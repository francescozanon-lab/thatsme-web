import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

// Home protetta. Il middleware blocca già chi non è loggato; qui aggiungiamo
// il gate vero di P1.4: "sei loggato, ma sei davvero un professionista?".
export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Doppia sicurezza (il middleware dovrebbe aver già reindirizzato).
  if (!user) redirect("/login");

  // --- GATE PROFESSIONISTA -------------------------------------------------
  // Sfrutta la RLS già verificata (Fase A): un professionista riesce a leggere
  // righe in `professionals` (>= 1), un account "ragazzo" ne vede 0.
  // head:true + count:'exact' conta senza scaricare righe; usiamo "*" così non
  // dipendiamo dal nome della colonna PK.
  const { count, error } = await supabase
    .from("professionals")
    .select("*", { count: "exact", head: true });

  const isProfessional = !error && (count ?? 0) > 0;

  // Alternativa più "semantica", se dai EXECUTE su is_professional() al ruolo
  // authenticated nel DB:
  //   const { data: isPro } = await supabase.rpc("is_professional");
  //   const isProfessional = isPro === true;

  if (!isProfessional) {
    // Autenticato ma non abilitato (es. account utente dell'app mobile):
    // chiudi la sessione e torna al login con avviso.
    await supabase.auth.signOut();
    redirect("/login?denied=1");
  }
  // -------------------------------------------------------------------------

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.eyebrow}>THAT&apos;S ME · area psicologi</p>
        <h1 style={styles.title}>Sei dentro 🎉</h1>
        <p style={styles.text}>
          Accesso effettuato come <strong>{user.email}</strong>.
        </p>
        <p style={styles.note}>
          Il gate professionista ha dato esito positivo: questo account può
          vedere la tabella <code>professionals</code> (RLS ok).
        </p>

        <form action={signOut}>
          <button type="submit" style={styles.button}>
            Esci
          </button>
        </form>
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
    maxWidth: "440px",
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
    margin: "0.5rem 0 0.5rem",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#16282e",
  },
  text: { margin: "0 0 0.5rem", fontSize: "1rem", color: "#2b3a40" },
  note: {
    margin: "0 0 1.4rem",
    fontSize: "0.85rem",
    color: "#5c6b71",
    lineHeight: 1.5,
  },
  button: {
    padding: "0.7rem 1.1rem",
    borderRadius: "10px",
    border: "1px solid #cdd9d9",
    background: "#f3f7f7",
    color: "#1c2b32",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};