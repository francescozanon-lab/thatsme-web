import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Il middleware fa due cose:
// 1) rinfresca il token di sessione a ogni richiesta (i Server Component non
//    possono scrivere cookie, quindi serve qui);
// 2) protegge le rotte: senza login si finisce su /login; se sei già loggato
//    e vai su /login ti rimanda alla home.
export async function proxy(request: NextRequest)  {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: non inserire codice tra createServerClient e getUser().
  // getUser() verifica il token col server di auth (più sicuro di getSession()).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");

  // Non loggato e fuori da /login -> vai a /login (copiando i cookie freschi).
  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  // Già loggato ma su /login -> vai alla home.
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  // IMPORTANTE: restituire sempre supabaseResponse così i cookie aggiornati
  // arrivano al browser e la sessione resta fresca.
  return supabaseResponse;
}

export const config = {
  // Salta asset statici e immagini: il middleware gira solo dove serve.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
