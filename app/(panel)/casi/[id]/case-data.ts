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

// Gli orari si formattano con `@/lib/panel-format` (fuso Europe/Rome dichiarato:
// vedi lì il perché). Prima stavano qui, ora servono anche a "I miei casi" (P3.4).
