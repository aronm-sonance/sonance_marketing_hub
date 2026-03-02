/**
 * AI Prompt Builder
 * Constructs system prompts for content generation with Sonance brand voice
 */

import { DontSayRule } from './guardrails';

export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  color_hex?: string | null;
  voice_foundation?: string | null;
  voice_attributes: Array<{ 
    name: string; 
    description: string; 
    sounds_like?: string[]; 
    avoid?: string[] 
  }>;
  we_say: string[];
  we_dont_say: string[];
  visual_scenes: Array<{ 
    name: string; 
    description?: string; 
    looks_like: string | string[]; 
    excludes: string | string[] 
  }>;
}

export interface BrandVoice {
  voice_foundation?: string | null;
  voice_attributes: Array<{ 
    name: string; 
    description: string 
  }>;
  we_say: string[];
  we_dont_say: string[];
  tone_modulations: Array<{ 
    context: string; 
    tone: string; 
    description: string 
  }>;
}

export interface ChannelPlatformGuideline {
  tone_adjustment?: string | null;
  content_approach?: string | null;
  optimal_content_mix: Array<{ 
    type: string; 
    percentage: number 
  }>;
  best_practices: string[];
  avoid: string[];
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
  brandVoice?: BrandVoice;
  platformGuideline?: ChannelPlatformGuideline;
  product?: Product;
  brief: string;
}

/**
 * Build a complete system prompt for content generation
 */
export function buildSystemPrompt(params: PromptParams): string {
  const sections: string[] = [];

  // 1. Global Brand Voice
  if (params.brandVoice) {
    sections.push(buildBrandVoiceSection(params.brandVoice));
  }

  // 2. Channel Voice
  sections.push(buildChannelVoiceSection(params.channel));

  // 3. Platform + Channel-Platform Guidelines
  sections.push(buildPlatformSection(params.platform, params.platformGuideline));

  // 4. Content Type Guidance
  sections.push(buildContentTypeSection(params.contentType));

  // 5. Global Don't Say + Channel We Don't Say (merged guardrails)
  const allDontSay = mergeGuardrails(params.dontSayRules, params.channel.we_dont_say);
  if (allDontSay.length > 0) {
    sections.push(buildGuardrailsSection(allDontSay));
  }

  // 6. Product Context (if provided)
  if (params.product) {
    sections.push(buildProductSection(params.product));
  }

  // 7. User Brief
  sections.push(buildBriefSection(params.brief));

  return sections.join('\n\n---\n\n');
}

function buildBrandVoiceSection(brandVoice: BrandVoice): string {
  let section = '## Sonance Brand Voice\n\n';

  if (brandVoice.voice_foundation) {
    section += `${brandVoice.voice_foundation}\n\n`;
  }

  if (brandVoice.voice_attributes.length > 0) {
    section += '### Voice Attributes:\n\n';
    for (const attr of brandVoice.voice_attributes) {
      section += `- **${attr.name}**: ${attr.description}\n`;
    }
    section += '\n';
  }

  if (brandVoice.tone_modulations.length > 0) {
    section += '### Tone Modulations:\n\n';
    for (const mod of brandVoice.tone_modulations) {
      section += `- **${mod.context}** → ${mod.tone}: ${mod.description}\n`;
    }
    section += '\n';
  }

  if (brandVoice.we_say.length > 0) {
    section += '### Global "We Say":\n\n';
    for (const phrase of brandVoice.we_say) {
      section += `- ✓ ${phrase}\n`;
    }
    section += '\n';
  }

  if (brandVoice.we_dont_say.length > 0) {
    section += '### Global "We Don\'t Say":\n\n';
    for (const phrase of brandVoice.we_dont_say) {
      section += `- ✗ ${phrase}\n`;
    }
  }

  return section.trim();
}

function buildChannelVoiceSection(channel: Channel): string {
  let section = `## Channel: ${channel.name}\n\n`;

  if (channel.description) {
    section += `${channel.description}\n\n`;
  }

  if (channel.voice_foundation) {
    section += `### Channel Voice Foundation:\n\n${channel.voice_foundation}\n\n`;
  }

  if (channel.voice_attributes.length > 0) {
    section += '### Channel Voice Attributes:\n\n';
    for (const attr of channel.voice_attributes) {
      section += `- **${attr.name}**: ${attr.description}\n`;
      
      if (attr.sounds_like && attr.sounds_like.length > 0) {
        section += `  - Sounds like: ${attr.sounds_like.map(s => `"${s}"`).join(', ')}\n`;
      }
      
      if (attr.avoid && attr.avoid.length > 0) {
        section += `  - Avoid: ${attr.avoid.map(a => `"${a}"`).join(', ')}\n`;
      }
    }
    section += '\n';
  }

  if (channel.we_say.length > 0) {
    section += '### Channel "We Say":\n\n';
    for (const phrase of channel.we_say) {
      section += `- ✓ ${phrase}\n`;
    }
    section += '\n';
  }

  if (channel.we_dont_say.length > 0) {
    section += '### Channel "We Don\'t Say":\n\n';
    for (const phrase of channel.we_dont_say) {
      section += `- ✗ ${phrase}\n`;
    }
    section += '\n';
  }

  if (channel.visual_scenes.length > 0) {
    section += '### Visual Scenes:\n\n';
    for (const scene of channel.visual_scenes) {
      section += `- **${scene.name}**`;
      if (scene.description) {
        section += `: ${scene.description}`;
      }
      section += '\n';
      
      const looksLike = Array.isArray(scene.looks_like) ? scene.looks_like : [scene.looks_like];
      if (looksLike.length > 0) {
        section += `  - Looks like: ${looksLike.join(', ')}\n`;
      }
      
      const excludes = Array.isArray(scene.excludes) ? scene.excludes : [scene.excludes];
      if (excludes.length > 0) {
        section += `  - Excludes: ${excludes.join(', ')}\n`;
      }
    }
  }

  return section.trim();
}

function buildPlatformSection(
  platform: Platform, 
  guideline?: ChannelPlatformGuideline
): string {
  let section = `## Platform: ${platform.name}\n\n`;

  // Platform constraints
  if (platform.constraints) {
    const c = platform.constraints;
    section += '### Platform Requirements:\n\n';

    if (c.max_chars) {
      section += `- **Character limit**: ${c.max_chars} characters maximum\n`;
    }
    if (c.max_words) {
      section += `- **Word limit**: ${c.max_words} words maximum\n`;
    }
    if (c.format) {
      section += `- **Format**: ${c.format}\n`;
    }
    if (typeof c.hashtags === 'boolean') {
      section += `- **Hashtags**: ${c.hashtags ? 'Encouraged' : 'Avoid'}\n`;
    }
    if (typeof c.emojis === 'boolean') {
      section += `- **Emojis**: ${c.emojis ? 'Allowed' : 'Avoid'}\n`;
    }
    if (typeof c.links === 'boolean') {
      section += `- **Links**: ${c.links ? 'Allowed' : 'Avoid'}\n`;
    }

    // Include any other constraints as key-value pairs
    const standardKeys = ['max_chars', 'max_words', 'format', 'hashtags', 'emojis', 'links'];
    const otherConstraints = Object.entries(c)
      .filter(([key]) => !standardKeys.includes(key))
      .map(([key, value]) => `- **${key}**: ${value}`)
      .join('\n');

    if (otherConstraints) {
      section += `${otherConstraints}\n`;
    }

    section += '\n';
  }

  // Channel-specific platform guidelines
  if (guideline) {
    section += '### Channel-Specific Platform Guidelines:\n\n';

    if (guideline.tone_adjustment) {
      section += `**Tone Adjustment**: ${guideline.tone_adjustment}\n\n`;
    }

    if (guideline.content_approach) {
      section += `**Content Approach**: ${guideline.content_approach}\n\n`;
    }

    if (guideline.optimal_content_mix.length > 0) {
      section += '**Optimal Content Mix**:\n';
      for (const mix of guideline.optimal_content_mix) {
        section += `- ${mix.type}: ${mix.percentage}%\n`;
      }
      section += '\n';
    }

    if (guideline.best_practices.length > 0) {
      section += '**Best Practices**:\n';
      for (const practice of guideline.best_practices) {
        section += `- ✓ ${practice}\n`;
      }
      section += '\n';
    }

    if (guideline.avoid.length > 0) {
      section += '**Avoid**:\n';
      for (const item of guideline.avoid) {
        section += `- ✗ ${item}\n`;
      }
    }
  }

  return section.trim();
}

function buildContentTypeSection(contentType: ContentType): string {
  let section = `## Content Type: ${contentType.name}`;

  if (contentType.description) {
    section += `\n\n${contentType.description}`;
  }

  return section;
}

function mergeGuardrails(
  globalRules: DontSayRule[], 
  channelDontSay: string[]
): Array<DontSayRule | { term: string; severity: 'warning' }> {
  const merged: Array<DontSayRule | { term: string; severity: 'warning' }> = [
    ...globalRules.filter(r => r.active)
  ];

  // Add channel-level "we don't say" as warnings
  for (const term of channelDontSay) {
    merged.push({
      term,
      severity: 'warning'
    });
  }

  return merged;
}

function buildGuardrailsSection(
  rules: Array<DontSayRule | { term: string; severity: 'error' | 'warning'; suggestion?: string }>
): string {
  let section = '## Content Guardrails\n\n';
  section += '**IMPORTANT**: The following terms and phrases must be avoided in your content:\n\n';

  for (const rule of rules) {
    section += `- ❌ **"${rule.term}"**`;
    if ('suggestion' in rule && rule.suggestion) {
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
