"use client";

import type { BenefitCard } from "../../types";

interface BenefitsSectionProps {
  data: BenefitCard[];
}

export default function BenefitsSection({ data }: BenefitsSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((card, i) => (
          <div
            key={i}
            className="rounded-xl p-5 bg-white/90 border border-white/60 shadow-sm"
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
  );
}
