"use client";
import { usePathname } from 'next/navigation';
import Header from './Header';

export default function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname.startsWith('/r/') || pathname.startsWith('/prompt-pages/');
  if (isPublic) {
    return (
      <main>
        {children}
      </main>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
      <main>
        <Header />
        {children}
      </main>
    </div>
  );
} 