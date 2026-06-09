-- SideQuest MVP schema. All tables RLS-protected to the owning user.

-- 1. profiles: per-user settings (1 row per auth user)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  time_zone text not null default 'UTC',
  morning_push_hour int not null default 8,        -- 0..23 local hour
  rhythm_mode text not null default 'morning'      -- 'morning' | 'popup' | 'both'
    check (rhythm_mode in ('morning','popup','both')),
  quests_per_day int not null default 1 check (quests_per_day between 1 and 5),
  enabled_categories text[] not null
    default array['social','body','creative','adventure'],
  enabled_reward_modules text[] not null default array['xp'], -- 'xp' always; 'shop','money'
  current_city text,
  current_lat double precision,
  current_lon double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. quests: one generated quest per day (or popup)
create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_date date not null,                         -- local date key
  title text not null,
  description text not null,
  category text not null
    check (category in ('social','body','creative','adventure')),
  est_minutes int not null,
  xp_value int not null default 10,
  source text not null default 'morning'            -- 'morning' | 'popup'
    check (source in ('morning','popup')),
  status text not null default 'pending'            -- 'pending' | 'done' | 'skipped'
    check (status in ('pending','done','skipped')),
  proof_text text,
  proof_url text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index quests_user_date_idx on public.quests (user_id, quest_date);

-- 3. xp_ledger: append-only XP transactions
create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,                               -- + earned, - spent
  reason text not null,                             -- 'quest_done' | 'redeem' | etc.
  quest_id uuid references public.quests(id) on delete set null,
  created_at timestamptz not null default now()
);
create index xp_ledger_user_idx on public.xp_ledger (user_id);

-- 4. streaks: one row per user
create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_done_date date
);

-- 5. custom_rewards: user-defined reward shop items
create table public.custom_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cost_xp int not null check (cost_xp > 0),
  created_at timestamptz not null default now()
);

-- 6. redemptions: log of reward purchases
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid references public.custom_rewards(id) on delete set null,
  cost_xp int not null,
  created_at timestamptz not null default now()
);

-- 7. money_stakes: manual money-bank ledger (no real payments in MVP)
create table public.money_stakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  outcome text not null default 'open'              -- 'open' | 'won' | 'lost'
    check (outcome in ('open','won','lost')),
  note text,
  created_at timestamptz not null default now()
);

-- 8. mood_checkins: daily mood for personalization
create table public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  mood text not null,                               -- e.g. 'great','good','meh','low'
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- Enable RLS everywhere
alter table public.profiles       enable row level security;
alter table public.quests         enable row level security;
alter table public.xp_ledger      enable row level security;
alter table public.streaks        enable row level security;
alter table public.custom_rewards enable row level security;
alter table public.redemptions    enable row level security;
alter table public.money_stakes   enable row level security;
alter table public.mood_checkins  enable row level security;

-- Owner-only policies (auth.uid() must match the row's user)
create policy "own profile"  on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own quests"   on public.quests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own xp"       on public.xp_ledger
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own streaks"  on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rewards"  on public.custom_rewards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own redemptions" on public.redemptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own stakes"   on public.money_stakes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own moods"    on public.mood_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile + streak row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
