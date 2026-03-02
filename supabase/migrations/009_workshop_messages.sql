-- Workshop messages for creative chat history
create table if not exists public.workshop_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workshop_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists workshop_messages_session_idx on public.workshop_messages(session_id, created_at);

-- RLS
alter table public.workshop_messages enable row level security;

create policy "workshop_messages_owner" on public.workshop_messages
  for all using (
    exists(select 1 from public.workshop_sessions ws where ws.id = workshop_messages.session_id and (ws.owner_id = auth.uid() or public.is_admin(auth.uid())))
  )
  with check (
    exists(select 1 from public.workshop_sessions ws where ws.id = workshop_messages.session_id and (ws.owner_id = auth.uid() or public.is_admin(auth.uid())))
  );
