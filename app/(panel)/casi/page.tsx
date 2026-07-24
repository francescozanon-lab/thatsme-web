// app/(panel)/casi/page.tsx
// Segnaposto: l'elenco "I miei casi" è P3.4. La chat del singolo caso esiste già
// (P3.5, in `casi/[id]/page.tsx`): oggi ci si arriva dalla presa in carico.

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
        L&apos;elenco arriva nel prossimo passo (P3.4). Per ora si entra in un caso
        subito dopo averlo preso in carico.
      </div>
    </div>
  );
}
