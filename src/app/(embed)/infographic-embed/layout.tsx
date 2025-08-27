import '@/app/globals.css'

export const metadata = {
  title: 'PromptReviews Infographic',
  description: 'How PromptReviews helps businesses get more reviews',
}

// This layout completely replaces the root layout for the embed page
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}