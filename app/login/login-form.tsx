"use client";

import { useActionState } from "react";
import { login } from "./actions";

const initialState = { error: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} style={styles.form}>
      <label style={styles.label}>
        <span style={styles.labelText}>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="nome@esempio.it"
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        <span style={styles.labelText}>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          style={styles.input}
        />
      </label>

      {state?.error ? (
        <p role="alert" style={styles.error}>
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} style={styles.button}>
        {pending ? "Accesso in corso…" : "Accedi"}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
