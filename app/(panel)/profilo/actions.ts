"use server";

// app/(panel)/profilo/actions.ts
// Salvataggio della password scelta in /profilo/password.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PASSWORD_MIN_LENGTH } from "./password/rules";

type PasswordState = { error: string; ok: boolean };

export async function updatePassword(
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: `La password deve avere almeno ${PASSWORD_MIN_LENGTH} caratteri.`,
      ok: false,
    };
  }
  if (password !== confirm) {
    return { error: "Le due password non coincidono.", ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Una Server Action si può chiamare anche senza passare dal layout: il gate
  // professionista si ripete qui, con la stessa lettura (e la stessa RLS) del
  // layout di (panel). Senza, un account da ragazzo arrivato col link dell'email
  // potrebbe darsi una password chiamando l'azione a mano.
  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!pro) {
    // Solo questa sessione, come nel layout: non si butta fuori il ragazzo
    // anche dall'app sul telefono.
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?denied=1");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.code === "same_password") {
      return {
        error: "È uguale a quella che avevi: scegline una diversa.",
        ok: false,
      };
    }
    if (error.code === "weak_password") {
      return {
        error: "Password troppo debole: allungala o mescola lettere e numeri.",
        ok: false,
      };
    }
    return {
      error: `Non sono riuscito a salvare la password: ${error.message}`,
      ok: false,
    };
  }

  return { error: "", ok: true };
}
