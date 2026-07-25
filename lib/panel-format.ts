// lib/panel-format.ts
// Formattatori di data/ora del pannello, tutti insieme per un motivo preciso:
// il fuso va SEMPRE dichiarato. Il server (su Vercel) gira in UTC e il browser no →
// senza `timeZone` fisso l'ora mostrata cambia a seconda di chi rende la pagina e,
// nei Client Component, l'HTML del server non combacia con quello del client (hydration).

const TZ = "Europe/Rome";

/** Orario breve: "14:32". */
export function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/** Data + ora estesa: "24 luglio, 14:32". */
export function dayTime(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/** Data lunga senza orario: "24 luglio 2026". */
export function dateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

/**
 * Durata leggibile da un numero di SECONDI: "45 sec", "12 min", "2h 15min", "3g 4h".
 * `null` (media non calcolabile: nessun dato) → "—".
 */
export function durationLabel(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} sec`;

  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const rest = mins % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const restH = hours % 24;
  return restH ? `${days}g ${restH}h` : `${days}g`;
}

/**
 * Da quanto tempo, in forma corta: "ora", "12 min", "3h 40min", "2 giorni".
 * ⚠️ Legge l'orologio (`Date.now()`): usarla solo nei Server Component, dove la pagina
 * è resa a ogni richiesta. In un Client Component darebbe hydration mismatch.
 */
export function sinceLabel(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "ora";
  if (mins < 60) return `${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const rest = mins % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return days === 1 ? "1 giorno" : `${days} giorni`;
}
