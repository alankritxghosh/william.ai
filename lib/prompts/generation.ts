import { VoiceMode, VoiceProfile, InterviewResponse } from "@/lib/types";
import { ALL_FORBIDDEN_PHRASES } from "@/lib/guardrails/forbidden-phrases";

// Stage 1: Generate 5 different versions
export function getStage1Prompt(
  interview: InterviewResponse,
  voiceMode: VoiceMode,
  voiceProfile: VoiceProfile
): string {
  const answersText = Object.entries(interview.answers)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n\n");

  return `You are generating LinkedIn/Twitter content that sounds HUMAN-WRITTEN, not AI-generated.

Generate 5 COMPLETELY DIFFERENT versions of a post based on this input.

=== INTERVIEW ANSWERS ===
${answersText}

=== VOICE MODE: ${voiceMode.name} ===
Tone: ${voiceMode.tone.formality}, ${voiceMode.tone.emotionalRange}, ${voiceMode.tone.directness}
Sentence patterns:
${voiceMode.sentencePatterns.map(p => `- ${p}`).join("\n")}

=== VOICE PROFILE RULES ===
${voiceProfile.rules.sentencePatterns.map(p => `- ${p}`).join("\n")}

Signature phrases to potentially use: ${voiceProfile.rules.signaturePhrases.join(", ")}

=== FORBIDDEN PHRASES (NEVER USE ANY OF THESE) ===
${ALL_FORBIDDEN_PHRASES.slice(0, 50).join(", ")}

=== REQUIREMENTS ===
1. Each version MUST include specific numbers, names, or dates from the interview
2. Match the voice mode style exactly
3. ZERO forbidden phrases allowed
4. Each version should take a DIFFERENT angle on the same story
5. Keep posts between 150-300 words
6. Use frequent paragraph breaks (1-2 sentences per paragraph)
7. Strong hook in first 1-2 lines

Output as:
VERSION 1:
[content]

VERSION 2:
[content]

VERSION 3:
[content]

VERSION 4:
[content]

VERSION 5:
[content]`;
}

// Stage 2: Select best version
export function getStage2Prompt(versions: string[]): string {
  return `You are evaluating 5 versions of a LinkedIn post to select the best one.

=== VERSIONS ===
${versions.map((v, i) => `VERSION ${i + 1}:\n${v}\n`).join("\n---\n")}

=== SCORING CRITERIA (0-100) ===
1. Specificity (30 points): Count of specific numbers/names/dates. More = better.
2. Voice match (25 points): How well it matches a professional LinkedIn voice
3. Hook strength (25 points): Is the opening line compelling and specific?
4. No slop (20 points): Zero AI-sounding phrases, no generic language

=== OUTPUT FORMAT ===
SCORES:
Version 1: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 2: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 3: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 4: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 5: X/100 (specificity: X, voice: X, hook: X, no-slop: X)

SELECTED: Version X
REASONING: [2-3 sentences on why this version is best]

SELECTED_CONTENT:
[paste the full content of the selected version here]`;
}

// Stage 3: Refine the selected version
export function getStage3Prompt(selectedVersion: string): string {
  return `You are refining a LinkedIn post to make it even better.

=== CURRENT VERSION ===
${selectedVersion}

=== IMPROVEMENTS TO MAKE ===
1. Remove any remaining AI tells (check for: delve, leverage, in today's world, moreover, furthermore, etc.)
2. Strengthen weak sentences (make them more punchy)
3. Ensure smooth narrative flow between paragraphs
4. Keep ALL specific details (numbers, names, dates) intact
5. Make sure every sentence adds value

=== RULES ===
- Do NOT add new information not in the original
- Do NOT make it longer
- Do NOT use any forbidden AI phrases
- Keep the hook exactly as compelling

=== OUTPUT FORMAT ===
REFINED VERSION:
[the improved post]

CHANGES MADE:
- [list each specific change you made]`;
}

// Stage 4: Hook optimization
export function getStage4Prompt(refinedVersion: string): string {
  return `You are optimizing the opening line (hook) of a LinkedIn post.

=== CURRENT POST ===
${refinedVersion}

=== GENERATE 10 ALTERNATIVE HOOKS ===
Each hook MUST have ONE of these elements:
- Specific number in first line
- Contrarian claim that challenges conventional wisdom
- Personal failure with real stakes
- Surprising data point
- Bold action taken
- Provocative question
- Pattern interrupt
- Unexpected comparison
- Time-specific urgency
- Counterintuitive statement

=== RULES ===
- Hooks must be 1-2 lines maximum
- Must grab attention immediately
- Must lead naturally into the rest of the post
- NO generic phrases like "Let me tell you" or "Picture this"
- Each hook should take a different approach

=== OUTPUT FORMAT ===
HOOK 1: [hook text]
HOOK 2: [hook text]
HOOK 3: [hook text]
HOOK 4: [hook text]
HOOK 5: [hook text]
HOOK 6: [hook text]
HOOK 7: [hook text]
HOOK 8: [hook text]
HOOK 9: [hook text]
HOOK 10: [hook text]

SELECTED HOOK: Hook X
REASONING: [why this hook is strongest]

POST WITH NEW HOOK:
[full post with the new hook replacing the original opening]`;
}

// Stage 5: Personality injection
export function getStage5Prompt(
  hookOptimizedVersion: string,
  voiceProfile: VoiceProfile
): string {
  const topPostsText = voiceProfile.topPosts
    .slice(0, 2)
    .map((p, i) => `Reference Post ${i + 1}:\n${p.content}`)
    .join("\n\n");

  return `You are adding personality to make this post sound uniquely like the author.

=== CURRENT POST ===
${hookOptimizedVersion}

=== SIGNATURE PHRASES TO POTENTIALLY USE ===
${voiceProfile.rules.signaturePhrases.map(p => `- "${p}"`).join("\n")}

=== REFERENCE POSTS (for voice matching) ===
${topPostsText}

=== RULES ===
1. Use 1-2 signature phrases naturally (don't force them)
2. Match the sentence rhythm of the reference posts
3. Add subtle quirks that make it recognizable
4. Don't overdo it - should feel natural, not forced
5. Keep all specific details (numbers, names) intact
6. Do NOT change the hook

=== OUTPUT FORMAT ===
PERSONALIZED VERSION:
[post with personality injected]

INJECTED ELEMENTS:
- [list what was added and where]`;
}

// Stage 6: Final quality check
export function getStage6Prompt(
  personalizedVersion: string,
  voiceProfile: VoiceProfile
): string {
  return `You are performing final quality validation on a LinkedIn post.

=== POST TO EVALUATE ===
${personalizedVersion}

=== QUALITY GATES ===
1. Forbidden Phrases: Check for AI-sounding language (delve, leverage, synergy, paradigm, moreover, furthermore, innovative, transformative, etc.). Must be ZERO.

2. Specificity: Count numbers, names, dates, specific details. Must be 3+.

3. Hook Strength: Evaluate opening 1-2 lines. Must have: number OR contrarian claim OR personal stake OR surprising data.

4. Formatting: Check for appropriate paragraph breaks, no em-dashes (unless allowed), reasonable sentence length variation.

5. Voice Match: Does it sound human? Would it pass as written by a real person?

=== OUTPUT FORMAT ===
QUALITY SCORE: X/100

GATE RESULTS:
✓/✗ Forbidden Phrases: [count found] - [list any found]
✓/✗ Specificity: [count] specific details found
✓/✗ Hook Strength: [pass/fail] - [brief analysis]
✓/✗ Formatting: [pass/fail] - [any issues]
✓/✗ Voice Match: [pass/fail] - [brief assessment]

OVERALL: PASS/FAIL
ISSUES: [list any issues that need fixing, or "None"]

FINAL POST:
[the post, potentially with minor fixes applied]`;
}

// Parse stage 2 output to get selected version
export function parseStage2Output(output: string): {
  selectedVersion: string;
  reasoning: string;
} {
  const selectedMatch = output.match(/SELECTED_CONTENT:\s*([\s\S]*?)(?=$)/i);
  const reasoningMatch = output.match(/REASONING:\s*([^\n]+(?:\n(?!SELECTED_CONTENT)[^\n]+)*)/i);

  return {
    selectedVersion: selectedMatch?.[1]?.trim() || output,
    reasoning: reasoningMatch?.[1]?.trim() || "Best version selected based on overall quality",
  };
}

// Parse stage 3 output
export function parseStage3Output(output: string): {
  refinedVersion: string;
  changes: string[];
} {
  const versionMatch = output.match(/REFINED VERSION:\s*([\s\S]*?)(?=CHANGES MADE:|$)/i);
  const changesMatch = output.match(/CHANGES MADE:\s*([\s\S]*?)$/i);

  const changes = changesMatch?.[1]
    ?.split("\n")
    .filter(line => line.trim().startsWith("-"))
    .map(line => line.trim().replace(/^-\s*/, "")) || [];

  return {
    refinedVersion: versionMatch?.[1]?.trim() || output,
    changes,
  };
}

// Parse stage 4 output
export function parseStage4Output(output: string): {
  hooks: string[];
  selectedHook: string;
  hookOptimizedVersion: string;
} {
  const hooks: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const hookMatch = output.match(new RegExp(`HOOK ${i}:\\s*([^\\n]+)`, "i"));
    if (hookMatch) hooks.push(hookMatch[1].trim());
  }

  const selectedMatch = output.match(/POST WITH NEW HOOK:\s*([\s\S]*?)$/i);

  return {
    hooks,
    selectedHook: hooks[0] || "",
    hookOptimizedVersion: selectedMatch?.[1]?.trim() || output,
  };
}

// Parse stage 5 output
export function parseStage5Output(output: string): {
  personalityVersion: string;
  injectedElements: string[];
} {
  const versionMatch = output.match(/PERSONALIZED VERSION:\s*([\s\S]*?)(?=INJECTED ELEMENTS:|$)/i);
  const elementsMatch = output.match(/INJECTED ELEMENTS:\s*([\s\S]*?)$/i);

  const elements = elementsMatch?.[1]
    ?.split("\n")
    .filter(line => line.trim().startsWith("-"))
    .map(line => line.trim().replace(/^-\s*/, "")) || [];

  return {
    personalityVersion: versionMatch?.[1]?.trim() || output,
    injectedElements: elements,
  };
}

// Parse stage 6 output
export function parseStage6Output(output: string): {
  score: number;
  passed: boolean;
  issues: string[];
  finalVersion: string;
} {
  const scoreMatch = output.match(/QUALITY SCORE:\s*(\d+)/i);
  const overallMatch = output.match(/OVERALL:\s*(PASS|FAIL)/i);
  const issuesMatch = output.match(/ISSUES:\s*([^\n]+(?:\n(?!FINAL POST)[^\n]+)*)/i);
  const finalMatch = output.match(/FINAL POST:\s*([\s\S]*?)$/i);

  const issues = issuesMatch?.[1]?.trim().toLowerCase() === "none" 
    ? [] 
    : issuesMatch?.[1]?.split("\n").filter(line => line.trim()) || [];

  return {
    score: parseInt(scoreMatch?.[1] || "0"),
    passed: overallMatch?.[1]?.toUpperCase() === "PASS",
    issues,
    finalVersion: finalMatch?.[1]?.trim() || output,
  };
}
