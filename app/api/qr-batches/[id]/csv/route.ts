import { NextResponse, type NextRequest } from "next/server";
import { getPrintQrUrl, QrPublicUrlConfigurationError } from "@/lib/qr-public-url";
import { loadAuthorizedBatch } from "@/lib/qr-batch-export";

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await loadAuthorizedBatch(id);

  if (result.kind === "unauthenticated") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (result.kind === "forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (result.kind === "not-found") return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
  if (result.kind !== "ok") return NextResponse.json({ error: "No se pudo preparar el CSV" }, { status: 500 });

  try {
    const lines = ["numero_unidad,id,identificador,url"];
    for (const unit of result.units) {
      lines.push([
        csvCell(unit.unit_number),
        csvCell(unit.id),
        csvCell(unit.code),
        csvCell(getPrintQrUrl(unit.code)),
      ].join(","));
    }

    return new NextResponse(`\uFEFF${lines.join("\r\n")}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qr-lote-${result.batch.id}.csv"`,
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
