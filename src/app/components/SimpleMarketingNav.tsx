import React from "react";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function SimpleMarketingNav() {
  return (
    <nav className="w-full bg-white shadow-sm z-50 sticky top-0">
      <div className="mx-auto max-w-[1000px] w-full flex items-center justify-between px-4 py-2">
        <Link href="/">
          <img
            src="/images/prompt-reviews-get-more-reviews-logo.png"
            alt="Prompt Reviews Logo"
            className="h-10 w-auto max-w-full object-contain"
            style={{ maxWidth: "200px" }}
          />
        </Link>
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
