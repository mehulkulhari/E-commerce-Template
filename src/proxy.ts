import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/* Runs before /admin routes render. It keeps the Supabase session cookie fresh
   and does a cheap optimistic gate: no signed-in user → send to the login page.
   This is only the first line of defence; the real authorisation (is_admin)
   runs in the Data Access Layer next to the data. Public routes never hit this. */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  // Without Supabase configured, let the pages render their "not set up" state.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = pathname !== "/admin" ? `?next=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(to);
  }
  if (user && isLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
