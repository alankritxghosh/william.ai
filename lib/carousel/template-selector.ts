import { CarouselTemplate } from "@/lib/types";
import { CAROUSEL_TEMPLATES } from "@/data/carousel-templates";
import { generate } from "@/lib/gemini";

/**
 * AI-powered carousel template selection based on post content
 */
export async function selectCarouselTemplate(
  postContent: string,
  preferredCategory?: "list" | "story" | "data"
): Promise<CarouselTemplate> {
  try {
    const templateSummaries = CAROUSEL_TEMPLATES.map(t => 
      `- ${t.id}: "${t.name}" (${t.category}) - ${t.description}`
    ).join("\n");

    const prompt = `You are helping select the best carousel template for a LinkedIn post.

=== POST CONTENT ===
${postContent}

=== AVAILABLE TEMPLATES ===
${templateSummaries}

=== SELECTION CRITERIA ===
1. Match template type to content structure (lists → list templates, stories → story templates, data-heavy → data templates)
2. Consider the number of key points (match to template page count)
3. Prioritize visual impact for the specific content type

${preferredCategory ? `USER PREFERENCE: Prefer "${preferredCategory}" category templates if suitable.` : ""}

=== OUTPUT ===
Respond with ONLY the template ID (e.g., "5-tips" or "before-after") that best matches this content.`;

    const result = await generate(prompt);
    const selectedId = result.trim().toLowerCase().replace(/['"]/g, "");
    
    // Find the matching template
    const selected = CAROUSEL_TEMPLATES.find(t => 
      t.id.toLowerCase() === selectedId || 
      t.name.toLowerCase() === selectedId
    );
    
    if (selected) {
      return selected;
    }
    
    // Fallback: use heuristic selection
    return selectTemplateHeuristic(postContent, preferredCategory);
  } catch (error) {
    console.error("AI template selection failed:", error);
    return selectTemplateHeuristic(postContent, preferredCategory);
  }
}

/**
 * Heuristic-based template selection (fallback)
 */
export function selectTemplateHeuristic(
  postContent: string,
  preferredCategory?: "list" | "story" | "data"
): CarouselTemplate {
  const content = postContent.toLowerCase();
  
  // Count indicators for each category
  let listScore = 0;
  let storyScore = 0;
  let dataScore = 0;
  
  // List indicators
  if (/\d+\s*(tips|mistakes|lessons|rules|ways|steps|things)/i.test(content)) listScore += 3;
  if ((content.match(/^\s*[-•*\d]/gm) || []).length > 3) listScore += 2;
  if (/first|second|third|finally/i.test(content)) listScore += 1;
  
  // Story indicators
  if (/years? ago|last year|when i was|i remember|my journey/i.test(content)) storyScore += 3;
  if (/before|after|transformation|changed my/i.test(content)) storyScore += 2;
  if (/i felt|i learned|i realized|it hit me/i.test(content)) storyScore += 1;
  
  // Data indicators
  if ((content.match(/\d+%|\$[\d,]+|₹[\d,]+/g) || []).length > 2) dataScore += 3;
  if (/increase|decrease|growth|revenue|conversion/i.test(content)) dataScore += 2;
  if (/vs|versus|compared to|difference/i.test(content)) dataScore += 2;
  
  // Apply user preference
  if (preferredCategory === "list") listScore += 2;
  if (preferredCategory === "story") storyScore += 2;
  if (preferredCategory === "data") dataScore += 2;
  
  // Determine winning category
  const maxScore = Math.max(listScore, storyScore, dataScore);
  let category: "list" | "story" | "data" = "list";
  
  if (maxScore === storyScore) category = "story";
  else if (maxScore === dataScore) category = "data";
  
  // Select best template from category
  const categoryTemplates = CAROUSEL_TEMPLATES.filter(t => t.category === category);
  
  // Further refinement based on content
  if (category === "list") {
    // Count the number of points to match template
    const bulletCount = (content.match(/^\s*[-•*\d]/gm) || []).length;
    
    if (bulletCount >= 7) {
      return categoryTemplates.find(t => t.id === "7-mistakes") || categoryTemplates[0];
    }
    return categoryTemplates.find(t => t.id === "5-tips") || categoryTemplates[0];
  }
  
  if (category === "story") {
    if (/before|after/i.test(content)) {
      return categoryTemplates.find(t => t.id === "before-after") || categoryTemplates[0];
    }
    return categoryTemplates.find(t => t.id === "journey") || categoryTemplates[0];
  }
  
  // Data category
  if (/vs|versus|compared/i.test(content)) {
    return CAROUSEL_TEMPLATES.find(t => t.id === "comparison") || categoryTemplates[0];
  }
  return categoryTemplates.find(t => t.id === "stats-showcase") || categoryTemplates[0];
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): CarouselTemplate | undefined {
  return CAROUSEL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all templates by category
 */
export function getTemplatesByCategory(category: "list" | "story" | "data"): CarouselTemplate[] {
  return CAROUSEL_TEMPLATES.filter(t => t.category === category);
}
