// app/(panel)/contenuti/nuovo/page.tsx
// V2 — Nuovo articolo. Nasce sempre come BOZZA: la pubblicazione è un gesto a parte,
// nella pagina di modifica.

import Link from "next/link";
import { requirePublisher } from "../guard";
import { creaArticolo } from "../actions";
import type { Categoria } from "../content-data";
import ArticleForm from "../ArticleForm";
import { colors } from "@/lib/panel-theme";

export default async function NuovoArticoloPage() {
  const { supabase } = await requirePublisher();

  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, label")
    .eq("is_active", true)
    .order("sort");

  const categorie = (data ?? []) as Categoria[];

  return (
    <div>
      <Link href="/contenuti" style={styles.indietro}>
        ← Contenuti
      </Link>

      <h1 style={styles.h1}>Nuovo articolo</h1>
      <p style={styles.sub}>
        Lo salvi come bozza: non lo vede nessuno finché non lo pubblichi tu.
      </p>

      {/* Senza categorie il form non può funzionare, e un menu a tendina vuoto
          sembrerebbe un guasto misterioso. Meglio dirlo. */}
      {error || categorie.length === 0 ? (
        <div style={styles.errorBox}>
          Non riesco a leggere le categorie{error ? `: ${error.message}` : ""}. Senza
          categorie non si può creare un articolo.
        </div>
      ) : (
        <ArticleForm categorie={categorie} azione={creaArticolo} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  indietro: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: colors.accentDark,
    textDecoration: "none",
  },
  h1: { margin: "0.6rem 0 0", fontSize: "1.4rem", fontWeight: 800, color: colors.title },
  sub: { margin: "0.3rem 0 1.5rem", fontSize: "0.9rem", color: colors.muted },
  errorBox: {
    padding: "1rem 1.25rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: 12,
    color: "#8a2b20",
    fontSize: "0.9rem",
  },
};
