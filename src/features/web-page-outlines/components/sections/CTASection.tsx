"use client";

import type { CTASection as CTASectionType } from "../../types";

interface CTASectionProps {
  data: CTASectionType;
}

export default function CTASection({ data }: CTASectionProps) {
  return (
    <div
      className="rounded-2xl px-8 py-10 text-center bg-white/90 border border-white/60 shadow-sm"
    >
        <h2 className="text-xl font-bold text-gray-900 mb-2">{data.heading}</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{data.subCopy}</p>
        <span className="inline-block px-8 py-3 bg-slate-blue text-white rounded-xl font-medium text-[15px] whitespace-nowrap shadow-md shadow-slate-blue/20">
          {data.buttonText}
        </span>
    </div>
  );
}
