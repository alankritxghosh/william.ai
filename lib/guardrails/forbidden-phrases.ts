// 100+ forbidden AI slop terms organized by category

export const FORBIDDEN_PHRASES = {
  // Buzzwords (20)
  buzzwords: [
    "leverage",
    "ecosystem",
    "synergy",
    "paradigm",
    "cutting-edge",
    "next-level",
    "game-changing",
    "world-class",
    "best-in-class",
    "industry-leading",
    "state-of-the-art",
    "innovative",
    "groundbreaking",
    "revolutionary",
    "transformative",
    "disruptive",
    "holistic",
    "robust",
    "scalable",
    "seamless",
  ],
  
  // Filler phrases (15)
  filler: [
    "dive deep",
    "delve into",
    "unpack",
    "let's explore",
    "in today's world",
    "in this day and age",
    "at the end of the day",
    "when all is said and done",
    "it goes without saying",
    "needless to say",
    "suffice it to say",
    "the fact of the matter is",
    "for all intents and purposes",
    "in terms of",
    "with that being said",
  ],
  
  // Generic openers (12)
  genericOpeners: [
    "let me tell you",
    "imagine this",
    "picture this",
    "think about it",
    "have you ever wondered",
    "in my experience",
    "as you know",
    "it's no secret that",
    "we all know that",
    "everyone knows",
    "here's the thing",
    "fun fact",
  ],
  
  // Engagement bait (10)
  engagementBait: [
    "what do you think?",
    "let me know in the comments",
    "drop a comment below",
    "tag someone who",
    "share if you agree",
    "thoughts?",
    "agree or disagree?",
    "hot take:",
    "unpopular opinion:",
    "controversial opinion:",
  ],
  
  // Corporate speak (20)
  corporateSpeak: [
    "circle back",
    "touch base",
    "reach out",
    "loop in",
    "move the needle",
    "low-hanging fruit",
    "quick win",
    "value-add",
    "drill down",
    "take it offline",
    "think outside the box",
    "paradigm shift",
    "win-win",
    "best practice",
    "core competency",
    "bandwidth",
    "synergize",
    "operationalize",
    "incentivize",
    "optimize",
  ],
  
  // AI tells (25)
  aiTells: [
    "moreover",
    "furthermore",
    "additionally",
    "in conclusion",
    "it's worth noting that",
    "it's important to note",
    "to summarize",
    "in summary",
    "as we've seen",
    "as mentioned earlier",
    "moving forward",
    "going forward",
    "that being said",
    "with that in mind",
    "it's crucial to",
    "it's essential to",
    "it's imperative to",
    "one must consider",
    "it should be noted",
    "interestingly",
    "notably",
    "importantly",
    "significantly",
    "consequently",
    "subsequently",
  ],
  
  // Weak qualifiers (10)
  weakQualifiers: [
    "sort of",
    "kind of",
    "somewhat",
    "relatively",
    "fairly",
    "quite",
    "rather",
    "a bit",
    "slightly",
    "to some extent",
  ],
};

// Flatten all phrases into a single array
export const ALL_FORBIDDEN_PHRASES: string[] = Object.values(FORBIDDEN_PHRASES).flat();

export interface ForbiddenPhraseMatch {
  phrase: string;
  category: string;
  position: number;
  context: string;
}

/**
 * Check text for forbidden phrases and return all matches
 */
export function checkForForbiddenPhrases(text: string): ForbiddenPhraseMatch[] {
  const matches: ForbiddenPhraseMatch[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [category, phrases] of Object.entries(FORBIDDEN_PHRASES)) {
    for (const phrase of phrases) {
      const lowerPhrase = phrase.toLowerCase();
      let position = lowerText.indexOf(lowerPhrase);
      
      while (position !== -1) {
        // Get surrounding context (20 chars before and after)
        const start = Math.max(0, position - 20);
        const end = Math.min(text.length, position + phrase.length + 20);
        const context = text.slice(start, end);
        
        matches.push({
          phrase,
          category,
          position,
          context: `...${context}...`,
        });
        
        position = lowerText.indexOf(lowerPhrase, position + 1);
      }
    }
  }
  
  return matches;
}

/**
 * Quick boolean check for any forbidden phrases
 */
export function hasForbiddenPhrases(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ALL_FORBIDDEN_PHRASES.some(phrase => 
    lowerText.includes(phrase.toLowerCase())
  );
}

/**
 * Get suggestions for replacing forbidden phrases
 */
export function getSuggestions(phrase: string): string[] {
  const suggestions: Record<string, string[]> = {
    "leverage": ["use", "apply", "build on"],
    "ecosystem": ["community", "network", "market"],
    "synergy": ["collaboration", "combined effect", "partnership"],
    "dive deep": ["examine", "look at", "explore"],
    "delve into": ["examine", "look at", "explore"],
    "at the end of the day": ["ultimately", "in the end", "(remove entirely)"],
    "circle back": ["follow up", "revisit", "return to"],
    "touch base": ["connect", "check in", "talk"],
    "move the needle": ["make progress", "improve", "change"],
    "low-hanging fruit": ["easy wins", "quick fixes", "obvious opportunities"],
    "moreover": ["also", "and", "(start new sentence)"],
    "furthermore": ["also", "and", "(start new sentence)"],
    "additionally": ["also", "and", "(start new sentence)"],
    "it's worth noting that": ["(remove entirely)", "notably,", "also,"],
    "in conclusion": ["(remove entirely)", "so,", "finally,"],
  };
  
  return suggestions[phrase.toLowerCase()] || ["(consider removing or rephrasing)"];
}

/**
 * Calculate quality score based on forbidden phrase usage
 */
export function calculateForbiddenPhraseScore(text: string): number {
  const matches = checkForForbiddenPhrases(text);
  const wordCount = text.split(/\s+/).length;
  
  // Base score is 100
  // Deduct 5 points per forbidden phrase, max 30 points
  const deduction = Math.min(matches.length * 5, 30);
  
  // Bonus for shorter posts with no violations (harder to achieve)
  const bonus = matches.length === 0 && wordCount < 100 ? 5 : 0;
  
  return Math.max(0, 100 - deduction + bonus);
}
