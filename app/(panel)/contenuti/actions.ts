// app/(panel)/contenuti/actions.ts
// V2 — Le azioni del modulo contenuti (Server Actions di Next 16).
//
// Girano SUL SERVER anche se le lancia un form nel browser. Ognuna ricontrolla da
// sola il permesso con requirePublisher(): la guida di Next lo dice esplicitamente
// — «verifica sempre autenticazione e autorizzazione dentro ogni Server Action,
// anche se il form è disegnato in una pagina protetta». Il form si può invocare
// anche senza passare dalla pagina.
//
// Firma `(prev, formData)`: è quella che vuole useActionState, il meccanismo che
// permette di rimandare indietro un messaggio d'errore SENZA far perdere allo
// psicologo il testo che ha appena scritto. Su un articolo lungo non è un
// dettaglio: perderlo una volta sola basta a non fidarsi più dello strumento.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePublisher } from "./guard";
import { UUID_RE, type EsitoForm } from "./content-data";

// ------------------------------------------------------------
// Lettura e controllo dei campi, in comune fra creazione e modifica
// ------------------------------------------------------------
type Campi = { level: number; category_id: string; title: string; body: string };

function leggiCampi(formData: FormData): { campi: Campi } | { errore: string } {
  const level = Number(formData.get("level"));
  const category_id = String(formData.get("category_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  // Messaggi diretti: qui legge un adulto professionista, non un ragazzo. La regola
  // del "mai il messaggio tecnico" vale per l'app; nel pannello serve invece che
  // sappia esattamente cosa manca.
  if (![1, 2, 3].includes(level)) return { errore: "Scegli il livello dell'articolo." };
  if (!UUID_RE.test(category_id)) return { errore: "Scegli la categoria." };
  if (!title) return { errore: "L'articolo ha bisogno di un titolo." };

  return { campi: { level, category_id, title, body } };
}

// ------------------------------------------------------------
// CREA — nasce sempre come BOZZA
// ------------------------------------------------------------
// Nessuno pubblica per sbaglio scrivendo: la pubblicazione è un gesto separato,
// nella pagina di modifica.
export async function creaArticolo(
  _prev: EsitoForm,
  formData: FormData,
): Promise<EsitoForm> {
  const { supabase, professionalId } = await requirePublisher();

  const letto = leggiCampi(formData);
  if ("errore" in letto) return { errore: letto.errore };

  const { data, error } = await supabase
    .from("articles")
    .insert({ ...letto.campi, status: "draft", author_id: professionalId })
    .select("id")
    .single();

  if (error) {
    return { errore: `Non sono riuscito a salvare: ${error.message}` };
  }

  revalidatePath("/contenuti");
  // redirect() lancia: deve stare FUORI da qualsiasi try/catch, o verrebbe scambiato
  // per un errore e inghiottito.
  redirect(`/contenuti/${data.id}`);
}

// ------------------------------------------------------------
// SALVA / PUBBLICA / RIPORTA IN BOZZA — un'azione sola
// ------------------------------------------------------------
// I tre bottoni della pagina di modifica inviano lo stesso form con un valore
// diverso in `azione`. Un solo percorso significa un solo posto dove l'errore può
// comparire, e nessun modo di pubblicare un testo diverso da quello che si vede a
// schermo: il salvataggio e il cambio di stato avvengono insieme.
export async function salvaArticolo(
  id: string,
  _prev: EsitoForm,
  formData: FormData,
): Promise<EsitoForm> {
  const { supabase } = await requirePublisher();

  if (!UUID_RE.test(id)) return { errore: "Articolo non riconosciuto." };

  const letto = leggiCampi(formData);
  if ("errore" in letto) return { errore: letto.errore };

  const azione = String(formData.get("azione") ?? "salva");
  const status =
    azione === "pubblica" ? "published" : azione === "bozza" ? "draft" : undefined;

  const { error } = await supabase
    .from("articles")
    .update({
      ...letto.campi,
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { errore: `Non sono riuscito a salvare: ${error.message}` };
  }

  revalidatePath("/contenuti");
  revalidatePath(`/contenuti/${id}`);
  return { errore: null };
}
