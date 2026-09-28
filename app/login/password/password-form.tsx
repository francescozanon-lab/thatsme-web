"use client";

import { useActionState } from "react";
import { requestPasswordEmail } from "../actions";
import { formStyles as styles } from "../auth-styles";

const initialState = { error: "", sent: false };

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordEmail,
    initialState,
  );

  // Stesso messaggio che l'indirizzo sia registrato o no (vedi actions.ts).
  if (state.sent) {
    return (
      <p role="status" style={styles.notice}>
        Se l&apos;indirizzo è registrato, tra poco ti arriva un&apos;email con il
        link. Controlla anche lo spam. Il link si usa una volta sola e scade dopo
        poco.
      </p>
    );
  }

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

      {state.error ? (
        <p role="alert" style={styles.error}>
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} style={styles.button}>
        {pending ? "Invio in corso…" : "Mandami il link"}
      </button>
    </form>
  );
}
