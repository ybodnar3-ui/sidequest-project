# SideQuest Phase 3 — Polish, Onboarding & Hardening

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

Three unblocked quality passes before opening to other users. **Prompt caching was considered and SKIPPED** — the system prompt (~150 tokens) is far below Anthropic's ~2–4K minimum cacheable prefix, so it would never cache (no-op).

## Plan A — In-app UI polish
**Goal:** Bring the logged-in screens up to the landing page's visual quality (dark `#070712` base, indigo→violet accents `#6d5efa`/`#a78bfa`, glassmorphism cards, rounded corners, subtle motion), while preserving 100% of existing functionality.

**Hard rule:** Change only styling/markup/structure. Do NOT change server actions, data flow, component props/contracts, or business logic. `npm run build` + all 28 tests must stay green. Each page must keep working exactly as before.

**Screens:** `app/login/page.tsx`, `app/(app)/home/page.tsx` + `StatsBar` + `QuestCard` + `MoodCheckin` + `PushSetup` + `LocationSetup`, `app/(app)/shop/*`, `app/(app)/money/*`, `app/(app)/journal/page.tsx`, `app/(app)/settings/*`.

**Approach:** Establish shared theme tokens/utility classes in `app/globals.css` (dark bg, card, accent button, input styles) and apply consistently. Keep the die/indigo identity. Mobile-first.

## Plan B — New-user onboarding
**Goal:** A smooth first-run for brand-new accounts. After first login, if the profile has never been set up (no location AND no settings touched), show a short onboarding: welcome + pick categories + set location (reuse `LocationSetup`) + brief "how it works". Persist a `profiles.onboarded_at` (migration) so it shows once. Then land on `/home`.

## Plan C — Code review + hardening
**Goal:** Review the whole codebase for correctness bugs + security before multi-user launch. Focus: RLS coverage on every table, server-side auth checks in every action/route, the cron + (future) Stripe routes' secret verification, no service-role key leakage to client, input validation, error handling. Use `/code-review` or a reviewer subagent; fix high-confidence findings.

Order: A → B → C (review the final state last).
