import React from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import PromptReviewsLogo from "@/app/dashboard/components/PromptReviewsLogo";
import { usePathname } from "next/navigation";

export default function SimpleMarketingNav() {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  
  return (
    <nav className={`w-full z-50 sticky top-0 ${isAuthPage ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
      <div className="mx-auto max-w-[1000px] w-full flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <span className="h-16 w-auto flex items-center" aria-label="PromptReviews Logo">
            <PromptReviewsLogo size={120} color={isAuthPage ? "#FFFFFF" : "#2E4A7D"} />
          </span>
        </Link>
        {/* Main nav content */}
        <div className="flex-1 flex justify-end">
          <a
            href="https://promptreviews.app/"
            target="_blank"
            rel="noopener"
            className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded transition ${
              isAuthPage 
                ? 'text-white hover:text-gray-200' 
                : 'text-slate-blue hover:text-slate-blue/80'
            }`}
          >
            <Icon name="FaArrowLeft" className="w-4 h-4" size={16} />
            Back to main site
          </a>
        </div>
      </div>
    </nav>
  );
}
