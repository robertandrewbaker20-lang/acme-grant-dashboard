-- Archive tracking (run once in Supabase SQL Editor)
alter table opportunities add column if not exists archived_at timestamptz;

create index if not exists idx_opportunities_archived_at on opportunities(archived_at desc);