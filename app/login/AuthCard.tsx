// app/login/AuthCard.tsx
// La cornice comune delle pagine d'accesso: login, primo accesso / password
// dimenticata, pagina del link che arriva per email.

import { authStyles as styles } from "./auth-styles";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.eyebrow}>THAT&apos;S ME · area psicologi</p>
        <h1 style={styles.title}>{title}</h1>
        {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
        {children}
      </section>
    </main>
  );
}
