// app/(panel)/layout.tsx
// P3.1 — Shell del pannello + gate professionista (spostato qui da app/page.tsx,
// così protegge e incornicia TUTTE le pagine del gruppo (panel)).
// Server Component: legge la sessione e la riga professionista, poi disegna la shell.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { colors, font } from "@/lib/panel-theme";
import Sidebar from "./Sidebar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // GATE PROFESSIONISTA (come in P1.4): legge la PROPRIA riga in professionals.
  // Un account "ragazzo" non vede righe (RLS) → data null → fuori.
  // `can_publish` (V2) decide se compare la voce "Contenuti": è cortesia verso chi
  // non pubblica, non una protezione — quella è la RLS più contenuti/guard.ts.
  const { data: pro } = await supabase
    .from("professionals")
    .select("full_name, role, can_publish")
    .eq("id", user.id)
    .maybeSingle();

  if (!pro) {
    await supabase.auth.signOut();
    redirect("/login?denied=1");
  }

  return (
    <div style={styles.shell}>
      <Sidebar canPublish={!!pro.can_publish} />
      <div style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.proName}>{pro.full_name}</div>
            <div style={styles.proMeta}>{user.email}</div>
          </div>
          <form action={signOut}>
            <button type="submit" style={styles.logout}>
              Esci
            </button>
          </form>
        </header>
        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100dvh",
    display: "flex",
    background: colors.bg,
    fontFamily: font,
    color: colors.text,
  },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.75rem",
    background: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
  },
  proName: { fontSize: "0.95rem", fontWeight: 700, color: colors.title },
  proMeta: { fontSize: "0.8rem", color: colors.muted },
  logout: {
    padding: "0.55rem 1rem",
    borderRadius: 10,
    border: `1px solid ${colors.btnBorder}`,
    background: colors.btnBg,
    color: colors.btnText,
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  content: { padding: "1.75rem", maxWidth: 980, width: "100%" },
};
