import LoginForm from "./login-form";

// Server Component: in Next.js 15 searchParams è una Promise.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.eyebrow}>THAT&apos;S ME · area psicologi</p>
        <h1 style={styles.title}>Accedi al pannello</h1>
        <p style={styles.subtitle}>
          Riservato ai professionisti registrati.
        </p>

        {denied ? (
          <p role="alert" style={styles.denied}>
            Questo account non è abilitato all&apos;area psicologi.
          </p>
        ) : null}

        <LoginForm />
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    background: "#eef3f3",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#fff",
    borderRadius: "18px",
    padding: "2rem 1.75rem",
    boxShadow: "0 10px 40px rgba(31, 64, 67, 0.10)",
    border: "1px solid #e2eaea",
  },
  eyebrow: {
    margin: 0,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#2f7d77",
  },
  title: {
    margin: "0.5rem 0 0.25rem",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#16282e",
  },
  subtitle: {
    margin: "0 0 1.4rem",
    fontSize: "0.92rem",
    color: "#5c6b71",
  },
  denied: {
    margin: "0 0 1rem",
    fontSize: "0.85rem",
    color: "#8a5300",
    background: "#fdf3e2",
    border: "1px solid #f1ddb8",
    borderRadius: "8px",
    padding: "0.55rem 0.7rem",
  },
};