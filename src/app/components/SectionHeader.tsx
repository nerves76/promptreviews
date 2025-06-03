import React from "react";

/**
 * SectionHeader component
 *
 * Usage: For all section/module headers with icon, title, and subcopy.
 * - Always use for major sections in forms, cards, and modules.
 * - Pass icon, title, and (optionally) subCopy.
 * - For main page titles, override with titleClassName (e.g., text-4xl font-bold text-slate-blue).
 * - Subcopy is left-aligned with the title by default.
 *
 * See DESIGN_GUIDELINES.md for visual rules and examples.
 */

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subCopy?: string;
  className?: string;
  subCopyLeftOffset?: string;
  titleClassName?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subCopy,
  className = "",
  subCopyLeftOffset = "",
  titleClassName,
}) => (
  <div className={`w-full ${className}`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className={titleClassName || "text-2xl font-bold text-[#1A237E]"}>
        {title}
      </span>
    </div>
    {subCopy && (
      <div
        className={`text-sm text-gray-700 mt-[3px] px-0 ${subCopyLeftOffset}`}
      >
        {subCopy}
      </div>
    )}
  </div>
);

export default SectionHeader;
