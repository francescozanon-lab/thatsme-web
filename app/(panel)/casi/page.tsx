// app/(panel)/casi/page.tsx
// P3.4 — "I miei casi": i casi presi in carico da CHI è loggato, in tre gruppi.
// Server Component: legge come lo psicologo loggato, quindi è la RLS a decidere cosa
// esce (`conversations` filtra su professional_id, gli embed su richiesta e profilo
// passano dalle loro policy).
//
// La divisione NON è solo per stato del DB: fra i casi aperti distingue quelli dove la
// palla è allo psicologo da quelli dove si aspetta il ragazzo, guardando chi ha scritto
// l'ultimo messaggio. È l'unica divisione che dice davvero "cosa devo fare adesso".

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  colors,
  radius,
  shadow,
  CATEGORY,
  type CategoryKey,
} from "@/lib/panel-theme";
import { hhmm, sinceLabel } from "@/lib/panel-format";
import RefreshButton from "../RefreshButton";

type Req = {
  category: CategoryKey;
  status: "pending" | "in_progress" | "resolved";
  created_at: string;
  taken_charge_at: string | null;
  resolved_at: string | null;
};

type Profile = { display_name: string | null; avatar_emoji: string | null };

type Conv = {
  id: string;
  is_archived: boolean;
  created_at: string;
  contact_request_id: string;
  // Relazioni "to-one": PostgREST le restituisce come oggetto, ma a seconda di come
  // riconosce il vincolo può darle come array di uno. Si accettano entrambe e si
  // normalizza con one() — così un cambio di forma non ci ribalta i gruppi in silenzio.
  contact_requests: Req | Req[] | null;
  profiles: Profile | Profile[] | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

type LastMsg = {
  conversation_id: string;
  content: string;
  sender_type: "user" | "professional";
  created_at: string;
};

type Case = {
  id: string; // = conversation id, è anche il link
  name: string;
  emoji: string;
  req: Req | null;
  last: LastMsg | null;
  activityAt: string; // per l'ordinamento: ultimo messaggio, o presa in carico
};

export default async function MieiCasiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // il gate vero è nel layout di (panel)

  const { data: convData, error } = await supabase
    .from("conversations")
    .select(
      "id, is_archived, created_at, contact_request_id, " +
        "contact_requests(category, status, created_at, taken_charge_at, resolved_at), " +
        "profiles(display_name, avatar_emoji)",
    )
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  const convs = (convData ?? []) as unknown as Conv[];

  // Ultimo messaggio per conversazione. PostgREST non sa fare "l'ultimo per gruppo":
  // si prendono i messaggi delle MIE conversazioni dal più recente e si tiene il primo
  // che si incontra per ciascuna. Sul prototipo i volumi sono minuscoli; se un giorno
  // non lo saranno, questa diventa una vista SQL (o una colonna `last_message_at`).
  const lastByConv = new Map<string, LastMsg>();
  if (convs.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, content, sender_type, created_at")
      .in(
        "conversation_id",
        convs.map((c) => c.id),
      )
      .order("created_at", { ascending: false });

    for (const m of (msgs ?? []) as LastMsg[]) {
      if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
    }
  }

  const cases: Case[] = convs.map((c) => {
    const last = lastByConv.get(c.id) ?? null;
    const req = one(c.contact_requests);
    const boy = one(c.profiles);
    return {
      id: c.id,
      name: boy?.display_name ?? "Ragazzo",
      emoji: boy?.avatar_emoji ?? "🙂",
      req,
      last,
      activityAt: last?.created_at ?? req?.taken_charge_at ?? c.created_at,
    };
  });

  const byActivity = (a: Case, b: Case) =>
    new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime();

  const closed = (c: Case) => c.req?.status === "resolved";
  const risolti = cases.filter(closed).sort(byActivity);
  const aperti = cases.filter((c) => !closed(c));

  // Tocca a te: il ragazzo ha scritto per ultimo, oppure non ha scritto ancora nessuno
  // (caso appena preso in carico → manca il primo messaggio, che è il più importante).
  const daRispondere = aperti
    .filter((c) => !c.last || c.last.sender_type === "user")
    .sort(byActivity);
  const inAttesa = aperti
    .filter((c) => c.last?.sender_type === "professional")
    .sort(byActivity);

  return (
    <div>
      <div style={styles.headRow}>
        <div>
          <h1 style={styles.h1}>I miei casi</h1>
          <p style={styles.sub}>
            I casi che hai preso in carico. In cima quelli che aspettano te.
          </p>
        </div>
        <RefreshButton />
      </div>

      {error ? (
        <div style={styles.errorBox}>
          Non riesco a leggere i tuoi casi. Se il problema persiste, controlliamo le
          policy RLS su <code>conversations</code>.
        </div>
      ) : cases.length === 0 ? (
        <div style={styles.empty}>
          Non hai ancora preso in carico nessun caso.{" "}
          <Link href="/" style={styles.emptyLink}>
            Vai a &laquo;Casi in arrivo&raquo;
          </Link>
          .
        </div>
      ) : (
        <div style={styles.sections}>
          <Section
            title="Tocca a te"
            hint="Il ragazzo ha scritto per ultimo, o aspetta ancora il primo messaggio."
            cases={daRispondere}
            emptyText="Nessuno sta aspettando una tua risposta."
            highlight
          />
          <Section
            title="In attesa del ragazzo"
            hint="Hai scritto tu per ultimo."
            cases={inAttesa}
            emptyText="Nessun caso in attesa di risposta."
          />
          <Section
            title="Risolti"
            hint="Casi chiusi."
            cases={risolti}
            emptyText="Nessun caso chiuso: la chiusura arriva nel prossimo passo (P3.6)."
          />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  cases,
  emptyText,
  highlight = false,
}: {
  title: string;
  hint: string;
  cases: Case[];
  emptyText: string;
  highlight?: boolean;
}) {
  return (
    <section>
      <div style={styles.sectionHead}>
        <h2 style={styles.h2}>
          {title} <span style={styles.count}>{cases.length}</span>
        </h2>
        <span style={styles.hint}>{hint}</span>
      </div>

      {cases.length === 0 ? (
        <div style={styles.sectionEmpty}>{emptyText}</div>
      ) : (
        <div style={styles.list}>
          {cases.map((c) => (
            <CaseRow key={c.id} c={c} highlight={highlight} />
          ))}
        </div>
      )}
    </section>
  );
}

function CaseRow({ c, highlight }: { c: Case; highlight: boolean }) {
  const cat = c.req
    ? CATEGORY[c.req.category] ?? {
        label: c.req.category,
        fg: colors.muted,
        bg: colors.bg,
      }
    : null;

  const preview = c.last
    ? `${c.last.sender_type === "professional" ? "Tu: " : ""}${c.last.content}`
    : "Nessun messaggio: il primo lo scrivi tu.";

  return (
    <Link
      href={`/casi/${c.id}`}
      style={{ ...styles.row, ...(highlight ? styles.rowHighlight : null) }}
    >
      <span style={styles.avatar}>{c.emoji}</span>

      <div style={styles.center}>
        <div style={styles.nameLine}>
          <span style={styles.name}>{c.name}</span>
          {cat ? (
            <span style={{ ...styles.tag, color: cat.fg, background: cat.bg }}>
              {cat.label}
            </span>
          ) : null}
        </div>
        <div
          style={{
            ...styles.preview,
            ...(c.last ? null : styles.previewNone),
          }}
        >
          {preview}
        </div>
      </div>

      <div style={styles.right}>
        <span style={styles.when}>{hhmm(c.activityAt)}</span>
        <span style={styles.ago}>da {sinceLabel(c.activityAt)}</span>
      </div>
    </Link>
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

  sections: { display: "flex", flexDirection: "column", gap: "1.75rem" },
  sectionHead: {
    display: "flex",
    alignItems: "baseline",
    gap: "0.6rem",
    flexWrap: "wrap",
    marginBottom: "0.6rem",
  },
  h2: { margin: 0, fontSize: "1rem", fontWeight: 800, color: colors.title },
  count: {
    display: "inline-block",
    minWidth: 20,
    padding: "0.05rem 0.4rem",
    borderRadius: radius.pill,
    background: colors.bg,
    color: colors.muted,
    fontSize: "0.78rem",
    fontWeight: 700,
    textAlign: "center",
  },
  hint: { fontSize: "0.8rem", color: colors.muted },
  sectionEmpty: {
    padding: "1rem 1.1rem",
    color: colors.muted,
    background: colors.surface,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.card,
    fontSize: "0.88rem",
  },

  list: { display: "flex", flexDirection: "column", gap: 10 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.9rem",
    padding: "0.85rem 1.1rem",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    boxShadow: shadow,
    textDecoration: "none",
    color: "inherit",
  },
  rowHighlight: { borderLeft: `4px solid ${colors.accent}` },
  avatar: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: radius.pill,
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
  },
  center: { flex: 1, minWidth: 0 },
  nameLine: { display: "flex", alignItems: "center", gap: "0.5rem" },
  name: { fontSize: "0.98rem", fontWeight: 700, color: colors.title },
  tag: {
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "0.15rem 0.5rem",
    borderRadius: radius.pill,
    whiteSpace: "nowrap",
  },
  preview: {
    marginTop: 2,
    fontSize: "0.85rem",
    color: colors.muted,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  previewNone: { color: colors.accentDark, fontWeight: 600 },
  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  when: { fontSize: "0.82rem", fontWeight: 600, color: colors.text },
  ago: { fontSize: "0.75rem", color: colors.muted, whiteSpace: "nowrap" },

  empty: {
    padding: "2.5rem 1.5rem",
    textAlign: "center",
    color: colors.muted,
    background: colors.surface,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.card,
    fontSize: "0.95rem",
  },
  emptyLink: { color: colors.accentDark, fontWeight: 700 },
  errorBox: {
    padding: "1rem 1.25rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: 12,
    color: "#8a2b20",
    fontSize: "0.9rem",
  },
};
