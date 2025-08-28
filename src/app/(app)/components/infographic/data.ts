import { ToolCategory, ReviewPlatform } from './types';

export const toolCategories: ToolCategory[] = [
  {
    category: 'Curiosity',
    tools: [
      { 
        name: 'AI Generate', 
        iconName: 'FaMagic' as any,
        description: 'Generate contextual review starters based on your service and customer history.',
        highlight: 'Break through writer\'s block',
        learnMore: null,
        position: { bottom: '25%', left: '5%' }
      },
      { 
        name: 'Service Details', 
        iconName: 'FaClipboardList' as any,
        description: 'Pre-fill specific service details to help customers remember their experience.',
        highlight: 'Jog their memory',
        learnMore: null,
        position: { bottom: '15%', left: '18%' }
      },
      { 
        name: 'Photo Upload', 
        iconName: 'FaCamera' as any,
        description: 'Let customers easily add photos to make their reviews more engaging.',
        highlight: 'Visual storytelling',
        learnMore: null,
        position: { bottom: '8%', left: '32%' }
      }
    ]
  },
  {
    category: 'Writing',
    tools: [
      { 
        name: 'Smart Suggestions', 
        iconName: 'FaLightbulb' as any,
        description: 'AI-powered prompts that adapt to your business and customer type.',
        highlight: 'Personalized guidance',
        learnMore: null,
        position: { bottom: '5%', left: '47%' }
      },
      { 
        name: 'Grammar Fix', 
        iconName: 'FaSpellCheck' as any,
        description: 'Automatic grammar and spelling correction to help reviews look professional.',
        highlight: 'Polish their words',
        learnMore: null,
        position: { bottom: '5%', right: '47%' }
      }
    ]
  },
  {
    category: 'Finishing',
    tools: [
      { 
        name: 'Sentiment Check', 
        iconName: 'FaSmile' as any,
        description: 'Ensure the review conveys the right emotional tone before posting.',
        highlight: 'Match their feelings',
        learnMore: null,
        position: { bottom: '8%', right: '32%' }
      },
      { 
        name: 'Multi-Platform', 
        iconName: 'FaShareAlt' as any,
        description: 'One-click posting to multiple review platforms simultaneously.',
        highlight: 'Save them time',
        learnMore: null,
        position: { bottom: '-13%', right: '32%' }
      },
      { 
        name: 'Branded Design', 
        iconName: 'FaPalette' as any,
        description: 'Design your Prompt Pages to match your brand look and feel.',
        highlight: 'Establishes continuity',
        learnMore: null,
        position: { bottom: '-8%', right: '12%' }
      }
    ]
  }
];

export const reviewPlatforms: ReviewPlatform[] = [
  { name: 'Google', iconName: 'FaGoogle' as any },
  { name: 'Facebook', iconName: 'FaFacebook' as any },
  { name: 'Yelp', iconName: 'FaYelp' as any },
  { name: 'TripAdvisor', iconName: 'FaTripadvisor' as any },
  { name: 'More', iconName: 'FaPlus' as any }
];