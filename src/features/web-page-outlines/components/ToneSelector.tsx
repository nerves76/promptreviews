"use client";

import { Tooltip } from "@/app/(app)/components/ui/Tooltip";
import { TONE_OPTIONS, type OutlineTone } from "../types";

interface ToneSelectorProps {
  selected: OutlineTone;
  onChange: (tone: OutlineTone) => void;
}

export default function ToneSelector({ selected, onChange }: ToneSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Content tone
      </label>
      <div className="flex flex-wrap gap-2">
        {TONE_OPTIONS.map((opt) => (
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
