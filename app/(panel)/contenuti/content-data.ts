// app/(panel)/contenuti/content-data.ts
// V2 — Tipi e costanti del modulo contenuti.
//
// ⚠️ Modulo NEUTRO di proposito: niente "use client" e nessun import lato server,
// così lo possono leggere SIA le pagine (server) SIA il form (client). È la gotcha
// già annotata in CLAUDE.md: un modulo con "use client" non può esportare valori
// che poi legge il server — Next li sostituisce con riferimenti al client.
// Stesso ruolo di casi/[id]/case-data.ts.

export type Livello = 1 | 2 | 3;

// I tre livelli, con la nota che ricorda allo psicologo COSA sta scrivendo: un
// articolo di livello 1 lo legge un ragazzo che sta bene e sfoglia per curiosità,
// uno di livello 3 lo legge qualcuno che ha appena detto che è andata male. È la
// differenza che conta di più nel tono, e va ricordata dove si scrive.
export const LIVELLI: { value: Livello; label: string; nota: string }[] = [
  { value: 1, label: "Livello 1 · Tutto bene", nota: "lettura libera, nessuna domanda e nessun contatto" },
  { value: 2, label: "Livello 2 · Così così", nota: "ci arriva dalle domande guidate, può chiedere aiuto dopo" },
  { value: 3, label: "Livello 3 · È andata male", nota: "ci arriva chi sta peggio: il contatto è a un passo" },
];

export type Categoria = { id: string; slug: string; label: string };

export type Articolo = {
  id: string;
  level: Livello;
  category_id: string;
  title: string;
  body: string;
  status: "draft" | "published";
  updated_at: string;
};

/** Esito di un invio del form. `errore: null` = è andata. */
export type EsitoForm = { errore: string | null };
export const ESITO_INIZIALE: EsitoForm = { errore: null };

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
