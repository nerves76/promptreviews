"use client";

import { Tooltip } from "@/app/(app)/components/ui/Tooltip";
import type { BodySection } from "../../types";

interface BodyContentSectionProps {
  data: BodySection[];
}

export default function BodyContentSection({ data }: BodyContentSectionProps) {
  return (
    <div className="space-y-6">
      {data.map((section, i) => (
        <div
          key={i}
          className="rounded-xl p-5 bg-white/90 border border-white/60 max-w-[750px]"
        >
          <div className="flex items-center gap-2 mb-3">
            <Tooltip content="H2 subheadings help search engines understand your content structure. Include keyword variations naturally.">
              <span className="text-xs font-mono text-slate-blue/70 bg-slate-blue/10 px-2 py-0.5 rounded-md border border-slate-blue/15">
                H2
              </span>
            </Tooltip>
            <h2 className="text-xl font-bold text-gray-900">{section.h2}</h2>
          </div>
          <div className="space-y-4">
            {section.paragraphs.map((paragraph, j) => (
              <p
                key={j}
                className="text-gray-700 text-[15px] leading-[1.8]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
