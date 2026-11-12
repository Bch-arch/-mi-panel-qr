"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { MAX_QR_PER_USER, type QrStatus } from "@/lib/qr-types";
import { createClient } from "@/lib/supabase/server";

export type CreateQrState = {
  ok: boolean;
  message?: string;
  errors?: {
    name?: string;
    destination?: string;
  };
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

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  if (errors.name || errors.destination) {
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
  const status = String(formData.get("status") ?? "activo") as QrStatus;

  const errors: UpdateQrState["errors"] = {};
  if (name.length < 3) {
    errors.name = "Introduce un nombre de al menos 3 caracteres.";
  }
  if (!isValidUrl(destination)) {
    errors.destination =
      "Introduce una URL válida que empiece por http:// o https://.";
  }
  if (errors.name || errors.destination) {
    return { ok: false, errors };
  }
  if (!id || !VALID_STATUSES.includes(status)) {
    return { ok: false, message: "Datos del código QR no válidos." };
  }

  const supabase = await createClient();

  // El filtro por user_id es defensa en profundidad; RLS ya lo garantiza.
  const { data, error } = await supabase
    .from("qr_codes")
    .update({
      name,
      destination,
      status,
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
  const { data, error } = await supabase
    .from("qr_codes")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "No se pudo actualizar el estado. Inténtalo de nuevo." };
  }
  if (!data) {
    return { ok: false, message: "Código QR no encontrado." };
  }

  revalidatePath("/");
  return { ok: true };
}
