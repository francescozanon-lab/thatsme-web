// app/(panel)/casi/[id]/CaseActions.tsx
// P3.5 — I due bottoni sotto la chat:
//  · "Aggiungi nota interna"  → attivo: scrive in case_status_log (vedi case-data.ts).
//  · "Chiudi caso come risolto" → è P3.6: qui resta spento, non finto-funzionante.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors, radius } from "@/lib/panel-theme";
import { NOTE_STATUS } from "./case-data";

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
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function saveNote() {
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

    setText("");
    setOpen(false);
    router.refresh(); // la nota compare nell'elenco (rilettura server)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.buttons}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={closed}
          style={{ ...styles.btn, ...(closed ? styles.btnOff : null) }}
        >
          {open ? "Annulla nota" : "Aggiungi nota interna"}
        </button>

        <button
          type="button"
          disabled
          title="Arriva nel passo successivo (P3.6)"
          style={{ ...styles.btnDanger, ...styles.btnOff }}
        >
          Chiudi caso come risolto
        </button>
      </div>

      {open ? (
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
              onClick={saveNote}
              disabled={!text.trim() || busy}
              style={{
                ...styles.save,
                ...(!text.trim() || busy ? styles.btnOff : null),
              }}
            >
              {busy ? "Salvo…" : "Salva nota"}
            </button>
          </div>
        </div>
      ) : null}

      {err ? <div style={styles.err}>Non sono riuscito a salvare: {err}</div> : null}
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
  btnDanger: {
    padding: "0.6rem 1.05rem",
    borderRadius: radius.control,
    border: `1px solid ${colors.danger}`,
    background: colors.surface,
    color: colors.danger,
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "not-allowed",
  },
  btnOff: { opacity: 0.45, cursor: "default" },
  form: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    padding: "0.9rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: 10,
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
  err: {
    padding: "0.6rem 0.9rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: radius.control,
    color: "#8a2b20",
    fontSize: "0.85rem",
  },
};
