/**
 * AI Model Router
 * Routes content generation tasks to appropriate Gemini models
 * based on complexity, latency requirements, and content type
 */

export type TaskType = 
  | 'social_draft'
  | 'hashtag_generation'
  | 'voice_check'
  | 'content_variation'
  | 'metadata_extraction'
  | 'long_form'
  | 'creative_chat'
  | 'multi_channel_repurpose'
  | 'strategy_analysis'
  | 'complex_chain'
  | 'image_draft'
  | 'image_hero'
  | 'image_edit';

export interface ModelConfig {
  model: string;
  tier: 'flash' | 'pro' | 'image';
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
}

const ROUTING_TABLE: Record<TaskType, ModelConfig> = {
  social_draft: { 
    model: 'gemini-2.0-flash', 
    tier: 'flash', 
    temperature: 0.8, 
    maxOutputTokens: 1024, 
    timeoutMs: 10000 
  },
  hashtag_generation: { 
    model: 'gemini-2.0-flash', 
    tier: 'flash', 
    temperature: 0.7, 
    maxOutputTokens: 256, 
    timeoutMs: 10000 
  },
  voice_check: { 
    model: 'gemini-2.0-flash', 
    tier: 'flash', 
    temperature: 0.2, 
    maxOutputTokens: 2048, 
    timeoutMs: 10000 
  },
  content_variation: { 
    model: 'gemini-2.0-flash', 
    tier: 'flash', 
    temperature: 0.9, 
    maxOutputTokens: 2048, 
    timeoutMs: 10000 
  },
  metadata_extraction: { 
    model: 'gemini-2.0-flash', 
    tier: 'flash', 
    temperature: 0.1, 
    maxOutputTokens: 512, 
    timeoutMs: 10000 
  },
  long_form: { 
    model: 'gemini-2.5-pro-preview-06-05', 
    tier: 'pro', 
    temperature: 0.7, 
    maxOutputTokens: 4096, 
    timeoutMs: 30000 
  },
  creative_chat: { 
    model: 'gemini-2.5-pro-preview-06-05', 
    tier: 'pro', 
    temperature: 0.9, 
    maxOutputTokens: 2048, 
    timeoutMs: 30000 
  },
  multi_channel_repurpose: { 
    model: 'gemini-2.5-pro-preview-06-05', 
    tier: 'pro', 
    temperature: 0.7, 
    maxOutputTokens: 4096, 
    timeoutMs: 30000 
  },
  strategy_analysis: { 
    model: 'gemini-2.5-pro-preview-06-05', 
    tier: 'pro', 
    temperature: 0.3, 
    maxOutputTokens: 2048, 
    timeoutMs: 30000 
  },
  complex_chain: { 
    model: 'gemini-2.5-pro-preview-06-05', 
    tier: 'pro', 
    temperature: 0.5, 
    maxOutputTokens: 4096, 
    timeoutMs: 30000 
  },
  image_draft: { 
    model: 'gemini-2.0-flash-exp', 
    tier: 'image', 
    temperature: 0.8, 
    maxOutputTokens: 1024, 
    timeoutMs: 45000 
  },
  image_hero: { 
    model: 'gemini-2.5-pro-preview-06-05', 
    tier: 'image', 
    temperature: 0.7, 
    maxOutputTokens: 1024, 
    timeoutMs: 45000 
  },
  image_edit: { 
    model: 'gemini-2.0-flash-exp', 
    tier: 'image', 
    temperature: 0.8, 
    maxOutputTokens: 1024, 
    timeoutMs: 45000 
  },
};

/**
 * Get the model configuration for a given task type
 */
export function getModelConfig(taskType: TaskType): ModelConfig {
  return ROUTING_TABLE[taskType];
}

/**
 * Get escalation model for flash tasks that need more power
 * Returns null if task is already using pro/image tier
 */
export function getEscalationModel(taskType: TaskType): ModelConfig | null {
  const currentConfig = ROUTING_TABLE[taskType];
  
  // Only escalate from flash tier
  if (currentConfig.tier !== 'flash') {
    return null;
  }

  // Escalate to pro model with adjusted settings
  return {
    model: 'gemini-2.5-pro-preview-06-05',
    tier: 'pro',
    temperature: currentConfig.temperature,
    maxOutputTokens: Math.min(currentConfig.maxOutputTokens * 2, 4096),
    timeoutMs: 30000,
  };
}

/**
 * Get default model config (for backward compatibility or unspecified tasks)
 */
export function getDefaultModelConfig(): ModelConfig {
  return {
    model: 'gemini-2.0-flash',
    tier: 'flash',
    temperature: 0.8,
    maxOutputTokens: 2048,
    timeoutMs: 15000,
  };
}
