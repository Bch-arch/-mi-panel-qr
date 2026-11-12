import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import QrTable from "@/components/qr-table";
import { getQrCodes } from "@/lib/data";
import { formatNumber } from "@/lib/qr-types";

export default function MisQrPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mis QR
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Resumen y listado de tus códigos QR dinámicos.
          </p>
        </div>
        <Link
          href="/crear"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Crear QR
        </Link>
      </header>

      <Suspense fallback={<QrContentSkeleton />}>
        <QrContent />
      </Suspense>
    </div>
  );
}

async function QrContent() {
  // Supabase Auth checks token expiry with Date.now(). Keep that request-time
  // work out of the prerendered shell while retaining the surrounding Suspense.
  await connection();
  const qrCodes = await getQrCodes();

  const activeCount = qrCodes.filter((qr) => qr.status === "activo").length;
  const totalScans = qrCodes.reduce((total, qr) => total + qr.scans, 0);

  const stats = [
    { label: "QR totales", value: formatNumber(qrCodes.length) },
    { label: "QR activos", value: formatNumber(activeCount) },
    { label: "Escaneos totales", value: formatNumber(totalScans) },
  ];

  return (
    <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-5 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Todos los códigos
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatNumber(qrCodes.length)} registros
          </span>
        </div>

        {qrCodes.length > 0 ? (
          <div className="overflow-x-auto p-2 sm:p-3">
            <QrTable items={qrCodes} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Todavía no tienes códigos QR
            </p>
            <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Crea tu primer QR dinámico para empezar a recopilar escaneos.
            </p>
            <Link
              href="/crear"
              className="mt-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Crear QR
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

function QrContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-[104px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40"
          />
        ))}
      </section>
      <div className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40" />
    </div>
  );
}
