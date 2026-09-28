"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LoginState = { error: string };
type RequestState = { error: string; sent: boolean };
type ConfirmState = { error: string };

// Login email + password. Firma (prevState, formData) per useActionState.
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Messaggio volutamente generico: non si rivela se l'email esiste.
    return { error: "Email o password non corretti." };
  }

  // Successo: il gate "sei un professionista?" lo fa la home (app/page.tsx).
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Primo accesso o password dimenticata: Supabase manda un'email col link per
// sceglierla. Il testo dell'email è il template "Reset Password" del dashboard
// (thatsme-app/supabase/templates/recupero_password.html), che porta a
// /login/conferma col token nel link.
export async function requestPasswordEmail(
  _prevState: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Inserisci la tua email.", sent: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await panelOrigin()}/login/conferma`,
  });

  if (error) {
    if (error.status === 429) {
      return {
        error: "Hai appena chiesto un'email: aspetta un minuto e riprova.",
        sent: false,
      };
    }
    return {
      error: `Non sono riuscito a mandare l'email: ${error.message}`,
      sent: false,
    };
  }

  // Stessa risposta che l'indirizzo sia registrato o no: non si rivela chi c'è.
  return { error: "", sent: true };
}

// Il clic su «Continua» nella pagina del link. È un POST apposta, e non una
// verifica fatta al semplice caricamento della pagina: certi filtri antispam
// aprono i link delle email per controllarli, e così consumerebbero il link
// (vale una volta sola) prima che lo apra lo psicologo.
export async function confirmRecovery(
  _prevState: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const tokenHash = String(formData.get("token_hash") ?? "");

  if (!tokenHash) {
    return { error: "Il link non è completo: chiedine uno nuovo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });

  if (error) {
    return { error: "Il link è scaduto o è già stato usato: chiedine uno nuovo." };
  }

  // Da qui c'è una sessione. La pagina della password sta dentro (panel), quindi
  // passa dal gate professionista del layout: un account da ragazzo che avesse
  // aperto il link viene respinto lì, senza arrivare a sceglierla.
  redirect("/profilo/password");
}

// L'indirizzo da cui è arrivata la richiesta: localhost in sviluppo, il pannello
// su Vercel in produzione. Non è fiducia cieca nell'intestazione: Supabase usa il
// link solo se l'indirizzo è nell'elenco «Redirect URLs» del dashboard, altrimenti
// ripiega sul Site URL.
async function panelOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;

  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
