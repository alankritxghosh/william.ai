# william.ai

AI ghostwriting platform for LinkedIn and Twitter that **eliminates AI slop** through structural constraints and multi-layer quality control.

## Features

- **Voice Profiles**: Create unique voice profiles with 20+ rules, reference posts, and brand colors
- **5 Voice Modes**: Thought Leader, Storyteller, Educator, Provocateur, Community Builder
- **6-Stage Generation Pipeline**: Multi-stage refinement ensures high-quality output
- **Quality Gates**: 100+ forbidden phrases, specificity checks, hook strength validation
- **Platform Conversion**: Automatic LinkedIn → Twitter thread conversion
- **Carousel Generation**: Template-based carousel creation with brand colors

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Components**: shadcn/ui, Framer Motion
- **AI**: Google Gemini 3 Flash API
- **Storage**: localStorage (MVP)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/william-ai.git
   cd william-ai
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a `.env.local` file:
   \`\`\`
   GEMINI_API_KEY=your_gemini_api_key_here
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Voice Profile

1. Go to "Voice Profile" in the navigation
2. Enter a name and select target platforms
3. Add 20+ voice rules (sentence patterns, forbidden words, signature phrases)
4. Add 3 reference posts with engagement metrics
5. Select brand colors for carousels
6. Save your profile

### Generating Posts

1. Go to "Create Post" and choose a flow:
   - **Personal Experience**: Share a story or lesson
   - **Pattern Recognition**: Share observations across situations

2. Select a voice mode that matches your content style

3. Answer the interview questions with specific details

4. Submit for generation (takes 30-60 seconds)

5. Review, edit, and export your post

### Quality Requirements

- Posts must score **85+** to pass quality gates
- Zero forbidden phrases allowed
- Minimum 3 specific details (numbers, names, dates)
- Strong hook with number, contrarian claim, or personal stake

## Project Structure

\`\`\`
william.ai/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── create/            # Post creation flows
│   ├── dashboard/         # Main dashboard
│   └── voice-profile/     # Profile management
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── interview/        # Interview flow components
│   ├── generation/       # Generation UI components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities and logic
│   ├── context/          # React contexts
│   ├── guardrails/       # Quality validation
│   ├── pipeline/         # Generation pipeline
│   ├── prompts/          # AI prompts
│   └── utils/            # Helper functions
├── data/                  # Static data
│   ├── voice-modes.ts    # Voice mode definitions
│   └── carousel-templates.ts
└── hooks/                 # Custom React hooks
\`\`\`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Connect your repository to Vercel

3. Add environment variable:
   - `GEMINI_API_KEY`: Your Gemini API key

4. Deploy!

## License

MIT

## Credits

Built with [Cursor](https://cursor.sh) and Claude Opus 4.5
