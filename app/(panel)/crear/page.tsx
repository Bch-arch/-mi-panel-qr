import Link from "next/link";
import QrCreateForm from "@/components/qr-create-form";

export default function CrearQrPage() {
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
          Crear QR
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Define un nombre para identificarlo y la URL de destino a la que apuntará.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <QrCreateForm />

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="h-16 w-16 text-zinc-300 dark:text-zinc-600" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 18v3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Vista previa del QR
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              La previsualización estará disponible al conectar el generador de QR.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Sobre los QR dinámicos
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              El código impreso no cambia: solo se actualiza el destino en este panel.
              La edición de destinos y la descarga se añadirán en una próxima etapa.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
