import "server-only";
import { isAdminUserId } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type ExportQrUnit = {
  id: string;
  code: string;
  unit_number: number;
};

export type AuthorizedBatch = {
  id: string;
  name: string;
  quantity: number;
};

export type BatchExportResult =
  | { kind: "unauthenticated" | "forbidden" | "not-found" | "error" }
  | { kind: "ok"; batch: AuthorizedBatch; units: ExportQrUnit[] };

export async function loadAuthorizedBatch(batchId: string): Promise<BatchExportResult> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;

  if (authError || !user) return { kind: "unauthenticated" };
  if (!isAdminUserId(user.id)) return { kind: "forbidden" };

  const { data: batch, error: batchError } = await supabase
    .from("qr_batches")
    .select("id, name, quantity")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (batchError) return { kind: "error" };
  if (!batch) return { kind: "not-found" };

  const { data: units, error: unitsError } = await supabase
    .from("qr_codes")
    .select("id, code, unit_number")
    .eq("batch_id", batchId)
    .eq("user_id", user.id)
    .order("unit_number", { ascending: true });

  if (unitsError || !units || units.length !== batch.quantity) {
    return { kind: "error" };
  }

  return { kind: "ok", batch, units };
}
