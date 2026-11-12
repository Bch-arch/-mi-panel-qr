"use client";

import { useActionState } from "react";
import {
  toggleQrStatus,
  type QrMutationState,
} from "@/app/actions/qr";

const initialState: QrMutationState = { ok: false };

export default function QrStatusButton({
  id,
  isActive,
  className,
}: {
  id: string;
  isActive: boolean;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(
    toggleQrStatus,
    initialState,
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <input
          type="hidden"
          name="nextStatus"
          value={isActive ? "pausado" : "activo"}
        />
        <button type="submit" className={className} disabled={pending}>
          {pending ? "Guardando…" : isActive ? "Pausar" : "Activar"}
        </button>
      </form>
      {state.message && !state.ok && (
        <p role="alert" className="max-w-40 text-right text-xs text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
    </div>
  );
}
