# Automatic registration bell notifications

Applied to the shared PLM-SEAMS database as 20261103152156_automatic_registration_notifications.sql. Do not rerun it on the shared project.

A private, non-client-callable trigger creates notices in the registration transaction for Confirmed, Waitlisted, Waitlisted-to-Confirmed promotion and Cancelled transitions. Same-status updates do not send duplicates. Recipient comes from the registration, not client notification input. Existing notification RLS remains unchanged. Messages are delivered in-app, not by email.

New notices use server statement_timestamp(). At the owner's request, the migration also refreshed the two matching legacy sample registration notices for rescheduled upcoming sample events; unrelated notices and registration timestamps were preserved.

Student bells refresh after successful registration/cancellation, on tab focus, and every 15 seconds while visible. Polling avoids changes to live Realtime settings. This supplements the existing Event/Sent display component; dates are displayed in Asia/Manila.

Validation: frontend build/lint and 22 tests; four SQL suites including registration_notifications.sql; live transactional verification of all four transitions rolled back. Existing leaked-password protection advisory remains a separate project-setting follow-up.
