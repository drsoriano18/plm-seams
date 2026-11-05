-- Draft proposals are private to their owning student organization until submitted.
-- Keep this change limited to read visibility; write workflows remain unchanged.

drop policy if exists rbac_select on public.event_proposal;
create policy rbac_select on public.event_proposal
for select to authenticated
using (
  (
    (select private.app_role()) = 'Student Organization'
    and private.owns_proposal(proposal_id::text)
  )
  or (
    (select private.app_role()) = 'Admin'
    and approval_status <> 'Draft'
  )
);

drop policy if exists rbac_select on public.proposal_schedule;
create policy rbac_select on public.proposal_schedule
for select to authenticated
using (
  (
    (select private.app_role()) = 'Student Organization'
    and private.owns_proposal(proposal_id::text)
  )
  or (
    (select private.app_role()) = 'Admin'
    and exists (
      select 1
      from public.event_proposal p
      where p.proposal_id = proposal_schedule.proposal_id
        and p.approval_status <> 'Draft'
    )
  )
);

drop policy if exists rbac_select on public.proposal_review;
create policy rbac_select on public.proposal_review
for select to authenticated
using (
  (
    (select private.app_role()) = 'Student Organization'
    and private.owns_proposal(proposal_id::text)
  )
  or (
    (select private.app_role()) = 'Admin'
    and exists (
      select 1
      from public.event_proposal p
      where p.proposal_id = proposal_review.proposal_id
        and p.approval_status <> 'Draft'
    )
  )
);
