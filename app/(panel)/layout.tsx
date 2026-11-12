import { Suspense } from "react";
import PanelSidebar from "@/components/panel-sidebar";
import { getCurrentUser } from "@/lib/auth";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <Suspense fallback={<SidebarFallback />}>
        <PanelSidebarContainer />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

async function PanelSidebarContainer() {
  const user = await getCurrentUser();
  return <PanelSidebar userEmail={user.email} />;
}

function SidebarFallback() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-950" />
  );
}
