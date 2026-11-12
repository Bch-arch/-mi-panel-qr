"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

function extractIdentifier(value: string): string | null {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const routeIndex = parts.lastIndexOf("r");
    if (routeIndex >= 0 && parts[routeIndex + 1]) {
      return decodeURIComponent(parts[routeIndex + 1]);
    }
  } catch {
    if (/^[A-Za-z0-9_-]{5,100}$/.test(value)) return value;
  }

  return null;
}

export default function QrCameraScanner({
  onDetected,
}: {
  onDetected: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }

  async function startScanner() {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        video,
        (result) => {
          if (!result) return;
          const code = extractIdentifier(result.getText());
          if (!code) {
            setError("El QR leído no contiene una ruta /r/{identificador} válida.");
            return;
          }
          onDetected(code);
          stopScanner();
        },
      );
      setActive(true);
    } catch {
      setError("No se pudo abrir la cámara. Permite el acceso y usa el sitio por HTTPS.");
    }
  }

  useEffect(() => () => controlsRef.current?.stop(), []);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Escanear sticker</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">La cámara identifica el código y lo busca en este inventario.</p>
        </div>
        {active ? (
          <button type="button" onClick={stopScanner} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
            Detener cámara
          </button>
        ) : (
          <button type="button" onClick={startScanner} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            Abrir cámara
          </button>
        )}
      </div>
      {(active || error) && (
        <video ref={videoRef} muted playsInline className="max-h-72 w-full rounded-lg bg-black object-contain" />
      )}
      {error && <p role="status" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
