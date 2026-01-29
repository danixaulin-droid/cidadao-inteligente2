import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_EMAIL = "vandilmar19@gmail.com";

export async function middleware(request) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const pathname = request.nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAssistenteRoute = pathname.startsWith("/assistente");
  const isChatApiRoute = pathname.startsWith("/api/chat");

  // 🔒 Bloqueia acesso se não estiver logado
  if (
    (isDashboardRoute || isAdminRoute || isAssistenteRoute || isChatApiRoute) &&
    !user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 🔐 Admin só para o email correto
  if (isAdminRoute && user?.email !== ADMIN_EMAIL) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/assistente/:path*",
    "/api/chat",
  ],
};
