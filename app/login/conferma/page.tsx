// app/login/conferma/page.tsx
// Qui arriva il link dell'email (template "Reset Password" su Supabase, che
// aggiunge token_hash e type=recovery). La pagina non verifica niente al
// caricamento: aspetta il clic su «Continua» (il perché è in confirmRecovery,
// ../actions.ts).

import Link from "next/link";
import AuthCard from "../AuthCard";
import ConfirmForm from "./confirm-form";
import { authStyles, formStyles } from "../auth-styles";

export default async function ConfermaPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash, type } = await searchParams;
  const tokenHash =
    typeof token_hash === "string" && type === "recovery" ? token_hash : null;

  return (
    <AuthCard
      title="Scegli la password"
      subtitle={tokenHash ? "Premi «Continua» per sceglierla." : undefined}
    >
      {tokenHash ? (
        <ConfirmForm tokenHash={tokenHash} />
      ) : (
        <p role="alert" style={formStyles.error}>
          Il link non è completo: chiedine uno nuovo.
        </p>
      )}

      <Link href="/login/password" style={authStyles.link}>
        Chiedi un nuovo link
      </Link>
    </AuthCard>
  );
}
