"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HelpContentBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function HelpContentBreadcrumbs({
  items,
  className,
}: HelpContentBreadcrumbsProps) {
  return (
    <nav className={className} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-white/70">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium text-white/80 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-white">{item.label}</span>
              )}
              {!isLast && <span className="text-white/70">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
