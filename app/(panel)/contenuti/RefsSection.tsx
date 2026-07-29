// app/(panel)/contenuti/RefsSection.tsx
// V2 — I riferimenti culturali di un articolo: quelli agganciati e come aggiungerne.
//
// ⚠️ Due form SEPARATI, affiancati e mai annidati: l'HTML non ammette un <form>
// dentro un altro, e il form dell'articolo sta già in questa pagina. È il motivo
// per cui questa sezione vive fuori da ArticleForm invece che dentro.

"use client";

import { useActionState } from "react";
import { colors, radius } from "@/lib/panel-theme";
import {
  ESITO_INIZIALE,
  TIPO_RIFERIMENTO,
  type Aggancio,
  type EsitoForm,
  type Riferimento,
} from "./content-data";

export default function RefsSection({
  agganci,
  riferimenti,
  aggancia,
  gestisci,
}: {
  /** Quelli già davanti a questo articolo, in ordine. */
  agganci: (Aggancio & { riferimento: Riferimento | undefined })[];
  /** Tutti quelli esistenti, per il menu "scegli fra quelli già inseriti". */
  riferimenti: Riferimento[];
  aggancia: (prev: EsitoForm, formData: FormData) => Promise<EsitoForm>;
  gestisci: (prev: EsitoForm, formData: FormData) => Promise<EsitoForm>;
}) {
  const [esitoAgg, submitAggancia, agganciando] = useActionState(aggancia, ESITO_INIZIALE);
  const [esitoGest, submitGestisci, gestendo] = useActionState(gestisci, ESITO_INIZIALE);

  const giaAgganciati = new Set(agganci.map((a) => a.cultural_ref_id));
  const disponibili = riferimenti.filter((r) => !giaAgganciati.has(r.id));

  return (
    <section style={styles.sezione}>
      <h2 style={styles.h2}>Riferimenti culturali</h2>
      <p style={styles.sub}>
        Compaiono <strong>prima</strong> del testo, ed è la prima cosa che il ragazzo
        vede. Lo stesso film può stare davanti a più articoli: la descrizione la
        scrivi ogni volta, perché parla di <em>questo</em> problema.
      </p>

      {/* ---- QUELLI GIÀ AGGANCIATI ---- */}
      {agganci.length === 0 ? (
        <div style={styles.vuoto}>
          Nessun riferimento, per ora. L&apos;articolo funziona lo stesso.
        </div>
      ) : (
        <form action={submitGestisci} style={styles.lista}>
          {agganci.map((a) => (
            <div key={a.cultural_ref_id} style={styles.riga}>
              <div style={styles.rigaTesta}>
                <span style={styles.tipo}>
                  {a.riferimento ? TIPO_RIFERIMENTO[a.riferimento.kind] : "?"}
                </span>
                <span style={styles.titolo}>
                  {a.riferimento?.title ?? "riferimento non trovato"}
                </span>
                <button
                  type="submit"
                  name="scollega"
                  value={a.cultural_ref_id}
                  disabled={gestendo}
                  style={styles.rimuovi}
                >
                  Rimuovi
                </button>
              </div>

              <textarea
                name={`desc_${a.cultural_ref_id}`}
                defaultValue={a.description}
                rows={3}
                placeholder="Perché lo consigli, per questo articolo…"
                style={styles.textarea}
              />
            </div>
          ))}

          {esitoGest.errore ? <div style={styles.errore}>{esitoGest.errore}</div> : null}

          <div>
            <button type="submit" disabled={gestendo} style={styles.btnPrimario}>
              {gestendo ? "Salvo…" : "Salva le descrizioni"}
            </button>
          </div>
        </form>
      )}

      {/* ---- AGGIUNGERNE UNO ---- */}
      <form action={submitAggancia} style={styles.aggiungi}>
        <h3 style={styles.h3}>Aggiungine uno</h3>

        {/* Scegliere fra gli esistenti è possibile solo se ce ne sono di liberi:
            un menu vuoto sarebbe una porta che non si apre, senza spiegazioni. */}
        {disponibili.length > 0 ? (
          <label style={styles.scelta}>
            <input type="radio" name="modo" value="esistente" defaultChecked />
            <span>Uno già inserito</span>
            <select name="ref_id" defaultValue="" style={styles.input}>
              <option value="" disabled>
                Scegli…
              </option>
              {disponibili.map((r) => (
                <option key={r.id} value={r.id}>
                  {TIPO_RIFERIMENTO[r.kind]} · {r.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label style={styles.scelta}>
          <input
            type="radio"
            name="modo"
            value="nuovo"
            defaultChecked={disponibili.length === 0}
          />
          <span>Uno nuovo</span>
          <select name="kind" defaultValue="film" style={{ ...styles.input, maxWidth: 150 }}>
            <option value="film">Film</option>
            <option value="song">Canzone</option>
          </select>
          <input
            name="titolo"
            type="text"
            placeholder="Titolo"
            style={{ ...styles.input, flex: "1 1 220px" }}
          />
        </label>

        <textarea
          name="descrizione"
          rows={3}
          placeholder="Perché lo consigli, per questo articolo… (puoi anche scriverla dopo)"
          style={styles.textarea}
        />

        {esitoAgg.errore ? <div style={styles.errore}>{esitoAgg.errore}</div> : null}

        <div>
          <button type="submit" disabled={agganciando} style={styles.btnPrimario}>
            {agganciando ? "Aggancio…" : "Aggancia all'articolo"}
          </button>
        </div>
      </form>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sezione: {
    marginTop: "2.25rem",
    paddingTop: "1.75rem",
    borderTop: `1px solid ${colors.border}`,
    maxWidth: 760,
  },
  h2: { margin: 0, fontSize: "1.05rem", fontWeight: 800, color: colors.title },
  sub: { margin: "0.35rem 0 1.1rem", fontSize: "0.86rem", color: colors.muted, lineHeight: 1.55 },
  h3: { margin: "0 0 0.2rem", fontSize: "0.9rem", fontWeight: 800, color: colors.title },
  lista: { display: "flex", flexDirection: "column", gap: "0.9rem" },
  riga: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "0.9rem 1rem",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
  },
  rigaTesta: { display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" },
  tipo: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.25rem 0.55rem",
    borderRadius: radius.pill,
    color: colors.accentDark,
    background: "#dff0ee",
    whiteSpace: "nowrap",
  },
  titolo: { fontSize: "0.95rem", fontWeight: 700, color: colors.title, flex: 1, minWidth: 0 },
  rimuovi: {
    padding: "0.35rem 0.7rem",
    borderRadius: 8,
    border: "1px solid #e3bdb7",
    background: colors.surface,
    color: colors.danger,
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  aggiungi: {
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    marginTop: "1.5rem",
    padding: "1.1rem 1.15rem",
    background: colors.bg,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.card,
  },
  scelta: { display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", fontSize: "0.9rem" },
  input: {
    padding: "0.5rem 0.6rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.surface,
    color: colors.text,
    fontSize: "0.92rem",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "0.6rem 0.7rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.surface,
    color: colors.text,
    fontSize: "0.92rem",
    fontFamily: "inherit",
    lineHeight: 1.55,
    resize: "vertical",
    width: "100%",
    boxSizing: "border-box",
  },
  vuoto: {
    padding: "1.1rem",
    textAlign: "center",
    color: colors.muted,
    background: colors.surface,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.card,
    fontSize: "0.9rem",
  },
  errore: {
    padding: "0.7rem 0.9rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: radius.control,
    color: "#8a2b20",
    fontSize: "0.88rem",
  },
  btnPrimario: {
    padding: "0.6rem 1.05rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.accent}`,
    background: colors.accent,
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};
