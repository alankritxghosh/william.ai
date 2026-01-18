/**
 * Convert a LinkedIn post to a Twitter thread
 * Rules:
 * - Preserve ALL specific details (numbers, names, dates)
 * - Each tweet max 280 characters
 * - Number tweets (1/X format)
 * - Keep the hook as first tweet
 */
export function convertToTwitterThread(linkedinPost: string): string[] {
  const MAX_TWEET_LENGTH = 280;
  const tweets: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = linkedinPost
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  for (const paragraph of paragraphs) {
    // If paragraph fits in a tweet, add it directly
    if (paragraph.length <= MAX_TWEET_LENGTH - 10) { // Reserve space for numbering
      tweets.push(paragraph);
      continue;
    }
    
    // Split long paragraphs into sentences
    const sentences = splitIntoSentences(paragraph);
    let currentTweet = "";
    
    for (const sentence of sentences) {
      const testTweet = currentTweet 
        ? `${currentTweet} ${sentence}` 
        : sentence;
      
      if (testTweet.length <= MAX_TWEET_LENGTH - 10) {
        currentTweet = testTweet;
      } else {
        // Save current tweet and start new one
        if (currentTweet) {
          tweets.push(currentTweet.trim());
        }
        
        // If single sentence is too long, break it at logical points
        if (sentence.length > MAX_TWEET_LENGTH - 10) {
          const chunks = breakLongSentence(sentence, MAX_TWEET_LENGTH - 10);
          tweets.push(...chunks.slice(0, -1));
          currentTweet = chunks[chunks.length - 1];
        } else {
          currentTweet = sentence;
        }
      }
    }
    
    if (currentTweet) {
      tweets.push(currentTweet.trim());
    }
  }
  
  // Add numbering
  const totalTweets = tweets.length;
  return tweets.map((tweet, i) => `${tweet}\n\n${i + 1}/${totalTweets}`);
}

/**
 * Split text into sentences while preserving integrity
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries but keep the punctuation
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

/**
 * Break a long sentence at logical points
 */
function breakLongSentence(sentence: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = sentence;
  
  while (remaining.length > maxLength) {
    // Try to break at punctuation or conjunctions
    let breakPoint = -1;
    
    // Look for break points in descending order of preference
    const breakPatterns = [
      /[,;:]\s/g,  // Comma, semicolon, colon
      /\s(?:and|but|or|so|because|however|therefore)\s/gi,  // Conjunctions
      /\s(?:that|which|who|when|where)\s/gi,  // Relative pronouns
      /\s/g,  // Any space as last resort
    ];
    
    for (const pattern of breakPatterns) {
      pattern.lastIndex = 0;
      let match;
      let lastGoodMatch = -1;
      
      while ((match = pattern.exec(remaining)) !== null) {
        if (match.index < maxLength - 20 && match.index > maxLength / 2) {
          lastGoodMatch = match.index + match[0].length;
        }
        if (match.index >= maxLength) break;
      }
      
      if (lastGoodMatch > 0) {
        breakPoint = lastGoodMatch;
        break;
      }
    }
    
    // If no good break point found, just break at max length
    if (breakPoint <= 0) {
      breakPoint = maxLength;
    }
    
    chunks.push(remaining.substring(0, breakPoint).trim());
    remaining = remaining.substring(breakPoint).trim();
  }
  
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  
  return chunks;
}

/**
 * Calculate specificity retention percentage
 */
export function calculateSpecificityRetention(
  original: string,
  converted: string[]
): number {
  const originalNumbers = (original.match(/[$₹€£]?[\d,]+\.?\d*[%kKmMbB]?/g) || []);
  const threadText = converted.join(" ");
  const threadNumbers = (threadText.match(/[$₹€£]?[\d,]+\.?\d*[%kKmMbB]?/g) || []);
  
  if (originalNumbers.length === 0) return 100;
  
  let retained = 0;
  for (const num of originalNumbers) {
    if (threadText.includes(num)) {
      retained++;
    }
  }
  
  return Math.round((retained / originalNumbers.length) * 100);
}

/**
 * Format Twitter thread for display
 */
export function formatThreadForDisplay(tweets: string[]): string {
  return tweets
    .map((tweet, i) => `Tweet ${i + 1}:\n${tweet}`)
    .join("\n\n---\n\n");
}

/**
 * Copy-friendly format for Twitter thread
 */
export function formatThreadForCopy(tweets: string[]): string {
  return tweets.join("\n\n---\n\n");
}
