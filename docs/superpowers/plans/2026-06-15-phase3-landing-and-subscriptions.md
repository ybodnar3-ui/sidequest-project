# SideQuest Phase 3 — Landing + Subscriptions (Freemium, $3/mo)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Decisions (from owner):** Freemium model · $3/mo Pro · no custom domain (stay on `*.vercel.app`, Google login, no email sending).

**Free tier:** quest of the day, XP/levels/streaks, journal, mood check-in.
**Pro ($3/mo):** reward modules (shop + money bank), push reminders. (Future Pro perks: extra quests/day, per-hour push.)

This doc has two plans: **7 — Landing page** (buildable now, no blockers) and **8 — Subscriptions + gating** (code now; live test needs the owner's Stripe test keys). Custom-domain email and per-hour push (Vercel Pro) are explicitly deferred.

---

# Plan 7 — Landing page

**Goal:** A polished public marketing page at `/` for logged-out visitors (hero, how-it-works, features, pricing, CTA to start free via Google). Logged-in users are redirected to `/home`.

**Architecture:** `app/page.tsx` becomes a server component that redirects authenticated users to `/home` and otherwise renders `<Landing />`. `Landing` is a presentational server component (static content + a `<Link href="/login">` CTA). Styled with Tailwind, matching the app's die/indigo identity. Middleware already leaves `/` public.

## Tasks

### Task 1: Landing component + root routing
**Files:** Create `app/Landing.tsx`; replace `app/page.tsx`.

- [ ] **Step 1:** Build `app/Landing.tsx` — a high-quality marketing page. Use the **anthropic-skills:frontend-design** skill for polish. Requirements:
  - **Hero:** the SideQuest die mark, headline "Один сайд-квест щодня — і життя стає цікавішим", subhead explaining the idea (AI дає тобі маленький квест на 5–15 хв під твоє місто/погоду/настрій), primary CTA button "Почати безкоштовно →" linking to `/login`, secondary muted note "Без картки. Перший квест — за 30 секунд."
  - **Як це працює (3 кроки):** 1) Щоранку отримуєш персональний квест · 2) Виконуєш (5–15 хв) · 3) XP, рівні, стріки, святкування.
  - **Фічі (cards):** AI-персоналізація (місто/погода/настрій), Гейміфікація (XP/рівні/стріки/журнал), Нагороди (магазин + грошовий банк), Пуш-нагадування, PWA (ставиться на телефон), Приватність (твої дані захищені).
  - **Ціни:** two cards — **Безкоштовно** (квест дня, XP/стріки, журнал) and **Pro — $3/міс** (усе з безкоштовного + модулі нагород + пуш-нагадування). Pro card highlighted. CTA on both → `/login`.
  - **Фінальний CTA** + small footer ("SideQuest · зроблено для мандрівників").
  - Visual identity: indigo→violet accents (#4f46e5 / #7c6cff) matching the app icon, clean modern type, generous spacing, mobile-first (most visitors are on phones). Dark or light — pick one cohesive theme and execute it well. Avoid generic AI-slop aesthetics; give it character.
  - Ukrainian copy throughout.

- [ ] **Step 2:** Replace `app/page.tsx` with:
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Landing } from "./Landing";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");
  return <Landing />;
}
```

- [ ] **Step 3:** Verify `npm run build` + `npm test` (25/28 — unchanged). Manually: logged-out `/` shows the landing; logged-in `/` redirects to `/home`; CTA → `/login`.

- [ ] **Step 4:** Commit `feat: add public landing page at /`.

### DoD (Plan 7)
- [ ] `/` renders a polished landing for logged-out visitors; redirects authed users to `/home`. CTA reaches `/login`. Build + tests green.

---

# Plan 8 — Subscriptions + gating (Stripe)

**Goal:** Gate Pro features (reward modules + push) behind a $3/mo Stripe subscription, with checkout, a customer portal, and a webhook that keeps each profile's subscription status in sync.

**Prerequisite (owner):** A Stripe account (test mode is fine to build). Provide: `STRIPE_SECRET_KEY` (test), the `$3/mo` recurring **Price ID** (`price_...`), and after deploy, a webhook signing secret `STRIPE_WEBHOOK_SECRET`. Publishable key not needed (we use hosted Checkout + Portal redirects).

**Architecture:** Add `subscription_status` + `stripe_customer_id` to `profiles`. A `requirePro(userId)` helper reads status. Pro UI (shop/money links + push setup) is gated; non-Pro users see an "Upgrade" prompt linking to a Checkout Session. A `/api/stripe/checkout` route creates a Checkout Session; `/api/stripe/portal` opens the billing portal; `/api/stripe/webhook` (nodejs runtime, raw body, signature-verified) updates `subscription_status` on `checkout.session.completed`, `customer.subscription.updated/deleted`. Gating is enforced server-side in the Pro actions/pages, not just hidden in UI.

## Tasks (summary — detail filled in at execution)

- [ ] **T1 — Migration `0004_subscriptions.sql`:** add `profiles.subscription_status text not null default 'free'` and `profiles.stripe_customer_id text`. Apply via Management API.
- [ ] **T2 — `lib/billing/pro.ts`:** `isPro(status)` pure helper (`status === 'active' || status === 'trialing'`) with tests; `getSubscription(userId)` reader.
- [ ] **T3 — Stripe client + checkout route:** `npm i stripe`; `lib/billing/stripe.ts` (server client from `STRIPE_SECRET_KEY`); `app/api/stripe/checkout/route.ts` creates/uses a customer, makes a subscription Checkout Session for the price, returns redirect URL. Success → `/home?upgraded=1`, cancel → `/upgrade`.
- [ ] **T4 — Webhook:** `app/api/stripe/webhook/route.ts` (runtime nodejs, verify signature with `STRIPE_WEBHOOK_SECRET`, read raw body). On relevant events, look up the profile by `stripe_customer_id` and set `subscription_status` (active/trialing/canceled/past_due) using the admin client.
- [ ] **T5 — Portal route:** `app/api/stripe/portal/route.ts` → billing portal session for the customer.
- [ ] **T6 — Upgrade page + gating UI:** `/upgrade` (explains Pro, "Підписатись за $3/міс" → checkout). On `/home`, show shop/money links + PushSetup only if Pro; otherwise show a single "✨ Pro — розблокувати нагороди й пуші" link to `/upgrade`. Settings module toggles show a Pro badge when locked.
- [ ] **T7 — Server-side enforcement:** in `shop/actions.ts`, `money/actions.ts`, and `savePushSubscription`, check `isPro` first; reject if not Pro. (Defense in depth — never trust the hidden UI.)
- [ ] **T8 — Env (Vercel CLI) + live test:** add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`; register the webhook endpoint in Stripe pointing at `/api/stripe/webhook`; test a full subscribe with a Stripe test card (4242…), confirm `subscription_status` flips to active and Pro unlocks; test cancel via portal flips it back.

### DoD (Plan 8)
- [ ] Non-Pro users cannot use shop/money/push (UI hidden AND server-enforced).
- [ ] Subscribing via Stripe test checkout flips the profile to Pro and unlocks features; cancel re-locks.
- [ ] Webhook signature-verified; status survives refresh.

## Deferred to later
- Custom domain + Resend email (needs a domain).
- Per-hour / popup push delivery (needs Vercel Pro hourly cron).
- Annual plan, coupons, trials tuning.
