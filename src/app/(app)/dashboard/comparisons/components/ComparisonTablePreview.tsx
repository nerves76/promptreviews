"use client";

import React from "react";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
}

interface Feature {
  id: string;
  slug: string;
  name: string;
  benefit_framing: string | null;
  description: string | null;
  feature_type: string;
  category_id: string | null;
}

interface Competitor {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  features: { feature_id: string; has_feature: boolean; is_limited: boolean; notes: string | null }[];
}

interface Props {
  tableType: "single" | "multi";
  competitors: Competitor[];
  categories: Category[];
  features: Feature[];
  promptreviewsOverrides: Record<string, { hasFeature?: boolean; isLimited?: boolean; notes?: string }>;
  design: Record<string, unknown>;
}

export default function ComparisonTablePreview({
  tableType,
  competitors,
  categories,
  features,
  promptreviewsOverrides,
}: Props) {
  if (competitors.length === 0 || categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Select competitors and categories to see preview</p>
      </div>
    );
  }

  // Group features by category
  const featuresByCategory = features.reduce(
    (acc, feature) => {
      const catId = feature.category_id || "uncategorized";
      if (!acc[catId]) acc[catId] = [];
      acc[catId].push(feature);
      return acc;
    },
    {} as Record<string, Feature[]>
  );

  const getFeatureValue = (
    competitor: Competitor,
    feature: Feature
  ): { hasFeature: boolean; isLimited: boolean } => {
    const compFeature = competitor.features?.find((f) => f.feature_id === feature.id);
    return {
      hasFeature: compFeature?.has_feature ?? false,
      isLimited: compFeature?.is_limited ?? false,
    };
  };

  const getPromptReviewsValue = (feature: Feature): { hasFeature: boolean; isLimited: boolean } => {
    const override = promptreviewsOverrides[feature.slug];
    return {
      hasFeature: override?.hasFeature ?? true,
      isLimited: override?.isLimited ?? false,
    };
  };

  const renderCheck = (hasFeature: boolean, isLimited: boolean) => {
    if (isLimited) {
      return (
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
          Limited
        </span>
      );
    }
    if (hasFeature) {
      return <span className="text-green-600 text-lg font-bold">✓</span>;
    }
    return <span className="text-red-400 text-lg">✗</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-3 px-2 text-left font-medium text-gray-700 w-1/3">Feature</th>
            {/* PromptReviews column - always first (F-pattern) */}
            <th className="py-3 px-2 text-center font-medium bg-indigo-50 text-indigo-900">
              <div className="relative group">
                <div className="flex flex-col items-center gap-1 cursor-pointer">
                  <span className="text-xs text-indigo-600 group-hover:text-indigo-800 transition-colors">Prompt Reviews</span>
                </div>
                {/* Hover card tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-150 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-l border-t border-gray-700 rotate-45" />
                    <p className="text-sm text-white leading-relaxed relative z-10">
                      Prompt Reviews is a marketing platform and community that helps small businesses grow by turning trust building into sustainable growth. It's human-first and AI-assisted, focused on review capture, Google Business Profile management, and tracking performance in local and AI-driven search.
                    </p>
                  </div>
                </div>
              </div>
            </th>
            {/* Competitor columns */}
            {competitors.map((comp) => (
              <th key={comp.id} className="py-3 px-2 text-center font-medium text-gray-700">
                <div className="relative group">
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    {comp.logo_url ? (
                      <img
                        src={comp.logo_url}
                        alt={comp.name}
                        className="w-6 h-6 rounded object-contain transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center transition-transform group-hover:scale-110">
                        <span className="text-xs">{comp.name[0]}</span>
                      </div>
                    )}
                    <span className="text-xs truncate max-w-20">{comp.name}</span>
                  </div>
                  {/* Hover card tooltip */}
                  {comp.description && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-150 z-50 pointer-events-none group-hover:pointer-events-auto">
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-l border-t border-gray-700 rotate-45" />
                        <p className="text-sm text-white leading-relaxed relative z-10">
                          {comp.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <React.Fragment key={category.id}>
              {/* Category header */}
              <tr className="bg-gray-50">
                <td
                  colSpan={2 + competitors.length}
                  className="py-2 px-2 font-semibold text-gray-800 text-xs uppercase tracking-wide"
                >
                  {category.name}
                </td>
              </tr>

              {/* Features in category */}
              {(featuresByCategory[category.id] || []).map((feature) => {
                const prValue = getPromptReviewsValue(feature);

                return (
                  <tr key={feature.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-700">
                      <div className="flex items-center gap-1.5">
                        {feature.benefit_framing || feature.name}
                        {feature.description && (
                          <div className="relative group/tip">
                            <div className="w-3.5 h-3.5 rounded-full bg-gray-200 flex items-center justify-center cursor-help hover:bg-gray-300 transition-colors">
                              <span className="text-[9px] text-gray-500 font-medium">?</span>
                            </div>
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-56 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 z-50 pointer-events-none">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-xl">
                                <p className="text-xs text-white leading-relaxed">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* PromptReviews value */}
                    <td className="py-2 px-2 text-center bg-indigo-50/50">
                      {renderCheck(prValue.hasFeature, prValue.isLimited)}
                    </td>
                    {/* Competitor values */}
                    {competitors.map((comp) => {
                      const value = getFeatureValue(comp, feature);
                      return (
                        <td key={comp.id} className="py-2 px-2 text-center">
                          {renderCheck(value.hasFeature, value.isLimited)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {features.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No features in selected categories
        </div>
      )}
    </div>
  );
}
