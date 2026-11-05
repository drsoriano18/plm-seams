select public.save_proposal_draft(
  '{"event_name":"Test Draft","eligibility_mode":"University-Wide"}'::jsonb,
  '[]'::jsonb,
  null
);