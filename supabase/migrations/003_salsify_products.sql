-- Salsify product cache (no pricing data)
create table if not exists public.salsify_products (
  id text primary key,
  parent_id text,
  hierarchy_level text,
  brand text not null,
  category text,
  sub_category text,
  product_model text,
  product_model_long text,
  sku text,
  description_short text,
  description_medium text,
  description_long text,
  hero_image_url text,
  hero_image_small_url text,
  product_images jsonb default '[]'::jsonb,
  lifestyle_image_url text,
  data_sheets jsonb default '[]'::jsonb,
  sell_sheet_url text,
  spec_sheet_url text,
  cad_files jsonb default '[]'::jsonb,
  manuals jsonb default '[]'::jsonb,
  ease_files jsonb default '[]'::jsonb,
  eq_file_url text,
  install_videos jsonb default '[]'::jsonb,
  video_url text,
  specifications jsonb default '{}'::jsonb,
  features jsonb default '[]'::jsonb,
  product_url text,
  color_finish text,
  type text,
  speaker_aesthetic text,
  speaker_size text,
  warranty text,
  raw_attributes jsonb default '{}'::jsonb,
  salsify_updated_at timestamptz,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salsify_products_brand_idx on public.salsify_products(brand);
create index if not exists salsify_products_category_idx on public.salsify_products(category);
create index if not exists salsify_products_parent_idx on public.salsify_products(parent_id);

alter table public.salsify_products add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(product_model, '') || ' ' ||
      coalesce(product_model_long, '') || ' ' ||
      coalesce(sku, '') || ' ' ||
      coalesce(description_long, '') || ' ' ||
      coalesce(brand, '') || ' ' ||
      coalesce(category, '')
    )
  ) stored;
create index if not exists salsify_products_search_idx on public.salsify_products using gin(search_vector);

create trigger salsify_products_set_updated_at before update on public.salsify_products
  for each row execute function public.set_updated_at();

create table if not exists public.salsify_product_relations (
  id uuid primary key default gen_random_uuid(),
  source_product_id text not null,
  target_product_id text not null,
  relation_type text not null,
  created_at timestamptz not null default now(),
  unique (source_product_id, target_product_id, relation_type)
);
create index if not exists salsify_relations_source_idx on public.salsify_product_relations(source_product_id);
create index if not exists salsify_relations_target_idx on public.salsify_product_relations(target_product_id);

create table if not exists public.salsify_import_log (
  id uuid primary key default gen_random_uuid(),
  filename text,
  products_count integer,
  relations_count integer,
  assets_resolved integer,
  duration_ms integer,
  imported_by text,
  errors jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.salsify_products enable row level security;
alter table public.salsify_product_relations enable row level security;
alter table public.salsify_import_log enable row level security;

create policy "salsify_products_read_all" on public.salsify_products
  for select using (auth.role() = 'authenticated');
create policy "salsify_products_admin_write" on public.salsify_products
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "salsify_relations_read_all" on public.salsify_product_relations
  for select using (auth.role() = 'authenticated');
create policy "salsify_relations_admin_write" on public.salsify_product_relations
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "salsify_import_log_admin" on public.salsify_import_log
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
