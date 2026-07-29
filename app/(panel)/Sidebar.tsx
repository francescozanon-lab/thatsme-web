// app/(panel)/Sidebar.tsx
// Navigazione laterale del pannello. Client Component: usa usePathname per
// evidenziare la voce attiva.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, font } from "@/lib/panel-theme";

const NAV = [
  { href: "/", label: "Casi in arrivo" },
  { href: "/casi", label: "I miei casi" },
  { href: "/profilo", label: "Profilo" },
];

// V2 — La voce del modulo contenuti, riservata a chi ha `can_publish`.
// ⚠️ Nasconderla è SOLO cortesia verso chi non pubblica: non è una protezione. La
// protezione è la RLS (rifiuta le scritture) più il cancello lato server in
// contenuti/guard.ts (rimanda indietro chi digita l'indirizzo a mano).
const NAV_CONTENUTI = { href: "/contenuti", label: "Contenuti" };

export default function Sidebar({ canPublish }: { canPublish: boolean }) {
  const pathname = usePathname();
  const voci = canPublish ? [...NAV, NAV_CONTENUTI] : NAV;

  return (
    <aside style={styles.aside}>
      <div style={styles.brand}>
        That&apos;s Me
        <span style={styles.brandSub}>area psicologi</span>
      </div>
      <nav style={styles.nav}>
        {voci.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ ...styles.link, ...(active ? styles.linkActive : null) }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  aside: {
    width: 230,
    flexShrink: 0,
    background: colors.surface,
    borderRight: `1px solid ${colors.border}`,
    padding: "1.5rem 1rem",
    fontFamily: font,
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  brand: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: colors.title,
    display: "flex",
    flexDirection: "column",
    paddingLeft: "0.5rem",
  },
  brandSub: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: colors.accent,
    marginTop: 2,
  },
  nav: { display: "flex", flexDirection: "column", gap: 4 },
  link: {
    padding: "0.6rem 0.75rem",
    borderRadius: 10,
    fontSize: "0.92rem",
    fontWeight: 600,
    color: colors.text,
    textDecoration: "none",
  },
  linkActive: { background: colors.bg, color: colors.accentDark },
};
