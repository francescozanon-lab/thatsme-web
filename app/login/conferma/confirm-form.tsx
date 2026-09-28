"use client";

import { useActionState } from "react";
import { confirmRecovery } from "../actions";
import { formStyles as styles } from "../auth-styles";

const initialState = { error: "" };

export default function ConfirmForm({ tokenHash }: { tokenHash: string }) {
  const [state, formAction, pending] = useActionState(
    confirmRecovery,
    initialState,
  );

  // Se la verifica fallisce il link è consumato o scaduto: ripremere non serve,
  // resta solo «Chiedi un nuovo link» sotto.
  if (state.error) {
    return (
      <p role="alert" style={styles.error}>
        {state.error}
      </p>
    );
  }

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="token_hash" value={tokenHash} />
      <button type="submit" disabled={pending} style={styles.button}>
        {pending ? "Un momento…" : "Continua"}
      </button>
    </form>
  );
}
