/**
 * AI Prompt Builder
 * Constructs system prompts for content generation with Sonance brand voice
 */

import { DontSayRule } from './guardrails';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  tone?: string;
  audience?: string;
}

export interface Platform {
  id: string;
  name: string;
  constraints?: {
    max_chars?: number;
    max_words?: number;
    format?: string;
    hashtags?: boolean;
    emojis?: boolean;
    links?: boolean;
    [key: string]: any;
  };
}

export interface ContentType {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  specs?: Record<string, any>;
  category?: string;
  [key: string]: any;
}

export interface PromptParams {
  channel: Channel;
  platform: Platform;
  contentType: ContentType;
  dontSayRules: DontSayRule[];
  product?: Product;
  brief: string;
}

const BRAND_VOICE = `## Sonance Brand Voice

You are writing for Sonance, a premium architectural audio brand. Our voice is:

- **Sophisticated but not stuffy**: Write with intelligence and refinement, but remain approachable and human. Avoid overly formal or academic language.

- **Technical precision without jargon**: Use accurate technical terms when necessary, but always make them accessible. Explain complex concepts clearly without dumbing them down.

- **Aspirational yet accessible**: Inspire without alienating. Show what's possible while making it feel attainable. Balance aspiration with practical value.

- **Confidence without arrogance**: Be authoritative and assured, but never condescending. Show expertise through substance, not swagger.

### What to Avoid:
- Consumer-grade comparisons (e.g., "better than standard speakers")
- Vague superlatives without substance (e.g., "the best," "incredible," "amazing")
- Spec dumps without context or meaning
- Price focus or value claims
- Unverified claims or exaggerations
- Hype or marketing speak that feels forced

### What to Embrace:
- Precise, meaningful language
- Context that brings technical details to life
- Storytelling that connects product to experience
- Respect for the reader's intelligence
- Authenticity over hyperbole`;

/**
 * Build a complete system prompt for content generation
 */
export function buildSystemPrompt(params: PromptParams): string {
  const sections: string[] = [];

  // 1. Brand Voice
  sections.push(BRAND_VOICE);

  // 2. Channel Context
  sections.push(buildChannelSection(params.channel));

  // 3. Platform Constraints
  sections.push(buildPlatformSection(params.platform));

  // 4. Content Type Guidance
  sections.push(buildContentTypeSection(params.contentType));

  // 5. Guardrails
  if (params.dontSayRules.length > 0) {
    sections.push(buildGuardrailsSection(params.dontSayRules));
  }

  // 6. Product Context (if provided)
  if (params.product) {
    sections.push(buildProductSection(params.product));
  }

  // 7. User Brief
  sections.push(buildBriefSection(params.brief));

  return sections.join('\n\n---\n\n');
}

function buildChannelSection(channel: Channel): string {
  let section = `## Channel: ${channel.name}`;

  if (channel.description) {
    section += `\n\n${channel.description}`;
  }

  if (channel.tone || channel.audience) {
    section += '\n\n### Channel Guidelines:';
    if (channel.tone) {
      section += `\n- **Tone**: ${channel.tone}`;
    }
    if (channel.audience) {
      section += `\n- **Audience**: ${channel.audience}`;
    }
  }

  return section;
}

function buildPlatformSection(platform: Platform): string {
  let section = `## Platform: ${platform.name}`;

  if (platform.constraints) {
    const c = platform.constraints;
    section += '\n\n### Platform Requirements:';

    if (c.max_chars) {
      section += `\n- **Character limit**: ${c.max_chars} characters maximum`;
    }
    if (c.max_words) {
      section += `\n- **Word limit**: ${c.max_words} words maximum`;
    }
    if (c.format) {
      section += `\n- **Format**: ${c.format}`;
    }
    if (typeof c.hashtags === 'boolean') {
      section += `\n- **Hashtags**: ${c.hashtags ? 'Encouraged' : 'Avoid'}`;
    }
    if (typeof c.emojis === 'boolean') {
      section += `\n- **Emojis**: ${c.emojis ? 'Allowed' : 'Avoid'}`;
    }
    if (typeof c.links === 'boolean') {
      section += `\n- **Links**: ${c.links ? 'Allowed' : 'Avoid'}`;
    }

    // Include any other constraints as key-value pairs
    const standardKeys = ['max_chars', 'max_words', 'format', 'hashtags', 'emojis', 'links'];
    const otherConstraints = Object.entries(c)
      .filter(([key]) => !standardKeys.includes(key))
      .map(([key, value]) => `- **${key}**: ${value}`)
      .join('\n');

    if (otherConstraints) {
      section += `\n${otherConstraints}`;
    }
  }

  return section;
}

function buildContentTypeSection(contentType: ContentType): string {
  let section = `## Content Type: ${contentType.name}`;

  if (contentType.description) {
    section += `\n\n${contentType.description}`;
  }

  return section;
}

function buildGuardrailsSection(rules: DontSayRule[]): string {
  const activeRules = rules.filter((r) => r.active);
  
  let section = '## Content Guardrails\n\n';
  section += '**IMPORTANT**: The following terms and phrases must be avoided in your content:\n\n';

  for (const rule of activeRules) {
    section += `- ❌ **"${rule.term}"**`;
    if (rule.suggestion) {
      section += ` → Instead: ${rule.suggestion}`;
    }
    if (rule.severity === 'error') {
      section += ' (CRITICAL - never use)';
    }
    section += '\n';
  }

  return section;
}

function buildProductSection(product: Product): string {
  let section = `## Product Context: ${product.name}`;

  if (product.description) {
    section += `\n\n${product.description}`;
  }

  if (product.category) {
    section += `\n\n**Category**: ${product.category}`;
  }

  if (product.specs && Object.keys(product.specs).length > 0) {
    section += '\n\n### Key Specifications:';
    for (const [key, value] of Object.entries(product.specs)) {
      if (value != null) {
        section += `\n- **${key}**: ${value}`;
      }
    }
  }

  return section;
}

function buildBriefSection(brief: string): string {
  return `## Content Brief\n\n${brief.trim()}\n\n---\n\n**Now generate the content following all the guidelines above.**`;
}
