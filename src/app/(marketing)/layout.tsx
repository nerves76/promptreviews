import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}