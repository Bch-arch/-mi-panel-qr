import { Suspense } from "react";
import LogoutButton from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export default function ConfiguracionPage() {
  const sections = [
    {
      title: "Cuenta",
      description: "Gestiona tu perfil y las credenciales de acceso.",
      action: "Disponible al añadir edición de perfil",
    },
    {
      title: "Preferencias",
      description: "Idioma, formato de fecha y comportamiento del panel.",
      action: "Disponible próximamente",
    },
    {
      title: "Dominio y base de datos",
      description: "Conecta el almacenamiento y el dominio de redirección de los QR.",
      action: "Disponible próximamente",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ajustes generales del panel.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40" />
        }
      >
        <AccountSection />
      </Suspense>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.title}
            className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {section.title}
            </h2>
            <p className="mt-1.5 flex-1 text-sm text-zinc-500 dark:text-zinc-400">
              {section.description}
            </p>
            <button
              type="button"
              disabled
              className="mt-4 self-start rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
            >
              {section.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

async function AccountSection() {
  const user = await getCurrentUser();

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/40">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Sesión iniciada
        </p>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
      </div>
      <div className="sm:w-40">
        <LogoutButton />
      </div>
    </section>
  );
}
