"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createQrBatch, type CreateQrBatchState } from "@/app/actions/qr";

const initialState: CreateQrBatchState = { ok: false };

export default function QrBatchForm({ remainingCapacity }: { remainingCapacity: number }) {
  const [state, formAction, pending] = useActionState(createQrBatch, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div>
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Crear lote de impresión</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Cada unidad recibe un identificador distinto y queda pendiente de asignación.
        </p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Nombre del lote
        <input
          name="name"
          required
          maxLength={80}
          placeholder="Stickers noviembre"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Cantidad
        <input
          name="quantity"
          type="number"
          min={1}
          max={Math.max(1, remainingCapacity)}
          defaultValue={Math.max(1, remainingCapacity)}
          required
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"
        />
        <span className="text-xs font-normal text-zinc-500">Disponibles según el límite actual: {remainingCapacity} de 50 QR por cuenta.</span>
      </label>
      <button
        type="submit"
        disabled={pending || remainingCapacity === 0}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Generando…" : remainingCapacity === 0 ? "Límite alcanzado" : "Crear códigos únicos"}
      </button>
      {state.message && (
        <p className={`text-sm ${state.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {state.message}
        </p>
      )}
      {state.batchId && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/api/qr-batches/${state.batchId}/download?format=svg`}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Descargar ZIP SVG
          </Link>
          <Link
            href={`/api/qr-batches/${state.batchId}/csv`}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Descargar CSV
          </Link>
        </div>
      )}
    </form>
  );
}
