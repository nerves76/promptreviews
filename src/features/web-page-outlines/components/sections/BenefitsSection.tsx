"use client";

import HelpBubble from "@/components/ui/HelpBubble";
import type { BenefitCard } from "../../types";

interface BenefitsSectionProps {
  data: BenefitCard[];
}

export default function BenefitsSection({ data }: BenefitsSectionProps) {
  return (
    <div className="py-6">
      <div className="flex items-center gap-1.5 mb-5">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Key benefits
        </span>
        <HelpBubble
          tooltip="Benefit-focused content demonstrates expertise and builds trust (E-E-A-T), which Google rewards in rankings."
          label="Learn about E-E-A-T signals"
          size="sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((card, i) => (
          <div
            key={i}
            className="rounded-xl p-5 bg-white/70 backdrop-blur-sm border border-white/40 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-2 text-[15px]">
              {card.heading}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
