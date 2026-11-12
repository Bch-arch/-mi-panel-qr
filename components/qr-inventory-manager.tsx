"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { assignQr, type AssignQrState } from "@/app/actions/qr";
import QrBatchForm from "@/components/qr-batch-form";
import QrCameraScanner from "@/components/qr-camera-scanner";
import type { QrBatch, QrCode } from "@/lib/qr-types";
import { formatDate, formatNumber } from "@/lib/qr-types";

const emptyState: AssignQrState = { ok: false };

function AssignQrForm({ qr }: { qr: QrCode }) {
  const [state, formAction, pending] = useActionState(assignQr, emptyState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-400/20 dark:bg-indigo-500/5">
      <input type="hidden" name="id" value={qr.id} />
      <div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Asignar {qr.code}</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">La dirección impresa permanece igual; podrás cambiar el destino después.</p>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Tienda
        <input name="storeName" required maxLength={120} defaultValue={qr.storeName ?? ""} placeholder="Tienda Centro" className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" />
        {state.errors?.storeName && <span className="text-xs text-red-600">{state.errors.storeName}</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Destino
        <input name="destination" type="url" required defaultValue={qr.destination ?? ""} placeholder="https://tienda.example/menu" className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" />
        {state.errors?.destination && <span className="text-xs text-red-600">{state.errors.destination}</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Estado al asignar
        <select name="status" defaultValue={qr.status === "activo" ? "activo" : "pausado"} className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950">
          <option value="pausado">Asignado, todavía inactivo</option>
          <option value="activo">Asignado y activo</option>
        </select>
      </label>
      <button type="submit" disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar asignación"}
      </button>
      {state.message && <p role="status" className={`text-sm ${state.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{state.message}</p>}
    </form>
  );
}

function BatchDownloads({ batch }: { batch: QrBatch }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{batch.name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatNumber(batch.quantity)} unidades · {formatDate(batch.createdAt)}</p>
      </div>
      <div className="flex gap-2">
        <Link className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium dark:border-zinc-700" href={`/api/qr-batches/${batch.id}/download?format=svg`}>ZIP SVG</Link>
        <Link className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium dark:border-zinc-700" href={`/api/qr-batches/${batch.id}/download?format=png`}>ZIP PNG</Link>
        <Link className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium dark:border-zinc-700" href={`/api/qr-batches/${batch.id}/csv`}>CSV</Link>
      </div>
    </li>
  );
}

export default function QrInventoryManager({
  items,
  batches,
}: {
  items: QrCode[];
  batches: QrBatch[];
}) {
  const [query, setQuery] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const selectedQr = items.find((item) => item.id === selectedId) ?? null;
  const available = items.filter((item) => item.inventoryStatus === "disponible").length;
  const active = items.filter((item) => item.status === "activo").length;
  const assigned = items.filter((item) => item.inventoryStatus === "asignado" && item.status !== "activo").length;

  const term = (scannedCode || query).trim().toLocaleLowerCase();
  const filteredItems = term
    ? items.filter((item) =>
        [item.code, item.id, item.name, item.storeName ?? "", item.destination ?? ""]
          .some((value) => value.toLocaleLowerCase().includes(term)),
      )
    : items;

  function handleScan(code: string) {
    setScannedCode(code);
    setQuery("");
    const match = items.find((item) => item.code === code || item.id === code);
    setSelectedId(match?.id ?? "");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Disponibles", value: available },
          { label: "Asignados e inactivos", value: assigned },
          { label: "Activos", value: active },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{formatNumber(stat.value)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <QrBatchForm remainingCapacity={Math.max(0, 50 - items.length)} />
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Lotes creados</h2>
          {batches.length ? (
            <ul className="mt-4 flex flex-col gap-2">{batches.map((batch) => <BatchDownloads key={batch.id} batch={batch} />)}</ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Todavía no hay lotes.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mb-4">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Buscar y asignar unidades</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Escanea un sticker o busca por código, tienda o nombre.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <QrCameraScanner onDetected={handleScan} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Identificador o búsqueda
              <input value={query} onChange={(event) => { setQuery(event.target.value); setScannedCode(""); }} placeholder="Código corto, UUID o tienda" className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            {scannedCode && <p role="status" className="text-sm text-indigo-700 dark:text-indigo-300">Detectado: {scannedCode}</p>}
            <ul className="max-h-80 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              {filteredItems.map((item) => (
                <li key={item.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                  <button type="button" onClick={() => setSelectedId(item.id)} aria-pressed={selectedId === item.id} className="flex w-full flex-col items-start px-3 py-3 text-left hover:bg-zinc-50 aria-pressed:bg-indigo-50 dark:hover:bg-zinc-800/50 dark:aria-pressed:bg-indigo-500/10">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.unitNumber ? `Unidad ${item.unitNumber}` : item.name} · {item.code}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.storeName ?? (item.inventoryStatus === "disponible" ? "Pendiente de asignación" : "Sin tienda registrada")} · {item.destination ?? "Sin destino"}</span>
                  </button>
                </li>
              ))}
              {!filteredItems.length && <li className="px-3 py-4 text-sm text-zinc-500">No se encontraron QR.</li>}
            </ul>
          </div>
          <div>
            {selectedQr ? <AssignQrForm key={selectedQr.id} qr={selectedQr} /> : (
              <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                Selecciona una unidad para asignarle una tienda y un destino.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
