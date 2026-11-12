import { createClient } from "@supabase/supabase-js";

// Cliente anonimo sin cookies, para rutas publicas (p. ej. la redireccion
// de un QR escaneado por alguien sin sesion). Solo puede ejecutar funciones
// concedidas al rol anon; nunca accede a las tablas directamente.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
