import { getCurrentUser } from "@/lib/auth";
import type { QrBatch, QrCode, QrInventoryStatus, QrStatus } from "@/lib/qr-types";
import { createClient } from "@/lib/supabase/server";

type QrRow = {
  id: string;
  name: string;
  destination: string | null;
  code: string;
  status: QrStatus;
  scans: number;
  created_at: string;
  batch_id: string | null;
  unit_number: number | null;
  store_name: string | null;
  inventory_status: QrInventoryStatus;
};

function mapRow(row: QrRow): QrCode {
  return {
    id: row.id,
    name: row.name,
    destination: row.destination,
    code: row.code,
    status: row.status,
    scans: row.scans,
    createdAt: row.created_at,
    batchId: row.batch_id,
    unitNumber: row.unit_number,
    storeName: row.store_name,
    inventoryStatus: row.inventory_status,
  };
}

const QR_SELECT =
  "id, name, destination, code, status, scans, created_at, batch_id, unit_number, store_name, inventory_status";

// Las politicas RLS limitan las filas a auth.uid() = user_id, por lo que
// esta consulta nunca devuelve los QR de otro usuario.
export async function getQrCodes(): Promise<QrCode[]> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_codes")
    .select(QR_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los códigos QR: ${error.message}`);
  }

  return (data as QrRow[]).map(mapRow);
}

export async function getQrById(id: string): Promise<QrCode | null> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_codes")
    .select(QR_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el código QR: ${error.message}`);
  }

  return data ? mapRow(data as QrRow) : null;
}

export async function getQrInventory(): Promise<QrCode[]> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_codes")
    .select(QR_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`No se pudo cargar el inventario QR: ${error.message}`);
  }

  return (data as QrRow[]).map(mapRow);
}

export async function getQrBatches(): Promise<QrBatch[]> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_batches")
    .select("id, name, quantity, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`No se pudieron cargar los lotes QR: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    createdAt: row.created_at,
  }));
}
