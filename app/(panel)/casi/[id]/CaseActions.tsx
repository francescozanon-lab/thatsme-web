// app/(panel)/casi/[id]/CaseActions.tsx
// I due bottoni sotto la chat:
//  · "Aggiungi nota interna"   → scrive in case_status_log (invisibile al ragazzo).
//  · "Chiudi caso come risolto" → P3.6: apre il campo del commiato, poi conferma e
//    chiama la RPC close_case (atomica: messaggio finale + resolved + archiviazione).
// Un solo pannello per volta: aprire "chiudi" chiude "nota" e viceversa.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors, radius } from "@/lib/panel-theme";
import { NOTE_STATUS } from "./case-data";

type Panel = "none" | "note" | "close";

export default function CaseActions({
  requestId,
  meId,
  closed,
}: {
  requestId: string;
  meId: string;
  closed: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("none");

  // Caso già chiuso: niente azioni, solo un promemoria.
  if (closed) {
    return <div style={styles.closedNote}>Caso chiuso. La conversazione è in sola lettura.</div>;
  }

  function toggle(which: Panel) {
    setPanel((p) => (p === which ? "none" : which));
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.buttons}>
        <button
          type="button"
          onClick={() => toggle("note")}
          style={{ ...styles.btn, ...(panel === "note" ? styles.btnOn : null) }}
        >
          {panel === "note" ? "Annulla nota" : "Aggiungi nota interna"}
        </button>

        <button
          type="button"
          onClick={() => toggle("close")}
          style={{ ...styles.btnDanger, ...(panel === "close" ? styles.btnDangerOn : null) }}
        >
          {panel === "close" ? "Annulla chiusura" : "Chiudi caso come risolto"}
        </button>
      </div>

      {panel === "note" ? (
        <NoteForm requestId={requestId} meId={meId} onDone={() => setPanel("none")} router={router} />
      ) : null}

      {panel === "close" ? (
        <CloseForm requestId={requestId} onDone={() => setPanel("none")} router={router} />
      ) : null}
    </div>
  );
}

// ----------------------------- NOTA INTERNA -----------------------------

function NoteForm({
  requestId,
  meId,
  onDone,
  router,
}: {
  requestId: string;
  meId: string;
  onDone: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const body = text.trim();
    if (!body || busy) return;

    setBusy(true);
    setErr(null);

    const supabase = createClient();
    const { error } = await supabase.from("case_status_log").insert({
      contact_request_id: requestId,
      professional_id: meId,
      old_status: null, // non è un cambio di stato: è un'annotazione
      new_status: NOTE_STATUS,
      note: body,
    });

    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onDone();
    router.refresh(); // la nota compare nell'elenco (rilettura server)
  }

  return (
    <div style={styles.form}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nota per te e per i colleghi. Il ragazzo non la vede."
        rows={3}
        style={styles.input}
        autoFocus
      />
      <div style={styles.formFoot}>
        <span style={styles.hint}>
          Visibile solo allo staff: la tabella delle note non è leggibile dall&apos;app.
        </span>
        <button
          type="button"
          onClick={save}
          disabled={!text.trim() || busy}
          style={{ ...styles.save, ...(!text.trim() || busy ? styles.off : null) }}
        >
          {busy ? "Salvo…" : "Salva nota"}
        </button>
      </div>
      {err ? <div style={styles.err}>Non sono riuscito a salvare: {err}</div> : null}
    </div>
  );
}

// ----------------------------- CHIUSURA CASO -----------------------------

function CloseForm({
  requestId,
  onDone,
  router,
}: {
  requestId: string;
  onDone: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirmClose() {
    const body = text.trim();
    if (!body || busy) return;

    setBusy(true);
    setErr(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("close_case", {
      p_request_id: requestId,
      p_final_message: body,
    });

    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }

    // Chiuso: il messaggio finale è partito, il caso è archiviato. Ricarico la pagina
    // → la chat passa in sola lettura e il commiato compare in coda.
    onDone();
    router.refresh();
  }

  return (
    <div style={styles.formDanger}>
      <div style={styles.warn}>
        Stai per <strong>chiudere e archiviare</strong> il caso. Dopo la conferma non potrai
        più scrivere. Il ragazzo riceverà questo messaggio come saluto finale.
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Il tuo messaggio di chiusura per il ragazzo…"
        rows={3}
        style={styles.input}
        autoFocus
      />
      <div style={styles.formFoot}>
        <span style={styles.hint}>Questo messaggio è l&apos;ultima cosa che legge: scrivilo con cura.</span>
        <button
          type="button"
          onClick={confirmClose}
          disabled={!text.trim() || busy}
          style={{ ...styles.confirmDanger, ...(!text.trim() || busy ? styles.off : null) }}
        >
          {busy ? "Chiudo…" : "Invia e chiudi il caso"}
        </button>
      </div>
      {err ? <div style={styles.err}>Non sono riuscito a chiudere: {err}</div> : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: 12 },
  buttons: { display: "flex", gap: 10, flexWrap: "wrap" },
  btn: {
    padding: "0.6rem 1.05rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.btnBg,
    color: colors.btnText,
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnOn: { background: colors.bg, borderColor: colors.accent, color: colors.accentDark },
  btnDanger: {
    padding: "0.6rem 1.05rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.danger}`,
    background: colors.surface,
    color: colors.danger,
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDangerOn: { background: "#fbeae8" },
  off: { opacity: 0.45, cursor: "default" },

  form: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    padding: "0.9rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  formDanger: {
    background: colors.surface,
    border: `1px solid ${colors.danger}`,
    borderRadius: radius.card,
    padding: "0.9rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  warn: {
    fontSize: "0.85rem",
    color: "#8a2b20",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: radius.control,
    padding: "0.6rem 0.75rem",
    lineHeight: 1.45,
  },
  input: {
    resize: "vertical",
    padding: "0.6rem 0.8rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.btnBg,
    color: colors.text,
    fontSize: "0.92rem",
    fontFamily: "inherit",
    lineHeight: 1.45,
  },
  formFoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
  },
  hint: { fontSize: "0.78rem", color: colors.muted },
  save: {
    padding: "0.55rem 1.1rem",
    borderRadius: radius.control,
    border: "none",
    background: colors.accent,
    color: "#fff",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  confirmDanger: {
    padding: "0.55rem 1.1rem",
    borderRadius: radius.control,
    border: "none",
    background: colors.danger,
    color: "#fff",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  err: {
    padding: "0.6rem 0.9rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: radius.control,
    color: "#8a2b20",
    fontSize: "0.85rem",
  },
  closedNote: {
    padding: "0.8rem 1rem",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    color: colors.muted,
    fontSize: "0.9rem",
  },
};
