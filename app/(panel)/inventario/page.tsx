import { Suspense } from "react";
import { connection } from "next/server";
import QrInventoryManager from "@/components/qr-inventory-manager";
import { getQrBatches, getQrInventory } from "@/lib/data";

export default function InventarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Inventario QR</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Genera lotes para impresión y asigna cada sticker a una tienda.
        </p>
      </header>
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryContent />
      </Suspense>
    </div>
  );
}

async function InventoryContent() {
  await connection();
  const [items, batches] = await Promise.all([getQrInventory(), getQrBatches()]);
  return <QrInventoryManager items={items} batches={batches} />;
}

function InventorySkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40" />)}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40" />
    </div>
  );
}
