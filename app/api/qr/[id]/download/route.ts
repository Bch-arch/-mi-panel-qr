import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { isAdminUserId } from "@/lib/admin";
import {
  getPublicQrUrl,
  QrPublicUrlConfigurationError,
} from "@/lib/qr-public-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") === "svg" ? "svg" : "png";
  const inline = searchParams.get("inline") === "1";

  // Descarga autenticada: se valida la sesion con getUser() y RLS limita la
  // fila al propietario, por lo que no se puede descargar el QR de otro usuario.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isAdminUserId(user.id)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .select("code")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  let target: string;
  try {
    target = getPublicQrUrl(data.code);
  } catch (error) {
    if (error instanceof QrPublicUrlConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }

  const disposition = inline ? "inline" : "attachment";
  const fileName = `qr-${data.code}`;

  if (format === "svg") {
    const svg = await QRCode.toString(target, {
      type: "svg",
      margin: 1,
      width: 512,
      errorCorrectionLevel: "M",
    });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `${disposition}; filename="${fileName}.svg"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const png = await QRCode.toBuffer(target, {
    type: "png",
    margin: 1,
    width: 512,
    errorCorrectionLevel: "M",
  });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${disposition}; filename="${fileName}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
