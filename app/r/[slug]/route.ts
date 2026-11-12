import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Solo puede ejecutar resolve_qr (SECURITY DEFINER, concedida a anon).
  // Nunca lee la tabla directamente, asi que no expone datos de ningun usuario.
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("resolve_qr", { p_slug: slug });

  const destination = typeof data === "string" ? data : null;

  if (error || !destination) {
    return NextResponse.redirect(new URL("/qr-no-disponible", request.url));
  }

  return NextResponse.redirect(destination, 302);
}
