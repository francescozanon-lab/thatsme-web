// app/(panel)/contenuti/ArticleForm.tsx
// V2 — Il form dell'articolo, usato sia per crearne uno sia per modificarlo.
//
// Client Component per una ragione sola: `useActionState` permette di mostrare un
// errore SENZA ricaricare la pagina, quindi senza far perdere il testo scritto. Un
// articolo può essere lungo; perderlo una volta basta a non fidarsi più.

"use client";

import { useActionState } from "react";
import { colors, radius } from "@/lib/panel-theme";
import {
  ESITO_INIZIALE,
  LIVELLI,
  type Articolo,
  type Categoria,
  type EsitoForm,
} from "./content-data";

export default function ArticleForm({
  categorie,
  azione,
  articolo,
}: {
  categorie: Categoria[];
  /** Server Action già legata all'id, se stiamo modificando. */
  azione: (prev: EsitoForm, formData: FormData) => Promise<EsitoForm>;
  /** Assente = nuovo articolo. */
  articolo?: Articolo;
}) {
  const [esito, submit, inCorso] = useActionState(azione, ESITO_INIZIALE);
  const modifica = !!articolo;
  const pubblicato = articolo?.status === "published";

  return (
    <form action={submit} style={styles.form}>
      <div style={styles.riga}>
        <label style={styles.campo}>
          <span style={styles.etichetta}>Livello</span>
          <select
            name="level"
            defaultValue={articolo?.level ?? ""}
            required
            style={styles.input}
          >
            <option value="" disabled>
              Scegli…
            </option>
            {LIVELLI.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.campo}>
          <span style={styles.etichetta}>Categoria</span>
          <select
            name="category_id"
            defaultValue={articolo?.category_id ?? ""}
            required
            style={styles.input}
          >
            <option value="" disabled>
              Scegli…
            </option>
            {categorie.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Il promemoria di chi legge questo livello. Cambia mentre si sceglie, ed è
          l'unico posto in cui allo psicologo viene ricordato per chi sta scrivendo. */}
      <div style={styles.note}>
        {LIVELLI.map((l) => (
          <div key={l.value} style={styles.nota}>
            <strong style={styles.notaTitolo}>{l.label}</strong> — {l.nota}
          </div>
        ))}
      </div>

      <label style={styles.campo}>
        <span style={styles.etichetta}>Titolo</span>
        <input
          name="title"
          type="text"
          defaultValue={articolo?.title ?? ""}
          placeholder="Es. Quando la scuola diventa troppo"
          required
          style={styles.input}
        />
      </label>

      <label style={styles.campo}>
        <span style={styles.etichetta}>Testo</span>
        <textarea
          name="body"
          defaultValue={articolo?.body ?? ""}
          rows={16}
          placeholder="Il testo dell'articolo…"
          style={{ ...styles.input, ...styles.textarea }}
        />
        <span style={styles.aiuto}>
          Per ora è testo semplice: gli a capo si vedono, grassetti ed elenchi no. Se
          servono, si decide insieme dopo che avrete provato a scrivere qualcosa.
        </span>
      </label>

      {esito.errore ? <div style={styles.errore}>{esito.errore}</div> : null}

      <div style={styles.azioni}>
        <button
          type="submit"
          name="azione"
          value="salva"
          disabled={inCorso}
          style={{ ...styles.btn, ...styles.btnPrimario }}
        >
          {inCorso ? "Salvo…" : modifica ? "Salva le modifiche" : "Crea la bozza"}
        </button>

        {/* Pubblicare è un gesto separato dallo scrivere: nessuno manda in chiaro un
            testo a metà solo perché ha premuto Invio. In creazione non c'è: un
            articolo nasce sempre come bozza. */}
        {modifica ? (
          <button
            type="submit"
            name="azione"
            value={pubblicato ? "bozza" : "pubblica"}
            disabled={inCorso}
            style={{ ...styles.btn, ...(pubblicato ? styles.btnRitira : styles.btnPubblica) }}
          >
            {pubblicato ? "Salva e riporta in bozza" : "Salva e pubblica"}
          </button>
        ) : null}
      </div>

      {modifica ? (
        <p style={styles.aiuto}>
          {pubblicato
            ? "Questo articolo è online: i ragazzi lo vedono. Riportandolo in bozza sparisce dall'app, ma non si perde."
            : "Finché è in bozza non lo vede nessuno tranne chi pubblica. Puoi tornarci quando vuoi."}
        </p>
      ) : null}
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { display: "flex", flexDirection: "column", gap: "1.1rem", maxWidth: 760 },
  riga: { display: "flex", gap: "1rem", flexWrap: "wrap" },
  campo: { display: "flex", flexDirection: "column", gap: 6, flex: "1 1 240px", minWidth: 0 },
  etichetta: { fontSize: "0.82rem", fontWeight: 700, color: colors.title },
  input: {
    padding: "0.6rem 0.7rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.surface,
    color: colors.text,
    fontSize: "0.95rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: { resize: "vertical", lineHeight: 1.55 },
  note: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0.75rem 0.9rem",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.control,
  },
  nota: { fontSize: "0.82rem", color: colors.muted },
  notaTitolo: { color: colors.accentDark },
  aiuto: { fontSize: "0.8rem", color: colors.muted, margin: 0 },
  errore: {
    padding: "0.8rem 1rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: radius.control,
    color: "#8a2b20",
    fontSize: "0.9rem",
  },
  azioni: { display: "flex", gap: "0.6rem", flexWrap: "wrap" },
  btn: {
    padding: "0.65rem 1.1rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.btnBg,
    color: colors.btnText,
    fontSize: "0.92rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnPrimario: { background: colors.accent, borderColor: colors.accent, color: "#fff" },
  btnPubblica: { background: colors.surface, color: colors.accentDark, borderColor: colors.accent },
  btnRitira: { background: colors.surface, color: colors.danger, borderColor: "#e3bdb7" },
};
