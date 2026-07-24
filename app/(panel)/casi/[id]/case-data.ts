// app/(panel)/casi/[id]/case-data.ts
// P3.5 — Pezzi condivisi fra il Server Component della pagina e i Client Component.
// Sta in un modulo NEUTRO (senza "use client") di proposito: da un modulo client il
// server non può leggere valori esportati (Next li sostituisce con riferimenti).

/** Colonne dei messaggi: identiche a quelle dell'app mobile (chat.tsx, P2.7). */
export const MSG_COLS =
  "id, conversation_id, sender_id, sender_type, content, created_at";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "user" | "professional";
  content: string;
  created_at: string;
};

/**
 * Marcatore della NOTA INTERNA dello psicologo.
 * Le note non hanno una tabella propria: vivono in `case_status_log` (che ha già la
 * colonna `note`) con questo valore al posto di uno stato reale. Due motivi:
 *  1. zero migrazioni da applicare su Supabase;
 *  2. soprattutto: `case_status_log` non concede NESSUNA policy di lettura al ragazzo
 *     → la nota è invisibile all'utente per costruzione, non per gentilezza della UI.
 * ⚠️ P3.7/P3.8: le statistiche devono filtrare `new_status in ('in_progress','resolved')`,
 * altrimenti contano dentro anche le note.
 */
export const NOTE_STATUS = "note";

/**
 * Orario HH:MM forzato in ora italiana. Il server (Vercel) gira in UTC e il browser no:
 * senza timeZone fissa, l'HTML del server e quello del client non combaciano (hydration).
 */
export function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

/** Data + ora estesa (usata nell'elenco delle note interne). */
export function dayTime(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}
