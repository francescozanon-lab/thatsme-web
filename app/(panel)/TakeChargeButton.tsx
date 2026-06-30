// app/(panel)/TakeChargeButton.tsx
// P3.3 — "Prendi in carico". Client Component: chiama la funzione RPC take_charge
// (DB), che in modo atomico assegna il caso, lo porta a in_progress e crea la
// conversation. Da qui sparisce lo scaffold SQL `do $$…$$`.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors } from "@/lib/panel-theme";

export default function TakeChargeButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setErr(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("take_charge", {
      p_request_id: requestId,
    });
    // data conterrebbe l'id della conversation creata — servirà in P3.5 per
    // andare dritti alla chat: router.push(`/casi/${data}`).

    if (error) {
      // es. "Richiesta non disponibile (già presa in carico)" se l'ha presa un collega
      setBusy(false);
      setErr(error.message);
      router.refresh(); // riallinea la lista
      return;
    }

    // Preso in carico: il caso esce da "Casi in arrivo" e l'app del ragazzo
    // scatta da sola a "uno psicologo è con te" (Realtime, P2.6).
    router.refresh();
  }

  return (
    <div style={styles.wrap}>
      <button
        onClick={handleClick}
        disabled={busy}
        style={{ ...styles.btn, ...(busy ? styles.btnBusy : null) }}
      >
        {busy ? "Prendo in carico…" : "Prendi in carico"}
      </button>
      {err ? <span style={styles.err}>{err}</span> : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  btn: {
    padding: "0.65rem 1.1rem",
    borderRadius: 10,
    border: "none",
    background: colors.accent,
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnBusy: { opacity: 0.6, cursor: "default" },
  err: { fontSize: "0.75rem", color: colors.danger, maxWidth: 220, textAlign: "right" },
};
