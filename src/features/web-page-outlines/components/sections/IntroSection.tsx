"use client";

import HelpBubble from "@/components/ui/HelpBubble";

interface IntroSectionProps {
  data: string;
}

export default function IntroSection({ data }: IntroSectionProps) {
  return (
    <div className="py-6">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
          Introduction
        </span>
        <HelpBubble
          tooltip="The opening paragraph should hook readers and include your keyword naturally within the first 100 words."
          label="Learn about intro content"
          size="sm"
        />
      </div>
      <div className="rounded-xl p-5 bg-white/60 backdrop-blur-sm border border-white/40">
        <p className="text-gray-700 text-[15px] leading-[1.8]">{data}</p>
      </div>
    </div>
  );
}
