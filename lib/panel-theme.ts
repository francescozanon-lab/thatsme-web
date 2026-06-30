// lib/panel-theme.ts
// Token grafici del pannello psicologi (estratti da app/page.tsx del P1.4).
// Palette teal/professionale — distinta dal coral dell'app mobile. Unica fonte
// per shell, dashboard e pagine successive (I miei casi, Profilo, chat psicologo).

export const colors = {
  bg: "#eef3f3",
  surface: "#ffffff",
  accent: "#2f7d77",
  accentDark: "#256661",
  title: "#16282e",
  text: "#2b3a40",
  muted: "#5c6b71",
  border: "#e2eaea",
  btnBg: "#f3f7f7",
  btnBorder: "#cdd9d9",
  btnText: "#1c2b32",
  danger: "#c0392b",
  // categorie (eco dei colori dell'app mobile)
  life: "#c9821f",
  lifeBg: "#fbf1df",
  school: "#7a6bc4",
  schoolBg: "#efecfa",
  love: "#cf5d7c",
  loveBg: "#fbeaf0",
};

export const radius = { card: 18, control: 10, pill: 999 };
export const shadow = "0 10px 40px rgba(31, 64, 67, 0.10)";
export const font =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// etichette + colori per la categoria della richiesta (life | school | love)
export const CATEGORY = {
  life: { label: "Vita", fg: colors.life, bg: colors.lifeBg },
  school: { label: "Scuola", fg: colors.school, bg: colors.schoolBg },
  love: { label: "Relazioni", fg: colors.love, bg: colors.loveBg },
} as const;

export type CategoryKey = keyof typeof CATEGORY;
