import { VoiceMode, VoiceModeId } from "@/lib/types";

export const VOICE_MODES: Record<VoiceModeId, VoiceMode> = {
  "thought-leader": {
    id: "thought-leader",
    name: "Thought Leader",
    emoji: "🎯",
    description: "Authoritative, data-driven insights that position you as an industry expert",
    
    sentencePatterns: [
      "Start with surprising data or statistics",
      "Use direct, declarative statements",
      "Cite specific numbers and sources",
      "Build arguments with evidence",
      "End with actionable takeaways",
    ],
    
    forbiddenWords: [
      "maybe", "perhaps", "I think", "in my opinion",
      "sort of", "kind of", "just", "actually",
    ],
    
    hookStyles: [
      "Surprising statistic that challenges assumptions",
      "Bold claim backed by data",
      "Contrarian industry observation",
      "Pattern identified from experience",
    ],
    
    tone: {
      formality: "professional",
      emotionalRange: "reserved",
      directness: "direct",
    },
    
    exampleHooks: [
      "Spent ₹8L on Meta ads. Zero meetings. Got mentioned on one podcast. 12 calls. Closed ₹15L.",
      "97% of startups fail at hiring. Not because of budget. Because of this one mistake.",
      "Built 47 products in my career. Only 3 made money. Here's what they had in common.",
      "Interviewed 200 founders. The successful ones all do this one thing differently.",
      "Your competition isn't who you think it is. Data from 500 B2B deals proves it.",
    ],
    
    examplePosts: [
      `Spent ₹8L on Meta ads. Zero meetings.

Got mentioned on one podcast. 12 calls. Closed ₹15L.

B2B buyers don't search. They ask peers.

Ads interrupt them at the wrong moment.

Podcasts catch them when they're already listening.

Most founders waste money on the wrong channel.

What's working for you?`,
      
      `Built our MVP in 6 weeks.

Rebuild took 6 months.

The rush cost us 4x the time.

When you skip planning:

1. Foundations are weak
2. Scaling breaks everything
3. Technical debt compounds
4. Team morale tanks

Slow is smooth. Smooth is fast.

Most founders learn this the expensive way.`,
    ],
    
    suggestedFor: [
      "Industry insights and analysis",
      "Data-backed observations",
      "Market trends and predictions",
      "Business strategy content",
    ],
  },
  
  "storyteller": {
    id: "storyteller",
    name: "Storyteller",
    emoji: "📖",
    description: "Vulnerable, narrative-driven content that creates emotional connection",
    
    sentencePatterns: [
      "Start with a specific moment in time",
      "Use short, punchy sentences for impact",
      "Include sensory details",
      "Show emotions, don't just tell",
      "Build tension before resolution",
    ],
    
    forbiddenWords: [
      "leverage", "synergy", "optimize", "utilize",
      "robust", "scalable", "innovative",
    ],
    
    hookStyles: [
      "Set the scene with a specific moment",
      "Start with dialogue",
      "Begin at the crisis point",
      "Open with a confession",
    ],
    
    tone: {
      formality: "casual",
      emotionalRange: "vulnerable",
      directness: "subtle",
    },
    
    exampleHooks: [
      "The phone rang at 3 AM. It was my biggest client. I knew what was coming.",
      "I sat in my car for 20 minutes before walking in. That meeting changed everything.",
      "My co-founder texted me two words. 'I'm out.' The best and worst day of my startup.",
      "They laughed when I said I'd quit my ₹35L job. No one's laughing now.",
      "The investor looked me in the eyes and said, 'You're not ready.' He was right.",
    ],
    
    examplePosts: [
      `The phone rang at 3 AM.

It was my biggest client. 60% of our revenue.

"We're switching to your competitor."

I didn't sleep that night.

But losing them was the best thing that happened.

Because it forced us to:
- Diversify our client base
- Improve our product
- Build real relationships

Sometimes your worst fear is actually your breakthrough.`,
      
      `I sat in the parking lot for 20 minutes.

Heart racing. Hands shaking.

Walking into that board meeting felt impossible.

Six months of missed targets. Team morale at rock bottom.

I had two choices: make excuses or own it.

I chose ownership.

"I failed you. Here's what I'm changing."

That vulnerability saved my company.

Your team doesn't want perfection. They want honesty.`,
    ],
    
    suggestedFor: [
      "Personal experiences and lessons",
      "Failure stories with redemption",
      "Career transitions",
      "Emotional moments that taught you something",
    ],
  },
  
  "educator": {
    id: "educator",
    name: "Educator",
    emoji: "📚",
    description: "Clear, helpful content that breaks down complex topics step-by-step",
    
    sentencePatterns: [
      "Start with the problem your audience faces",
      "Use numbered lists and clear structure",
      "Include analogies to explain concepts",
      "Provide actionable steps",
      "End with encouragement or next steps",
    ],
    
    forbiddenWords: [
      "obviously", "simply", "just", "easy",
      "everyone knows", "of course",
    ],
    
    hookStyles: [
      "Identify a common problem",
      "Promise a clear solution",
      "Challenge a common misconception",
      "Offer a framework or system",
    ],
    
    tone: {
      formality: "professional",
      emotionalRange: "moderate",
      directness: "direct",
    },
    
    exampleHooks: [
      "Cold emails not working? You're probably making this mistake in the first 5 words.",
      "The 3-step framework I use to write posts in 10 minutes (not 2 hours).",
      "Stop building features. Start building this instead. Here's why.",
      "Your landing page is losing you customers. Fix these 5 things today.",
      "I've reviewed 500+ pitch decks. 90% fail on slide 2. Here's how to fix it.",
    ],
    
    examplePosts: [
      `Cold emails not working?

You're probably making this mistake in the first 5 words.

Most people start with: "Hi, my name is..."

No one cares.

Start with their problem instead.

Here's the formula:

1. Pain point (specific to them)
2. Proof you understand it
3. One-line solution
4. Clear ask

Example:
"Saw you're hiring 5 engineers. Most startups lose 40% of candidates to slow hiring. We cut time-to-hire by 60%."

That's it. No fluff. No life story.

Try it on your next 10 emails.`,
      
      `The 3-step framework I use to write posts in 10 minutes.

Step 1: The Hook
Answer: "What would make someone stop scrolling?"
- Surprising number
- Contrarian take
- Personal failure

Step 2: The Body
Answer: "What's the one thing they need to know?"
- One main point
- 3-5 supporting bullets
- Real example

Step 3: The Close
Answer: "What should they do next?"
- Actionable takeaway
- Question for engagement

That's the whole system.

No more staring at blank screens.`,
    ],
    
    suggestedFor: [
      "How-to guides and tutorials",
      "Framework explanations",
      "Common mistake corrections",
      "Step-by-step processes",
    ],
  },
  
  "provocateur": {
    id: "provocateur",
    name: "Provocateur",
    emoji: "🔥",
    description: "Bold, contrarian takes that challenge conventional wisdom",
    
    sentencePatterns: [
      "Lead with your strongest, most contrarian point",
      "Use absolute statements confidently",
      "Challenge industry sacred cows",
      "Back up bold claims with specifics",
      "End with a challenge to the reader",
    ],
    
    forbiddenWords: [
      "I might be wrong", "I'm not sure", "maybe",
      "it depends", "to be fair", "in some cases",
    ],
    
    hookStyles: [
      "Directly contradict popular advice",
      "Call out industry BS",
      "Make a bold prediction",
      "Challenge a sacred cow",
    ],
    
    tone: {
      formality: "bold",
      emotionalRange: "moderate",
      directness: "provocative",
    },
    
    exampleHooks: [
      "Hustle culture is a lie sold to you by people who already made their money.",
      "Your mentor's advice is probably wrong. Here's why.",
      "Stop networking. It's a waste of time. Do this instead.",
      "The productivity tips you follow are keeping you poor.",
      "Most 'thought leaders' have never actually built anything. I checked.",
    ],
    
    examplePosts: [
      `Hustle culture is a lie.

Sold to you by people who already made their money.

They worked 80-hour weeks in their 20s.
Built something.
Now they tell you to do the same.

But they forget:
- They had no competition
- Markets were different
- Opportunity cost was lower

What works now:
- Smart leverage, not just hard work
- Systems that compound
- Saying no more than yes

Stop grinding. Start thinking.`,
      
      `Your mentor's advice is probably wrong.

Not because they're lying.

Because their context is completely different from yours.

They built in 2010. You're building in 2024.

They had:
- Different market conditions
- Different tools
- Different competition

What worked for them won't work for you.

Find mentors who are building NOW.

Learn principles, not tactics.`,
    ],
    
    suggestedFor: [
      "Contrarian industry opinions",
      "Challenging popular advice",
      "Calling out hypocrisy",
      "Unpopular but true observations",
    ],
  },
  
  "community-builder": {
    id: "community-builder",
    name: "Community Builder",
    emoji: "🤝",
    description: "Casual, conversational content that builds connection and engagement",
    
    sentencePatterns: [
      "Write like you're talking to a friend",
      "Use 'we' and 'us' to create belonging",
      "Ask genuine questions",
      "Share relatable struggles",
      "Celebrate others' wins",
    ],
    
    forbiddenWords: [
      "pursuant to", "heretofore", "leverage",
      "synergize", "optimize", "implement",
    ],
    
    hookStyles: [
      "Start with a shared experience",
      "Ask a question everyone relates to",
      "Admit something embarrassing but relatable",
      "Celebrate a small win",
    ],
    
    tone: {
      formality: "casual",
      emotionalRange: "moderate",
      directness: "subtle",
    },
    
    exampleHooks: [
      "Real talk: who else has imposter syndrome every Monday morning?",
      "Unpopular opinion: sometimes the best networking is just... being nice?",
      "Just shipped something terrifying. Anyone else get that mix of excited and nauseous?",
      "Shoutout to everyone building in public. It's scary but you're not alone.",
      "What's one piece of advice you wish you'd ignored? I'll go first.",
    ],
    
    examplePosts: [
      `Real talk: who else has imposter syndrome every Monday morning?

I've been doing this for 8 years.

Still wake up wondering if today's the day everyone figures out I have no idea what I'm doing.

Then I remember:

Everyone feels this way.

The CEO you admire? Imposter syndrome.
The founder who raised millions? Imposter syndrome.
That person who always seems confident? Definitely imposter syndrome.

We're all just figuring it out together.

You're doing better than you think.`,
      
      `Shoutout to everyone building in public.

It's terrifying.

Sharing your work before it's "ready."
Getting feedback that stings.
Watching others succeed faster.

But here's what I've learned:

The people who support you now?
They become your first customers.
Your biggest advocates.
Your lifelong network.

Keep shipping.
Keep sharing.
Keep going.

We're all cheering for you.`,
    ],
    
    suggestedFor: [
      "Relatable struggles",
      "Community celebrations",
      "Questions for engagement",
      "Building in public updates",
    ],
  },
};

export const VOICE_MODE_LIST = Object.values(VOICE_MODES);

export function getVoiceMode(id: VoiceModeId): VoiceMode {
  return VOICE_MODES[id];
}
