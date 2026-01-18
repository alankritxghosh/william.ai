import { CarouselPage, CarouselTemplate, VoiceProfile } from "@/lib/types";
import { generate } from "@/lib/gemini";

interface CarouselConfig {
  pages: CarouselPage[];
  template: CarouselTemplate;
  brandColors: VoiceProfile["brandColors"];
}

/**
 * Generate carousel pages from a post
 */
export async function generateCarouselPages(
  post: string,
  template: CarouselTemplate,
  brandColors: VoiceProfile["brandColors"]
): Promise<CarouselConfig> {
  const prompt = `Break down this LinkedIn post into carousel slides for the template: "${template.name}"

POST:
${post}

TEMPLATE INFO:
- Name: ${template.name}
- Category: ${template.category}
- Page count: ${template.pageCount}
- Description: ${template.description}

Generate content for each page. For each page, provide:
1. A heading (short, punchy, < 60 chars)
2. Content bullets/text (based on template type)

Output as JSON array:
[
  {
    "pageNumber": 1,
    "heading": "Title text",
    "content": ["bullet 1", "bullet 2"],
    "layout": "${template.category}"
  },
  ...
]

RULES:
- First page should be a hook/title
- Last page should be a CTA or summary
- Each page should be standalone but flow together
- Keep text concise - this is for visual slides
- Preserve specific numbers and data from the post`;

  try {
    const result = await generate(prompt);
    
    // Parse JSON from response
    let pages: CarouselPage[];
    try {
      let cleaned = result.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }
      pages = JSON.parse(cleaned.trim());
    } catch {
      // If JSON parsing fails, create basic pages
      pages = createBasicPages(post, template);
    }

    // Ensure correct number of pages
    while (pages.length < template.pageCount) {
      pages.push({
        pageNumber: pages.length + 1,
        heading: "",
        content: [],
        layout: template.category,
      });
    }

    return {
      pages: pages.slice(0, template.pageCount),
      template,
      brandColors,
    };
  } catch (error) {
    console.error("Error generating carousel:", error);
    return {
      pages: createBasicPages(post, template),
      template,
      brandColors,
    };
  }
}

/**
 * Create basic pages from post when AI fails
 */
function createBasicPages(post: string, template: CarouselTemplate): CarouselPage[] {
  const paragraphs = post.split("\n\n").filter(p => p.trim());
  const pages: CarouselPage[] = [];

  // Title page
  pages.push({
    pageNumber: 1,
    heading: paragraphs[0]?.slice(0, 60) || "Title",
    content: [],
    layout: template.category,
  });

  // Content pages
  for (let i = 1; i < template.pageCount - 1 && i < paragraphs.length; i++) {
    pages.push({
      pageNumber: i + 1,
      heading: `Point ${i}`,
      content: [paragraphs[i]?.slice(0, 150) || ""],
      layout: template.category,
    });
  }

  // Conclusion page
  pages.push({
    pageNumber: template.pageCount,
    heading: "Key Takeaway",
    content: [paragraphs[paragraphs.length - 1]?.slice(0, 100) || "Follow for more!"],
    layout: template.category,
  });

  return pages;
}

/**
 * Generate HTML for a carousel page
 */
export function generatePageHTML(
  page: CarouselPage,
  brandColors: VoiceProfile["brandColors"],
  pageIndex: number,
  totalPages: number
): string {
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === totalPages - 1;

  const bgGradient = isFirstPage 
    ? `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`
    : `linear-gradient(135deg, ${brandColors.primary}15, ${brandColors.secondary}15)`;

  const textColor = isFirstPage ? "#FFFFFF" : "#1F2937";
  const accentColor = brandColors.accent;

  return `
    <div style="
      width: 1080px;
      height: 1080px;
      background: ${bgGradient};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px;
      font-family: 'Inter', sans-serif;
      position: relative;
    ">
      ${isFirstPage ? '' : `
        <div style="
          position: absolute;
          top: 40px;
          right: 40px;
          background: ${brandColors.primary};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 18px;
          font-weight: 600;
        ">
          ${pageIndex + 1}/${totalPages}
        </div>
      `}
      
      <h1 style="
        font-size: ${isFirstPage ? '72px' : '56px'};
        font-weight: 800;
        color: ${textColor};
        text-align: center;
        line-height: 1.2;
        margin-bottom: ${page.content.length > 0 ? '40px' : '0'};
      ">
        ${page.heading}
      </h1>
      
      ${page.content.length > 0 ? `
        <div style="
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 800px;
        ">
          ${page.content.map(item => `
            <div style="
              display: flex;
              align-items: flex-start;
              gap: 16px;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background: ${accentColor};
                border-radius: 50%;
                margin-top: 10px;
                flex-shrink: 0;
              "></div>
              <p style="
                font-size: 32px;
                color: ${textColor};
                line-height: 1.5;
              ">
                ${item}
              </p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${isLastPage ? `
        <div style="
          margin-top: 40px;
          background: ${accentColor};
          color: white;
          padding: 20px 40px;
          border-radius: 12px;
          font-size: 24px;
          font-weight: 600;
        ">
          Follow for more
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Convert HTML to image using html2canvas (client-side only)
 */
export async function htmlToImage(html: string): Promise<string> {
  // This function should be called from client-side only
  if (typeof window === "undefined") {
    throw new Error("htmlToImage can only be called client-side");
  }

  const html2canvas = (await import("html2canvas")).default;

  // Create temporary container
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      width: 1080,
      height: 1080,
      scale: 1,
    });

    return canvas.toDataURL("image/png");
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Download all carousel pages as images
 */
export async function downloadCarouselImages(
  pages: CarouselPage[],
  brandColors: VoiceProfile["brandColors"],
  filename: string = "carousel"
): Promise<void> {
  for (let i = 0; i < pages.length; i++) {
    const html = generatePageHTML(pages[i], brandColors, i, pages.length);
    const dataUrl = await htmlToImage(html);
    
    // Download image
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}_page_${i + 1}.png`;
    a.click();
    
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
