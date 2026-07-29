// app/(panel)/contenuti/guard.ts
// V2 — Il cancello del modulo contenuti, in un punto solo.
//
// ⚠️ Questo NON è la protezione vera: la protezione è la RLS, che rifiuta le
// scritture di chi non ha `can_publish` anche se qualcuno chiamasse l'API a mano
// (verificato il 29/07/2026 travestendosi da psicologo). Questo cancello serve a
// non FAR VEDERE una scrivania in cui non si può scrivere: uno psicologo senza
// l'interruttore che finisse qui vedrebbe form che falliscono al salvataggio, e
// penserebbe che l'app è rotta.
//
// Sta in un file suo perché lo usano tutte le pagine del modulo E tutte le azioni:
// il consiglio della guida di Next è esplicito — l'autorizzazione va verificata
// DENTRO ogni Server Action, non solo nella pagina che disegna il form.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requirePublisher() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, can_publish")
    .eq("id", user.id)
    .maybeSingle();

  // Niente riga = non è un professionista (ma il layout di (panel) l'avrebbe già
  // fermato); riga senza interruttore = psicologo che non pubblica → alla sua
  // scrivania dei casi, che è dove ha senso che stia.
  if (!pro?.can_publish) redirect("/");

  return { supabase, professionalId: pro.id as string };
}
