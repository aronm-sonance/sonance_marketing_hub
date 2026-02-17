# Sonance Marketing Hub — Execution Spec

## Overview
Centralized command center for brand-aligned content generation. Multi-modal GenAI (Google Gemini) transforms brand guidelines, corporate identity, and product assets into platform-specific marketing content.

**Stack:** Next.js (App Router) + Vercel + Supabase + Resend + Google Gemini
**Source:** GitHub (`sonance/marketing-hub`)
**Auth:** Email/password (Supabase Auth)
**Initial Admin:** Aron McKay

---

## Decisions Log

| # | Decision | Detail |
|---|----------|--------|
| 1 | No Teams | Web-only for now |
| 2 | Auth | Email/password, admin-only user creation |
| 3 | Platforms v1 | LinkedIn, Instagram, Facebook, Email, YouTube (admin CRUD) |
| 4 | Content types | Structured, admin CRUD |
| 5 | Approvals | Admin + channel-specific approvers; in-app + email notifications |
| 6 | Assets | Salsify import (read-only) + user upload + AI generation |
| 7 | Brand snapshot | Snapshot guidelines, periodic scrape to keep fresh |
| 8 | UI | Sonance design system (colors, Montserrat, components from brand.sonance.com) |
| 9 | Global guardrails | "Don't say" repository |
| 10 | Data retention | Store only final content (no prompts/intermediates) |
| 11 | AI budgets | Logging only to start |
| 12 | Analytics | Manual entry + internal workflow metrics |
| 13 | Email provider | Resend |
| 14 | Username | = email address |
| 15 | Channel membership | `channel_members` table (per-channel assignment) |
| 16 | Salsify fields | Images: `hero_product_image`, `product_image`, `lifestyle_image`. Copy: `sku`, `product_model`, `product_model_long`, `25_word_description`, `50_word_description`, `100_word_description` |

---

## Database Schema

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | References auth.users |
| email | text | Login email |
| full_name | text | Display name |
| role | text | `admin`, `brand-marketer`, `channel-lead`, `creator`, `viewer` |
| status | text | `active`, `inactive` |
| avatar_url | text | Profile image URL |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### channels
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| name | text | Channel display name |
| description | text | Channel purpose |
| color_hex | text | Brand color for UI theming |
| voice_foundation | text | Core brand voice description |
| voice_attributes | jsonb | Array of {name, description, sounds_like[], avoid[]} |
| we_say | text[] | Approved phrases |
| we_dont_say | text[] | Prohibited phrases (channel-level) |
| visual_scenes | jsonb | Array of {id, name, description, looks_like[], excludes[]} |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### channel_members
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| channel_id | uuid (fk) | References channels |
| profile_id | uuid (fk) | References profiles |
| role | text | `creator`, `approver`, `viewer` |
| created_at | timestamptz | |
| UNIQUE | | (channel_id, profile_id) |

### platforms
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| name | text | e.g., `LinkedIn` |
| slug | text | e.g., `linkedin` (unique) |
| constraints | jsonb | {char_limit, hashtag_limit, image_specs, cta_rules, etc.} |
| enabled | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Seed: LinkedIn, Instagram, Facebook, Email, YouTube

### content_types
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| name | text | e.g., `Product Launch`, `Dealer Promo` |
| slug | text | Unique |
| description | text | |
| template_prompt | text | Optional default prompt template |
| enabled | boolean | Default true |
| created_at | timestamptz | |

Admin CRUD.

### posts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| channel_id | uuid (fk) | References channels |
| platform_id | uuid (fk) | References platforms |
| content_type_id | uuid (fk) | References content_types |
| author_id | uuid (fk) | References profiles |
| title | text | Post title / headline |
| content | text | Final body content (markdown) |
| image_url | text | Primary image URL |
| status | text | `draft`, `pending`, `changes_requested`, `approved`, `scheduled`, `published` |
| publish_date | timestamptz | Scheduled or actual |
| metadata | jsonb | GenAI scores, hashtags, final revision notes |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### post_status_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| post_id | uuid (fk) | References posts |
| from_status | text | Previous status |
| to_status | text | New status |
| changed_by | uuid (fk) | References profiles |
| comment | text | Optional note (e.g., approval feedback) |
| created_at | timestamptz | |

### assets
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| name | text | File display name |
| storage_path | text | Path in Supabase Storage bucket |
| source | text | `upload`, `salsify`, `ai_generated` |
| salsify_id | text | Salsify product ID (if source=salsify) |
| salsify_field | text | Which field (hero_product_image, etc.) |
| tags | text[] | Searchable tags |
| uploaded_by | uuid (fk) | References profiles |
| created_at | timestamptz | |

### global_dont_say
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| phrase | text | Prohibited term or phrase |
| rationale | text | Why it's prohibited |
| category | text | Optional grouping (legal, competitive, brand) |
| created_by | uuid (fk) | References profiles |
| created_at | timestamptz | |

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| recipient_id | uuid (fk) | References profiles |
| type | text | `approval_requested`, `approved`, `changes_requested`, `published`, etc. |
| title | text | Short summary |
| body | text | Detail message |
| post_id | uuid (fk) | Related post (nullable) |
| read | boolean | Default false |
| emailed | boolean | Whether email was sent |
| created_at | timestamptz | |

### ai_usage_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| user_id | uuid (fk) | References profiles |
| channel_id | uuid (fk, nullable) | |
| task_type | text | `social_draft`, `voice_check`, `image_gen`, etc. |
| model | text | Actual model used |
| input_tokens | integer | |
| output_tokens | integer | |
| latency_ms | integer | |
| escalated | boolean | Flash → Pro escalation |
| cost_estimate_usd | numeric(10,6) | |
| created_at | timestamptz | |

### manual_metrics
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| post_id | uuid (fk) | References posts |
| platform_id | uuid (fk) | References platforms |
| date | date | Metric date |
| impressions | integer | |
| engagements | integer | |
| clicks | integer | |
| shares | integer | |
| comments_count | integer | |
| other | jsonb | Flexible additional metrics |
| entered_by | uuid (fk) | References profiles |
| created_at | timestamptz | |

### workshop_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| owner_id | uuid (fk) | References profiles |
| channel_id | uuid (fk, nullable) | Optional channel context |
| title | text | Session name |
| status | text | `active`, `archived` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Note: workshop chat messages are ephemeral (client-side only per data retention decision). Only the session metadata and any finalized output (saved as a post draft) persists.

### brand_snapshots
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | |
| page_slug | text | e.g., `colors`, `typography`, `guidelines` |
| content | text | Scraped markdown content |
| scraped_at | timestamptz | |
| checksum | text | Content hash for change detection |

---

## RLS Policy Summary

| Table | Admin | Creator (in channel) | Approver (in channel) | Viewer |
|-------|-------|---------------------|----------------------|--------|
| profiles | full CRUD | read own + channel members | read own + channel members | read own |
| channels | full CRUD | read assigned | read assigned | read assigned |
| channel_members | full CRUD | read own channels | read own channels | read own |
| platforms | full CRUD | read | read | read |
| content_types | full CRUD | read | read | read |
| posts | full CRUD | CRUD own in assigned channels | read + update status in assigned channels | read approved/published |
| post_status_log | read all | read own channel posts | read + insert in assigned channels | — |
| assets | full CRUD | CRUD | read | read |
| global_dont_say | full CRUD | read | read | read |
| notifications | full CRUD | read/update own | read/update own | read/update own |
| ai_usage_log | read all | insert + read own | — | — |
| manual_metrics | full CRUD | insert + read own channel posts | read own channel posts | — |
| workshop_sessions | full CRUD | CRUD own | read assigned channel | — |
| brand_snapshots | full CRUD | read | read | read |

---

## Salsify Integration (Read-Only)

### Image Assets
Browse/search Salsify products and import images into Hub:
- Fields: `hero_product_image`, `product_image`, `lifestyle_image`
- On import: download from Salsify digital asset URL → upload to Supabase Storage → create `assets` row with `source=salsify`
- Never write to Salsify

### Copy/Text Assets
Pull product copy for content generation context:
- Fields: `sku`, `product_model`, `product_model_long`, `25_word_description`, `50_word_description`, `100_word_description`
- Used as AI generation context (passed to Gemini, not stored separately)
- Product browser UI for selecting products to include in content

### API Pattern
```
GET https://app.salsify.com/api/v1/products
  ?access_token={SALSIFY_TOKEN}
  &filter=<field filter>
  &per_page=50
```
Cursor-paginated. Server-side only (Edge Function proxy).

---

## Page Map

### Public
- `/login` — email/password sign-in

### App (authenticated)
- `/` — Dashboard (recent posts, pending approvals, quick stats)
- `/studio` — Content Studio (generate + edit + voice check)
- `/studio/[postId]` — Edit existing post
- `/workshop` — Creative Workshop sessions list
- `/workshop/[sessionId]` — Chat session
- `/library` — Content Library (all posts, filter by status/channel/platform)
- `/assets` — Asset Library (upload, Salsify import, AI-generated)
- `/assets/salsify` — Salsify browser/importer
- `/analytics` — Workflow metrics + manual performance entry
- `/notifications` — Notification center

### Admin (`/admin/...`)
- `/admin/users` — User management (invite, assign roles)
- `/admin/channels` — Channel CRUD + member/approver assignment
- `/admin/platforms` — Platform CRUD + constraints config
- `/admin/content-types` — Content type CRUD
- `/admin/dont-say` — Global "don't say" repository
- `/admin/brand` — Brand snapshot viewer + refresh trigger
- `/admin/ai-usage` — AI usage log dashboard

---

## API Routes

### Auth
- `POST /api/auth/signup` — Admin-only user creation
- `POST /api/auth/reset-password` — Password reset (Resend email)

### AI (Edge Functions)
- `POST /api/ai/generate` — Content generation (model router selects tier)
- `POST /api/ai/voice-check` — Brand voice scoring
- `POST /api/ai/image` — Image generation
- `POST /api/ai/workshop` — Creative Workshop chat (streaming)

### Salsify (server-side proxy)
- `GET /api/salsify/products` — Search/browse products
- `GET /api/salsify/products/[id]` — Product detail + assets
- `POST /api/salsify/import-asset` — Download asset → Supabase Storage

### Notifications
- `POST /api/notifications/send` — Create notification + send email via Resend
- `PATCH /api/notifications/[id]/read` — Mark as read

### Brand Snapshot
- `POST /api/brand/refresh` — Trigger scrape (admin-only, also called by cron)

---

## Notification Events + Email

| Event | In-App | Email (Resend) | Recipients |
|-------|--------|----------------|------------|
| Post submitted for approval | ✅ | ✅ | Channel approvers + admins |
| Post approved | ✅ | ✅ | Post author |
| Changes requested | ✅ | ✅ | Post author |
| Post published | ✅ | ❌ | Channel members |
| New asset uploaded | ✅ | ❌ | Channel members |
| User invited | ❌ | ✅ | New user (welcome + set password) |
| Password reset | ❌ | ✅ | Requesting user |

---

## AI Model Router

| Task | Model | Tier |
|------|-------|------|
| Social post drafts (short-form) | gemini-3-flash-preview | Flash |
| Hashtag/tag generation | gemini-3-flash-preview | Flash |
| Brand voice scoring | gemini-3-flash-preview | Flash |
| Content variations (bulk) | gemini-3-flash-preview | Flash |
| Metadata extraction | gemini-3-flash-preview | Flash |
| Long-form content | gemini-3-pro-preview | Pro |
| Creative Workshop chat | gemini-3-pro-preview | Pro |
| Multi-channel repurposing | gemini-3-pro-preview | Pro |
| Strategy alignment | gemini-3-pro-preview | Pro |
| Quick image gen / drafts | gemini-2.5-flash-image | Image |
| High-fidelity hero images | gemini-3-pro-image-preview | Image |
| Iterative image editing | gemini-2.5-flash-image | Image |

Auto-escalation: Flash → Pro on low-confidence results (1 retry max, logged).

---

## Implementation Phases

### Phase 1 — Foundation (Week 1–2)
- [ ] Init Next.js App Router repo
- [ ] Supabase project + all migrations (14 tables)
- [ ] RLS policies + integration tests
- [ ] Supabase Auth (email/password)
- [ ] Seed Aron as admin
- [ ] Seed 5 platforms (LinkedIn, Instagram, Facebook, Email, YouTube)
- [ ] Admin pages: Users, Channels, Platforms, Content Types, Don't Say
- [ ] Sonance UI: Sidebar layout, Navbar, dark theme, Montserrat
- [ ] Resend integration (user invite + password reset emails)
- [ ] Basic notification system (in-app)

### Phase 2 — Workflow (Week 3)
- [ ] Post CRUD + status lifecycle
- [ ] `post_status_log` audit trail
- [ ] Approval workflow (channel approvers gate)
- [ ] Content Library with filters (status, channel, platform, date)
- [ ] Notification triggers (approval requested/approved/changes requested)
- [ ] Email notifications via Resend for approval events

### Phase 3 — AI Core (Week 4–5)
- [ ] `lib/ai/model-router.ts` (single source of truth)
- [ ] Vercel AI SDK + Gemini Edge Function routes
- [ ] Content Studio: generate + variants + platform-aware
- [ ] Brand Voice Checker with structured scoring
- [ ] Creative Workshop (streaming chat, ephemeral, save-to-draft)
- [ ] `ai_usage_log` tracking (all calls)
- [ ] Global "don't say" enforcement in generation prompts
- [ ] Final-content-only storage (no prompts/intermediates persisted)

### Phase 4 — Assets + Salsify (Week 6)
- [ ] Supabase Storage bucket `marketing-assets`
- [ ] Asset Library (upload, tag, search)
- [ ] Salsify product browser (server-side proxy)
- [ ] Salsify image import (download → Storage → assets row)
- [ ] Salsify copy fields as AI context in Content Studio
- [ ] AI image generation pipeline
- [ ] Attach assets to posts

### Phase 5 — Analytics + Brand Snapshot (Week 7)
- [ ] Manual metrics entry per post
- [ ] Workflow analytics dashboard (throughput, approval latency, output volume)
- [ ] AI usage dashboard (admin)
- [ ] Brand snapshot scraper + storage
- [ ] Vercel Cron for periodic brand refresh
- [ ] Admin brand snapshot viewer

---

## Tech Dependencies

| Package | Purpose |
|---------|---------|
| `next` (14+) | App Router framework |
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Server-side Supabase auth |
| `ai` (Vercel AI SDK) | Streaming AI responses |
| `@google/genai` | Gemini API client |
| `resend` | Transactional email |
| `tailwindcss` | Styling (with Sonance design tokens) |
| `@radix-ui/*` | Headless UI primitives (underlying Sonance components) |
| `react-hook-form` + `zod` | Form validation |
| `date-fns` | Date formatting |
| `lucide-react` | Icons |
