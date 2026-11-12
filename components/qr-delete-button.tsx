"use client";

import { useActionState, type FormEvent } from "react";
import { deleteQr, type QrMutationState } from "@/app/actions/qr";

const initialState: QrMutationState = { ok: false };

export default function QrDeleteButton({
  id,
  className,
}: {
  id: string;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(deleteQr, initialState);

  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("¿Eliminar este código QR? El enlace dejará de funcionar.")) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction} onSubmit={confirmDelete}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className={className} disabled={pending}>
          {pending ? "Eliminando…" : "Eliminar"}
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
