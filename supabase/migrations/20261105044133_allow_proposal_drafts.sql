create or replace function private.guard_proposal() returns trigger
language plpgsql set search_path = '' as $$
begin
  if private.app_role()='Student Organization' then
    if new.org_id <> private.app_user_id()
       or new.approval_status not in ('Draft','Pending','Revisions Required') then
      raise exception 'Organizations may only edit their own drafts, pending, or returned proposals' using errcode='42501';
    end if;
    if TG_OP='UPDATE' and (new.org_id is distinct from old.org_id or new.proposal_id is distinct from old.proposal_id) then
      raise exception 'Proposal identity cannot be changed' using errcode='42501';
    end if;
  end if;
  return new;
end $$;
