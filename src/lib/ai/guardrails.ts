/**
 * AI Content Guardrails
 * Validates generated content against dont_say_rules
 */

export interface DontSayRule {
  id: string;
  term: string;
  severity: 'error' | 'warning';
  suggestion?: string;
  active: boolean;
}

export interface Violation {
  rule_id: string;
  matched_text: string;
  suggestion?: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
}

/**
 * Validate content against dont_say rules
 * Performs case-insensitive matching with word boundary support
 */
export function validateContent(
  content: string,
  rules: DontSayRule[],
  channelDontSay?: string[]
): ValidationResult {
  const violations: Violation[] = [];
  const activeRules = rules.filter((r) => r.active);

  // Validate against global dont_say rules
  for (const rule of activeRules) {
    const term = rule.term.trim();
    if (!term) continue;

    // Case-insensitive search
    const lowerContent = content.toLowerCase();
    const lowerTerm = term.toLowerCase();

    // Check if term is a single word or phrase
    const isWord = /^\w+$/.test(term);

    if (isWord) {
      // Word boundary matching for single words
      const wordRegex = new RegExp(`\\b${escapeRegex(lowerTerm)}\\b`, 'gi');
      const matches = content.matchAll(wordRegex);
      
      for (const match of matches) {
        violations.push({
          rule_id: rule.id,
          matched_text: match[0],
          suggestion: rule.suggestion,
          severity: rule.severity,
        });
      }
    } else {
      // Phrase matching - find all occurrences
      let startIndex = 0;
      while (true) {
        const index = lowerContent.indexOf(lowerTerm, startIndex);
        if (index === -1) break;

        // Extract the actual matched text (preserving original case)
        const matchedText = content.substring(index, index + term.length);
        
        violations.push({
          rule_id: rule.id,
          matched_text: matchedText,
          suggestion: rule.suggestion,
          severity: rule.severity,
        });

        startIndex = index + 1;
      }
    }
  }

  // Validate against channel-level "we don't say" (treated as warnings)
  if (channelDontSay && channelDontSay.length > 0) {
    for (const term of channelDontSay) {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) continue;

      const lowerContent = content.toLowerCase();
      const lowerTerm = trimmedTerm.toLowerCase();

      // Check if term is a single word or phrase
      const isWord = /^\w+$/.test(trimmedTerm);

      if (isWord) {
        // Word boundary matching for single words
        const wordRegex = new RegExp(`\\b${escapeRegex(lowerTerm)}\\b`, 'gi');
        const matches = content.matchAll(wordRegex);
        
        for (const match of matches) {
          violations.push({
            rule_id: `channel-dont-say-${trimmedTerm}`,
            matched_text: match[0],
            suggestion: undefined,
            severity: 'warning',
          });
        }
      } else {
        // Phrase matching - find all occurrences
        let startIndex = 0;
        while (true) {
          const index = lowerContent.indexOf(lowerTerm, startIndex);
          if (index === -1) break;

          // Extract the actual matched text (preserving original case)
          const matchedText = content.substring(index, index + trimmedTerm.length);
          
          violations.push({
            rule_id: `channel-dont-say-${trimmedTerm}`,
            matched_text: matchedText,
            suggestion: undefined,
            severity: 'warning',
          });

          startIndex = index + 1;
        }
      }
    }
  }

  // Content is valid only if there are no error-level violations
  const hasErrors = violations.some((v) => v.severity === 'error');

  return {
    valid: !hasErrors,
    violations,
  };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
