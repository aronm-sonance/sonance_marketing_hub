-- Seed initial channels (idempotent)
INSERT INTO public.channels (name, description, color_hex)
SELECT name, description, color_hex FROM (VALUES
  ('Residential', 'Luxury residential audio', '#00BCD4'),
  ('Professional', 'Commercial/professional integrators', '#FF9800'),
  ('Enterprise', 'Enterprise and corporate', '#9C27B0'),
  ('Marine', 'Marine audio solutions', '#2196F3'),
  ('Green', 'Sustainability and green initiatives', '#4CAF50'),
  ('Production Build', 'Internal production content', '#607D8B')
) AS seed(name, description, color_hex)
WHERE NOT EXISTS (SELECT 1 FROM public.channels c WHERE c.name = seed.name);
