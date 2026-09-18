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
// (16/09/2026: niente più domande guidate — si arriva all'articolo scegliendo
// categoria e sottocategoria; il contatto sta in fondo all'articolo, solo L2 e L3.)
export const LIVELLI: { value: Livello; label: string; breve: string; nota: string }[] = [
  { value: 1, label: "Livello 1 · Tutto bene", breve: "Tutto bene", nota: "lettura libera, nessun contatto con lo psicologo" },
  { value: 2, label: "Livello 2 · Così così", breve: "Così così", nota: "in fondo all'articolo può chiedere di parlare con uno psicologo" },
  { value: 3, label: "Livello 3 · È andata male", breve: "È andata male", nota: "lo legge chi sta peggio: in fondo c'è il contatto con lo psicologo" },
];

export type Categoria = { id: string; slug: string; label: string };

// Cinque per categoria (decisione 16 del 16/09/2026). È ciò che il ragazzo tocca
// dopo aver scelto la categoria.
export type Sottocategoria = {
  id: string;
  category_id: string;
  slug: string;
  label: string;
};

// Un articolo vive in UNA casella: (sottocategoria, livello). Il database rifiuta
// il secondo nella stessa casella, e non accetta una sottocategoria sotto la
// categoria sbagliata. Per questo nel pannello la posizione non si sceglie: si
// sceglie la casella nella griglia.
export type Articolo = {
  id: string;
  level: Livello;
  category_id: string;
  subcategory_id: string;
  title: string;
  body: string;
  /** «Una domanda per te…» — chiude l'articolo, il ragazzo la legge e basta. */
  closing_question: string;
  status: "draft" | "published";
  updated_at: string;
};

// I segnaposto (ottava categoria, domande mancanti) cominciano tutti così:
// riconoscibili a colpo d'occhio, e quindi anche dal codice.
export const SEGNAPOSTO = "PLACEHOLDER";
export const eSegnaposto = (testo: string) => testo.trim().startsWith(SEGNAPOSTO);

// ------------------------------------------------------------
// RIFERIMENTI CULTURALI
// ------------------------------------------------------------
// Un'opera (film, brano, romanzo…) esiste UNA volta sola (`Riferimento`) e può
// stare in più articoli. Quello che cambia da un articolo all'altro è la
// DESCRIZIONE: è il cuore della decisione 4 chiusa col cliente — la stessa opera
// consigliata in un articolo sulla bulimia e in uno sull'ansia va spiegata in due
// modi diversi, perché parla di quel problema. Per questo la descrizione sta
// nell'AGGANCIO. I documenti degli psicologi lo confermano: la stessa canzone
// torna in schede diverse con spiegazioni diverse.
export type Riferimento = {
  id: string;
  /** slug della tabella `cultural_ref_kinds` */
  kind: string;
  /** in corsivo */
  title: string;
  /** autore e/o anno, in tondo dopo il titolo: «Greta Gerwig, 2017» */
  credits: string;
};

export type Aggancio = {
  cultural_ref_id: string;
  description: string;
  sort: number;
};

// I tipi non sono più scritti qui (erano solo Film e Canzone): stanno nella tabella
// `cultural_ref_kinds`, 18 voci costruite sulle parole degli psicologi. Aggiungerne
// uno è una riga nel database, non una modifica al pannello.
export type TipoRiferimento = { slug: string; label: string };

/** Esito di un invio del form. `errore: null` = è andata. */
export type EsitoForm = { errore: string | null };
export const ESITO_INIZIALE: EsitoForm = { errore: null };

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ------------------------------------------------------------
// GRASSETTO — una regola sola, condivisa da pannello e app
// ------------------------------------------------------------
// Il testo si salva come TESTO, con `**così**` a segnare le parti in grassetto.
//
// PERCHÉ non un editor "tipo Word" che produce HTML: l'app è **React Native**, non
// un browser — non sa disegnare l'HTML da sola, servirebbe una libreria che lo
// interpreti, con il suo peso e i suoi bachi. Un marcatore banale invece lo
// disegnano entrambi con dieci righe, e resta leggibile anche a occhio nudo se un
// domani i contenuti finissero altrove.
//
// Lo psicologo non scrive mai questi asterischi a mano: seleziona e preme il
// bottone (o Ctrl+B). Li vede nel campo, ma sotto ha l'anteprima di come apparirà.
export const MARCA_GRASSETTO = "**";

export type Pezzo = { testo: string; grassetto: boolean };

/**
 * Spezza il testo in pezzi normali e in grassetto.
 * ⚠️ Questa funzione è la definizione del formato: quando in V4 l'app disegnerà
 * l'articolo, deve applicare ESATTAMENTE questa regola, o il pannello e l'app
 * mostrerebbero due cose diverse.
 *
 * Un `**` senza il suo compagno resta testo normale, asterischi compresi: è
 * volutamente visibile, così chi scrive si accorge che qualcosa non torna.
 */
export function segmentaTesto(testo: string): Pezzo[] {
  const pezzi: Pezzo[] = [];
  // Le parentesi nella regex tengono i separatori dentro il risultato dello split.
  for (const parte of testo.split(/(\*\*[^*]+\*\*)/g)) {
    if (!parte) continue;
    const grassetto = parte.length > 4 && parte.startsWith("**") && parte.endsWith("**");
    pezzi.push({
      testo: grassetto ? parte.slice(2, -2) : parte,
      grassetto,
    });
  }
  return pezzi;
}
