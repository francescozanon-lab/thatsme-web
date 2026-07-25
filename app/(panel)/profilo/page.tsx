// app/(panel)/profilo/page.tsx
// P3.7 — Profilo psicologo + statistiche. P3.8 — i numeri sono calcolati al volo
// dalla RPC `get_my_stats` (db/get_my_stats.sql), non da una tabella dedicata.
// Server Component: legge come lo psicologo loggato.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { colors, radius, shadow } from "@/lib/panel-theme";
import { dateLong, durationLabel } from "@/lib/panel-format";

type Stats = {
  taken_total: number;
  taken_30d: number;
  resolved_total: number;
  resolved_30d: number;
  active_now: number;
  avg_first_response_seconds: number | null;
  avg_resolution_seconds: number | null;
  messages_sent: number;
};

const ROLE_LABEL: Record<string, string> = {
  psychologist: "Psicologo",
  coordinator: "Coordinatore",
  admin: "Amministratore",
};

// Iniziali dal nome, per l'avatar (nel prototipo non c'è upload foto).
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function ProfiloPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // il gate vero è nel layout di (panel)

  const { data: pro } = await supabase
    .from("professionals")
    .select("full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string; role: string; created_at: string }>();

  const { data: statsData, error: statsError } = await supabase.rpc("get_my_stats");
  const stats = (statsData ?? null) as Stats | null;

  const name = pro?.full_name ?? "Psicologo";
  const role = pro ? ROLE_LABEL[pro.role] ?? pro.role : "—";

  return (
    <div style={styles.page}>
      {/* Intestazione profilo */}
      <section style={styles.card}>
        <div style={styles.avatar}>{initials(name)}</div>
        <div>
          <h1 style={styles.name}>{name}</h1>
          <div style={styles.role}>{role}</div>
          {pro?.created_at ? (
            <div style={styles.since}>Nel team dal {dateLong(pro.created_at)}</div>
          ) : null}
          <div style={styles.email}>{user.email}</div>
        </div>
      </section>

      <h2 style={styles.h2}>Le tue statistiche</h2>

      {statsError || !stats ? (
        <div style={styles.errorBox}>
          Statistiche non disponibili. Se è la prima volta, verifica di aver eseguito
          <code> db/get_my_stats.sql</code> sul database.
        </div>
      ) : (
        <div style={styles.grid}>
          <Stat
            label="Casi presi in carico"
            value={stats.taken_total}
            sub={`${stats.taken_30d} negli ultimi 30 giorni`}
          />
          <Stat
            label="Casi risolti"
            value={stats.resolved_total}
            sub={`${stats.resolved_30d} negli ultimi 30 giorni`}
          />
          <Stat label="Attivi adesso" value={stats.active_now} highlight />
          <Stat label="Messaggi inviati" value={stats.messages_sent} />
          <Stat
            label="Tempo medio di 1ª risposta"
            value={durationLabel(stats.avg_first_response_seconds)}
          />
          <Stat
            label="Tempo medio di chiusura"
            value={durationLabel(stats.avg_resolution_seconds)}
          />
        </div>
      )}

      <p style={styles.footNote}>
        Numeri calcolati in tempo reale a ogni apertura della pagina.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ ...styles.tile, ...(highlight ? styles.tileHi : null) }}>
      <div style={styles.tileLabel}>{label}</div>
      <div style={{ ...styles.tileValue, ...(highlight ? styles.tileValueHi : null) }}>
        {value}
      </div>
      {sub ? <div style={styles.tileSub}>{sub}</div> : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: "1.25rem" },

  card: {
    display: "flex",
    alignItems: "center",
    gap: "1.1rem",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    boxShadow: shadow,
    padding: "1.25rem 1.5rem",
  },
  avatar: {
    width: 64,
    height: 64,
    flexShrink: 0,
    borderRadius: radius.pill,
    background: colors.accent,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.4rem",
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  name: { margin: 0, fontSize: "1.3rem", fontWeight: 800, color: colors.title },
  role: { marginTop: 2, fontSize: "0.85rem", fontWeight: 700, color: colors.accentDark },
  since: { marginTop: 4, fontSize: "0.82rem", color: colors.muted },
  email: { marginTop: 1, fontSize: "0.82rem", color: colors.muted },

  h2: { margin: "0.25rem 0 0", fontSize: "1.05rem", fontWeight: 800, color: colors.title },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 12,
  },
  tile: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    padding: "1.1rem 1.25rem",
  },
  tileHi: { borderColor: colors.accent, background: "#f2f9f8" },
  tileLabel: { fontSize: "0.82rem", color: colors.muted, fontWeight: 600 },
  tileValue: {
    marginTop: 6,
    fontSize: "1.7rem",
    fontWeight: 800,
    color: colors.title,
    lineHeight: 1.1,
  },
  tileValueHi: { color: colors.accentDark },
  tileSub: { marginTop: 4, fontSize: "0.78rem", color: colors.muted },

  footNote: { margin: 0, fontSize: "0.78rem", color: colors.muted },

  errorBox: {
    padding: "1rem 1.25rem",
    background: "#fdf3e6",
    border: "1px solid #f0d9b5",
    borderRadius: radius.card,
    color: "#8a5a20",
    fontSize: "0.9rem",
  },
};
