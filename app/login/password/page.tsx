// app/login/password/page.tsx
// «Primo accesso o password dimenticata?»: lo psicologo scrive la sua email e
// riceve il link per scegliere la password. È pubblica (sta sotto /login).

import Link from "next/link";
import AuthCard from "../AuthCard";
import PasswordForm from "./password-form";
import { authStyles as styles } from "../auth-styles";

export default function PasswordPage() {
  return (
    <AuthCard
      title="Scegli la password"
      subtitle="Primo accesso o password dimenticata: scrivi la tua email e ti mandiamo un link per sceglierla."
    >
      <PasswordForm />

      <Link href="/login" style={styles.link}>
        Torna all&apos;accesso
      </Link>
    </AuthCard>
  );
}
