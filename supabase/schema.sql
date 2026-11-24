-- Acme grant dashboard schema.
-- Safe to run more than once.

do $$ begin
  create type opportunity_status as enum (
    'new',
    'reviewing',
    'qualified',
    'rejected',
    'applied',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type review_status as enum (
    'pending',
    'approved',
    'rejected'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type recommendation as enum (
    'pursue',
    'review',
    'pass'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  notice_id text unique not null,
  title text not null,
  description text,
  solicitation_number text,
  agency text,
  naics_code text,
  opportunity_type text,
  posted_date timestamptz,
  response_deadline timestamptz,
  set_aside text,
  sam_url text,
  raw_data jsonb default '{}',
  source text default 'sam.gov',
  archived_at timestamptz,
  status opportunity_status default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references opportunities(id) on delete cascade not null,
  fit_score integer check (fit_score >= 0 and fit_score <= 100),
  recommendation recommendation not null,
  summary text,
  strengths text[],
  concerns text[],
  stage integer default 1 check (stage in (1, 2)),
  raw_response jsonb,
  created_at timestamptz default now()
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references opportunities(id) on delete cascade not null unique,
  reason text not null,
  status review_status default 'pending',
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_opportunities_status on opportunities(status);
create index if not exists idx_opportunities_source on opportunities(source);
create index if not exists idx_opportunities_archived_at on opportunities(archived_at desc);
create index if not exists idx_opportunities_posted_date on opportunities(posted_date desc);
create index if not exists idx_opportunities_naics on opportunities(naics_code);
create index if not exists idx_evaluations_opportunity on evaluations(opportunity_id);
create index if not exists idx_review_queue_status on review_queue(status);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists opportunities_updated_at on opportunities;
create trigger opportunities_updated_at
  before update on opportunities
  for each row execute function update_updated_at();
