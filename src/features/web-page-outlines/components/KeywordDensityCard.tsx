"use client";

import HelpBubble from "@/components/ui/HelpBubble";
import { getDensityColor } from "../utils/keywordDensity";
import type { KeywordDensity } from "../types";

interface KeywordDensityCardProps {
  data: KeywordDensity;
}

const COLOR_CLASSES = {
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Optimal",
  },
  yellow: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Suboptimal",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Over-optimized",
  },
};

export default function KeywordDensityCard({ data }: KeywordDensityCardProps) {
  const color = getDensityColor(data.densityPercent);
  const styles = COLOR_CLASSES[color];

  return (
    <div className={`border ${styles.border} rounded-lg p-4 backdrop-blur-sm shadow-sm`} style={{ background: "rgba(255,255,255,0.92)" }}>
      <div className="flex items-center gap-1 mb-3">
        <h3 className="font-semibold text-gray-900">Keyword density</h3>
        <HelpBubble
          tooltip="Aim for 1-3% keyword density. Too low means missed relevance signals; too high risks keyword stuffing penalties."
          label="Learn about keyword density"
          size="sm"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-gray-600 block text-xs">Keyword</span>
          <span className="font-medium text-gray-900">{data.keyword}</span>
        </div>
        <div>
          <span className="text-gray-600 block text-xs">Occurrences</span>
          <span className="font-medium text-gray-900">{data.occurrences}</span>
        </div>
        <div>
          <span className="text-gray-600 block text-xs">Total words</span>
          <span className="font-medium text-gray-900">{data.totalWords}</span>
        </div>
        <div>
          <span className="text-gray-600 block text-xs">Density</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
            <span className={`font-medium ${styles.text}`}>
              {data.densityPercent}%
            </span>
            <span className={`text-xs ${styles.text}`}>({styles.label})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
