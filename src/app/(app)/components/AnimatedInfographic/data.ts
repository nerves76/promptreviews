export interface Tool {
  icon: string
  label: string
  description: string
  color: string
  highlightPhrase: string
  delay?: number
}

export interface Platform {
  name: string
  logo: React.ReactNode
  color: string
  rating?: number
  reviews?: string
  isMore?: boolean
}

export const toolCategories = [
  {
    category: 'Curiosity',
    tools: [
      { icon: 'star', label: 'Smart questions', description: 'Guide customers to share specific experiences that future buyers care about', color: 'from-yellow-400 to-orange-400', highlightPhrase: 'Smart questions' },
      { icon: 'brain', label: 'Memory joggers', description: 'Help customers remember details that make reviews authentic and valuable', color: 'from-purple-400 to-pink-400', highlightPhrase: 'Memory joggers' },
      { icon: 'heart', label: 'Emotion prompts', description: 'Encourage customers to share feelings that resonate with readers', color: 'from-red-400 to-pink-400', highlightPhrase: 'Emotion prompts' },
    ]
  },
  {
    category: 'Convenience',
    tools: [
      { icon: 'time', label: 'Save drafts', description: 'Let customers pause and return to their review when convenient', color: 'from-blue-400 to-cyan-400', highlightPhrase: 'Save drafts', delay: 100 },
      { icon: 'device', label: 'Works anywhere', description: 'Optimized for phones, tablets, and computers—no app needed', color: 'from-green-400 to-teal-400', highlightPhrase: 'Works anywhere', delay: 200 },
      { icon: 'lightning', label: 'Quick submit', description: 'Post to multiple platforms with one tap after writing once', color: 'from-purple-400 to-indigo-400', highlightPhrase: 'Quick submit', delay: 300 },
    ]
  },
  {
    category: 'Trust',
    tools: [
      { icon: 'shield', label: 'Privacy first', description: "Customer data stays secure and isn't sold or shared", color: 'from-green-400 to-emerald-400', highlightPhrase: 'Privacy first', delay: 400 },
      { icon: 'refresh', label: 'Edit anytime', description: 'Customers can update their review before or after posting', color: 'from-blue-400 to-indigo-400', highlightPhrase: 'Edit anytime', delay: 500 },
      { icon: 'sparkle', label: 'AI help (optional)', description: 'Grammar fixes and suggestions available, but never required', color: 'from-purple-400 to-pink-400', highlightPhrase: 'AI help (optional)', delay: 600 }
    ]
  }
]

// Flatten for easier access
export const tools = toolCategories.flatMap(cat => cat.tools)