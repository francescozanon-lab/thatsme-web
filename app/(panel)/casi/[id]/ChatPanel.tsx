// app/(panel)/casi/[id]/ChatPanel.tsx
// P3.5 — La chat vera e propria, lato psicologo. Client Component: la storia iniziale
// arriva già pronta dal server, qui si gestiscono realtime, invio e scroll.
// Speculare a src/app/(app)/chat.tsx dell'app mobile: stesse colonne, stesso dedup,
// stesso `realtime.setAuth()` PRIMA di `.subscribe()`.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { colors, radius } from "@/lib/panel-theme";
import { hhmm } from "@/lib/panel-format";
import { MSG_COLS, type Message } from "./case-data";

export default function ChatPanel({
  conversationId,
  meId,
  initialMessages,
  readOnly = false,
}: {
  conversationId: string;
  meId: string;
  initialMessages: Message[];
  readOnly?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Aggiunge evitando i doppioni: il realtime fa l'eco anche dei propri insert.
  const addMessage = useCallback((m: Message) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  // Realtime: i messaggi nuovi di QUESTA conversazione (la RLS resta a filtrare).
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) await supabase.realtime.setAuth(token); // sempre PRIMA di subscribe
      if (cancelled) return;

      channel = supabase
        .channel(`panel-messages-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => addMessage(payload.new as Message),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId, addMessage]);

  // Sempre in fondo, come in qualunque chat.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body || sending || readOnly) return;

    setSending(true);
    setErr(null);
    setText("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: meId,
        sender_type: "professional",
        content: body,
      })
      .select(MSG_COLS)
      .single();

    setSending(false);
    if (error) {
      setText(body); // il testo non si perde
      setErr(error.message);
      return;
    }
    if (data) addMessage(data as Message); // feedback immediato, poi il realtime dedup-a
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Invio manda, Shift+Invio va a capo.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const canSend = !!text.trim() && !sending && !readOnly;

  return (
    <div style={styles.card}>
      <div ref={scrollRef} style={styles.scroll}>
        {messages.length === 0 ? (
          <div style={styles.empty}>
            Nessun messaggio, ancora.
            <br />
            <strong style={styles.emptyStrong}>Il primo lo scrivi tu:</strong> dall&apos;altra
            parte c&apos;è un ragazzo che ha chiesto aiuto e sta aspettando.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_type === "professional";
            return (
              <div
                key={m.id}
                style={{ ...styles.row, ...(mine ? styles.rowMine : styles.rowTheirs) }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(mine ? styles.bubbleMine : styles.bubbleTheirs),
                  }}
                >
                  {m.content}
                </div>
                <span style={styles.time}>{hhmm(m.created_at)}</span>
              </div>
            );
          })
        )}
      </div>

      {readOnly ? (
        <div style={styles.closedBar}>
          Caso chiuso: la conversazione è in sola lettura.
        </div>
      ) : (
        <div style={styles.composer}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi al ragazzo… (Invio manda, Maiusc+Invio va a capo)"
            rows={2}
            style={styles.input}
          />
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            style={{ ...styles.send, ...(canSend ? null : styles.sendOff) }}
          >
            {sending ? "Invio…" : "Invia"}
          </button>
        </div>
      )}

      {err ? <div style={styles.err}>Non sono riuscito a inviare: {err}</div> : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  scroll: {
    height: "min(52vh, 460px)",
    overflowY: "auto",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: colors.bg,
  },
  empty: {
    margin: "auto",
    maxWidth: 380,
    textAlign: "center",
    fontSize: "0.95rem",
    lineHeight: 1.5,
    color: colors.muted,
  },
  emptyStrong: { color: colors.title },

  row: { display: "flex", flexDirection: "column", maxWidth: "78%" },
  rowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowTheirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    padding: "0.6rem 0.85rem",
    borderRadius: 16,
    fontSize: "0.95rem",
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleMine: {
    background: colors.accent,
    color: "#fff",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    background: colors.surface,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderBottomLeftRadius: 4,
  },
  time: { fontSize: "0.7rem", color: colors.muted, margin: "3px 4px 0" },

  composer: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "0.85rem 1rem",
    borderTop: `1px solid ${colors.border}`,
    background: colors.surface,
  },
  input: {
    flex: 1,
    resize: "none",
    maxHeight: 120,
    padding: "0.6rem 0.8rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.btnBg,
    color: colors.text,
    fontSize: "0.95rem",
    fontFamily: "inherit",
    lineHeight: 1.4,
  },
  send: {
    padding: "0.65rem 1.25rem",
    borderRadius: radius.control,
    border: "none",
    background: colors.accent,
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  sendOff: { opacity: 0.45, cursor: "default" },
  closedBar: {
    padding: "0.9rem 1rem",
    borderTop: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.muted,
    fontSize: "0.9rem",
    textAlign: "center",
  },
  err: {
    padding: "0.6rem 1rem",
    background: "#fdecea",
    borderTop: "1px solid #f3c2bc",
    color: "#8a2b20",
    fontSize: "0.85rem",
  },
};
