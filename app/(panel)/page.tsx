// app/(panel)/page.tsx
// P3.2 — Dashboard "Casi in arrivo": le richieste `pending`, in coda per data.
// Server Component: legge come lo psicologo loggato (RLS). Rotta = "/".

import { createClient } from "@/lib/supabase/server";
import { colors, radius, shadow } from "@/lib/panel-theme";
import { hhmm, sinceLabel } from "@/lib/panel-format";
import TakeChargeButton from "./TakeChargeButton";
import RefreshButton from "./RefreshButton";
import { Provenienza, SELECT_PROVENIENZA, type ProvenienzaDati } from "./Provenienza";

type Psicologo = { id: string; full_name: string | null; is_active: boolean };

type Req = {
  id: string;
  created_at: string;
  // ⚠️ Due rimandi diversi verso `professionals` (assegnato e preferito): il nome del
  // vincolo dice a PostgREST quale dei due seguire, altrimenti si rifiuta di scegliere.
  preferito: Psicologo | Psicologo[] | null;
} & ProvenienzaDati;

const uno = (p: Psicologo | Psicologo[] | null) => (Array.isArray(p) ? p[0] : p) ?? null;

export default async function CasiInArrivoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("contact_requests")
    .select(
      `id, created_at, ${SELECT_PROVENIENZA}, ` +
        "preferito:professionals!contact_requests_preferred_professional_id_fkey(id, full_name, is_active)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true }); // chi aspetta da più tempo, in cima

  // V6 — STICKY. Un caso «di» un altro psicologo ancora attivo non compare: il ragazzo
  // torna da chi l'ha già ascoltato (decisione 5). Se invece quello psicologo ha
  // lasciato il pool, il caso torna di tutti, con la nota di chi lo seguiva: chi
  // aspetta viene prima della continuità.
  // ⚠️ Il filtro vero è dentro `take_charge` (db/v6_sticky.sql): qui è solo la vista.
  const requests = ((data ?? []) as unknown as Req[])
    .map((r) => {
      const p = uno(r.preferito);
      return {
        ...r,
        mio: !!p && p.id === user?.id,
        altrui: !!p && p.id !== user?.id && p.is_active,
        primaSeguitoDa: p && !p.is_active ? (p.full_name ?? "uno psicologo che ha lasciato il team") : null,
      };
    })
    .filter((r) => !r.altrui);

  // Dirlo invece di nasconderlo: «nessun caso» quando la coda non è vuota farebbe
  // pensare a un guasto del pannello.
  const riservatiAdAltri = ((data ?? []) as unknown as Req[]).length - requests.length;

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
          Nessun caso in arrivo per te. Quando un ragazzo chiede aiuto, comparirà qui.
          {riservatiAdAltri > 0 ? (
            <div style={styles.riservati}>
              {riservatiAdAltri === 1
                ? "C'è 1 richiesta di un ragazzo già seguito da un collega."
                : `Ci sono ${riservatiAdAltri} richieste di ragazzi già seguiti da colleghi.`}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={styles.list}>
          {requests.map((r) => {
            const time = hhmm(r.created_at);
            return (
              <div key={r.id} style={styles.row}>
                <div style={styles.rowLeft}>
                  <div style={styles.times}>
                    <span style={styles.time}>arrivata alle {time}</span>
                    <span style={styles.waited}>in attesa da {sinceLabel(r.created_at)}</span>
                  </div>
                  <div style={styles.info}>
                    {/* Da dove arriva: stato d'animo + categoria · sottocategoria. */}
                    <Provenienza dati={r} />
                    {r.mio ? (
                      <span style={styles.sticky}>Hai già seguito questo ragazzo</span>
                    ) : r.primaSeguitoDa ? (
                      <span style={styles.stickyOrfano}>Prima seguito da {r.primaSeguitoDa}</span>
                    ) : null}
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
  info: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  riservati: { marginTop: "0.6rem", fontSize: "0.85rem", color: colors.muted },
  sticky: { fontSize: "0.78rem", fontWeight: 700, color: colors.accentDark },
  stickyOrfano: { fontSize: "0.78rem", color: colors.muted },
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
