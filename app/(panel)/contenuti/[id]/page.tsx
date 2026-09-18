// app/(panel)/contenuti/[id]/page.tsx
// V2 — Modifica di un articolo, e il posto da cui si pubblica.

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePublisher } from "../guard";
import { agganciaRiferimento, gestisciAgganci, salvaArticolo } from "../actions";
import {
  UUID_RE,
  type Aggancio,
  type Articolo,
  type Riferimento,
  type TipoRiferimento,
} from "../content-data";
import ArticleForm from "../ArticleForm";
import RefsSection from "../RefsSection";
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

  const [artRes, aggRes, refRes, tipiRes] = await Promise.all([
    supabase
      .from("articles")
      .select(
        "id, level, category_id, subcategory_id, title, body, closing_question, status, updated_at",
      )
      .eq("id", id)
      .maybeSingle<Articolo>(),
    supabase
      .from("article_cultural_refs")
      .select("cultural_ref_id, description, sort")
      .eq("article_id", id)
      .order("sort"),
    supabase.from("cultural_refs").select("id, kind, title, credits").order("title"),
    supabase.from("cultural_ref_kinds").select("slug, label").order("sort"),
  ]);

  if (!artRes.data) notFound();

  const articolo = artRes.data;
  const pubblicato = articolo.status === "published";

  // Dove sta l'articolo, in parole: serve al form (che la mostra) e al link di
  // ritorno, che riporta alla griglia sulla categoria giusta invece che in cima.
  const [subRes, catRes] = await Promise.all([
    supabase.from("subcategories").select("label").eq("id", articolo.subcategory_id).maybeSingle(),
    supabase.from("categories").select("slug, label").eq("id", articolo.category_id).maybeSingle(),
  ]);
  const posizione = {
    categoria: (catRes.data?.label as string | undefined) ?? "categoria non trovata",
    sottocategoria: (subRes.data?.label as string | undefined) ?? "sottocategoria non trovata",
    subcategoryId: articolo.subcategory_id,
    livello: articolo.level,
  };
  const ritorno = catRes.data?.slug ? `/contenuti#${catRes.data.slug}` : "/contenuti";

  // L'unione la faccio qui invece di chiederla al database con una query annidata:
  // i riferimenti servono comunque tutti (per il menu "scegli uno già inserito"),
  // quindi incrociarli in memoria non costa una riga in più di rete — e i tipi
  // restano semplici, che su una query annidata non è scontato.
  const riferimenti = (refRes.data ?? []) as Riferimento[];
  const perId = new Map(riferimenti.map((r) => [r.id, r]));
  const agganci = ((aggRes.data ?? []) as Aggancio[]).map((a) => ({
    ...a,
    riferimento: perId.get(a.cultural_ref_id),
  }));

  return (
    <div>
      <Link href={ritorno} style={styles.indietro}>
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

      <ArticleForm
        posizione={posizione}
        articolo={articolo}
        azione={salvaArticolo.bind(null, articolo.id)}
      />

      <RefsSection
        agganci={agganci}
        riferimenti={riferimenti}
        tipi={(tipiRes.data ?? []) as TipoRiferimento[]}
        livello={articolo.level}
        aggancia={agganciaRiferimento.bind(null, articolo.id)}
        gestisci={gestisciAgganci.bind(null, articolo.id)}
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
};
