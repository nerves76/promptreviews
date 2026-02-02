"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import type { BusinessInfoForOutline } from "../types";

interface BusinessInfoPanelProps {
  businessInfo: BusinessInfoForOutline;
  onChange: (info: BusinessInfoForOutline) => void;
  hasBusiness: boolean;
}

const FIELD_CONFIG: {
  key: keyof BusinessInfoForOutline;
  label: string;
  multiline?: boolean;
}[] = [
  { key: "name", label: "Business name" },
  { key: "aboutUs", label: "About us", multiline: true },
  { key: "servicesOffered", label: "Services offered", multiline: true },
  { key: "differentiators", label: "Differentiators", multiline: true },
  { key: "industriesServed", label: "Industries served" },
  { key: "yearsInBusiness", label: "Years in business" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "companyValues", label: "Company values", multiline: true },
  { key: "aiDos", label: "AI content guidelines (do)", multiline: true },
  { key: "aiDonts", label: "AI content guidelines (don't)", multiline: true },
];

export default function BusinessInfoPanel({
  businessInfo,
  onChange,
  hasBusiness,
}: BusinessInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!hasBusiness) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          No business profile found
        </p>
        <Link
          href="/dashboard/business-profile"
          className="text-sm text-slate-blue hover:underline"
        >
          Set up your business profile
        </Link>
      </div>
    );
  }

  const filledFields = FIELD_CONFIG.filter(
    (f) => businessInfo[f.key]?.trim()
  ).length;

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
        aria-expanded={isExpanded}
        aria-label="Toggle business info panel"
      >
        <div className="flex items-center gap-2">
          <Icon name="FaStore" size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Business info
          </span>
          <span className="text-xs text-gray-500">
            ({filledFields}/{FIELD_CONFIG.length} fields)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              className="text-xs text-slate-blue hover:underline whitespace-nowrap"
              aria-label={isEditing ? "Lock editing" : "Enable editing"}
            >
              {isEditing ? "Done editing" : "Edit for this generation"}
            </button>
          )}
          <Icon
            name={isExpanded ? "FaChevronUp" : "FaChevronDown"}
            size={10}
            className="text-gray-400"
          />
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {isEditing && (
            <p className="text-xs text-gray-500">
              Edits here are only used for this outline generation and won&apos;t
              update your business profile.
            </p>
          )}
          {FIELD_CONFIG.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={`biz-${field.key}`}
                className="block text-xs font-medium text-gray-600 mb-0.5"
              >
                {field.label}
              </label>
              {isEditing ? (
                field.multiline ? (
                  <textarea
                    id={`biz-${field.key}`}
                    value={businessInfo[field.key]}
                    onChange={(e) =>
                      onChange({ ...businessInfo, [field.key]: e.target.value })
                    }
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-blue resize-none"
                  />
                ) : (
                  <input
                    id={`biz-${field.key}`}
                    type="text"
                    value={businessInfo[field.key]}
                    onChange={(e) =>
                      onChange({ ...businessInfo, [field.key]: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-blue"
                  />
                )
              ) : (
                <p className="text-sm text-gray-600 truncate">
                  {businessInfo[field.key] || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
