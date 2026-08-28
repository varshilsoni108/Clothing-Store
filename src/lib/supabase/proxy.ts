import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Runs in the Next.js Proxy (src/proxy.ts) on matched requests.
 * Refreshes the Supabase auth session when it expires so the user stays logged in.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Critical: do not run code between createServerClient and
  // supabase.auth.getUser() — a complex app could treat expired sessions
  // as valid without this refresh.
  let isAuthed = false;
  try {
    isAuthed = !!(await supabase.auth.getUser()).data.user;
  } catch {
    // session malformed — treat as logged out
  }

  let response = supabaseResponse;
  const path = request.nextUrl.pathname;

  // /reset-password is intentionally excluded from the redirect list: password
  // recovery emails arrive with a session, so the page must render for authed
  // visitors while they update their password.
  const authRoutes = ["/login", "/signup", "/forgot-password"];
  const isAuthRoute = authRoutes.some((r) => path.startsWith(r));

  if (isAuthed && isAuthRoute) {
    const signupConfirmation = request.nextUrl.searchParams.get("confirm");
    if (!signupConfirmation) {
      response = NextResponse.redirect(
        new URL("/account", request.nextUrl)
      );
    }
  }

  return response;
}
