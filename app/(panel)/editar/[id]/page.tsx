import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import QrEditForm from "@/components/qr-edit-form";
import { getQrById } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/qr-types";

export default function EditarQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Volver a Mis QR
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Editar QR
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Actualiza el destino y el estado sin cambiar el código QR impreso.
        </p>
      </header>

      <Suspense fallback={<EditSkeleton />}>
        <EditContent params={params} />
      </Suspense>
    </div>
  );
}

async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  // La validación de sesión de Supabase Auth consulta Date.now(). Ejecutamos
  // ese trabajo en la petición, fuera del prerender estático de Cache Components.
  await connection();
  const { id } = await params;

  const qr = await getQrById(id);
  if (!qr) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <QrEditForm qr={qr} />

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <Image
            src={`/api/qr/${qr.id}/download?format=png&inline=1`}
            alt={`Código QR: ${qr.name}`}
            width={200}
            height={200}
            unoptimized
            className="mx-auto h-40 w-40 rounded-lg bg-white p-2"
          />
          <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {qr.name}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {formatNumber(qr.scans)} escaneos · creado el {formatDate(qr.createdAt)}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <a
              href={`/api/qr/${qr.id}/download?format=png`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
            >
              Descargar PNG
            </a>
            <a
              href={`/api/qr/${qr.id}/download?format=svg`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
            >
              SVG
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Enlace corto</p>
          <p className="mt-2 break-all text-xs text-zinc-500 dark:text-zinc-400">
            /r/{qr.code}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Este enlace es el que contiene el QR. Se mantiene aunque cambies el destino.
          </p>
        </div>
      </aside>
    </div>
  );
}

function EditSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40" />
      <div className="h-72 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40" />
    </div>
  );
}
