// app/(panel)/profilo/page.tsx
// Segnaposto: Profilo psicologo + statistiche (P3.7 / P3.8) arrivano più avanti nel blocco.

import { colors, radius } from "@/lib/panel-theme";

export default function ProfiloPage() {
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: colors.title }}>
        Profilo
      </h1>
      <p style={{ margin: "0.3rem 0 0", fontSize: "0.9rem", color: colors.muted }}>
        Le tue statistiche: casi presi in carico, casi risolti, tempi medi.
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
        In arrivo (P3.7 / P3.8).
      </div>
    </div>
  );
}
