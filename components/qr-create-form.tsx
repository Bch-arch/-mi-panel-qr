"use client";

import { useActionState } from "react";
import { createQr, type CreateQrState } from "@/app/actions/qr";

const initialState: CreateQrState = { ok: false };

export default function QrCreateForm() {
  const [state, formAction, pending] = useActionState(createQr, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Nombre del QR
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Ej. Menú del restaurante"
          aria-invalid={Boolean(state.errors?.name)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        {state.errors?.name && (
          <p className="text-xs text-red-600 dark:text-red-400">{state.errors.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="destination" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          URL de destino
        </label>
        <input
          id="destination"
          name="destination"
          type="url"
          placeholder="https://ejemplo.com/pagina"
          aria-invalid={Boolean(state.errors?.destination)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        {state.errors?.destination && (
          <p className="text-xs text-red-600 dark:text-red-400">{state.errors.destination}</p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Podrás cambiar este destino más adelante sin modificar el código QR impreso.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="reset"
          disabled={pending}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
        >
          Limpiar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Creando…" : "Crear QR"}
        </button>
      </div>

      {state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {state.message}
        </div>
      )}
    </form>
  );
}
