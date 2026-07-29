// app/(panel)/contenuti/[id]/page.tsx
// V2 — Modifica di un articolo, e il posto da cui si pubblica.

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePublisher } from "../guard";
import { salvaArticolo } from "../actions";
import { UUID_RE, type Articolo, type Categoria } from "../content-data";
import ArticleForm from "../ArticleForm";
import { colors, radius } from "@/lib/panel-theme";
import { dayTime } from "@/lib/panel-format";

export default async function ModificaArticoloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { supabase } = await requirePublisher();

  const [artRes, catRes] = await Promise.all([
    supabase
      .from("articles")
      .select("id, level, category_id, title, body, status, updated_at")
      .eq("id", id)
      .maybeSingle<Articolo>(),
    supabase
      .from("categories")
      .select("id, slug, label")
      .eq("is_active", true)
      .order("sort"),
  ]);

  if (!artRes.data) notFound();

  const articolo = artRes.data;
  const categorie = (catRes.data ?? []) as Categoria[];
  const pubblicato = articolo.status === "published";

  return (
    <div>
      <Link href="/contenuti" style={styles.indietro}>
        ← Contenuti
      </Link>

      <div style={styles.headRow}>
        <h1 style={styles.h1}>Modifica articolo</h1>
        <span
          style={{
            ...styles.stato,
            color: pubblicato ? colors.accentDark : colors.muted,
            background: pubblicato ? "#dff0ee" : colors.bg,
          }}
        >
          {pubblicato ? "Pubblicato" : "Bozza"}
        </span>
      </div>
      <p style={styles.sub}>Ultimo aggiornamento: {dayTime(articolo.updated_at)}</p>

      {/* La categoria dell'articolo potrebbe essere stata disattivata dopo: in quel
          caso non comparirebbe nel menu e il form si aprirebbe con la tendina vuota,
          facendo sembrare persa una scelta che invece c'è. Meglio dirlo. */}
      {categorie.some((c) => c.id === articolo.category_id) ? null : (
        <div style={styles.avviso}>
          La categoria di questo articolo non è più fra quelle attive: scegline
          un&apos;altra prima di salvare, o l&apos;articolo resterà dov&apos;è.
        </div>
      )}

      <ArticleForm
        categorie={categorie}
        articolo={articolo}
        azione={salvaArticolo.bind(null, articolo.id)}
      />
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
  headRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    margin: "0.6rem 0 0",
  },
  h1: { margin: 0, fontSize: "1.4rem", fontWeight: 800, color: colors.title },
  stato: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.3rem 0.6rem",
    borderRadius: radius.pill,
  },
  sub: { margin: "0.3rem 0 1.5rem", fontSize: "0.85rem", color: colors.muted },
  avviso: {
    padding: "0.8rem 1rem",
    marginBottom: "1.25rem",
    background: "#fdf4e3",
    border: "1px solid #eddcb6",
    borderRadius: radius.control,
    color: "#7a5b12",
    fontSize: "0.88rem",
    maxWidth: 760,
  },
};
