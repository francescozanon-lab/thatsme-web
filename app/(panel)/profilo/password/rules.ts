// app/(panel)/profilo/password/rules.ts
// La regola della password in un posto solo: la leggono la pagina (testo), il
// modulo client (minLength) e la Server Action (controllo vero). Modulo neutro:
// un file "use server" può esportare solo funzioni, uno "use client" non può
// passare valori al server.

export const PASSWORD_MIN_LENGTH = 10;
