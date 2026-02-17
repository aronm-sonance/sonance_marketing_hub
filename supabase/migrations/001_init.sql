-- Sonance Marketing Hub
-- Initial schema (Phase 1)

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.app_role as enum ('admin','brand-marketer','channel-lead','creator','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('active','inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.channel_member_role as enum ('creator','approver','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum ('draft','pending','changes_requested','approved','scheduled','published');
exception when duplicate_object then null; end $$;

-- Updated-at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'viewer',
  status public.user_status not null default 'active',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_email_unique on public.profiles (lower(email));
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- channels
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color_hex text,
  voice_foundation text,
  voice_attributes jsonb not null default '[]'::jsonb,
  we_say text[] not null default array[]::text[],
  we_dont_say text[] not null default array[]::text[],
  visual_scenes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger channels_set_updated_at before update on public.channels
  for each row execute function public.set_updated_at();

-- channel_members
create table if not exists public.channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.channel_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (channel_id, profile_id)
);
create index if not exists channel_members_profile_id_idx on public.channel_members(profile_id);
create index if not exists channel_members_channel_id_idx on public.channel_members(channel_id);

-- platforms
create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  constraints jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists platforms_slug_unique on public.platforms (lower(slug));
create trigger platforms_set_updated_at before update on public.platforms
  for each row execute function public.set_updated_at();

-- content_types
create table if not exists public.content_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  template_prompt text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists content_types_slug_unique on public.content_types (lower(slug));

-- posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete restrict,
  platform_id uuid not null references public.platforms(id) on delete restrict,
  content_type_id uuid not null references public.content_types(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text,
  content text,
  image_url text,
  status public.post_status not null default 'draft',
  publish_date timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_channel_id_idx on public.posts(channel_id);
create index if not exists posts_status_idx on public.posts(status);
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- post_status_log
create table if not exists public.post_status_log (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  from_status public.post_status,
  to_status public.post_status not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists post_status_log_post_id_idx on public.post_status_log(post_id);

-- assets
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  source text not null default 'upload',
  salsify_id text,
  salsify_field text,
  tags text[] not null default array[]::text[],
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assets_tags_gin on public.assets using gin (tags);

-- global_dont_say
create table if not exists public.global_dont_say (
  id uuid primary key default gen_random_uuid(),
  phrase text not null,
  rationale text,
  category text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists global_dont_say_phrase_unique on public.global_dont_say (lower(phrase));

-- notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  post_id uuid references public.posts(id) on delete set null,
  read boolean not null default false,
  emailed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_unread_idx on public.notifications(recipient_id, read);

-- ai_usage_log
create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  channel_id uuid references public.channels(id) on delete set null,
  task_type text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  escalated boolean not null default false,
  cost_estimate_usd numeric(10,6),
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_log_created_at_idx on public.ai_usage_log(created_at);

-- manual_metrics
create table if not exists public.manual_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete restrict,
  date date not null,
  impressions integer,
  engagements integer,
  clicks integer,
  shares integer,
  comments_count integer,
  other jsonb not null default '{}'::jsonb,
  entered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (post_id, platform_id, date)
);

-- workshop_sessions
create table if not exists public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  title text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger workshop_sessions_set_updated_at before update on public.workshop_sessions
  for each row execute function public.set_updated_at();

-- brand_snapshots
create table if not exists public.brand_snapshots (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  content text not null,
  scraped_at timestamptz not null default now(),
  checksum text,
  unique (page_slug)
);

-- Storage bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('marketing-assets', 'marketing-assets', false)
on conflict (id) do nothing;

-- RLS enable
alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.platforms enable row level security;
alter table public.content_types enable row level security;
alter table public.posts enable row level security;
alter table public.post_status_log enable row level security;
alter table public.assets enable row level security;
alter table public.global_dont_say enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_usage_log enable row level security;
alter table public.manual_metrics enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.brand_snapshots enable row level security;

-- Helper: is admin
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.profiles p where p.id = uid and p.role = 'admin' and p.status = 'active'
  );
$$;

-- Policies (minimal viable set for Phase 1)

-- profiles: users can read self; admins can read all; admins can update all
create policy "profiles_read_self" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_read_admin" on public.profiles
  for select using (public.is_admin(auth.uid()));
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin(auth.uid()));

-- channels: admin CRUD; members read
create policy "channels_read_member" on public.channels
  for select using (
    public.is_admin(auth.uid())
    or exists(select 1 from public.channel_members cm where cm.channel_id = channels.id and cm.profile_id = auth.uid())
  );
create policy "channels_admin_write" on public.channels
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- channel_members: admin CRUD; members read their own rows
create policy "channel_members_read_self" on public.channel_members
  for select using (profile_id = auth.uid() or public.is_admin(auth.uid()));
create policy "channel_members_admin_write" on public.channel_members
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- platforms: read all; admin write
create policy "platforms_read_all" on public.platforms
  for select using (auth.role() = 'authenticated');
create policy "platforms_admin_write" on public.platforms
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- content_types: read all; admin write
create policy "content_types_read_all" on public.content_types
  for select using (auth.role() = 'authenticated');
create policy "content_types_admin_write" on public.content_types
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- posts: members can read; creators can write their own drafts; admins all
create policy "posts_read_member" on public.posts
  for select using (
    public.is_admin(auth.uid())
    or exists(select 1 from public.channel_members cm where cm.channel_id = posts.channel_id and cm.profile_id = auth.uid())
  );
create policy "posts_write_author" on public.posts
  for insert with check (
    exists(select 1 from public.channel_members cm where cm.channel_id = posts.channel_id and cm.profile_id = auth.uid() and cm.role in ('creator','approver'))
    and author_id = auth.uid()
  );
create policy "posts_update_author" on public.posts
  for update using (author_id = auth.uid() or public.is_admin(auth.uid()));

-- assets: members read; admin write (tighten later)
create policy "assets_read_member" on public.assets
  for select using (auth.role() = 'authenticated');
create policy "assets_admin_write" on public.assets
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- global_dont_say: read all; admin write
create policy "global_dont_say_read_all" on public.global_dont_say
  for select using (auth.role() = 'authenticated');
create policy "global_dont_say_admin_write" on public.global_dont_say
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- notifications: recipient read/update; admin read
create policy "notifications_read_recipient" on public.notifications
  for select using (recipient_id = auth.uid() or public.is_admin(auth.uid()));
create policy "notifications_update_recipient" on public.notifications
  for update using (recipient_id = auth.uid() or public.is_admin(auth.uid()));
create policy "notifications_insert_admin" on public.notifications
  for insert with check (public.is_admin(auth.uid()));

-- ai_usage_log: insert self; admin read
create policy "ai_usage_log_insert_self" on public.ai_usage_log
  for insert with check (user_id = auth.uid());
create policy "ai_usage_log_read_admin" on public.ai_usage_log
  for select using (public.is_admin(auth.uid()));

-- manual_metrics: admin all; members read
create policy "manual_metrics_read_member" on public.manual_metrics
  for select using (auth.role() = 'authenticated');
create policy "manual_metrics_admin_write" on public.manual_metrics
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- workshop_sessions: owner CRUD; admin read
create policy "workshop_sessions_owner" on public.workshop_sessions
  for all using (owner_id = auth.uid() or public.is_admin(auth.uid()))
  with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

-- brand_snapshots: read all; admin write
create policy "brand_snapshots_read_all" on public.brand_snapshots
  for select using (auth.role() = 'authenticated');
create policy "brand_snapshots_admin_write" on public.brand_snapshots
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Seed platforms (idempotent)
insert into public.platforms (name, slug, constraints)
values
  ('LinkedIn','linkedin','{}'::jsonb),
  ('Instagram','instagram','{}'::jsonb),
  ('Facebook','facebook','{}'::jsonb),
  ('Email','email','{}'::jsonb),
  ('YouTube','youtube','{}'::jsonb)
on conflict (lower(slug)) do nothing;
