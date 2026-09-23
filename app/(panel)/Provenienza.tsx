// app/(panel)/Provenienza.tsx
// V6 — Da dove arriva il ragazzo: stato d'animo + categoria · sottocategoria.
//
// ⚠️ Questo dato vive SOLO QUI (decisione 27 del 16/09/2026). Non entra nelle email
// né nelle notifiche push: «Orientamento sessuale e affettivo» sulla schermata di
// blocco di un telefono è un dato sensibile di un minore. La Edge Function `notify`
// infatti non lo legge.
//
// Perché serve: lo psicologo apre la chat sapendo già che il ragazzo stava leggendo
// «Famiglia · Autonomia e regole» dopo aver detto che è andata male. È un punto di
// partenza, e gli risparmia la prima domanda a vuoto.

import { colors, radius } from "@/lib/panel-theme";

/** I campi che servono: si leggono con un `select` che incrocia le due tabelle. */
type Etichetta = { label: string };

// Le richieste di prima del modello a 3 livelli non hanno né livello né
// sottocategoria: arrivano agganciate a una delle tre categorie «storiche»
// (`Vita (storica)`, `Scuola (storica)`, `Amore (storica)`), disattivate per l'app ma
// leggibili dagli psicologi. La vecchia categoria-parola (life/school/love), con il
// suo ripiego qui dentro, è stata tolta da `thatsme-app/db/v1_cleanup.sql`.
export type ProvenienzaDati = {
  level: number | null;
  // ⚠️ PostgREST restituisce le relazioni "to-one" come oggetto, ma a seconda di come
  // riconosce il vincolo può darle come array di uno (qui il rimando è DOPPIO, su due
  // colonne). Si accettano entrambe le forme, come già fa la pagina dei casi.
  categories: Etichetta | Etichetta[] | null;
  subcategories: Etichetta | Etichetta[] | null;
};

const uno = (v: Etichetta | Etichetta[] | null | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.label;

// Lo stato d'animo con cui è partito. L1 non compare mai: da «tutto bene» non nasce
// una richiesta di contatto.
const STATO: Record<number, { label: string; fg: string; bg: string }> = {
  2: { label: "Così così", fg: colors.life, bg: colors.lifeBg },
  3: { label: "È andata male", fg: colors.love, bg: colors.loveBg },
};

export const SELECT_PROVENIENZA = "level, categories(label), subcategories(label)";

export function Provenienza({ dati, compatta }: { dati: ProvenienzaDati; compatta?: boolean }) {
  const stato = dati.level ? STATO[dati.level] : null;
  const categoria = uno(dati.categories);
  const sottocategoria = uno(dati.subcategories);

  if (!stato && !categoria) return null;

  return (
    <span style={{ ...styles.riga, ...(compatta ? styles.rigaCompatta : null) }}>
      {stato ? (
        <span style={{ ...styles.pill, color: stato.fg, background: stato.bg }}>{stato.label}</span>
      ) : null}
      {categoria ? (
        <span style={styles.percorso}>
          {categoria}
          {sottocategoria ? <span style={styles.sotto}> · {sottocategoria}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  riga: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minWidth: 0 },
  rigaCompatta: { gap: 8 },
  pill: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.3rem 0.6rem",
    borderRadius: radius.pill,
    whiteSpace: "nowrap",
  },
  percorso: { fontSize: "0.88rem", fontWeight: 700, color: colors.title, minWidth: 0 },
  sotto: { fontWeight: 500, color: colors.muted },
};
