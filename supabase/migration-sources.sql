-- Add multi-source tracking (run once in Supabase SQL Editor)
alter table opportunities add column if not exists source text default 'sam.gov';

create index if not exists idx_opportunities_source on opportunities(source);

-- Drop old unique on notice_id if re-running on fresh DB skip this
-- Existing notice_ids remain valid; new records use source-prefixed ids