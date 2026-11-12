import { redirect } from "next/navigation";
import { getConfiguredAdminId, isAdminUserId } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
};

async function readAdmin(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminUserId(user.id)) {
    const reason = getConfiguredAdminId()
      ? "admin-not-authorized"
      : "admin-not-configured";
    redirect(`/login?error=${reason}`);
  }

  return { id: user.id, email: user.email ?? "" };
}

// Data Access Layer para componentes. Lee la cookie de sesion y valida el
// usuario. `use cache: private` permite cachear por navegador sin cachearlo
// en el servidor (requerido con cacheComponents activado).
export async function getCurrentUser(): Promise<CurrentUser> {
  "use cache: private";
  return readAdmin();
}

// Las acciones siempre vuelven a validar la sesión y el UUID administrativo.
export async function requireAdmin(): Promise<CurrentUser> {
  return readAdmin();
}
