import Link from "next/link";
import AuthCard from "./AuthCard";
import LoginForm from "./login-form";
import { authStyles as styles } from "./auth-styles";

// Server Component: in Next.js 15 searchParams è una Promise.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;

  return (
    <AuthCard
      title="Accedi al pannello"
      subtitle="Riservato ai professionisti registrati."
    >
      {denied ? (
        <p role="alert" style={styles.denied}>
          Questo account non è abilitato all&apos;area psicologi.
        </p>
      ) : null}

      <LoginForm />

      {/* Anche il primo accesso passa da qui: l'account lo crea Francesco, la
          password la sceglie lo psicologo (db/add_professional.sql). */}
      <Link href="/login/password" style={styles.link}>
        Primo accesso o password dimenticata?
      </Link>
    </AuthCard>
  );
}
