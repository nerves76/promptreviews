import React from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function SimpleMarketingNav() {
  return (
    <nav className="w-full relative flex items-center justify-center px-0 py-4 bg-white/90 shadow-sm border-b border-gray-100">
      <div className="w-full max-w-[1000px] flex items-center justify-between px-6 relative">
        {/* Floating logo */}
        <div className="absolute -left-32 z-10 flex items-center" style={{ width: 200 }}>
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4-136x49.png"
              alt="Prompt Reviews Logo"
              className="h-10 w-auto"
              style={{ filter: 'brightness(0) saturate(100%) invert(10%) sepia(60%) saturate(6000%) hue-rotate(230deg) brightness(0.7)' }}
            />
          </Link>
        </div>
        {/* Main nav content */}
        <div className="flex-1 flex justify-end">
          <a
            href="https://promptreviews.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 font-bold text-sm px-4 py-2 rounded transition"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to main site
          </a>
        </div>
      </div>
    </nav>
  );
} 