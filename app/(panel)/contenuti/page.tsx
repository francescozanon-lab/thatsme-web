// app/(panel)/contenuti/page.tsx
// V2 — La GRIGLIA dei contenuti (decisione 26 del 16/09/2026): categoria ×
// sottocategoria × livello, 120 caselle. Ogni casella è piena o vuota.
//
// Sostituisce l'elenco con il bottone «Nuovo articolo». Il motivo: nel modello
// definitivo ogni casella ospita UN articolo, e il lavoro degli psicologi è vedere
// cosa manca e cosa è da rivedere — un elenco lo nasconde, una griglia lo mostra.
// Per scrivere un articolo nuovo si clicca una casella vuota.
//
// Server Component: legge come lo psicologo loggato, quindi la RLS decide cosa vede
// (le bozze solo a chi pubblica).

import Link from "next/link";
import { requirePublisher } from "./guard";
import {
  LIVELLI,
  eSegnaposto,
  type Articolo,
  type Categoria,
  type Sottocategoria,
} from "./content-data";
import { colors, radius, shadow } from "@/lib/panel-theme";

type Casella = Pick<Articolo, "id" | "level" | "subcategory_id" | "title" | "status" | "closing_question">;

// Lo stato che conta per chi guarda la griglia. «Segnaposto» vince su bozza e
// pubblicato: un segnaposto va riscritto, qualunque cosa dica il suo stato.
function statoDi(a: Casella) {
  if (eSegnaposto(a.title)) return STATI.segnaposto;
  return a.status === "published" ? STATI.pubblicato : STATI.bozza;
}

const STATI = {
  pubblicato: { etichetta: "Pubblicato", fg: colors.accentDark, bg: "#dff0ee" },
  bozza: { etichetta: "Bozza", fg: colors.muted, bg: colors.bg },
  segnaposto: { etichetta: "Segnaposto", fg: "#8a5a00", bg: "#fdf0d5" },
};

const domandaDaCompletare = (a: Casella) =>
  !a.closing_question.trim() || eSegnaposto(a.closing_question);

export default async function ContenutiPage() {
  const { supabase } = await requirePublisher();

  const [catRes, subRes, artRes] = await Promise.all([
    supabase.from("categories").select("id, slug, label").eq("is_active", true).order("sort"),
    supabase
      .from("subcategories")
      .select("id, category_id, slug, label")
      .eq("is_active", true)
      .order("sort"),
    supabase
      .from("articles")
      .select("id, level, subcategory_id, title, status, closing_question"),
  ]);

  // Un errore di lettura non è "griglia vuota": il primo è un guasto, il secondo
  // non succede più (ci sono 120 articoli). Confonderli farebbe pensare che il
  // lavoro degli psicologi sia sparito.
  const errore = catRes.error ?? subRes.error ?? artRes.error;
  if (errore) {
    return (
      <div>
        <h1 style={styles.h1}>Contenuti</h1>
        <div style={styles.errorBox}>Non riesco a leggere i contenuti: {errore.message}</div>
      </div>
    );
  }

  const categorie = (catRes.data ?? []) as Categoria[];
  const sottocategorie = (subRes.data ?? []) as Sottocategoria[];
  const articoli = (artRes.data ?? []) as Casella[];

  // (sottocategoria, livello) → articolo. È la chiave unica del database: in una
  // casella ce n'è al massimo uno.
  const perCasella = new Map(articoli.map((a) => [`${a.subcategory_id}/${a.level}`, a]));

  // I conti in cima: la risposta alla domanda «quanto manca?» senza scorrere 40 righe.
  const caselle = sottocategorie.length * LIVELLI.length;
  const conta = {
    pubblicati: articoli.filter((a) => statoDi(a) === STATI.pubblicato).length,
    bozze: articoli.filter((a) => statoDi(a) === STATI.bozza).length,
    segnaposto: articoli.filter((a) => statoDi(a) === STATI.segnaposto).length,
    domande: articoli.filter((a) => !eSegnaposto(a.title) && domandaDaCompletare(a)).length,
    vuote: caselle - articoli.length,
  };

  return (
    <div>
      <h1 style={styles.h1}>Contenuti</h1>
      <p style={styles.sub}>
        Gli articoli che i ragazzi leggono nell&apos;app: uno per ogni sottocategoria e
        livello. Clicca una casella per aprirla; una casella vuota si apre per scriverci.
      </p>

      <div style={styles.riepilogo}>
        <Conto n={conta.pubblicati} testo="pubblicati" stato={STATI.pubblicato} />
        <Conto n={conta.bozze} testo="in bozza" stato={STATI.bozza} />
        <Conto n={conta.segnaposto} testo="segnaposto" stato={STATI.segnaposto} />
        {conta.domande > 0 ? (
          <Conto n={conta.domande} testo="domande finali da scrivere" stato={STATI.segnaposto} />
        ) : null}
        {conta.vuote > 0 ? <Conto n={conta.vuote} testo="caselle vuote" stato={STATI.bozza} /> : null}
        <span style={styles.totale}>su {caselle} caselle</span>
      </div>

      {/* Indice: 8 categorie per 5 righe sono una pagina lunga. */}
      <nav style={styles.indice}>
        {categorie.map((c) => (
          <a key={c.id} href={`#${c.slug}`} style={styles.voceIndice}>
            {c.label}
          </a>
        ))}
      </nav>

      {categorie.map((c) => {
        const righe = sottocategorie.filter((s) => s.category_id === c.id);
        const pubblicatiQui = righe.reduce(
          (n, s) =>
            n +
            LIVELLI.filter((l) => {
              const a = perCasella.get(`${s.id}/${l.value}`);
              return a && statoDi(a) === STATI.pubblicato;
            }).length,
          0,
        );

        return (
          <section key={c.id} id={c.slug} style={styles.categoria}>
            <h2 style={styles.h2}>
              {c.label}
              <span style={styles.h2Conto}>
                {pubblicatiQui} pubblicati su {righe.length * LIVELLI.length}
              </span>
            </h2>

            <div style={styles.griglia}>
              {/* intestazione: i tre livelli */}
              <div />
              {LIVELLI.map((l) => (
                <div key={l.value} style={styles.testaLivello}>
                  Livello {l.value}
                  <span style={styles.testaLivelloNota}>{l.breve}</span>
                </div>
              ))}

              {righe.map((s) => (
                <Riga key={s.id} sottocategoria={s} perCasella={perCasella} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Conto({ n, testo, stato }: { n: number; testo: string; stato: { fg: string; bg: string } }) {
  return (
    <span style={{ ...styles.conto, color: stato.fg, background: stato.bg }}>
      <strong>{n}</strong> {testo}
    </span>
  );
}

function Riga({
  sottocategoria,
  perCasella,
}: {
  sottocategoria: Sottocategoria;
  perCasella: Map<string, Casella>;
}) {
  return (
    <>
      <div style={styles.nomeSotto}>{sottocategoria.label}</div>
      {LIVELLI.map((l) => {
        const a = perCasella.get(`${sottocategoria.id}/${l.value}`);

        if (!a) {
          return (
            <Link
              key={l.value}
              href={`/contenuti/nuovo?sottocategoria=${sottocategoria.id}&livello=${l.value}`}
              style={{ ...styles.casella, ...styles.casellaVuota }}
            >
              <span style={styles.vuotaTesto}>Vuota</span>
              <span style={styles.vuotaAzione}>Scrivi l&apos;articolo</span>
            </Link>
          );
        }

        const stato = statoDi(a);
        return (
          <Link key={l.value} href={`/contenuti/${a.id}`} style={styles.casella}>
            <span style={{ ...styles.stato, color: stato.fg, background: stato.bg }}>
              {stato.etichetta}
            </span>
            <span style={styles.titolo}>{a.title}</span>
            {stato !== STATI.segnaposto && domandaDaCompletare(a) ? (
              <span style={styles.manca}>Manca la domanda finale</span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: "1.4rem", fontWeight: 800, color: colors.title },
  sub: { margin: "0.3rem 0 1rem", fontSize: "0.9rem", color: colors.muted, lineHeight: 1.5 },
  riepilogo: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: "0.9rem" },
  conto: { fontSize: "0.82rem", padding: "0.3rem 0.65rem", borderRadius: radius.pill },
  totale: { fontSize: "0.82rem", color: colors.muted },
  indice: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: `1px solid ${colors.border}`,
  },
  voceIndice: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: colors.accentDark,
    textDecoration: "none",
    padding: "0.3rem 0.6rem",
    borderRadius: radius.control,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
  },
  categoria: { marginBottom: "2rem", scrollMarginTop: "1rem" },
  h2: {
    margin: "0 0 0.7rem",
    fontSize: "1.05rem",
    fontWeight: 800,
    color: colors.title,
    display: "flex",
    alignItems: "baseline",
    gap: "0.6rem",
  },
  h2Conto: { fontSize: "0.78rem", fontWeight: 500, color: colors.muted },
  griglia: {
    display: "grid",
    gridTemplateColumns: "190px repeat(3, minmax(0, 1fr))",
    gap: 8,
    alignItems: "stretch",
  },
  testaLivello: {
    fontSize: "0.78rem",
    fontWeight: 800,
    color: colors.title,
    padding: "0 0.2rem",
    display: "flex",
    flexDirection: "column",
  },
  testaLivelloNota: { fontWeight: 500, color: colors.muted },
  nomeSotto: {
    fontSize: "0.86rem",
    fontWeight: 700,
    color: colors.text,
    display: "flex",
    alignItems: "center",
    paddingRight: "0.4rem",
    lineHeight: 1.3,
  },
  casella: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "0.65rem 0.75rem",
    minHeight: 88,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.control + 2,
    boxShadow: shadow,
    textDecoration: "none",
    color: "inherit",
    minWidth: 0,
  },
  casellaVuota: {
    background: "transparent",
    border: `1px dashed ${colors.btnBorder}`,
    boxShadow: "none",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  vuotaTesto: { fontSize: "0.82rem", color: colors.muted },
  vuotaAzione: { fontSize: "0.82rem", fontWeight: 700, color: colors.accentDark },
  stato: {
    alignSelf: "flex-start",
    fontSize: "0.68rem",
    fontWeight: 700,
    padding: "0.2rem 0.5rem",
    borderRadius: radius.pill,
    whiteSpace: "nowrap",
  },
  // Il titolo si ferma a tre righe: la casella deve restare leggibile a colpo
  // d'occhio, e il titolo intero è a un clic.
  titolo: {
    fontSize: "0.84rem",
    fontWeight: 600,
    color: colors.title,
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  manca: { fontSize: "0.72rem", fontWeight: 700, color: "#9a6b00" },
  errorBox: {
    marginTop: "1rem",
    padding: "1rem 1.25rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: 12,
    color: "#8a2b20",
    fontSize: "0.9rem",
  },
};
