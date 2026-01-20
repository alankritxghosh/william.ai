import { describe, it, expect } from "vitest";
import {
  FORBIDDEN_PHRASES,
  ALL_FORBIDDEN_PHRASES,
  checkForForbiddenPhrases,
  hasForbiddenPhrases,
  getSuggestions,
  calculateForbiddenPhraseScore,
} from "@/lib/guardrails/forbidden-phrases";

describe("FORBIDDEN_PHRASES", () => {
  it("should have all expected categories", () => {
    expect(FORBIDDEN_PHRASES.buzzwords).toBeDefined();
    expect(FORBIDDEN_PHRASES.filler).toBeDefined();
    expect(FORBIDDEN_PHRASES.genericOpeners).toBeDefined();
    expect(FORBIDDEN_PHRASES.engagementBait).toBeDefined();
    expect(FORBIDDEN_PHRASES.corporateSpeak).toBeDefined();
    expect(FORBIDDEN_PHRASES.aiTells).toBeDefined();
    expect(FORBIDDEN_PHRASES.weakQualifiers).toBeDefined();
  });

  it("should have a significant number of phrases", () => {
    expect(ALL_FORBIDDEN_PHRASES.length).toBeGreaterThanOrEqual(100);
  });
});

describe("checkForForbiddenPhrases", () => {
  it("should detect buzzwords", () => {
    const text = "We need to leverage our ecosystem for better synergy.";
    const matches = checkForForbiddenPhrases(text);
    
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches.some(m => m.phrase === "leverage")).toBe(true);
    expect(matches.some(m => m.phrase === "ecosystem")).toBe(true);
  });

  it("should detect filler phrases", () => {
    const text = "Let's dive deep into this topic. In today's world, we need to explore.";
    const matches = checkForForbiddenPhrases(text);
    
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches.some(m => m.category === "filler")).toBe(true);
  });

  it("should detect AI tells", () => {
    const text = "Moreover, it's worth noting that furthermore, this is important.";
    const matches = checkForForbiddenPhrases(text);
    
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches.some(m => m.category === "aiTells")).toBe(true);
  });

  it("should detect engagement bait", () => {
    const text = "What do you think? Let me know in the comments!";
    const matches = checkForForbiddenPhrases(text);
    
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches.some(m => m.category === "engagementBait")).toBe(true);
  });

  it("should detect corporate speak", () => {
    const text = "Let's circle back and touch base about the low-hanging fruit.";
    const matches = checkForForbiddenPhrases(text);
    
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches.some(m => m.category === "corporateSpeak")).toBe(true);
  });

  it("should detect weak qualifiers", () => {
    const text = "This is sort of kind of somewhat important.";
    const matches = checkForForbiddenPhrases(text);
    
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches.some(m => m.category === "weakQualifiers")).toBe(true);
  });

  it("should return empty array for clean text", () => {
    const text = "I built a product that helps teams communicate better.";
    const matches = checkForForbiddenPhrases(text);
    
    expect(matches.length).toBe(0);
  });

  it("should include position and context in matches", () => {
    const text = "We need to leverage technology here.";
    const matches = checkForForbiddenPhrases(text);
    
    const leverageMatch = matches.find(m => m.phrase === "leverage");
    expect(leverageMatch).toBeDefined();
    expect(leverageMatch?.position).toBeGreaterThanOrEqual(0);
    expect(leverageMatch?.context).toContain("leverage");
  });

  it("should detect multiple occurrences of same phrase", () => {
    const text = "Moreover, the results are good. Moreover, we should continue.";
    const matches = checkForForbiddenPhrases(text);
    
    const moreoverMatches = matches.filter(m => m.phrase === "moreover");
    expect(moreoverMatches.length).toBe(2);
  });

  it("should be case insensitive", () => {
    const text = "LEVERAGE the ECOSYSTEM for SYNERGY!";
    const matches = checkForForbiddenPhrases(text);
    
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});

describe("hasForbiddenPhrases", () => {
  it("should return true when forbidden phrases exist", () => {
    expect(hasForbiddenPhrases("Let's leverage synergy")).toBe(true);
    expect(hasForbiddenPhrases("Moreover, this is important")).toBe(true);
    expect(hasForbiddenPhrases("What do you think?")).toBe(true);
  });

  it("should return false for clean text", () => {
    expect(hasForbiddenPhrases("I built a product last year.")).toBe(false);
    expect(hasForbiddenPhrases("The team shipped on time.")).toBe(false);
  });
});

describe("getSuggestions", () => {
  it("should provide suggestions for common phrases", () => {
    expect(getSuggestions("leverage")).toContain("use");
    expect(getSuggestions("ecosystem")).toContain("community");
    expect(getSuggestions("synergy")).toContain("collaboration");
    expect(getSuggestions("moreover")).toContain("also");
  });

  it("should provide fallback for unknown phrases", () => {
    const suggestions = getSuggestions("unknown-phrase-xyz");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain("removing");
  });

  it("should be case insensitive", () => {
    expect(getSuggestions("LEVERAGE")).toContain("use");
    expect(getSuggestions("Leverage")).toContain("use");
  });
});

describe("calculateForbiddenPhraseScore", () => {
  it("should return 100+ for clean text", () => {
    const text = "I built a successful product that helps teams.";
    const score = calculateForbiddenPhraseScore(text);
    
    // Short clean text gets +5 bonus, so expect 105
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it("should give bonus for short clean text", () => {
    const text = "Quick win. Done."; // Short and clean
    const score = calculateForbiddenPhraseScore(text);
    
    // Score is 100 but "quick win" is in corporateSpeak
    // Actually "quick win" is forbidden, so let's use truly clean text
    const cleanShort = "Built it. Shipped it.";
    const cleanScore = calculateForbiddenPhraseScore(cleanShort);
    expect(cleanScore).toBe(105); // 100 + 5 bonus
  });

  it("should deduct 5 points per forbidden phrase", () => {
    // One forbidden phrase
    const textOne = "We need to leverage this opportunity.";
    const scoreOne = calculateForbiddenPhraseScore(textOne);
    expect(scoreOne).toBe(95);

    // Two forbidden phrases
    const textTwo = "We need to leverage the ecosystem.";
    const scoreTwo = calculateForbiddenPhraseScore(textTwo);
    expect(scoreTwo).toBe(90);
  });

  it("should cap deduction at 30 points", () => {
    // Text with many forbidden phrases
    const text = 
      "Let's leverage the ecosystem synergy. Moreover, it's worth noting that " +
      "we need to dive deep and circle back. Furthermore, let's touch base " +
      "about the paradigm shift in today's world.";
    const score = calculateForbiddenPhraseScore(text);
    
    expect(score).toBeGreaterThanOrEqual(70); // 100 - 30 max
  });

  it("should never return negative scores", () => {
    // Even with absurd amount of slop
    const text = Array(50).fill("leverage synergy ecosystem paradigm").join(" ");
    const score = calculateForbiddenPhraseScore(text);
    
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
