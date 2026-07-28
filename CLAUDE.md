# CLAUDE.md — That's Me

> **⚠️ COPIA SINCRONIZZATA.** L'originale vive in **`thatsme-app/CLAUDE.md`**: se modifichi uno dei due,
> allinea l'altro (i repo sono separati su GitHub, quindi un rimando al file dell'altra cartella qui non
> funzionerebbe). Allineata il **28/07/2026**.

> **File di contesto per Claude Code.** Va alla **radice del repo** in cui apri Claude Code. Ci sono **due
> repo** (`thatsme-app`, `thatsme-web`): tieni una copia di questo file alla radice di **ciascuno**. I due
> documenti di dettaglio (`progress.md`, `thatsme_due_scalette.md`) vivono in `thatsme-app` e **non sono
> presenti in questo repo**; se lavori nel pannello web, questo `CLAUDE.md` resta comunque autosufficiente
> sull'essenziale.

## Cos'è il progetto
That's Me è un'app di supporto psicologico per **adolescenti (target 14-19)**, committente **Radio Voice
Società Benefit srl**. Stato: **prototipo / MVP**. Loop centrale: ragazzo in difficoltà → **psicologo vero**
che risponde in chat. Non è ancora un prodotto in produzione.

## ⚠️ Sicurezza e minori — vale su tutto, leggere sempre
L'app tratterà **dati sensibili di minori**. Regole non negoziabili quando si lavora al codice:
- **Segreti fuori dal contesto.** La **service/secret key di Supabase** e le API key (Resend) **non entrano
  mai** nel codice né in questa sessione. Stanno in `.env` / `.env.local` (git-ignored) e nel dashboard
  Supabase. Se servono per un'operazione, **fermati e falla eseguire all'umano**.
- **Migrazioni DB: le scrivi, non le applichi.** Genera/aggiorna i file SQL versionati in `db/` (schema,
  policy, grants, funzioni). **L'esecuzione su Supabase la fa l'umano** dal dashboard, che poi verifica.
  ⚠️ La cartella `db/` sta in **`thatsme-app`**, non qui: le migrazioni che nascono da un lavoro sul
  pannello vanno comunque versionate là.
- **RLS + GRANT sono la vera protezione** (non il gate di navigazione client, che è solo UI). Ogni tabella
  nuova o modifica a policy va accompagnata da RLS *e* GRANT a `authenticated` (vedi `db/grants.sql`). Non
  abbassare le policy per far passare un test.
  ⚠️ **RLS e GRANT sono due lucchetti DIVERSI, e vale anche per `service_role`.** La RLS decide *quali
  righe* vedi, il GRANT decide *se puoi toccare la tabella*: `service_role` scavalca solo il primo. Ogni
  tabella letta **in diretta** dalla Edge Function va concessa a mano in `db/notify_grants.sql`, altrimenti
  `42501 permission denied` e la notifica muore in silenzio. Le funzioni `SECURITY DEFINER` non hanno il
  problema (basta il `grant execute`). Questo errore è già costato due debug: P1.2 su `authenticated`,
  27/07/2026 su `service_role`. Restare **stretti**: mai `grant all … to service_role`.
- **Binario legale = fuori perimetro.** DPIA, consensi art. 9 GDPR, protocollo emergenza (F1/F2/F3.5) sono di
  avvocato + team clinico. Tu acceleri il **binario tecnico**, non quello legale.

## Come sono organizzati i documenti
- **`progress.md`** = fonte di verità sullo **STATO** (dove siamo, dettaglio file-per-file, decisioni, gotcha).
  **Leggilo per primo a ogni task**, sezioni «Dove siamo» e «Prossimo passo concreto».
- **`thatsme_due_scalette.md`** = **roadmap** (PARTE A prototipo, PARTE B produzione, 🔀 VARIAZIONE V1–V7).
  Dice *cosa* e *in che ordine*; lo *stato* (a che punto) sta in `progress.md`.
- ⚠️ **Entrambi vivono in `thatsme-app`.** Da questo repo non sono leggibili: se il task lo richiede, apri
  Claude Code sulla cartella che contiene **entrambi** i repo (`C:\Users\Maurizio\Progetti`).
- **A fine sessione:** aggiorna `progress.md` (stato + prossimo passo + nuove gotcha) e committa.

## Stack & repo
- **App mobile `thatsme-app`** — React Native + **Expo SDK 54** (cartella `src/`, alias `@/` → `./src`,
  `expo-router`). Repo GitHub: `francescozanon-lab/thatsme`.
- **Pannello web `thatsme-web`** — **Next.js 16** (App Router, **niente `src/`**, alias `@/` alla root,
  `@supabase/ssr`, stili inline, palette teal). Repo separato.
- **Backend** — **Supabase** (progetto `thatsme-prototype`, region Frankfurt): Postgres + Auth + Realtime.
  Schema, policy, grants, funzioni e realtime versionati in `db/` (lato `thatsme-app`).
- **Ambiente di sviluppo:** Windows + PowerShell.

## Convenzioni e gotcha BUILD-CRITICAL (non ignorare)
- **Casing componenti = MAIUSCOLO** (`Button.tsx`, non `button.tsx`). Windows non distingue, **la build EAS
  (Linux) sì** → il barrel `index.ts` non li trova e la build fallisce. Su Windows rinomina con nome
  intermedio (`x.tsx → x.tmp → X.tsx`) e committa con Git.
- **`theme.ts` = export NOMINATI:** `import { colors, fonts } from '@/lib/theme'` (NON `theme.colors`). Pesi
  font usati: regular / medium / bold / extrabold.
- **Accenti in JSX = caratteri LETTERALI** nel testo (à, è, …), non entity HTML.
- **PowerShell + parentesi:** i percorsi con `(app)` / `(tabs)` / `(panel)` vanno **sempre tra virgolette**
  (le `()` sono speciali in PowerShell).
- **PowerShell 5.1 non conosce `&&`:** `cd X && npm run dev` non parte nemmeno (errore di sintassi). Dare
  sempre i comandi su **righe separate**.
- **Realtime:** `supabase.realtime.setAuth(access_token)` **prima** di `.subscribe()`; la tabella dev'essere in
  `supabase_realtime` (`db/realtime.sql`). Rispetta la RLS.
- **Tastiera/chat:** `app.json` → `android.softwareKeyboardLayoutMode: "resize"`; dopo aver toccato `app.json`,
  riavvia con `npx expo start -c`.
- **Spinner infinito / cache stantìa:** di solito è `.expo` / Metro → cancella `.expo` e `npx expo start -c`.
- **Next.js 16:** convenzione **`proxy.ts`** (funzione `proxy`), **non** `middleware.ts`.
- **Orari nel pannello:** formattare **sempre** con `timeZone: 'Europe/Rome'` dichiarato
  (`lib/panel-format.ts`). Su Vercel il server è in **UTC** e il browser no: senza fuso fisso l'HTML non
  combacia (hydration mismatch) e l'ora mostrata è sbagliata.
- **Moduli condivisi server/client:** un modulo con `"use client"` **non può esportare valori che poi legge
  il server** (Next li sostituisce con riferimenti al client) → tenerli in un modulo neutro, come
  `casi/[id]/case-data.ts`.
- **OTP a 6 cifre** (impostato su Supabase; fonte di verità = dashboard). `login.tsx` usa `maxLength={6}`.
- **Auth pilota = telefono + SMS 6 cifre** (decisione committente); **ora si resta a email-OTP**. Lo swap
  email→SMS è **isolato in `src/lib/otp.ts`** (lato app): si cambia solo quel file (+ provider SMS su Supabase).
- **Resend in modalità test** consegna **solo a `francesco.zanon99@gmail.com`** → blocca ogni altro tester
  finché non si verifica il dominio `thats-me.it` (passo «Distribuzione»).
- **Push: niente Expo Go.** Dall'SDK 53 le push remote sono state rimosse da Expo Go → si provano solo con un
  **development build EAS** (+ Firebase/FCM su Android). In Expo Go `registerPushToken` risponde
  `unsupported` e non registra nulla: è il comportamento voluto, non un bug.
- **`tsconfig.json` (lato app) esclude `supabase/`:** dentro c'è la Edge Function, che è codice **Deno** —
  `npx tsc --noEmit` non conosce `Deno.serve` e fallirebbe su un file che non appartiene all'app.
- **Nelle notifiche non entra mai il contenuto** di un messaggio (né nei log della Edge Function): si legge
  dalla schermata di blocco, cioè da chiunque abbia in mano il telefono. Testo neutro, sempre.
- **Errori a schermo: MAI il messaggio tecnico** (P4.3). Lato app si usa `reportFailure(tag, err, fallback)`
  da `@/lib/errors`: dettaglio nel **log**, frase sullo **schermo**. Nel pannello la regola è più morbida —
  chi legge è uno psicologo, e un codice d'errore può girarlo a noi — ma la forma resta quella già usata in
  `CaseActions.tsx`: *«Non sono riuscito a chiudere: {err}»*, mai l'errore nudo.
  ⚠️ **I testi dell'app sono segnaposto**: la versione definitiva la daranno gli **psicologi**.

## Stato attuale (sintesi — dettaglio in `progress.md`)
- ✅ **P0** (manca solo P0.4 account Vercel) · ✅ **P1** (schema, RLS+GRANT, auth app, auth pannello) ·
  ✅ **P2** completo (P2.1→P2.8) · ✅ **Reskin grafico** · ✅ **Blocco 3** (registrazione/onboarding).
- ✅ **P3.1–P3.3** (pannello: shell + «Casi in arrivo» + «Prendi in carico» via RPC `take_charge`, atomica).
  Testato end-to-end col telefono. Lo scaffold di test `do $$…$$` è **morto**.
- ✅ **P3.5** (pannello: chat lato psicologo su `/casi/<conversationId>` — Realtime, invio del **primo
  messaggio**, nota interna in `case_status_log` con `new_status='note'`, invisibile all'app per RLS).
  Testata end-to-end col telefono.
- ✅ **P3.4** «I miei casi» in tre gruppi (tocca a te / in attesa del ragazzo / risolti), riga → `/casi/<id>`.
  Testato a video. Formattatori di data condivisi in `lib/panel-format.ts` (fuso `Europe/Rome` dichiarato).
- ✅ **P3.6** chiusura caso end-to-end: RPC `close_case(p_request_id, p_final_message)` (`db/close_case.sql`,
  applicata) + bottone "Chiudi caso" col commiato; lato app la chat va in **sola lettura in diretta** e la
  presa in carico **apre la chat da sola** (rimosso lo stato "taken" di `attesa.tsx`). Testato.
- ✅ **fix logout** (`auth.tsx`): `signOut` aggiunto al `SessionContext` (prima il bottone "Esci" era un no-op).
- ✅ **P3.7/P3.8** profilo psicologo + statistiche al volo: RPC `get_my_stats()` (`db/get_my_stats.sql`,
  **applicata e verificata**) + `/profilo` riscritto. Le stat si calcolano da `contact_requests`/`messages`
  (non da `case_status_log`) → note escluse per costruzione. **→ P3 COMPLETO (P3.1→P3.8).**
- ✅ **P4.2 notifiche — COMPLETA E VERIFICATA IN PRODUZIONE.** Email il 25/07/2026, **push il 27/07/2026**
  (Prove A/B/C di `BUILD.md` sul development build installato sul telefono).
  Edge Function **`notify`** svegliata dai **Database Webhook**: email al pool su nuova richiesta, push al
  ragazzo su presa in carico / nuova risposta / commiato. **Non tocca il pannello** — è il motivo per cui è
  stata scelta quell'architettura. File (lato `thatsme-app`): `db/push_tokens.sql`, `db/notify_grants.sql`,
  `db/notify_pool.sql`, `supabase/functions/notify/index.ts`, `src/lib/push.ts`.
  ⚠️ **Resend è in test:** il secret `NOTIFY_EMAIL_OVERRIDE` dirotta tutte le email del pool sull'unico
  indirizzo consegnabile; si toglie quando è verificato il dominio **`thats-me.it`** (comprato il 26/07).
  🔐 **Da fare prima del pilota:** rigenerare `NOTIFY_HOOK_SECRET` (transitato in chiaro durante il debug
  del 27/07) — nuovo secret + stesso valore nell'header dei due webhook + **deploy rifatto**.
- ▶️ **P4.3 polish — A+B+C (27/07/2026) + blocco D (28/07/2026).** Censimento completo in `progress.md`.
  **Il pannello era già a posto** (stati vuoti ed errori curati in P3, conferma vera prima di chiudere un
  caso): l'unica voce che lo riguardava era il testo di `casi/page.tsx` che citava ancora "P3.6", ora
  corretto. Il resto del lavoro era nell'app. Il **blocco D** ha chiuso i due debiti tecnici: la finestra
  cieca del Realtime in `attesa.tsx` e la policy `messages_insert_participants`, che ora rifiuta gli INSERT
  in una conversazione archiviata (`db/messages_archived.sql`, **in `thatsme-app/db/`**).
  ⚠️ Riguarda anche questo repo: da quando la RLS blocca gli invii a caso chiuso, `ChatPanel.tsx` può
  ricevere quel rifiuto se lo psicologo chiude il caso **da una seconda scheda** con la chat aperta nella
  prima. Lasciato com'è di proposito — chi legge è uno psicologo, non un ragazzo — ma è la ragione per cui
  esiste. ⏳ La migrazione è scritta ma **non ancora applicata** su Supabase.
  **Resta E** (notifica allo psicologo sulla risposta del ragazzo, decisa **col freno** anti-spam).
- Poi: **distribuzione** (Resend + Vercel + build EAS `preview`) = **B1** (loop reale con psicologi
  veri + tester adulti).
- Dopo B1: 🔀 **VARIAZIONE V1–V7** (modello a 3 livelli). In parallelo, **binario legale** F1→F2→F3.5 =
  cancello per **B2** (ragazzi veri).

## Come lavorare con me (workflow)
- **Rituale a inizio task** (3 domande, da `progress.md`): 1) l'output dello step precedente funziona?
  2) servono account/credenziali nuove? 3) è cambiato qualcosa nel piano? Va dichiarato **prima** di scrivere codice.
- **Task circoscritti**, uno step alla volta (es. solo P3.5), non «finisci il progetto».
- **Commit frequenti** e review dei diff. Su tutto ciò che tocca RLS/policy, verifica **comportamentale**
  (test «travestendosi» da utente, dentro `begin … rollback`).
- **Non riaprire** le «decisioni chiuse col cliente» (sezione nella variazione) senza un motivo esplicito.
- **Due repo:** se il task è cross-repo (app che reagisce al pannello via Realtime), lavora a sessioni separate
  o apri Claude Code su una cartella che contiene entrambi.
- **Fine sessione:** aggiorna `progress.md` e committa su **entrambi** i repo toccati.

## Comandi utili
- **Pannello (`thatsme-web`, questo repo):** `npm run dev` · `npm run build` · `npm run lint`.
  Login di prova: `psicologo-test@example.com` (password impostata via SQL; se persa, reset con `crypt(...)`
  — vedi le note P1.4 in `progress.md`).
- **App (`thatsme-app`):** `npx expo start -c` (dev, cache pulita) · `npx expo start --dev-client` (con il
  development build sul telefono) · `npx tsc --noEmit` (typecheck) · `npx expo install <pkg>`.
  Build: **EAS** (Android = via più rapida da Windows; iOS/TestFlight richiede Apple Developer €99).

---
*Riassunto operativo. La verità di dettaglio vive in `progress.md` e `thatsme_due_scalette.md`, entrambi in `thatsme-app`.*

<!-- Avviso di scaffold Next.js: tenuto perché segnala che questa versione ha breaking changes. -->
@AGENTS.md
