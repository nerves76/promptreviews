"use client";

import type { FooterSection as FooterSectionType } from "../../types";

interface FooterSectionProps {
  data: FooterSectionType;
}

export default function FooterSection({ data }: FooterSectionProps) {
  return (
    <div className="pt-6 mt-4 border-t border-white/30">
      <p className="text-sm text-white/70 leading-relaxed text-center">{data.content}</p>
    </div>
  );
}
