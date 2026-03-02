-- Global Brand Voice
-- Master brand voice settings for Sonance

create table if not exists public.brand_voice (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  voice_foundation text,
  voice_attributes jsonb not null default '[]'::jsonb,
  we_say text[] not null default array[]::text[],
  we_dont_say text[] not null default array[]::text[],
  tone_modulations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at trigger
create trigger brand_voice_set_updated_at 
  before update on public.brand_voice
  for each row execute function public.set_updated_at();

-- RLS policies
alter table public.brand_voice enable row level security;

-- All authenticated users can read
create policy "brand_voice_read_all" on public.brand_voice
  for select using (auth.role() = 'authenticated');

-- Admins can write
create policy "brand_voice_admin_write" on public.brand_voice
  for all using (public.is_admin(auth.uid())) 
  with check (public.is_admin(auth.uid()));

-- Seed master Sonance brand voice
insert into public.brand_voice (key, name, voice_foundation, voice_attributes, we_say, we_dont_say, tone_modulations)
values (
  'sonance-master',
  'Sonance Master Brand Voice',
  'Sonance speaks with confident expertise that empowers rather than overwhelms. We''re the trusted partner who elevates experiences through audio that''s felt, not seen—blending technical mastery with an understanding of how people actually live.',
  '[
    {
      "name": "Expert Without Ego",
      "description": "We lead from deep knowledge, not superiority. We share insights generously, making complex audio engineering understandable without talking down."
    },
    {
      "name": "Inviting, Not Institutional",
      "description": "Professional doesn''t mean stiff. We''re approachable experts who understand that great audio serves life''s moments—from morning coffee to movie nights."
    },
    {
      "name": "Purposeful and Clear",
      "description": "Every word earns its place. We respect our audience''s time with direct, benefit-focused communication that tells them what they need to know."
    },
    {
      "name": "Forward-Thinking Partner",
      "description": "We''re not just selling products—we''re advancing the industry. We speak as collaborators invested in our dealers'' success and homeowners'' satisfaction."
    }
  ]'::jsonb,
  array[
    'Designed to disappear',
    'Architectural audio',
    'Premium performance',
    'Invisible integration',
    'Precision engineering',
    'Immersive experience',
    'Seamless installation',
    'Tested in the field',
    'Acoustic comfort',
    'Custom integrator'
  ]::text[],
  array[
    'Hidden speakers',
    'Luxury audio',
    'Cutting-edge',
    'Bleeding-edge',
    'Game-changer',
    'Revolutionary',
    'World-class',
    'Premium quality',
    'Cheap',
    'Budget',
    'Installation (use integration)'
  ]::text[],
  '[
    {
      "context": "Technical Documentation",
      "shift": "Precision, clarity, no marketing fluff"
    },
    {
      "context": "Sales Enablement",
      "shift": "Consultative, solution-oriented, ROI-focused"
    },
    {
      "context": "End-User Facing",
      "shift": "Aspirational, lifestyle-driven, emotion over spec"
    },
    {
      "context": "Internal Strategy",
      "shift": "Candid, data-informed, action-oriented"
    }
  ]'::jsonb
)
on conflict (key) do nothing;
