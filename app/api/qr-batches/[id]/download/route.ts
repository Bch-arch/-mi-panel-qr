import { zipSync } from "fflate";
import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { loadAuthorizedBatch } from "@/lib/qr-batch-export";
import { getPrintQrUrl, QrPublicUrlConfigurationError } from "@/lib/qr-public-url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await loadAuthorizedBatch(id);

  if (result.kind === "unauthenticated") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (result.kind === "forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (result.kind === "not-found") return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
  if (result.kind !== "ok") return NextResponse.json({ error: "No se pudo preparar el lote" }, { status: 500 });

  const format = request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  const files: Record<string, Uint8Array> = {};
  const encoder = new TextEncoder();

  try {
    for (const unit of result.units) {
      const target = getPrintQrUrl(unit.code);
      const filename = `unidad-${String(unit.unit_number).padStart(3, "0")}-${unit.code}.${format}`;
      if (format === "svg") {
        const svg = await QRCode.toString(target, {
          type: "svg",
          margin: 2,
          width: 1024,
          errorCorrectionLevel: "H",
        });
        files[filename] = encoder.encode(svg);
      } else {
        const png = await QRCode.toBuffer(target, {
          type: "png",
          margin: 2,
          width: 1600,
          errorCorrectionLevel: "H",
        });
        files[filename] = new Uint8Array(png);
      }
    }

    const archive = zipSync(files, { level: 6 });
    return new NextResponse(new Uint8Array(archive), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="qr-lote-${result.batch.id}-${format}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof QrPublicUrlConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }
}
