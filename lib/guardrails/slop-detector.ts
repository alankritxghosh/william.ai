import { checkForForbiddenPhrases, ForbiddenPhraseMatch } from "./forbidden-phrases";

export interface SlopAnalysis {
  hasSop: boolean;
  matches: ForbiddenPhraseMatch[];
  severity: "none" | "low" | "medium" | "high";
  suggestions: string[];
}

/**
 * Analyze text for AI slop
 */
export function detectSlop(text: string): SlopAnalysis {
  const matches = checkForForbiddenPhrases(text);
  
  let severity: SlopAnalysis["severity"];
  if (matches.length === 0) {
    severity = "none";
  } else if (matches.length <= 2) {
    severity = "low";
  } else if (matches.length <= 5) {
    severity = "medium";
  } else {
    severity = "high";
  }

  const suggestions = matches.map(m => 
    `Remove or replace "${m.phrase}" found in: ${m.context}`
  );

  return {
    hasSop: matches.length > 0,
    matches,
    severity,
    suggestions,
  };
}

/**
 * Attempt to auto-fix common slop patterns
 */
export function autoFixSlop(text: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];
  let fixed = text;

  // Simple replacements for common AI phrases
  const replacements: Record<string, string> = {
    "dive deep into": "examine",
    "delve into": "look at",
    "let's explore": "here's",
    "in today's world": "",
    "at the end of the day": "ultimately",
    "it's worth noting that": "",
    "it's important to note that": "",
    "moreover": "also",
    "furthermore": "and",
    "additionally": "also",
    "in conclusion": "",
    "leverage": "use",
    "utilize": "use",
    "implement": "add",
    "synergy": "collaboration",
    "paradigm": "approach",
    "ecosystem": "community",
  };

  for (const [phrase, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(phrase, "gi");
    if (regex.test(fixed)) {
      fixed = fixed.replace(regex, replacement);
      changes.push(`Replaced "${phrase}" with "${replacement || "(removed)"}"`);
    }
  }

  // Clean up double spaces
  fixed = fixed.replace(/\s+/g, " ").trim();

  // Clean up orphaned punctuation
  fixed = fixed.replace(/\s+([,.])/g, "$1");
  fixed = fixed.replace(/([,.])([A-Za-z])/g, "$1 $2");

  return { fixed, changes };
}

/**
 * Check if text passes the slop threshold
 */
export function passesSlopThreshold(text: string): boolean {
  const analysis = detectSlop(text);
  return analysis.severity === "none" || analysis.severity === "low";
}

/**
 * Get a clean version of text with slop removed
 */
export function cleanText(text: string): string {
  const { fixed } = autoFixSlop(text);
  return fixed;
}
