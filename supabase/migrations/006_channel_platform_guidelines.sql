-- Channel Platform Guidelines
-- Links channels to platforms with specific tone, content approach, and best practices

create table if not exists public.channel_platform_guidelines (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  tone_adjustment text,
  content_approach text,
  optimal_content_mix jsonb not null default '[]'::jsonb,
  best_practices text[] not null default array[]::text[],
  avoid text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_id, platform_id)
);

-- Index for lookups
create index if not exists channel_platform_guidelines_channel_id_idx 
  on public.channel_platform_guidelines(channel_id);
create index if not exists channel_platform_guidelines_platform_id_idx 
  on public.channel_platform_guidelines(platform_id);

-- Updated-at trigger
create trigger channel_platform_guidelines_set_updated_at 
  before update on public.channel_platform_guidelines
  for each row execute function public.set_updated_at();

-- RLS policies
alter table public.channel_platform_guidelines enable row level security;

-- Members of channel can read
create policy "channel_platform_guidelines_read_member" on public.channel_platform_guidelines
  for select using (
    public.is_admin(auth.uid())
    or exists(
      select 1 from public.channel_members cm 
      where cm.channel_id = channel_platform_guidelines.channel_id 
      and cm.profile_id = auth.uid()
    )
  );

-- Admins can write
create policy "channel_platform_guidelines_admin_write" on public.channel_platform_guidelines
  for all using (public.is_admin(auth.uid())) 
  with check (public.is_admin(auth.uid()));
