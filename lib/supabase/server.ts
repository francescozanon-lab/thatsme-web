import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client da usare lato server: Server Component, Server Action, Route Handler.
// In Next.js 15 cookies() è async, quindi questa funzione è async.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll chiamato da un Server Component: i Server Component non
            // possono scrivere cookie. Si ignora: ci pensa il middleware a
            // rinfrescare la sessione. Nessun problema.
          }
        },
      },
    },
  );
}
