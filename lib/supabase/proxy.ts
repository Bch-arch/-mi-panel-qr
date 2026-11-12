import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getConfiguredAdminId, isAdminUserId } from "@/lib/admin";

function redirectPreservingCookies(
  url: URL,
  response: NextResponse,
): NextResponse {
  const redirectResponse = NextResponse.redirect(url);

  for (const cookie of response.cookies.getAll()) {
    const { name, value, ...options } = cookie;
    redirectResponse.cookies.set(name, value, options);
  }

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Importante: getUser() valida el token contra Supabase, a diferencia de
  // getSession() que solo lee la cookie (no fiable en el servidor).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (pathname === "/registro") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=registration-closed";
    return redirectPreservingCookies(url, response);
  }

  const isAuthPage = pathname === "/login";
  const isPublic =
    isAuthPage ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/qr-no-disponible";

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirectTo", pathname);
    return redirectPreservingCookies(url, response);
  }

  const isAdmin = Boolean(user && isAdminUserId(user.id));

  if (user && isAuthPage && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirectPreservingCookies(url, response);
  }

  if (user && !isAdmin && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set(
      "error",
      getConfiguredAdminId()
        ? "admin-not-authorized"
        : "admin-not-configured",
    );
    return redirectPreservingCookies(url, response);
  }

  return response;
}
