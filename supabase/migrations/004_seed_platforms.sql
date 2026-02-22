-- Seed initial platforms (idempotent)
INSERT INTO public.platforms (name, slug, constraints, enabled)
SELECT name, slug, constraints::jsonb, enabled FROM (VALUES
  ('LinkedIn', 'linkedin', '{"max_text_length": 3000, "max_hashtags": 30, "supports_images": true, "supports_video": true, "max_images": 9, "optimal_image_size": "1200x627"}', true),
  ('Instagram', 'instagram', '{"max_text_length": 2200, "max_hashtags": 30, "supports_images": true, "supports_video": true, "supports_carousel": true, "optimal_image_size": "1080x1080", "video_max_duration_seconds": 60}', true),
  ('Facebook', 'facebook', '{"max_text_length": 63206, "supports_images": true, "supports_video": true, "optimal_image_size": "1200x630", "recommended_text_length": 250}', true),
  ('Email', 'email', '{"subject_max_length": 100, "supports_html": true, "supports_images": true, "optimal_preview_length": 50}', true),
  ('YouTube', 'youtube', '{"title_max_length": 100, "description_max_length": 5000, "supports_video": true, "supports_community_posts": true, "tags_max": 15}', true)
) AS seed(name, slug, constraints, enabled)
WHERE NOT EXISTS (SELECT 1 FROM public.platforms p WHERE lower(p.slug) = lower(seed.slug));
