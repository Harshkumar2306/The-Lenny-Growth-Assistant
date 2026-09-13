export interface CuratedPrompt {
  title: string;
  subtitle: string;
  prompt: string;
  skill: 'chat' | 'ship30' | 'artifact';
}

// Single source of truth for the curated starter prompts, rendered both as
// empty-state hero cards (ChatPane) and in the sidebar "Quick Starters"
// accordion (Sidebar).
export const curatedPrompts: CuratedPrompt[] = [
  {
    title: 'Pre-Mortem Strategy',
    subtitle: 'Shreyas Doshi on Tigers & Elephants',
    prompt: 'How does Shreyas Doshi recommend running a product pre-mortem, and what are Tigers, Paper Tigers, and Elephants?',
    skill: 'chat',
  },
  {
    title: 'Retention vs. Acquisition',
    subtitle: 'Ship 30 Essay grounded in Casey Winters',
    prompt: 'Write a Ship 30 for 30 essay on why retention comes before acquisition according to Casey Winters',
    skill: 'ship30',
  },
  {
    title: 'B2B Growth Loops',
    subtitle: 'Elena Verna on PLG & Expansion',
    prompt: "Explain Elena Verna's core framework for B2B product-led growth loops and user journeys.",
    skill: 'chat',
  },
  {
    title: 'PMF Score Calculator',
    subtitle: 'Rahul Vohra Superhuman 40% threshold',
    prompt: 'Create an interactive HTML/CSS Product-Market Fit calculator using Rahul Vohra Superhuman 40% rule',
    skill: 'artifact',
  },
];
