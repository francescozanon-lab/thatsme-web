// app/(panel)/RefreshButton.tsx
// Aggiorna manualmente la coda. Provvisorio: l'auto-aggiornamento Realtime del
// pannello arriva in P4.1.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/panel-theme";

export default function RefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function handleClick() {
    setBusy(true);
    router.refresh();
    setTimeout(() => setBusy(false), 600);
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      style={{
        padding: "0.55rem 1rem",
        borderRadius: 10,
        border: `1px solid ${colors.btnBorder}`,
        background: colors.btnBg,
        color: colors.btnText,
        fontSize: "0.9rem",
        fontWeight: 600,
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {busy ? "Aggiorno…" : "Aggiorna"}
    </button>
  );
}
