// app/login/auth-styles.ts
// Stili condivisi dalle pagine d'accesso (login, primo accesso, link dell'email):
// la cornice (authStyles) e i moduli (formStyles). Modulo neutro, né "use client"
// né "use server": lo leggono sia le pagine server sia i moduli client.

import type { CSSProperties } from "react";

export const authStyles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    background: "#eef3f3",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#fff",
    borderRadius: "18px",
    padding: "2rem 1.75rem",
    boxShadow: "0 10px 40px rgba(31, 64, 67, 0.10)",
    border: "1px solid #e2eaea",
  },
  eyebrow: {
    margin: 0,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#2f7d77",
  },
  title: {
    margin: "0.5rem 0 0.25rem",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#16282e",
  },
  subtitle: {
    margin: "0 0 1.4rem",
    fontSize: "0.92rem",
    color: "#5c6b71",
  },
  denied: {
    margin: "0 0 1rem",
    fontSize: "0.85rem",
    color: "#8a5300",
    background: "#fdf3e2",
    border: "1px solid #f1ddb8",
    borderRadius: "8px",
    padding: "0.55rem 0.7rem",
  },
  link: {
    display: "block",
    marginTop: "1.2rem",
    textAlign: "center",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#2f7d77",
    textDecoration: "none",
  },
};

export const formStyles: Record<string, CSSProperties> = {
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  label: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  labelText: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#3a4a52",
    letterSpacing: "0.01em",
  },
  input: {
    padding: "0.7rem 0.85rem",
    borderRadius: "10px",
    border: "1px solid #d4dde0",
    fontSize: "1rem",
    color: "#1c2b32",
    background: "#fff",
    outlineColor: "#2f7d77",
  },
  error: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#b3261e",
    background: "#fcecea",
    border: "1px solid #f3c9c4",
    borderRadius: "8px",
    padding: "0.55rem 0.7rem",
  },
  notice: {
    margin: 0,
    fontSize: "0.9rem",
    lineHeight: 1.5,
    color: "#1f4d4a",
    background: "#e8f4f2",
    border: "1px solid #c5e3de",
    borderRadius: "8px",
    padding: "0.7rem 0.8rem",
  },
  button: {
    marginTop: "0.4rem",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "none",
    background: "#2f7d77",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
