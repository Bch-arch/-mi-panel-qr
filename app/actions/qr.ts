"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { MAX_QR_PER_USER, type QrStatus } from "@/lib/qr-types";
import { getPrintQrUrl, QrPublicUrlConfigurationError } from "@/lib/qr-public-url";
import { createClient } from "@/lib/supabase/server";

export type CreateQrState = {
  ok: boolean;
  message?: string;
  errors?: {
    name?: string;
    destination?: string;
  };
};

export type CreateQrBatchState = {
  ok: boolean;
  message?: string;
  batchId?: string;
};

const SLUG_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateSlug(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let slug = "";
  for (let i = 0; i < length; i += 1) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return slug;
}

function generateBatchCodes(quantity: number): string[] {
  return Array.from({ length: quantity }, () => generateSlug(12));
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createQrBatch(
  _prevState: CreateQrBatchState,
  formData: FormData,
): Promise<CreateQrBatchState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  if (!name || name.length > 80) {
    return { ok: false, message: "El nombre del lote debe tener entre 1 y 80 caracteres." };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QR_PER_USER) {
    return { ok: false, message: `La cantidad debe estar entre 1 y ${MAX_QR_PER_USER}.` };
  }

  try {
    getPrintQrUrl("preflight-check");
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof QrPublicUrlConfigurationError
          ? error.message
          : "No se pudo validar el dominio público de impresión.",
    };
  }

  const supabase = await createClient();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase.rpc("create_qr_batch", {
      p_name: name,
      p_quantity: quantity,
      p_codes: generateBatchCodes(quantity),
    });

    if (!error && typeof data === "string") {
      revalidatePath("/inventario");
      revalidatePath("/");
      return { ok: true, batchId: data, message: "Lote creado. Descarga el paquete y su CSV." };
    }

    if (error?.code === "23505") continue;
    if (error?.code === "23514") {
      return { ok: false, message: "El lote supera el límite actual de 50 códigos QR." };
    }
    if (error?.code === "PGRST202") {
      return {
        ok: false,
        message: "Falta aplicar la migración SQL de inventario en Supabase.",
      };
    }
    return {
      ok: false,
      message: "No se pudo crear el lote. Verifica la migración SQL y vuelve a intentarlo.",
    };
  }

  return { ok: false, message: "No se pudieron generar códigos únicos. Inténtalo de nuevo." };
}

export type AssignQrState = {
  ok: boolean;
  message?: string;
  errors?: { storeName?: string; destination?: string };
};

export async function assignQr(
  _prevState: AssignQrState,
  formData: FormData,
): Promise<AssignQrState> {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const storeName = String(formData.get("storeName") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const requestedStatus = String(formData.get("status") ?? "pausado");
  const errors: NonNullable<AssignQrState["errors"]> = {};

  if (!storeName || storeName.length > 120) {
    errors.storeName = "Introduce una tienda (máximo 120 caracteres).";
  }
  if (!isValidUrl(destination)) {
    errors.destination = "Introduce una URL válida que empiece por http:// o https://.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  if (!id || !["activo", "pausado"].includes(requestedStatus)) {
    return { ok: false, message: "Datos de asignación no válidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .update({
      store_name: storeName,
      destination,
      inventory_status: "asignado",
      status: requestedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "No se pudo asignar el QR. Inténtalo de nuevo." };
  }
  if (!data) return { ok: false, message: "Código QR no encontrado." };

  revalidatePath("/inventario");
  revalidatePath("/");
  revalidatePath(`/editar/${id}`);
  return { ok: true, message: "Tienda y destino guardados. La URL impresa no cambió." };
}

export async function createQr(
  _prevState: CreateQrState,
  formData: FormData,
): Promise<CreateQrState> {
  const user = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();

  const errors: CreateQrState["errors"] = {};
  if (name.length < 3) {
    errors.name = "Introduce un nombre de al menos 3 caracteres.";
  }
  if (!isValidUrl(destination)) {
    errors.destination =
      "Introduce una URL válida que empiece por http:// o https://.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("qr_codes")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) >= MAX_QR_PER_USER) {
    return {
      ok: false,
      message: `Has alcanzado el límite de ${MAX_QR_PER_USER} códigos QR.`,
    };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateSlug();
    const { error } = await supabase.from("qr_codes").insert({
      user_id: user.id,
      name,
      destination,
      code,
      status: "activo",
    });

    if (!error) {
      revalidatePath("/");
      redirect("/");
    }

    // 23505 = violacion de unicidad del slug: reintentamos.
    if (error.code !== "23505") {
      return {
        ok: false,
        message: "No se pudo guardar el código QR. Inténtalo de nuevo.",
      };
    }
  }

  return {
    ok: false,
    message: "No se pudo generar un identificador único. Inténtalo de nuevo.",
  };
}

export type UpdateQrState = {
  ok: boolean;
  message?: string;
  errors?: {
    name?: string;
    destination?: string;
    storeName?: string;
  };
};

const VALID_STATUSES: QrStatus[] = ["activo", "pausado", "borrador"];

export async function updateQr(
  _prevState: UpdateQrState,
  formData: FormData,
): Promise<UpdateQrState> {
  const user = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const storeName = String(formData.get("storeName") ?? "").trim();
  const status = String(formData.get("status") ?? "activo") as QrStatus;

  const errors: UpdateQrState["errors"] = {};
  if (name.length < 3) {
    errors.name = "Introduce un nombre de al menos 3 caracteres.";
  }
  if (!isValidUrl(destination)) {
    errors.destination =
      "Introduce una URL válida que empiece por http:// o https://.";
  }
  if (storeName.length > 120) {
    errors.storeName = "La tienda no puede superar 120 caracteres.";
  }
  if (errors.name || errors.destination) {
    return { ok: false, errors };
  }
  if (!id || !VALID_STATUSES.includes(status)) {
    return { ok: false, message: "Datos del código QR no válidos." };
  }

  const supabase = await createClient();

  const { data: existing, error: lookupError } = await supabase
    .from("qr_codes")
    .select("inventory_status, store_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError || !existing) {
    return { ok: false, message: "Código QR no encontrado." };
  }
  if (existing.inventory_status === "disponible" && !storeName) {
    return {
      ok: false,
      errors: { storeName: "Indica la tienda para asignar este QR del inventario." },
    };
  }

  // El filtro por user_id es defensa en profundidad; RLS ya lo garantiza.
  const { data, error } = await supabase
    .from("qr_codes")
    .update({
      name,
      destination,
      status,
      store_name: storeName || existing.store_name,
      inventory_status: "asignado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return {
      ok: false,
      message: "No se pudo actualizar el código QR. Inténtalo de nuevo.",
    };
  }
  if (!data || data.length === 0) {
    return { ok: false, message: "Código QR no encontrado." };
  }

  revalidatePath("/");
  revalidatePath("/inventario");
  redirect("/");
}

export type QrMutationState = {
  ok: boolean;
  message?: string;
};

export async function deleteQr(
  _prevState: QrMutationState,
  formData: FormData,
): Promise<QrMutationState> {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { ok: false, message: "Código QR no válido." };
  }

  const supabase = await createClient();
  const { data: existing, error: lookupError } = await supabase
    .from("qr_codes")
    .select("batch_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError || !existing) {
    return { ok: false, message: "Código QR no encontrado." };
  }
  if (existing.batch_id) {
    return {
      ok: false,
      message: "Las unidades de un lote de impresión se conservan para mantener el inventario y sus archivos completos.",
    };
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "No se pudo eliminar el código QR. Inténtalo de nuevo." };
  }
  if (!data) {
    return { ok: false, message: "Código QR no encontrado." };
  }

  revalidatePath("/");
  return { ok: true, message: "Código QR eliminado." };
}

export async function toggleQrStatus(
  _prevState: QrMutationState,
  formData: FormData,
): Promise<QrMutationState> {
  const user = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "") as QrStatus;

  if (!id || !VALID_STATUSES.includes(nextStatus)) {
    return { ok: false, message: "Datos del código QR no válidos." };
  }

  const supabase = await createClient();
  let updateQuery = supabase
    .from("qr_codes")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (nextStatus === "activo") {
    updateQuery = updateQuery.eq("inventory_status", "asignado").not("destination", "is", null);
  }
  const { data, error } = await updateQuery.select("id").maybeSingle();

  if (error) {
    return { ok: false, message: "No se pudo actualizar el estado. Inténtalo de nuevo." };
  }
  if (!data) {
    return { ok: false, message: "Código QR no encontrado." };
  }

  revalidatePath("/");
  return { ok: true };
}
