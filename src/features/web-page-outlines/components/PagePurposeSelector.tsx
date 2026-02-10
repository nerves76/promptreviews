"use client";

import { Tooltip } from "@/app/(app)/components/ui/Tooltip";
import { PAGE_PURPOSE_OPTIONS, type PagePurpose } from "../types";

interface PagePurposeSelectorProps {
  selected: PagePurpose;
  onChange: (purpose: PagePurpose) => void;
}

export default function PagePurposeSelector({ selected, onChange }: PagePurposeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Page purpose
      </label>
      <div className="flex flex-wrap gap-2">
        {PAGE_PURPOSE_OPTIONS.map((opt) => (
          <Tooltip key={opt.value} content={opt.description}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 ${
                selected === opt.value
                  ? "bg-slate-blue text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-pressed={selected === opt.value}
            >
              {opt.label}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
