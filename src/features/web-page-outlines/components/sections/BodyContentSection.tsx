"use client";

import { Tooltip } from "@/app/(app)/components/ui/Tooltip";
import HelpBubble from "@/components/ui/HelpBubble";
import type { BodySection } from "../../types";

interface BodyContentSectionProps {
  data: BodySection[];
}

export default function BodyContentSection({ data }: BodyContentSectionProps) {
  return (
    <div className="py-6 space-y-6">
      {data.map((section, i) => (
        <div
          key={i}
          className="rounded-xl p-5 bg-white/60 backdrop-blur-sm border border-white/40"
        >
          <div className="flex items-center gap-2 mb-3">
            <Tooltip content="H2 subheadings help search engines understand your content structure. Include keyword variations naturally.">
              <span className="text-xs font-mono text-slate-blue/70 bg-slate-blue/10 px-2 py-0.5 rounded-md border border-slate-blue/15">
                H2
              </span>
            </Tooltip>
            <h2 className="text-xl font-bold text-gray-900">{section.h2}</h2>
            {i === 0 && (
              <HelpBubble
                tooltip="Each section is written to stand alone - this helps AI systems like Google's SGE extract and cite your content."
                label="Learn about standalone content"
                size="sm"
              />
            )}
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
