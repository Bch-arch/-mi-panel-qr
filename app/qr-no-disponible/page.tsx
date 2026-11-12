import Link from "next/link";

export default function QrNoDisponiblePage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Código QR no disponible
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Este enlace no existe o su código QR está desactivado en este momento.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
