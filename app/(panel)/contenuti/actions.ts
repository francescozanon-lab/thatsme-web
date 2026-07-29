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
// Perché più bottoni condividono UNA sola azione
// ------------------------------------------------------------
// Sia qui sia nel form dell'articolo, bottoni diversi inviano lo stesso form con un
// valore diverso. Non è un trucco: è ciò che garantisce **un solo posto** in cui
// l'errore può comparire. Con un'azione per bottone, prima o poi una di esse
// fallisce in silenzio — e in questo pannello un salvataggio perso è il lavoro di
// uno psicologo buttato via.

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

// ------------------------------------------------------------
// AGGANCIA un riferimento culturale a un articolo
// ------------------------------------------------------------
// Due strade nello stesso form: scegliere un film/canzone già in elenco, oppure
// crearne uno al volo. La seconda esiste perché costringere a passare da una
// schermata separata per poi tornare indietro è il modo migliore per far
// abbandonare uno strumento — e chi scrive un articolo ha in mente il film adesso.
export async function agganciaRiferimento(
  articleId: string,
  _prev: EsitoForm,
  formData: FormData,
): Promise<EsitoForm> {
  const { supabase, professionalId } = await requirePublisher();

  if (!UUID_RE.test(articleId)) return { errore: "Articolo non riconosciuto." };

  const modo = String(formData.get("modo") ?? "esistente");
  let refId = "";

  if (modo === "nuovo") {
    const kind = String(formData.get("kind") ?? "");
    const title = String(formData.get("titolo") ?? "").trim();

    if (kind !== "film" && kind !== "song") {
      return { errore: "Scegli se è un film o una canzone." };
    }
    if (!title) return { errore: "Manca il titolo del film o della canzone." };

    const { data, error } = await supabase
      .from("cultural_refs")
      .insert({ kind, title, created_by: professionalId })
      .select("id")
      .single();

    if (error) return { errore: `Non sono riuscito a crearlo: ${error.message}` };
    refId = data.id as string;
  } else {
    refId = String(formData.get("ref_id") ?? "");
    if (!UUID_RE.test(refId)) {
      return { errore: "Scegli un riferimento dall'elenco, o creane uno nuovo." };
    }
  }

  // In coda agli altri. L'ordine conta: i riferimenti compaiono PRIMA del testo, e
  // il primo è quello che il ragazzo legge per primo.
  const { data: ultimo } = await supabase
    .from("article_cultural_refs")
    .select("sort")
    .eq("article_id", articleId)
    .order("sort", { ascending: false })
    .limit(1);

  const sort = ((ultimo?.[0]?.sort as number | undefined) ?? -1) + 1;

  const { error } = await supabase.from("article_cultural_refs").insert({
    article_id: articleId,
    cultural_ref_id: refId,
    description: String(formData.get("descrizione") ?? "").trim(),
    sort,
  });

  if (error) {
    // La chiave primaria è (articolo, riferimento): riagganciare lo stesso film
    // sbatte qui. Il messaggio di Postgres parlerebbe di "duplicate key", che non
    // dice niente a uno psicologo.
    if (error.code === "23505") {
      return { errore: "Quel riferimento è già agganciato a questo articolo." };
    }
    return { errore: `Non sono riuscito ad agganciarlo: ${error.message}` };
  }

  revalidatePath(`/contenuti/${articleId}`);
  return { errore: null };
}

// ------------------------------------------------------------
// SALVA le descrizioni · oppure SCOLLEGA un riferimento
// ------------------------------------------------------------
// Un form solo per tutte le descrizioni, e i bottoni "Rimuovi" di ogni riga sono
// bottoni dello stesso form che portano l'id da scollegare. Così esiste un solo
// percorso, e quindi un solo posto dove l'errore compare.
export async function gestisciAgganci(
  articleId: string,
  _prev: EsitoForm,
  formData: FormData,
): Promise<EsitoForm> {
  const { supabase } = await requirePublisher();

  if (!UUID_RE.test(articleId)) return { errore: "Articolo non riconosciuto." };

  // 1) Ha premuto "Rimuovi" su una riga?
  const scollega = String(formData.get("scollega") ?? "");
  if (scollega) {
    if (!UUID_RE.test(scollega)) return { errore: "Riferimento non riconosciuto." };

    const { error } = await supabase
      .from("article_cultural_refs")
      .delete()
      .eq("article_id", articleId)
      .eq("cultural_ref_id", scollega);

    if (error) return { errore: `Non sono riuscito a rimuoverlo: ${error.message}` };

    revalidatePath(`/contenuti/${articleId}`);
    return { errore: null };
  }

  // 2) Altrimenti sta salvando le descrizioni: una riga per campo `desc_<id>`.
  for (const [chiave, valore] of formData.entries()) {
    if (!chiave.startsWith("desc_")) continue;

    const refId = chiave.slice(5);
    if (!UUID_RE.test(refId)) continue;

    const { error } = await supabase
      .from("article_cultural_refs")
      .update({ description: String(valore).trim() })
      .eq("article_id", articleId)
      .eq("cultural_ref_id", refId);

    // Si ferma al primo errore invece di tirare avanti: se una descrizione non è
    // stata salvata, dirlo subito è meglio che lasciar credere che sia tutto a posto.
    if (error) return { errore: `Non sono riuscito a salvare: ${error.message}` };
  }

  revalidatePath(`/contenuti/${articleId}`);
  return { errore: null };
}
