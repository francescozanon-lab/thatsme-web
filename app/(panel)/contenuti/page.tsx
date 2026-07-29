// app/(panel)/contenuti/page.tsx
// V2 — L'elenco degli articoli, raggruppati per livello.
// Server Component: legge come lo psicologo loggato, quindi la RLS decide cosa vede
// (le bozze solo a chi pubblica).

import Link from "next/link";
import { requirePublisher } from "./guard";
import { LIVELLI, type Articolo, type Categoria } from "./content-data";
import { colors, radius, shadow } from "@/lib/panel-theme";
import { dayTime } from "@/lib/panel-format";

export default async function ContenutiPage() {
  const { supabase } = await requirePublisher();

  const [catRes, artRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, label")
      .eq("is_active", true)
      .order("sort"),
    supabase
      .from("articles")
      .select("id, level, category_id, title, body, status, updated_at")
      .order("level")
      .order("updated_at", { ascending: false }),
  ]);

  const categorie = (catRes.data ?? []) as Categoria[];
  const articoli = (artRes.data ?? []) as Articolo[];
  const nomeCategoria = new Map(categorie.map((c) => [c.id, c.label]));

  return (
    <div>
      <div style={styles.headRow}>
        <div>
          <h1 style={styles.h1}>Contenuti</h1>
          <p style={styles.sub}>
            Gli articoli che i ragazzi leggono nell&apos;app, uno per livello e categoria.
          </p>
        </div>
        <Link href="/contenuti/nuovo" style={styles.nuovo}>
          Nuovo articolo
        </Link>
      </div>

      {/* Un errore di lettura non è "nessun articolo": il primo è un guasto, il
          secondo è normale il primo giorno. Confonderli farebbe pensare che il
          lavoro appena salvato sia sparito. */}
      {artRes.error ? (
        <div style={styles.errorBox}>
          Non riesco a leggere gli articoli: {artRes.error.message}
        </div>
      ) : articoli.length === 0 ? (
        <div style={styles.empty}>
          Ancora nessun articolo. Il primo si scrive da <strong>Nuovo articolo</strong>:
          nasce come bozza, quindi non lo vede nessuno finché non lo pubblichi.
        </div>
      ) : (
        LIVELLI.map((liv) => {
          const delLivello = articoli.filter((a) => a.level === liv.value);
          if (delLivello.length === 0) return null;

          return (
            <section key={liv.value} style={styles.gruppo}>
              <h2 style={styles.h2}>
                {liv.label}
                <span style={styles.h2Nota}>{liv.nota}</span>
              </h2>

              <div style={styles.list}>
                {delLivello.map((a) => {
                  const pubblicato = a.status === "published";
                  return (
                    <Link key={a.id} href={`/contenuti/${a.id}`} style={styles.row}>
                      <div style={styles.rowLeft}>
                        <span
                          style={{
                            ...styles.stato,
                            color: pubblicato ? colors.accentDark : colors.muted,
                            background: pubblicato ? "#dff0ee" : colors.bg,
                          }}
                        >
                          {pubblicato ? "Pubblicato" : "Bozza"}
                        </span>
                        <div style={styles.testi}>
                          <span style={styles.titolo}>{a.title}</span>
                          <span style={styles.meta}>
                            {nomeCategoria.get(a.category_id) ?? "categoria non trovata"}
                            {" · "}
                            aggiornato {dayTime(a.updated_at)}
                          </span>
                        </div>
                      </div>
                      <span style={styles.apri}>Apri</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "1.25rem",
  },
  h1: { margin: 0, fontSize: "1.4rem", fontWeight: 800, color: colors.title },
  sub: { margin: "0.3rem 0 0", fontSize: "0.9rem", color: colors.muted },
  nuovo: {
    padding: "0.6rem 1.1rem",
    borderRadius: radius.control,
    background: colors.accent,
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  gruppo: { marginBottom: "1.75rem" },
  h2: {
    margin: "0 0 0.7rem",
    fontSize: "1rem",
    fontWeight: 800,
    color: colors.title,
    display: "flex",
    flexDirection: "column",
  },
  h2Nota: { fontSize: "0.78rem", fontWeight: 500, color: colors.muted, marginTop: 2 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    boxShadow: shadow,
    padding: "0.9rem 1.15rem",
    textDecoration: "none",
    color: "inherit",
  },
  rowLeft: { display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 },
  stato: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.3rem 0.6rem",
    borderRadius: radius.pill,
    whiteSpace: "nowrap",
  },
  testi: { display: "flex", flexDirection: "column", minWidth: 0 },
  titolo: { fontSize: "0.95rem", fontWeight: 700, color: colors.title },
  meta: { fontSize: "0.8rem", color: colors.muted },
  apri: { fontSize: "0.85rem", fontWeight: 700, color: colors.accentDark, whiteSpace: "nowrap" },
  empty: {
    padding: "2.5rem 1.5rem",
    textAlign: "center",
    color: colors.muted,
    background: colors.surface,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.card,
    fontSize: "0.95rem",
  },
  errorBox: {
    padding: "1rem 1.25rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: 12,
    color: "#8a2b20",
    fontSize: "0.9rem",
  },
};
