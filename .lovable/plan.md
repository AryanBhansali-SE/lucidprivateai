# Fix the failing build: relocate server functions

The production build fails. The framework blocks the entire `src/server/` folder from client bundles, but eleven client files (routes and components) import server functions from there. The build stops at the first offender, `admin-bootstrap`, and would fail on the rest afterwards.

## What changes

Move every `*.functions.ts` file out of `src/server/` into `src/lib/`, which is a client-safe path. The framework replaces server-function bodies with remote-call stubs in the browser bundle, so this is the intended location.

- `src/server/admin.functions.ts` → `src/lib/admin.functions.ts`
- `src/server/calendar.functions.ts` → `src/lib/calendar.functions.ts`
- `src/server/goals.functions.ts` → `src/lib/goals.functions.ts`
- `src/server/habits.functions.ts` → `src/lib/habits.functions.ts`
- `src/server/insights.functions.ts` → `src/lib/insights.functions.ts`
- `src/server/journal.functions.ts` → `src/lib/journal.functions.ts`
- `src/server/onboarding.functions.ts` → `src/lib/onboarding.functions.ts`
- `src/server/pulse.functions.ts` → `src/lib/pulse.functions.ts`

`src/server/calendar.server.ts` stays where it is — it is server-only by design and is only reached from the calendar server functions, never from a component.

## Import updates

Rewrite `@/server/<name>.functions` to `@/lib/<name>.functions` in the eleven importers:

`src/routes/welcome.tsx`, `src/routes/admin-bootstrap.tsx`, `src/routes/api/auth/google/callback.ts`, `src/routes/_authenticated/{settings,goals,pulse,admin,calendar,matrix,journal}.tsx`, `src/lib/use-roles.ts`, `src/components/lucid/InsightsPanels.tsx`, `src/components/lucid/tutorial/TutorialPopover.tsx`.

The moved function files keep their own import of `@/server/calendar.server` where applicable.

## Guardrails while moving

Each relocated file must stay a thin wrapper: only imports, types, and exported `createServerFn` declarations at module scope. Any helper, constant, or config currently sitting alongside a server function in those files gets moved into a plain module (or inside the handler) — otherwise the build's code-splitting drops it and produces a runtime `ReferenceError` that typechecks clean.

## Verification

Run the production build to confirm the import-protection error is gone, then load `/`, `/auth`, and a protected page to confirm data still loads.
