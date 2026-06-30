// app/(panel)/casi/page.tsx
// Segnaposto: "I miei casi" (P3.4) + chat psicologo (P3.5) arrivano nel prossimo passo.

import { colors, radius } from "@/lib/panel-theme";

export default function MieiCasiPage() {
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: colors.title }}>
        I miei casi
      </h1>
      <p style={{ margin: "0.3rem 0 0", fontSize: "0.9rem", color: colors.muted }}>
        I casi che hai preso in carico, divisi per stato.
      </p>
      <div
        style={{
          marginTop: "1.5rem",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          color: colors.muted,
          background: colors.surface,
          border: `1px dashed ${colors.border}`,
          borderRadius: radius.card,
          fontSize: "0.95rem",
        }}
      >
        In arrivo nel prossimo passo (P3.4 / P3.5).
      </div>
    </div>
  );
}
