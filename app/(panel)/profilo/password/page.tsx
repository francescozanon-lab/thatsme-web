// app/(panel)/profilo/password/page.tsx
// Scelta o cambio della password. Ci si arriva in due modi:
//  · dal link dell'email (login → «Primo accesso o password dimenticata?»);
//  · da «Cambia password» nel profilo.
// Sta dentro (panel) apposta: passa dal gate professionista del layout, quindi un
// account da ragazzo che avesse aperto il link viene respinto prima di arrivare qui.

import { createClient } from "@/lib/supabase/server";
import { colors, radius, shadow } from "@/lib/panel-theme";
import NewPasswordForm from "./new-password-form";
import { PASSWORD_MIN_LENGTH } from "./rules";

export default async function PasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section style={styles.card}>
      <h1 style={styles.title}>Scegli la password</h1>
      <p style={styles.subtitle}>
        Almeno {PASSWORD_MIN_LENGTH} caratteri. Più è lunga meglio è: va bene
        anche una frase.
      </p>
      <NewPasswordForm email={user?.email ?? ""} />
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: 460,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.card,
    boxShadow: shadow,
    padding: "1.5rem",
  },
  title: { margin: 0, fontSize: "1.3rem", fontWeight: 800, color: colors.title },
  subtitle: { margin: "0.35rem 0 1.2rem", fontSize: "0.9rem", color: colors.muted },
};
