import { getCurrentUser } from "@/lib/auth";
import type { QrCode, QrStatus } from "@/lib/qr-types";
import { createClient } from "@/lib/supabase/server";

type QrRow = {
  id: string;
  name: string;
  destination: string;
  code: string;
  status: QrStatus;
  scans: number;
  created_at: string;
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
  };
}

// Las politicas RLS limitan las filas a auth.uid() = user_id, por lo que
// esta consulta nunca devuelve los QR de otro usuario.
export async function getQrCodes(): Promise<QrCode[]> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_codes")
    .select("id, name, destination, code, status, scans, created_at")
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
    .select("id, name, destination, code, status, scans, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el código QR: ${error.message}`);
  }

  return data ? mapRow(data as QrRow) : null;
}
