import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchComparisonData } from './fetchComparisonData';
import ComparisonTableEmbed from './ComparisonTableEmbed';

export const revalidate = 300; // 5-minute ISR cache (matches existing API cache)

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchComparisonData(slug);

  if (!data) {
    return { title: 'Comparison not found' };
  }

  const competitorNames = data.competitors.map(c => c.name).join(', ');
  const title = `Prompt Reviews vs ${competitorNames} - Feature Comparison`;
  const description = `Compare Prompt Reviews with ${competitorNames}. See which review management platform offers the features your business needs.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Prompt Reviews',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ComparisonEmbedPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchComparisonData(slug);

  if (!data) {
    notFound();
  }

  return (
    <div style={{ padding: '16px', background: 'transparent' }}>
      <ComparisonTableEmbed data={data} />
    </div>
  );
}
