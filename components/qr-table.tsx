import Link from "next/link";
import QrDeleteButton from "@/components/qr-delete-button";
import QrStatusButton from "@/components/qr-status-button";
import {
  formatDate,
  formatNumber,
  statusLabels,
  type QrCode,
  type QrStatus,
} from "@/lib/qr-types";

const statusStyles: Record<QrStatus, string> = {
  activo:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
  pausado:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
  borrador:
    "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-400/20",
};

function StatusBadge({ status }: { status: QrStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

const actionLink =
  "rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/60";

function RowActions({ qr }: { qr: QrCode }) {
  const isActive = qr.status === "activo";

  return (
    <div className="flex items-center justify-end gap-1.5">
      <a href={`/api/qr/${qr.id}/download?format=png`} className={actionLink}>
        PNG
      </a>
      <a href={`/api/qr/${qr.id}/download?format=svg`} className={actionLink}>
        SVG
      </a>
      <Link href={`/editar/${qr.id}`} className={actionLink}>
        Editar
      </Link>
      <QrStatusButton id={qr.id} isActive={isActive} className={actionLink} />
      <QrDeleteButton id={qr.id} className={actionLink} />
    </div>
  );
}

export default function QrTable({ items }: { items: QrCode[] }) {
  return (
    <div>
      <table className="hidden w-full border-collapse md:table">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Destino</th>
            <th className="px-4 py-3 font-medium">Creación</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((qr) => (
            <tr
              key={qr.id}
              className="border-b border-zinc-100 text-sm transition-colors last:border-0 hover:bg-zinc-50/80 dark:border-zinc-800/70 dark:hover:bg-zinc-800/30"
            >
              <td className="px-4 py-3.5">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {qr.name}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  {formatNumber(qr.scans)} escaneos
                </span>
              </td>
              <td className="max-w-[260px] px-4 py-3.5">
                <span className="block truncate text-zinc-600 dark:text-zinc-400" title={qr.destination}>
                  {qr.destination}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                {formatDate(qr.createdAt)}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={qr.status} />
              </td>
              <td className="px-4 py-3.5">
                <RowActions qr={qr} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((qr) => (
          <li
            key={qr.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {qr.name}
                </p>
                <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400" title={qr.destination}>
                  {qr.destination}
                </p>
              </div>
              <StatusBadge status={qr.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>{formatDate(qr.createdAt)}</span>
              <span>{formatNumber(qr.scans)} escaneos</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <a href={`/api/qr/${qr.id}/download?format=png`} className={actionLink}>
                PNG
              </a>
              <a href={`/api/qr/${qr.id}/download?format=svg`} className={actionLink}>
                SVG
              </a>
              <Link href={`/editar/${qr.id}`} className={actionLink}>
                Editar
              </Link>
              <QrStatusButton
                id={qr.id}
                isActive={qr.status === "activo"}
                className={actionLink}
              />
              <QrDeleteButton id={qr.id} className={actionLink} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
