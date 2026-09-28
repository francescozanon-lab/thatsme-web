"use client";

import Link from "next/link";
import { useActionState } from "react";
import { colors, radius } from "@/lib/panel-theme";
import { updatePassword } from "../actions";
import { PASSWORD_MIN_LENGTH } from "./rules";

const initialState = { error: "", ok: false };

export default function NewPasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  if (state.ok) {
    return (
      <div role="status" style={styles.ok}>
        Password salvata: da ora entri con questa.{" "}
        <Link href="/" style={styles.okLink}>
          Vai ai casi in arrivo
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} style={styles.form}>
      {/* Nascosto: serve ai gestori di password per abbinare la password nuova
          all'account giusto. L'azione non lo legge. */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        style={{ display: "none" }}
      />

      <label style={styles.label}>
        <span style={styles.labelText}>Nuova password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoFocus
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        <span style={styles.labelText}>Ripeti la password</span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          style={styles.input}
        />
      </label>

      {state.error ? (
        <div role="alert" style={styles.err}>
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={pending} style={styles.save}>
        {pending ? "Salvo…" : "Salva la password"}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  label: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  labelText: { fontSize: "0.82rem", fontWeight: 600, color: colors.text },
  input: {
    padding: "0.65rem 0.8rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.surface,
    color: colors.text,
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  save: {
    alignSelf: "flex-start",
    padding: "0.6rem 1.2rem",
    borderRadius: radius.control,
    border: "none",
    background: colors.accent,
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  err: {
    padding: "0.6rem 0.9rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: radius.control,
    color: "#8a2b20",
    fontSize: "0.85rem",
  },
  ok: {
    padding: "0.8rem 1rem",
    background: "#f2f9f8",
    border: `1px solid ${colors.accent}`,
    borderRadius: radius.control,
    color: colors.accentDark,
    fontSize: "0.92rem",
    lineHeight: 1.5,
  },
  okLink: { color: colors.accentDark, fontWeight: 700 },
};
