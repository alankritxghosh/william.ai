import { VoiceProfile, QualityReport, QualityGate } from "@/lib/types";
import { checkForForbiddenPhrases } from "./forbidden-phrases";
import { generate } from "@/lib/gemini";

/**
 * Validate a post against all quality gates (sync version for quick checks)
 */
export function validatePost(post: string, profile: VoiceProfile): QualityReport {
  const gates = {
    forbiddenPhrases: checkForbiddenPhrasesGate(post),
    specificity: checkSpecificityGate(post),
    voiceMatch: checkVoiceMatchGate(post, profile),
    hookStrength: checkHookStrengthGate(post),
    formatting: checkFormattingGate(post, profile),
  };

  const overallScore = calculateOverallScore(gates);

  return {
    overallScore,
    passed: overallScore >= 85 && gates.forbiddenPhrases.passed,
    gates,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate a post against all quality gates with AI voice matching
 */
export async function validatePostWithAI(post: string, profile: VoiceProfile): Promise<QualityReport> {
  const [forbiddenPhrases, specificity, voiceMatch, hookStrength, formatting] = await Promise.all([
    Promise.resolve(checkForbiddenPhrasesGate(post)),
    Promise.resolve(checkSpecificityGate(post)),
    checkVoiceMatchGateAI(post, profile),
    Promise.resolve(checkHookStrengthGate(post)),
    Promise.resolve(checkFormattingGate(post, profile)),
  ]);

  const gates = {
    forbiddenPhrases,
    specificity,
    voiceMatch,
    hookStrength,
    formatting,
  };

  const overallScore = calculateOverallScore(gates);

  return {
    overallScore,
    passed: overallScore >= 85 && gates.forbiddenPhrases.passed,
    gates,
    timestamp: new Date().toISOString(),
  };
}

/**
 * AI-based voice match scoring
 */
async function checkVoiceMatchGateAI(post: string, profile: VoiceProfile): Promise<QualityGate> {
  try {
    const referencePosts = profile.topPosts.slice(0, 2).map(p => p.content).join("\n\n---\n\n");
    
    if (!referencePosts || referencePosts.length < 50) {
      // Fall back to heuristic if no reference posts
      return checkVoiceMatchGate(post, profile);
    }

    const prompt = `You are an expert writing analyst. Compare a generated post to reference posts and score voice similarity.

=== REFERENCE POSTS (the author's authentic voice) ===
${referencePosts}

=== GENERATED POST ===
${post}

=== VOICE ANALYSIS CRITERIA ===
1. Sentence rhythm and length patterns (0-25 points)
2. Vocabulary and word choice alignment (0-25 points)
3. Tone and emotional register match (0-25 points)
4. Structural patterns (paragraphing, transitions) (0-25 points)

=== OUTPUT FORMAT (JSON) ===
{
  "score": [0-100 total score],
  "rhythmScore": [0-25],
  "vocabularyScore": [0-25],
  "toneScore": [0-25],
  "structureScore": [0-25],
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    const result = await generate(prompt);
    
    // Parse the JSON response
    let parsed;
    try {
      let cleaned = result.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      parsed = JSON.parse(cleaned.trim());
    } catch {
      // Fall back to heuristic if JSON parsing fails
      return checkVoiceMatchGate(post, profile);
    }

    return {
      name: "Voice Match",
      passed: parsed.score >= 70,
      score: Math.min(100, Math.max(0, parsed.score || 70)),
      issues: parsed.issues || [],
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    console.error("AI voice match failed, using heuristic:", error);
    return checkVoiceMatchGate(post, profile);
  }
}

/**
 * Gate 1: Check for forbidden phrases
 */
function checkForbiddenPhrasesGate(post: string): QualityGate {
  const matches = checkForForbiddenPhrases(post);
  
  return {
    name: "Forbidden Phrases",
    passed: matches.length === 0,
    score: Math.max(0, 100 - matches.length * 20),
    issues: matches.map(m => `Found "${m.phrase}" (${m.category})`),
    suggestions: matches.map(m => `Remove or replace "${m.phrase}"`),
  };
}

/**
 * Gate 2: Check specificity (numbers, names, dates)
 */
function checkSpecificityGate(post: string): QualityGate {
  const details = countSpecificDetails(post);
  const passed = details.count >= 3;
  
  return {
    name: "Specificity",
    passed,
    score: Math.min(100, details.count * 25),
    issues: passed ? [] : [`Only ${details.count} specific details found (need 3+)`],
    suggestions: passed 
      ? [] 
      : ["Add more specific numbers, names, or dates to make the post more concrete"],
  };
}

/**
 * Count specific details in text
 */
function countSpecificDetails(text: string): { count: number; details: string[] } {
  const details: string[] = [];
  
  // Numbers (including currency)
  const numbers = text.match(/[$₹€£]?[\d,]+\.?\d*[%kKmMbB]?/g) || [];
  details.push(...numbers.filter(n => n.length > 0));
  
  // Time references
  const times = text.match(/\b\d+\s*(?:years?|months?|weeks?|days?|hours?|minutes?)\b/gi) || [];
  details.push(...times);
  
  return { count: details.length, details };
}

/**
 * Gate 3: Check voice match (simplified for MVP)
 */
function checkVoiceMatchGate(post: string, profile: VoiceProfile): QualityGate {
  let score = 70; // Base score
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for signature phrases
  const signatureUsed = profile.rules.signaturePhrases.some(phrase =>
    post.toLowerCase().includes(phrase.toLowerCase())
  );
  if (signatureUsed) {
    score += 15;
  } else {
    issues.push("No signature phrases found");
    suggestions.push(`Consider using one of: ${profile.rules.signaturePhrases.slice(0, 2).join(", ")}`);
  }
  
  // Check sentence patterns (simplified)
  const avgSentenceLength = calculateAvgSentenceLength(post);
  const targetLength = profile.rules.rhythmPreferences.avgSentenceLength || 15;
  if (Math.abs(avgSentenceLength - targetLength) <= 5) {
    score += 15;
  } else {
    issues.push(`Avg sentence length (${avgSentenceLength}) differs from target (${targetLength})`);
  }
  
  return {
    name: "Voice Match",
    passed: score >= 70,
    score,
    issues,
    suggestions,
  };
}

/**
 * Gate 4: Check hook strength
 */
function checkHookStrengthGate(post: string): QualityGate {
  const firstLine = post.split("\n")[0];
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Has specific number?
  if (/\d+/.test(firstLine)) {
    score += 35;
  }
  
  // Has dollar/rupee amount or percentage?
  if (/[$₹€£][\d,]+|\d+%/.test(firstLine)) {
    score += 20;
  }
  
  // Starts with action verb?
  const actionVerbs = ["spent", "built", "lost", "gained", "failed", "learned", "discovered", "made", "quit", "started", "stopped"];
  const firstWord = firstLine.toLowerCase().split(" ")[0];
  if (actionVerbs.includes(firstWord)) {
    score += 20;
  }
  
  // Contains contrarian signals?
  const contrarianWords = ["actually", "wrong", "myth", "lie", "secret", "nobody", "everyone thinks", "most people"];
  if (contrarianWords.some(w => firstLine.toLowerCase().includes(w))) {
    score += 25;
  }
  
  // Short and punchy? (< 15 words)
  const wordCount = firstLine.split(" ").length;
  if (wordCount <= 15) {
    score += 10;
  }
  
  // Generic opening penalty
  const genericOpeners = ["let me tell you", "imagine this", "picture this", "in my experience", "here's the thing"];
  if (genericOpeners.some(o => firstLine.toLowerCase().includes(o))) {
    score -= 30;
    issues.push("Uses generic opening phrase");
    suggestions.push("Start with a specific number, action, or contrarian statement");
  }
  
  if (score < 50) {
    issues.push("Hook lacks specific or compelling elements");
    suggestions.push("Add a specific number, contrarian claim, or personal stake to the first line");
  }
  
  return {
    name: "Hook Strength",
    passed: score >= 50,
    score: Math.min(100, Math.max(0, score)),
    issues,
    suggestions,
  };
}

/**
 * Gate 5: Check formatting
 */
function checkFormattingGate(post: string, profile: VoiceProfile): QualityGate {
  let score = 100;
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check em-dash usage
  if (!profile.rules.formattingRules.useEmDash && post.includes("—")) {
    score -= 20;
    issues.push("Uses em-dashes when forbidden");
    suggestions.push("Replace em-dashes with periods or commas");
  }
  
  // Check paragraph breaks
  const paragraphs = post.split("\n\n").filter(p => p.trim());
  if (paragraphs.length < 3) {
    score -= 15;
    issues.push("Not enough paragraph breaks");
    suggestions.push("Add more paragraph breaks for better readability");
  }
  
  // Check for excessive bullet points
  const bulletCount = (post.match(/^[-•*]\s/gm) || []).length;
  if (!profile.rules.formattingRules.useBulletPoints && bulletCount > 3) {
    score -= 15;
    issues.push("Too many bullet points");
  }
  
  // Check sentence length variation
  const sentences = post.split(/[.!?]+/).filter(s => s.trim());
  const lengths = sentences.map(s => s.trim().split(" ").length);
  const hasVariation = lengths.some(l => l < 8) && lengths.some(l => l > 12);
  if (!hasVariation && sentences.length > 3) {
    score -= 10;
    issues.push("Sentence lengths too uniform");
    suggestions.push("Mix short punchy sentences with longer ones");
  }
  
  return {
    name: "Formatting",
    passed: score >= 70,
    score,
    issues,
    suggestions,
  };
}

/**
 * Calculate overall score from gates
 */
function calculateOverallScore(gates: QualityReport["gates"]): number {
  const weights = {
    forbiddenPhrases: 0.25,
    specificity: 0.25,
    hookStrength: 0.20,
    voiceMatch: 0.15,
    formatting: 0.15,
  };
  
  let totalScore = 0;
  for (const [key, gate] of Object.entries(gates)) {
    const weight = weights[key as keyof typeof weights] || 0;
    totalScore += (gate.score || 0) * weight;
  }
  
  return Math.round(totalScore);
}

/**
 * Calculate average sentence length
 */
function calculateAvgSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length === 0) return 0;
  
  const totalWords = sentences.reduce((sum, s) => sum + s.trim().split(" ").length, 0);
  return Math.round(totalWords / sentences.length);
}

/**
 * Get quality score color
 */
export function getScoreColor(score: number): "gold" | "green" | "yellow" | "default" {
  if (score >= 95) return "gold";
  if (score >= 90) return "green";
  if (score >= 85) return "yellow";
  return "default";
}

/**
 * Get score badge variant
 */
export function getScoreBadgeVariant(score: number): "gold" | "green" | "yellow" | "destructive" {
  if (score >= 95) return "gold";
  if (score >= 90) return "green";
  if (score >= 85) return "yellow";
  return "destructive";
}
