/**
 * AI Usage Logger
 * Logs AI model calls to track budget and usage patterns
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TaskType, ModelConfig } from './model-router';

/**
 * Gemini pricing (approximate, as of March 2026)
 * Prices are per 1M tokens
 */
const PRICING = {
  'gemini-2.0-flash': {
    input: 0.075,   // $0.075 per 1M input tokens
    output: 0.30,   // $0.30 per 1M output tokens
  },
  'gemini-2.0-flash-exp': {
    input: 0.075,
    output: 0.30,
  },
  'gemini-2.5-pro-preview-06-05': {
    input: 1.25,    // $1.25 per 1M input tokens
    output: 5.00,   // $5.00 per 1M output tokens
  },
  // Default fallback for unknown models
  default: {
    input: 0.50,
    output: 1.50,
  },
} as const;

export interface LogAiUsageParams {
  userId: string;
  postId?: string;
  taskType: TaskType;
  model: string;
  tier: ModelConfig['tier'];
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

/**
 * Calculate estimated cost based on token counts and model pricing
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Get pricing for the model (or use default)
  const pricing = (PRICING as any)[model] || PRICING.default;

  // Calculate cost per token (pricing is per 1M tokens)
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Log an AI usage event to the database
 */
export async function logAiUsage(params: LogAiUsageParams): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    const estimatedCost = calculateCost(
      params.model,
      params.inputTokens,
      params.outputTokens
    );

    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: params.userId,
      post_id: params.postId || null,
      task_type: params.taskType,
      model: params.model,
      tier: params.tier,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      estimated_cost_usd: estimatedCost,
      duration_ms: params.durationMs,
    });

    if (error) {
      console.error('Failed to log AI usage:', error);
      // Don't throw - we don't want to fail the request if logging fails
    }
  } catch (error) {
    console.error('Error in logAiUsage:', error);
    // Swallow errors - logging is non-critical
  }
}

/**
 * Estimate token count from text (rough approximation)
 * Real token counts come from the API response
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}
