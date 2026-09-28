"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { formStyles as styles } from "./auth-styles";

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
