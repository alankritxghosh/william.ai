import { CarouselTemplate } from "@/lib/types";

export const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
  // List Style Templates
  {
    id: "5-tips",
    name: "5 Tips",
    category: "list",
    pageCount: 7,
    description: "Share 5 actionable tips with a hook and CTA",
    pages: [
      { pageNumber: 1, layout: "title", textAreas: [
        { id: "title", type: "heading", maxCharacters: 50, position: { x: 10, y: 30, width: 80, height: 40 } },
        { id: "subtitle", type: "body", maxCharacters: 100, position: { x: 10, y: 70, width: 80, height: 20 } },
      ]},
      { pageNumber: 2, layout: "content", textAreas: [
        { id: "number", type: "number", maxCharacters: 5, position: { x: 10, y: 10, width: 20, height: 20 } },
        { id: "tip", type: "heading", maxCharacters: 80, position: { x: 10, y: 35, width: 80, height: 30 } },
        { id: "explanation", type: "body", maxCharacters: 150, position: { x: 10, y: 65, width: 80, height: 25 } },
      ]},
      { pageNumber: 3, layout: "content", textAreas: [
        { id: "number", type: "number", maxCharacters: 5, position: { x: 10, y: 10, width: 20, height: 20 } },
        { id: "tip", type: "heading", maxCharacters: 80, position: { x: 10, y: 35, width: 80, height: 30 } },
        { id: "explanation", type: "body", maxCharacters: 150, position: { x: 10, y: 65, width: 80, height: 25 } },
      ]},
      { pageNumber: 4, layout: "content", textAreas: [
        { id: "number", type: "number", maxCharacters: 5, position: { x: 10, y: 10, width: 20, height: 20 } },
        { id: "tip", type: "heading", maxCharacters: 80, position: { x: 10, y: 35, width: 80, height: 30 } },
        { id: "explanation", type: "body", maxCharacters: 150, position: { x: 10, y: 65, width: 80, height: 25 } },
      ]},
      { pageNumber: 5, layout: "content", textAreas: [
        { id: "number", type: "number", maxCharacters: 5, position: { x: 10, y: 10, width: 20, height: 20 } },
        { id: "tip", type: "heading", maxCharacters: 80, position: { x: 10, y: 35, width: 80, height: 30 } },
        { id: "explanation", type: "body", maxCharacters: 150, position: { x: 10, y: 65, width: 80, height: 25 } },
      ]},
      { pageNumber: 6, layout: "content", textAreas: [
        { id: "number", type: "number", maxCharacters: 5, position: { x: 10, y: 10, width: 20, height: 20 } },
        { id: "tip", type: "heading", maxCharacters: 80, position: { x: 10, y: 35, width: 80, height: 30 } },
        { id: "explanation", type: "body", maxCharacters: 150, position: { x: 10, y: 65, width: 80, height: 25 } },
      ]},
      { pageNumber: 7, layout: "conclusion", textAreas: [
        { id: "summary", type: "heading", maxCharacters: 60, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "cta", type: "body", maxCharacters: 80, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
    ],
    thumbnailUrl: "/templates/list-style/5-tips.png",
  },
  {
    id: "7-mistakes",
    name: "7 Mistakes to Avoid",
    category: "list",
    pageCount: 9,
    description: "Highlight 7 common mistakes with solutions",
    pages: [
      { pageNumber: 1, layout: "title", textAreas: [
        { id: "title", type: "heading", maxCharacters: 60, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
      { pageNumber: 2, layout: "content", textAreas: [
        { id: "mistake", type: "heading", maxCharacters: 80, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "solution", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 3, layout: "content", textAreas: [
        { id: "mistake", type: "heading", maxCharacters: 80, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "solution", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 4, layout: "content", textAreas: [
        { id: "mistake", type: "heading", maxCharacters: 80, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "solution", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 5, layout: "content", textAreas: [
        { id: "mistake", type: "heading", maxCharacters: 80, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "solution", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 6, layout: "content", textAreas: [
        { id: "mistake", type: "heading", maxCharacters: 80, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "solution", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 7, layout: "content", textAreas: [
        { id: "mistake", type: "heading", maxCharacters: 80, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "solution", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 8, layout: "content", textAreas: [
        { id: "mistake", type: "heading", maxCharacters: 80, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "solution", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 9, layout: "conclusion", textAreas: [
        { id: "summary", type: "heading", maxCharacters: 60, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
    ],
    thumbnailUrl: "/templates/list-style/7-mistakes.png",
  },
  
  // Story Style Templates
  {
    id: "before-after",
    name: "Before & After",
    category: "story",
    pageCount: 5,
    description: "Show transformation with before/after comparison",
    pages: [
      { pageNumber: 1, layout: "title", textAreas: [
        { id: "title", type: "heading", maxCharacters: 50, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
      { pageNumber: 2, layout: "content", textAreas: [
        { id: "label", type: "heading", maxCharacters: 20, position: { x: 10, y: 10, width: 80, height: 15 } },
        { id: "before", type: "body", maxCharacters: 200, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 3, layout: "content", textAreas: [
        { id: "change", type: "heading", maxCharacters: 60, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
      { pageNumber: 4, layout: "content", textAreas: [
        { id: "label", type: "heading", maxCharacters: 20, position: { x: 10, y: 10, width: 80, height: 15 } },
        { id: "after", type: "body", maxCharacters: 200, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 5, layout: "conclusion", textAreas: [
        { id: "lesson", type: "heading", maxCharacters: 80, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
    ],
    thumbnailUrl: "/templates/story-style/before-after.png",
  },
  {
    id: "journey",
    name: "My Journey",
    category: "story",
    pageCount: 6,
    description: "Share a personal journey with milestones",
    pages: [
      { pageNumber: 1, layout: "title", textAreas: [
        { id: "title", type: "heading", maxCharacters: 50, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
      { pageNumber: 2, layout: "content", textAreas: [
        { id: "year", type: "number", maxCharacters: 10, position: { x: 10, y: 10, width: 30, height: 15 } },
        { id: "event", type: "body", maxCharacters: 150, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 3, layout: "content", textAreas: [
        { id: "year", type: "number", maxCharacters: 10, position: { x: 10, y: 10, width: 30, height: 15 } },
        { id: "event", type: "body", maxCharacters: 150, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 4, layout: "content", textAreas: [
        { id: "year", type: "number", maxCharacters: 10, position: { x: 10, y: 10, width: 30, height: 15 } },
        { id: "event", type: "body", maxCharacters: 150, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 5, layout: "content", textAreas: [
        { id: "year", type: "number", maxCharacters: 10, position: { x: 10, y: 10, width: 30, height: 15 } },
        { id: "event", type: "body", maxCharacters: 150, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 6, layout: "conclusion", textAreas: [
        { id: "lesson", type: "heading", maxCharacters: 80, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
    ],
    thumbnailUrl: "/templates/story-style/journey.png",
  },
  
  // Data Style Templates
  {
    id: "stats-showcase",
    name: "Stats Showcase",
    category: "data",
    pageCount: 5,
    description: "Present key statistics with impact",
    pages: [
      { pageNumber: 1, layout: "title", textAreas: [
        { id: "title", type: "heading", maxCharacters: 50, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
      { pageNumber: 2, layout: "content", textAreas: [
        { id: "stat", type: "number", maxCharacters: 20, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "context", type: "body", maxCharacters: 100, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 3, layout: "content", textAreas: [
        { id: "stat", type: "number", maxCharacters: 20, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "context", type: "body", maxCharacters: 100, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 4, layout: "content", textAreas: [
        { id: "stat", type: "number", maxCharacters: 20, position: { x: 10, y: 20, width: 80, height: 30 } },
        { id: "context", type: "body", maxCharacters: 100, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 5, layout: "conclusion", textAreas: [
        { id: "takeaway", type: "heading", maxCharacters: 80, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
    ],
    thumbnailUrl: "/templates/data-style/stats.png",
  },
  {
    id: "comparison",
    name: "Comparison",
    category: "data",
    pageCount: 5,
    description: "Compare two approaches or options",
    pages: [
      { pageNumber: 1, layout: "title", textAreas: [
        { id: "title", type: "heading", maxCharacters: 50, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
      { pageNumber: 2, layout: "content", textAreas: [
        { id: "option_a", type: "heading", maxCharacters: 40, position: { x: 10, y: 10, width: 80, height: 20 } },
        { id: "details_a", type: "bullet", maxCharacters: 200, position: { x: 10, y: 35, width: 80, height: 55 } },
      ]},
      { pageNumber: 3, layout: "content", textAreas: [
        { id: "vs", type: "heading", maxCharacters: 10, position: { x: 35, y: 40, width: 30, height: 20 } },
      ]},
      { pageNumber: 4, layout: "content", textAreas: [
        { id: "option_b", type: "heading", maxCharacters: 40, position: { x: 10, y: 10, width: 80, height: 20 } },
        { id: "details_b", type: "bullet", maxCharacters: 200, position: { x: 10, y: 35, width: 80, height: 55 } },
      ]},
      { pageNumber: 5, layout: "conclusion", textAreas: [
        { id: "verdict", type: "heading", maxCharacters: 80, position: { x: 10, y: 30, width: 80, height: 40 } },
      ]},
    ],
    thumbnailUrl: "/templates/data-style/comparison.png",
  },
  
  // Framework Template (NEW)
  {
    id: "framework",
    name: "Framework",
    category: "list",
    pageCount: 6,
    description: "Present a step-by-step framework or methodology",
    pages: [
      { pageNumber: 1, layout: "title", textAreas: [
        { id: "title", type: "heading", maxCharacters: 60, position: { x: 10, y: 25, width: 80, height: 35 } },
        { id: "subtitle", type: "body", maxCharacters: 80, position: { x: 10, y: 65, width: 80, height: 25 } },
      ]},
      { pageNumber: 2, layout: "content", textAreas: [
        { id: "step_number", type: "number", maxCharacters: 10, position: { x: 10, y: 10, width: 20, height: 15 } },
        { id: "step_name", type: "heading", maxCharacters: 40, position: { x: 10, y: 30, width: 80, height: 20 } },
        { id: "step_description", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 3, layout: "content", textAreas: [
        { id: "step_number", type: "number", maxCharacters: 10, position: { x: 10, y: 10, width: 20, height: 15 } },
        { id: "step_name", type: "heading", maxCharacters: 40, position: { x: 10, y: 30, width: 80, height: 20 } },
        { id: "step_description", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 4, layout: "content", textAreas: [
        { id: "step_number", type: "number", maxCharacters: 10, position: { x: 10, y: 10, width: 20, height: 15 } },
        { id: "step_name", type: "heading", maxCharacters: 40, position: { x: 10, y: 30, width: 80, height: 20 } },
        { id: "step_description", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 5, layout: "content", textAreas: [
        { id: "step_number", type: "number", maxCharacters: 10, position: { x: 10, y: 10, width: 20, height: 15 } },
        { id: "step_name", type: "heading", maxCharacters: 40, position: { x: 10, y: 30, width: 80, height: 20 } },
        { id: "step_description", type: "body", maxCharacters: 120, position: { x: 10, y: 55, width: 80, height: 35 } },
      ]},
      { pageNumber: 6, layout: "conclusion", textAreas: [
        { id: "summary", type: "heading", maxCharacters: 60, position: { x: 10, y: 25, width: 80, height: 30 } },
        { id: "cta", type: "body", maxCharacters: 80, position: { x: 10, y: 60, width: 80, height: 30 } },
      ]},
    ],
    thumbnailUrl: "/templates/list-style/framework.png",
  },
  
  // Case Study Template (NEW)
  {
    id: "case-study",
    name: "Case Study",
    category: "story",
    pageCount: 7,
    description: "Present a case study with problem, solution, and results",
    pages: [
      { pageNumber: 1, layout: "title", textAreas: [
        { id: "title", type: "heading", maxCharacters: 60, position: { x: 10, y: 25, width: 80, height: 35 } },
        { id: "company", type: "body", maxCharacters: 40, position: { x: 10, y: 65, width: 80, height: 20 } },
      ]},
      { pageNumber: 2, layout: "content", textAreas: [
        { id: "section_title", type: "heading", maxCharacters: 30, position: { x: 10, y: 10, width: 80, height: 15 } },
        { id: "problem", type: "body", maxCharacters: 180, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 3, layout: "content", textAreas: [
        { id: "section_title", type: "heading", maxCharacters: 30, position: { x: 10, y: 10, width: 80, height: 15 } },
        { id: "approach", type: "body", maxCharacters: 180, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 4, layout: "content", textAreas: [
        { id: "section_title", type: "heading", maxCharacters: 30, position: { x: 10, y: 10, width: 80, height: 15 } },
        { id: "implementation", type: "body", maxCharacters: 180, position: { x: 10, y: 30, width: 80, height: 60 } },
      ]},
      { pageNumber: 5, layout: "content", textAreas: [
        { id: "section_title", type: "heading", maxCharacters: 30, position: { x: 10, y: 10, width: 80, height: 15 } },
        { id: "metric_1", type: "number", maxCharacters: 25, position: { x: 10, y: 30, width: 35, height: 25 } },
        { id: "metric_2", type: "number", maxCharacters: 25, position: { x: 55, y: 30, width: 35, height: 25 } },
        { id: "metric_3", type: "number", maxCharacters: 25, position: { x: 10, y: 60, width: 35, height: 25 } },
        { id: "metric_4", type: "number", maxCharacters: 25, position: { x: 55, y: 60, width: 35, height: 25 } },
      ]},
      { pageNumber: 6, layout: "content", textAreas: [
        { id: "quote", type: "body", maxCharacters: 150, position: { x: 15, y: 25, width: 70, height: 50 } },
        { id: "attribution", type: "body", maxCharacters: 50, position: { x: 15, y: 75, width: 70, height: 15 } },
      ]},
      { pageNumber: 7, layout: "conclusion", textAreas: [
        { id: "key_takeaway", type: "heading", maxCharacters: 80, position: { x: 10, y: 25, width: 80, height: 35 } },
        { id: "cta", type: "body", maxCharacters: 60, position: { x: 10, y: 65, width: 80, height: 25 } },
      ]},
    ],
    thumbnailUrl: "/templates/story-style/case-study.png",
  },
];

export function getTemplateById(id: string): CarouselTemplate | undefined {
  return CAROUSEL_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: "list" | "story" | "data"): CarouselTemplate[] {
  return CAROUSEL_TEMPLATES.filter(t => t.category === category);
}
