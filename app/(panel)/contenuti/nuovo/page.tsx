// app/(panel)/contenuti/nuovo/page.tsx
// V2 — Nuovo articolo in una casella VUOTA della griglia. Nasce sempre come BOZZA:
// la pubblicazione è un gesto a parte, nella pagina di modifica.
//
// Dal 16/09/2026 non si sceglie più dove metterlo: ci si arriva dalla griglia
// cliccando una casella vuota, e la casella (sottocategoria + livello) viaggia
// nell'indirizzo. Una casella ospita un articolo solo.

import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePublisher } from "../guard";
import { creaArticolo } from "../actions";
import { UUID_RE, type Livello } from "../content-data";
import ArticleForm from "../ArticleForm";
import { colors } from "@/lib/panel-theme";

export default async function NuovoArticoloPage({
  searchParams,
}: {
  searchParams: Promise<{ [chiave: string]: string | string[] | undefined }>;
}) {
  const { supabase } = await requirePublisher();

  const q = await searchParams;
  const subcategoryId = typeof q.sottocategoria === "string" ? q.sottocategoria : "";
  const livello = Number(q.livello);

  const casellaValida = UUID_RE.test(subcategoryId) && [1, 2, 3].includes(livello);

  const { data: sub } = casellaValida
    ? await supabase
        .from("subcategories")
        .select("id, label, category_id, categories(slug, label)")
        .eq("id", subcategoryId)
        .maybeSingle()
    : { data: null };

  // Qualcuno ha riempito la casella nel frattempo (o si è arrivati da un link
  // vecchio): invece di un form che fallirebbe al salvataggio, si apre l'articolo
  // che c'è già.
  if (sub) {
    const { data: esistente } = await supabase
      .from("articles")
      .select("id")
      .eq("subcategory_id", sub.id)
      .eq("level", livello)
      .maybeSingle();
    if (esistente) redirect(`/contenuti/${esistente.id}`);
  }

  // `categories(...)` arriva come oggetto o come array a seconda di come il client
  // legge la relazione: si normalizza qui invece di fidarsi di una delle due.
  const cat = sub
    ? ((Array.isArray(sub.categories) ? sub.categories[0] : sub.categories) as
        | { slug: string; label: string }
        | null)
    : null;

  return (
    <div>
      <Link href={cat ? `/contenuti#${cat.slug}` : "/contenuti"} style={styles.indietro}>
        ← Contenuti
      </Link>

      <h1 style={styles.h1}>Nuovo articolo</h1>
      <p style={styles.sub}>
        Lo salvi come bozza: non lo vede nessuno finché non lo pubblichi tu.
      </p>

      {sub && cat ? (
        <ArticleForm
          posizione={{
            categoria: cat.label,
            sottocategoria: sub.label as string,
            subcategoryId: sub.id as string,
            livello: livello as Livello,
          }}
          azione={creaArticolo}
        />
      ) : (
        <div style={styles.errorBox}>
          Un articolo nuovo si crea dalla griglia dei contenuti: scegli la casella vuota
          in cui metterlo. <Link href="/contenuti">Torna alla griglia</Link>
        </div>
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
    maxWidth: 760,
  },
};
