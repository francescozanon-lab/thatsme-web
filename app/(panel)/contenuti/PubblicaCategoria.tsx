// app/(panel)/contenuti/PubblicaCategoria.tsx
// «Pubblica le N bozze» di una categoria, con conferma in due tempi.
//
// Perché la conferma: pubblicare vuol dire mettere quei testi sotto gli occhi dei
// ragazzi, ed è l'unica azione di questa pagina che si vede fuori dal pannello.
// Stesso criterio della chiusura di un caso: niente finestre di sistema, la domanda
// compare al posto del bottone.
//
// Client Component per `useActionState`: l'errore torna senza ricaricare la pagina.

"use client";

import { useActionState, useState } from "react";
import { colors, radius } from "@/lib/panel-theme";
import { ESITO_INIZIALE, type EsitoForm } from "./content-data";

export default function PubblicaCategoria({
  quante,
  azione,
}: {
  /** Quante bozze VERE (segnaposto esclusi) ci sono in questa categoria. */
  quante: number;
  azione: (prev: EsitoForm, formData: FormData) => Promise<EsitoForm>;
}) {
  const [esito, submit, inCorso] = useActionState(azione, ESITO_INIZIALE);
  const [chiedo, setChiedo] = useState(false);

  if (quante === 0) return null;

  if (!chiedo) {
    return (
      <div style={styles.riga}>
        <button type="button" onClick={() => setChiedo(true)} style={styles.btn}>
          Pubblica {quante === 1 ? "la bozza" : `le ${quante} bozze`}
        </button>
        {esito.errore ? <span style={styles.errore}>{esito.errore}</span> : null}
      </div>
    );
  }

  return (
    <form action={submit} style={styles.riga}>
      <span style={styles.domanda}>
        {quante === 1
          ? "La pubblico? La vedranno i ragazzi nell'app."
          : `Le pubblico tutte e ${quante}? Le vedranno i ragazzi nell'app.`}
      </span>
      <button type="submit" disabled={inCorso} style={{ ...styles.btn, ...styles.btnSi }}>
        {inCorso ? "Pubblico…" : "Sì, pubblica"}
      </button>
      <button type="button" onClick={() => setChiedo(false)} style={styles.btnNo}>
        Annulla
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  riga: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  domanda: { fontSize: "0.82rem", color: colors.text },
  btn: {
    padding: "0.4rem 0.8rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.btnBg,
    color: colors.btnText,
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnSi: { background: colors.accent, borderColor: colors.accent, color: "#fff" },
  btnNo: {
    padding: "0.4rem 0.7rem",
    borderRadius: radius.control,
    border: "none",
    background: "transparent",
    color: colors.muted,
    fontSize: "0.82rem",
    cursor: "pointer",
  },
  errore: { fontSize: "0.8rem", color: colors.danger },
};
