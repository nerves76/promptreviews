import "../globals.css";
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generatePromptPageMetadata, createVariableContext } from '@/utils/metadataTemplates';

// Helper function to get formatted page type
function getPageType(promptPage: any): string {
  if (promptPage.is_universal) return 'universal';
  if (promptPage.review_type === 'product') return 'product';
  if (promptPage.review_type === 'service') return 'service';
  if (promptPage.review_type === 'photo') return 'photo';
  if (promptPage.review_type === 'video') return 'video';
  if (promptPage.review_type === 'event') return 'event';
  if (promptPage.review_type === 'employee') return 'employee';
  return 'universal';
}

// Dynamic metadata generation with og:image support
export async function generateMetadata({ params }: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  console.log('[LAYOUT] generateMetadata called');
  
  // Simple test metadata to see if function is called
  const testMetadata: Metadata = {
    title: "TEST METADATA - Business Name Here",
    description: "This is a test to see if generateMetadata is being called",
    keywords: ["test", "metadata"],
    openGraph: {
      title: "TEST METADATA - Business Name Here",
      description: "This is a test to see if generateMetadata is being called",
      type: "website",
    },
  };
  
  return testMetadata;
}

export default function PublicPromptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
