// app/(panel)/casi/[id]/page.tsx
// P3.5 — Schermata chat dello psicologo. Rotta: /casi/<conversationId>
// (l'id è quello che restituisce `take_charge`, P3.3).
// Server Component: carica caso, ragazzo, storia messaggi e note interne leggendo
// COME lo psicologo loggato — quindi è la RLS a dire cosa può vedere, non questa pagina.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  colors,
  radius,
  shadow,
  CATEGORY,
  type CategoryKey,
} from "@/lib/panel-theme";
import ChatPanel from "./ChatPanel";
import CaseActions from "./CaseActions";
import { MSG_COLS, NOTE_STATUS, hhmm, dayTime, type Message } from "./case-data";

// L'id arriva dall'URL: se non è un uuid, Postgres darebbe errore 22P02 → 404 e stop.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Conversation = {
  id: string;
  contact_request_id: string;
  user_id: string;
  professional_id: string;
  is_archived: boolean;
  created_at: string;
};

type Request = {
  category: CategoryKey;
  status: "pending" | "in_progress" | "resolved";
  created_at: string;
  taken_charge_at: string | null;
};

type Note = { id: string; note: string | null; changed_at: string };

export default async function CasoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // il gate vero è nel layout di (panel)

  // La conversazione. La RLS lascia passare solo i partecipanti: se non è tua, è null.
  const { data: conv } = await supabase
    .from("conversations")
    .select(
      "id, contact_request_id, user_id, professional_id, is_archived, created_at",
    )
    .eq("id", id)
    .maybeSingle<Conversation>();

  // Un coordinatore potrebbe leggerla (RLS), ma questa è la scrivania di CHI ha il caso.
  if (!conv || conv.professional_id !== user.id) notFound();

  const [reqRes, boyRes, msgRes, notesRes] = await Promise.all([
    supabase
      .from("contact_requests")
      .select("category, status, created_at, taken_charge_at")
      .eq("id", conv.contact_request_id)
      .maybeSingle<Request>(),
    supabase
      .from("profiles")
      .select("display_name, avatar_emoji")
      .eq("id", conv.user_id)
      .maybeSingle<{ display_name: string | null; avatar_emoji: string | null }>(),
    supabase
      .from("messages")
      .select(MSG_COLS)
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("case_status_log")
      .select("id, note, changed_at")
      .eq("contact_request_id", conv.contact_request_id)
      .eq("new_status", NOTE_STATUS)
      .order("changed_at", { ascending: false }),
  ]);

  const req = reqRes.data;
  const boy = boyRes.data;
  const messages = (msgRes.data ?? []) as Message[];
  const notes = (notesRes.data ?? []) as Note[];

  const cat = req
    ? CATEGORY[req.category] ?? { label: req.category, fg: colors.muted, bg: colors.bg }
    : null;

  // Caso chiuso (P3.6) o conversazione archiviata → chat in sola lettura.
  const closed = conv.is_archived || req?.status === "resolved";

  return (
    <div style={styles.page}>
      <Link href="/casi" style={styles.back}>
        ← I miei casi
      </Link>

      <div style={styles.head}>
        <div style={styles.who}>
          <span style={styles.avatar}>{boy?.avatar_emoji ?? "🙂"}</span>
          <div>
            <h1 style={styles.h1}>{boy?.display_name ?? "Ragazzo"}</h1>
            <div style={styles.meta}>
              {req ? (
                <>
                  richiesta delle {hhmm(req.created_at)}
                  {req.taken_charge_at
                    ? ` · presa in carico alle ${hhmm(req.taken_charge_at)}`
                    : null}
                </>
              ) : (
                "dettagli della richiesta non disponibili"
              )}
            </div>
          </div>
        </div>

        <div style={styles.badges}>
          {cat ? (
            <span style={{ ...styles.tag, color: cat.fg, background: cat.bg }}>
              {cat.label}
            </span>
          ) : null}
          <span
            style={{
              ...styles.tag,
              color: closed ? colors.muted : colors.accentDark,
              background: closed ? colors.bg : "#dff0ee",
            }}
          >
            {closed ? "Chiuso" : "In corso"}
          </span>
        </div>
      </div>

      <ChatPanel
        conversationId={conv.id}
        meId={user.id}
        initialMessages={messages}
        readOnly={closed}
      />

      <CaseActions requestId={conv.contact_request_id} meId={user.id} closed={!!closed} />

      <section style={styles.notes}>
        <h2 style={styles.h2}>Note interne</h2>
        {notes.length === 0 ? (
          <p style={styles.notesEmpty}>
            Nessuna nota. Servono a te e ai colleghi: il ragazzo non le vede.
          </p>
        ) : (
          <ul style={styles.noteList}>
            {notes.map((n) => (
              <li key={n.id} style={styles.note}>
                <div style={styles.noteWhen}>{dayTime(n.changed_at)}</div>
                <div style={styles.noteText}>{n.note}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  back: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: colors.muted,
    textDecoration: "none",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    boxShadow: shadow,
    padding: "1rem 1.25rem",
  },
  who: { display: "flex", alignItems: "center", gap: "0.9rem", minWidth: 0 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.4rem",
    flexShrink: 0,
  },
  h1: { margin: 0, fontSize: "1.25rem", fontWeight: 800, color: colors.title },
  meta: { marginTop: 2, fontSize: "0.82rem", color: colors.muted },
  badges: { display: "flex", gap: 8, alignItems: "center" },
  tag: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.3rem 0.65rem",
    borderRadius: radius.pill,
    whiteSpace: "nowrap",
  },

  notes: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    padding: "1rem 1.25rem",
  },
  h2: { margin: 0, fontSize: "1rem", fontWeight: 800, color: colors.title },
  notesEmpty: { margin: "0.5rem 0 0", fontSize: "0.88rem", color: colors.muted },
  noteList: { listStyle: "none", margin: "0.75rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  note: {
    padding: "0.7rem 0.85rem",
    background: colors.bg,
    borderRadius: radius.control,
    border: `1px solid ${colors.border}`,
  },
  noteWhen: { fontSize: "0.72rem", color: colors.muted, marginBottom: 3 },
  noteText: { fontSize: "0.92rem", color: colors.text, whiteSpace: "pre-wrap" },
};
