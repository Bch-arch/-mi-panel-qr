export type QrStatus = "activo" | "pausado" | "borrador";

export interface QrCode {
  id: string;
  name: string;
  destination: string | null;
  code: string;
  createdAt: string;
  status: QrStatus;
  scans: number;
  batchId: string | null;
  unitNumber: number | null;
  storeName: string | null;
  inventoryStatus: QrInventoryStatus;
}

export type QrInventoryStatus = "disponible" | "asignado";

export interface QrBatch {
  id: string;
  name: string;
  quantity: number;
  createdAt: string;
}

// Limite de QR por usuario. La comprobacion se hace en el servidor;
// preparado para ajustarse por plan en el futuro.
export const MAX_QR_PER_USER = 50;

export const statusLabels: Record<QrStatus, string> = {
  activo: "Activo",
  pausado: "Pausado",
  borrador: "Borrador",
};

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value);
}
