# PLM-SEAMS

React/Vite frontend with Supabase Auth and database-enforced access for **Student**, **Student Organization**, and **Admin**. The existing landing page and all three portal designs are preserved.

## Run the app

Use Node.js 22.12+ (or a supported newer LTS). From the repository root:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open the URL printed by Vite. `frontend/.env.local` is ignored by Git. The example contains only the PLM-SEAMS URL and **publishable** key; these are designed for client applications. Never put a secret or service-role key in a `VITE_` variable.

If you already have `frontend/.env.local`, add the variables from `.env.example` without replacing your other settings. A root `.env.local` is not loaded by this Vite frontend.

Choose the portal matching the account's database role. Passwords are verified by Supabase Auth, never the legacy `public.users.password` field. Roles come from `public.users`, not portal selection, local storage, or editable Auth user metadata.

There is deliberately no self-service role selector or automatic account linking by email. A trusted project administrator must provision the Auth account and explicitly link its UUID to the correct existing business user. The three existing linked Auth accounts remain unchanged. Their existing credentials are required for real login testing.

## Routes

| Role | Sign in | Protected workspace |
| --- | --- | --- |
| Student | `/student/login` | `/student/dashboard` |
| Student Organization | `/student-organization/login` | `/student-organization/dashboard` |
| Admin | `/admin/login` | `/admin/dashboard` |

Anonymous visitors are redirected to login. Signed-in users requesting a different role's workspace are redirected to their own. These React route checks control navigation; **Postgres RLS and column privileges enforce security even when someone bypasses the UI and calls the API directly**. There is no application server in this Vite architecture.

On a static production host, configure SPA fallback to `frontend/dist/index.html` for non-file paths, or direct navigation to a workspace will return a hosting 404.

## Access and workflows

| Data/action | Student | Student Organization | Admin |
| --- | --- | --- | --- |
| Base account | Read own safe columns | Read own safe columns | Read safe account columns |
| Password, role and Auth link writes | Denied | Denied | Denied through browser/API; trusted provisioning only |
| Student profiles | Own | Participants registered to own events | Manage |
| Organization profiles | Denied | Own | Manage |
| Administrator profiles | Denied | Denied | Manage |
| Event types and venues | Read | Read | Manage |
| Proposals | Denied | Own; create Pending; edit/delete Pending or Revisions Required | Manage and review |
| Schedule options | Denied | Own; edit while proposal is Pending or Revisions Required | Manage |
| Reviews | Denied | Read own proposal reviews | Review with recorded administrator identity |
| Events | Published and eligible for student's college | Own, including unpublished; publication/caption/registration visibility edits only | Manage |
| Registrations | Read own; register/cancel via RPC | Read own event registrations | Read/delete; unrestricted UPDATE denied |
| Attendance | Denied | Mark confirmed attendees of own events via RPC | Read; cannot mark as an organization |
| Venue bookings | Denied | Read own event bookings | Manage |
| Notifications | Own; mark read/delete | Own; mark read/delete | Own; mark read/delete; send notifications |

The database exposes more administrative CRUD than the initial workspace forms. The workspace provides proposal and schedule entry, reviews, event/venue/type/booking entry, publication controls, registrations, cancellation, attendance, and notification read/delete actions. Account provisioning and profile administration remain trusted administrative tasks; do not treat this initial workspace as a complete production event-management application.

### Controlled database operations

```js
await supabase.rpc('register_event', { eid: eventId })
await supabase.rpc('cancel_registration', { rid: registrationId, reason })
await supabase.rpc('mark_attendance', { rid: registrationId, status: 'Present' })
await supabase.rpc('review_proposal', { pid: proposalId, decision: 'Approved', remarks })
```

- Registration checks role, linked student, eligibility, publication, open registration, Upcoming status, and start time. An event-row lock serializes registration/cancellation; full events produce Waitlisted registrations.
- Duplicate active registrations are rejected. Re-registering after cancellation reuses the existing `(event_id, student_number)` row.
- Students can cancel only their own registration before an Upcoming event starts. Cancellation records the reason/time and clears attendance. A vacated confirmed place promotes the earliest waitlisted registration. No browser receives unrestricted registration UPDATE privileges.
- Attendance accepts only Present/Absent for a Confirmed registration. The signed-in organization must own the event. The organization ID and timestamp are set in the database; callers cannot supply another marker.
- `registration.attendance_marked_by` references `student_organization(org_id)`, matching ERD v17. No existing non-null attendance markers needed conversion.
- Organizations cannot self-approve proposals or modify another organization's proposal/event. Only an approved, matching proposal can be published as an event.
- Base user records, roles and Auth links cannot be changed through the client, including by an Admin account. `password` is excluded using column privileges, not merely hidden in the UI.
- Notification UPDATE is restricted to `read_at` at the privilege level.

## Database source of truth

`supabase/migrations/20261102031827_complete_erd_rbac.sql` was applied to the shared **PLM-SEAMS** project on 2026-11-02. **Do not rerun it or the seed on the existing project.** Pulling this repository does not require applying the migration again.

The migration replaces the old permissive policies rather than layering new policies over them, explicitly grants required operations, installs private authorization/RPC implementations and public invoker wrappers, corrects the attendance FK, and adds relevant indexes. Historical migrations are preserved. The `auth_user_id` addition is conditional because it already existed in the shared project but was missing from its committed historical schema.

- `supabase/policies/rls_policies.sql`: current policy reference, dependent on migration helpers; do not run independently.
- `database/plm_seams_schema_aligned_supabase.sql`: updated base-schema reference, not a substitute for migrations.
- `frontend/src/types/database.ts`: generated from the live schema after applying the migration. Generated types describe columns; they do not imply callers have permission to read/write every column.

## Verification

```bash
cd frontend
npm test
npm run lint
npm run build
```

Eight frontend access tests pass, lint is clean, and the production build passes. `supabase/tests/rbac.sql` also passed on PLM-SEAMS using transaction-local authenticated/anonymous database roles and the three existing linked identities. It tests allowed/denied reads and writes, ownership, role escalation, protected columns, approval, eligibility, capacity, re-registration, waitlist promotion, cancellation, attendance, schedules and notifications. All fixture records and test changes were rolled back. This verifies database authorization, not those users' passwords.

For browser smoke tests, start the dev server in another terminal, then:

```bash
cd frontend
npx playwright install chromium
npm run test:browser
```

The browser suite mocks all Supabase requests and writes no live data. It checks anonymous redirects, each role's login/navigation/logout, wrong-portal rejection, user-metadata role spoofing and mobile overflow. It could not execute in the implementation environment because Chromium's socket creation was blocked; real login and browser testing still need to be run locally with the existing account credentials.

Supabase's database security advisories are clear after this change. One Auth-setting advisory remains: leaked-password protection is disabled. Enable it in the project's Auth password settings if available for your plan: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . This setting was not changed. Performance advisories only report unused indexes on this small dataset; existing indexes were retained.
