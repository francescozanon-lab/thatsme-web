// app/(panel)/contenuti/ArticleForm.tsx
// V2 — Il form dell'articolo, usato sia per crearne uno sia per modificarlo.
//
// Client Component per una ragione sola: `useActionState` permette di mostrare un
// errore SENZA ricaricare la pagina, quindi senza far perdere il testo scritto. Un
// articolo può essere lungo; perderlo una volta basta a non fidarsi più.

"use client";

import { useActionState, useRef, useState } from "react";
import { colors, radius } from "@/lib/panel-theme";
import {
  ESITO_INIZIALE,
  LIVELLI,
  MARCA_GRASSETTO,
  segmentaTesto,
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

  // Il testo è "controllato" (lo tiene React) per due motivi che vanno insieme:
  // il bottone Grassetto deve poter riscrivere il campo attorno alla selezione, e
  // l'anteprima qui sotto deve aggiornarsi mentre si scrive.
  const [testo, setTesto] = useState(articolo?.body ?? "");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Mette o toglie il grassetto sulla porzione selezionata.
  // Nessuno deve imparare una sintassi: si seleziona e si preme, come ovunque.
  function toggleGrassetto() {
    const area = areaRef.current;
    if (!area) return;

    const da = area.selectionStart;
    const a = area.selectionEnd;
    const selezione = testo.slice(da, a);

    // Niente selezione: apro i marcatori e lascio il cursore in mezzo, così chi
    // preme il bottone *prima* di scrivere ottiene comunque quello che si aspetta.
    if (da === a) {
      const nuovo = testo.slice(0, da) + MARCA_GRASSETTO + MARCA_GRASSETTO + testo.slice(a);
      setTesto(nuovo);
      const cursore = da + MARCA_GRASSETTO.length;
      requestAnimationFrame(() => {
        area.focus();
        area.setSelectionRange(cursore, cursore);
      });
      return;
    }

    // Già in grassetto → lo tolgo. Senza questo, premere due volte produrrebbe
    // asterischi dentro asterischi e un risultato che non si capisce.
    const giaGrassetto =
      selezione.startsWith(MARCA_GRASSETTO) && selezione.endsWith(MARCA_GRASSETTO);
    const sostituto = giaGrassetto
      ? selezione.slice(2, -2)
      : MARCA_GRASSETTO + selezione + MARCA_GRASSETTO;

    setTesto(testo.slice(0, da) + sostituto + testo.slice(a));
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(da, da + sostituto.length);
    });
  }

  // Ctrl+B (Cmd+B sul Mac): è il gesto che le dita fanno da sole.
  function tastiera(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleGrassetto();
    }
  }

  const pezzi = segmentaTesto(testo);

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

      <div style={styles.campo}>
        <div style={styles.barraTesto}>
          <span style={styles.etichetta}>Testo</span>
          <button
            type="button"
            onClick={toggleGrassetto}
            title="Grassetto (Ctrl+B) — seleziona il testo e premi"
            style={styles.btnGrassetto}
          >
            <strong>G</strong>
          </button>
        </div>

        <textarea
          ref={areaRef}
          name="body"
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          onKeyDown={tastiera}
          rows={14}
          placeholder="Il testo dell'articolo…"
          style={{ ...styles.input, ...styles.textarea }}
        />
        <span style={styles.aiuto}>
          Per il grassetto: seleziona le parole e premi <strong>G</strong> (o Ctrl+B).
          Nel campo compaiono due asterischi ai lati — sono solo il segno, il ragazzo
          vedrà il grassetto come nell&apos;anteprima qui sotto.
        </span>
      </div>

      {/* L'anteprima non è un vezzo: è ciò che permette di non pensare agli
          asterischi. Chi scrive guarda qui e vede la pagina che leggerà il ragazzo. */}
      <div style={styles.campo}>
        <span style={styles.etichetta}>Come lo vedrà il ragazzo</span>
        <div style={styles.anteprima}>
          {testo.trim() ? (
            pezzi.map((p, i) =>
              p.grassetto ? (
                <strong key={i}>{p.testo}</strong>
              ) : (
                <span key={i}>{p.testo}</span>
              ),
            )
          ) : (
            <span style={styles.anteprimaVuota}>
              Qui comparirà il testo mentre lo scrivi.
            </span>
          )}
        </div>
      </div>

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
  barraTesto: { display: "flex", alignItems: "center", gap: "0.6rem" },
  btnGrassetto: {
    width: 30,
    height: 28,
    borderRadius: 8,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.btnBg,
    color: colors.btnText,
    fontSize: "0.9rem",
    cursor: "pointer",
    lineHeight: 1,
  },
  anteprima: {
    padding: "0.9rem 1rem",
    minHeight: 90,
    borderRadius: radius.control,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    fontSize: "0.95rem",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",   // gli a capo scritti nel campo si vedono anche qui
    wordBreak: "break-word",
  },
  anteprimaVuota: { color: colors.muted, fontStyle: "italic" },
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
