import React from "react";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import PromptReviewsLogo from "@/app/dashboard/components/PromptReviewsLogo";

export default function SimpleMarketingNav() {
  return (
    <nav className="w-full bg-white shadow-sm z-50 sticky top-0">
      <div className="mx-auto max-w-[1000px] w-full flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <span className="h-16 w-auto flex items-center" aria-label="PromptReviews Logo">
            <PromptReviewsLogo size={120} color="#2E4A7D" />
          </span>
        </Link>
        {/* Main nav content */}
        <div className="flex-1 flex justify-end">
          <a
            href="https://promptreviews.app/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-slate-blue hover:text-slate-blue/80 font-bold text-sm px-4 py-2 rounded transition"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to main site
          </a>
        </div>
      </div>
    </nav>
  );
}
