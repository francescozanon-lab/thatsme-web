// app/(panel)/page.tsx
// P3.2 — Dashboard "Casi in arrivo": le richieste `pending`, in coda per data.
// Server Component: legge come lo psicologo loggato (RLS). Rotta = "/".

import { createClient } from "@/lib/supabase/server";
import {
  colors,
  radius,
  shadow,
  CATEGORY,
  type CategoryKey,
} from "@/lib/panel-theme";
import TakeChargeButton from "./TakeChargeButton";
import RefreshButton from "./RefreshButton";

type Req = { id: string; category: CategoryKey; created_at: string };

function waitedSince(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "ora";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export default async function CasiInArrivoPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contact_requests")
    .select("id, category, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true }); // chi aspetta da più tempo, in cima

  const requests = (data ?? []) as Req[];

  return (
    <div>
      <div style={styles.headRow}>
        <div>
          <h1 style={styles.h1}>Casi in arrivo</h1>
          <p style={styles.sub}>
            Richieste in attesa di uno psicologo. Chi prende per primo, prende il caso.
          </p>
        </div>
        <RefreshButton />
      </div>

      {error ? (
        <div style={styles.errorBox}>
          Non riesco a leggere le richieste. Se il problema persiste, controlliamo le policy RLS
          su <code>contact_requests</code>.
        </div>
      ) : requests.length === 0 ? (
        <div style={styles.empty}>
          Nessun caso in arrivo. Quando un ragazzo chiede aiuto, comparirà qui.
        </div>
      ) : (
        <div style={styles.list}>
          {requests.map((r) => {
            const cat =
              CATEGORY[r.category] ?? { label: r.category, fg: colors.muted, bg: colors.bg };
            const time = new Date(r.created_at).toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div key={r.id} style={styles.row}>
                <div style={styles.rowLeft}>
                  <span style={{ ...styles.tag, color: cat.fg, background: cat.bg }}>
                    {cat.label}
                  </span>
                  <div style={styles.times}>
                    <span style={styles.time}>arrivata alle {time}</span>
                    <span style={styles.waited}>in attesa da {waitedSince(r.created_at)}</span>
                  </div>
                </div>
                <TakeChargeButton requestId={r.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "1.25rem",
  },
  h1: { margin: 0, fontSize: "1.4rem", fontWeight: 800, color: colors.title },
  sub: { margin: "0.3rem 0 0", fontSize: "0.9rem", color: colors.muted },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    boxShadow: shadow,
    padding: "1rem 1.25rem",
  },
  rowLeft: { display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 },
  tag: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.3rem 0.6rem",
    borderRadius: radius.pill,
    whiteSpace: "nowrap",
  },
  times: { display: "flex", flexDirection: "column" },
  time: { fontSize: "0.92rem", fontWeight: 600, color: colors.title },
  waited: { fontSize: "0.8rem", color: colors.muted },
  empty: {
    padding: "2.5rem 1.5rem",
    textAlign: "center",
    color: colors.muted,
    background: colors.surface,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.card,
    fontSize: "0.95rem",
  },
  errorBox: {
    padding: "1rem 1.25rem",
    background: "#fdecea",
    border: "1px solid #f3c2bc",
    borderRadius: 12,
    color: "#8a2b20",
    fontSize: "0.9rem",
  },
};
