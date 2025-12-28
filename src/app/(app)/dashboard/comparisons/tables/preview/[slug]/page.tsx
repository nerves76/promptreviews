"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useCoreAuth } from "@/auth/context/CoreAuthContext";
import { apiClient } from "@/utils/apiClient";
import Icon from "@/components/Icon";

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
  feature_type: string;
  category_id: string | null;
}

interface Competitor {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  features: { feature_id: string; has_feature: boolean; is_limited: boolean }[];
}

interface ComparisonTable {
  id: string;
  slug: string;
  name: string;
  table_type: "single" | "multi";
  status: string;
  competitor_ids: string[];
  single_competitor_id: string | null;
  category_ids: string[];
  promptreviews_overrides: Record<string, { hasFeature?: boolean; isLimited?: boolean }>;
  pricing_notes?: Record<string, string>;
}

export default function PreviewTablePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useCoreAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<ComparisonTable | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiClient.get<{
          table: ComparisonTable;
          categories: Category[];
          competitors: Competitor[];
          features: Feature[];
        }>(`/admin/comparisons/tables/${resolvedParams.slug}`);

        setTable(data.table);
        setCategories(data.categories || []);
        setCompetitors(data.competitors || []);
        setFeatures(data.features || []);
      } catch (err: any) {
        console.error("Error fetching table:", err);
        setError(err.message || "Failed to load table");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, resolvedParams.slug]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 flex items-center justify-center">
        <div className="text-white/80 backdrop-blur-sm bg-white/10 px-6 py-3 rounded-full">Loading preview...</div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 flex items-center justify-center">
        <div className="text-white backdrop-blur-sm bg-red-500/20 px-6 py-3 rounded-xl border border-red-300/30">
          {error || "Table not found"}
        </div>
      </div>
    );
  }

  // Filter data based on table config
  const selectedCategories = categories.filter((c) => table.category_ids.includes(c.id));
  const selectedCompetitors =
    table.table_type === "multi"
      ? competitors.filter((c) => table.competitor_ids.includes(c.id))
      : competitors.filter((c) => c.id === table.single_competitor_id);
  const selectedFeatures = features.filter(
    (f) => f.category_id && table.category_ids.includes(f.category_id)
  );

  // Group features by category
  const featuresByCategory = selectedCategories.map((cat) => ({
    ...cat,
    features: selectedFeatures.filter((f) => f.category_id === cat.id),
  }));

  const getCompetitorFeature = (competitor: Competitor, featureId: string) => {
    return competitor.features?.find((f) => f.feature_id === featureId);
  };

  const getPromptReviewsFeature = (featureSlug: string) => {
    const override = table.promptreviews_overrides?.[featureSlug];
    if (override) {
      return {
        hasFeature: override.hasFeature !== false,
        isLimited: override.isLimited || false,
      };
    }
    return { hasFeature: true, isLimited: false };
  };

  const renderFeatureValue = (hasFeature: boolean, isLimited: boolean, isPromptReviews: boolean = false) => {
    if (isLimited) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 bg-amber-400/20 text-amber-700 text-xs font-semibold rounded-full border border-amber-400/30">
          Limited
        </span>
      );
    }
    if (hasFeature) {
      return (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
          isPromptReviews
            ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30'
            : 'bg-emerald-100 text-emerald-600'
        }`}>
          <Icon name="FaCheck" size={12} />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 text-red-400">
        <Icon name="FaTimes" size={12} />
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400">
      {/* Top bar */}
      <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <Icon name="FaArrowLeft" size={16} />
          </button>
          <span className="text-sm text-white/90">
            Preview: <strong className="text-white">{table.name}</strong>
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            table.status === "published"
              ? "bg-emerald-400/20 text-emerald-100 border border-emerald-400/30"
              : "bg-amber-400/20 text-amber-100 border border-amber-400/30"
          }`}>
            {table.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span>Resize browser to test responsiveness</span>
        </div>
      </div>

      {/* Preview area */}
      <div className="p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Glass card container */}
          <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/10 shadow-[0_25px_60px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
            {/* Decorative gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
            <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-pink-300/20 blur-3xl" />

            {/* Table content */}
            <div className="relative z-10 overflow-x-auto">
              <table className="min-w-full">
                {/* Header */}
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-6 py-6 text-center w-1/4">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-300/50 to-purple-400/50 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-9 h-9 text-white" fill="currentColor">
                            <path d="M12 2C11.45 2 11 2.45 11 3V4.29L5.71 6.59C5.28 6.78 5 7.2 5 7.67L5 8L2 14C2 15.66 3.34 17 5 17C6.66 17 8 15.66 8 14L5 8L11 5.5V19H7V21H17V19H13V5.5L19 8L16 14C16 15.66 17.34 17 19 17C20.66 17 22 15.66 22 14L19 8V7.67C19 7.2 18.72 6.78 18.29 6.59L13 4.29V3C13 2.45 12.55 2 12 2ZM5 9.33L6.77 13H3.23L5 9.33ZM19 9.33L20.77 13H17.23L19 9.33Z"/>
                          </svg>
                        </div>
                        <span className="text-base font-bold text-white">Features</span>
                      </div>
                    </th>
                    {/* Prompt Reviews column - highlighted */}
                    <th className="px-4 py-6 text-center bg-white/10 border-x border-white/10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                          <svg viewBox="0 0 225 225" className="w-10 h-10 text-white" fill="currentColor">
                            <path fillRule="evenodd" d="M 82.375 7.867188 C 75.75 11.171875 67.027344 24.929688 59.957031 43.238281 C 55.550781 54.644531 56.246094 56.117188 69.203125 62.855469 C 76.160156 66.476562 76.519531 67.210938 70.445312 65.410156 C 63.566406 63.367188 59.089844 60.738281 46.339844 51.253906 C 31.546875 40.246094 29.222656 39.117188 22.179688 39.515625 C -2.902344 40.933594 -2.007812 84.523438 23.425781 100.242188 C 26.636719 102.226562 27.363281 107.472656 24.546875 108.367188 C 16.679688 110.863281 16.078125 146.238281 23.832031 150.417969 L 26.625 151.925781 L 27.109375 161.332031 C 28.25 183.464844 35.175781 193.601562 52.15625 197.996094 C 59.113281 199.796875 166.875 199.796875 173.832031 197.996094 C 190.46875 193.6875 197.679688 183.132812 198.886719 161.308594 L 199.363281 152.65625 L 202.039062 151.214844 C 206.609375 148.753906 206.9375 147.308594 206.917969 129.660156 C 206.898438 112.15625 206.804688 111.800781 201.671875 109.21875 C 197.058594 106.902344 197.972656 103.710938 204.875 98.042969 C 225.203125 81.359375 228.429688 51.421875 211.003906 41.171875 C 203.277344 36.625 195.855469 39 179.648438 51.207031 C 168.914062 59.289062 159.210938 64.585938 153.53125 65.464844 C 150.714844 65.898438 151.011719 65.632812 156.652344 62.699219 C 169.683594 55.917969 170.105469 55.113281 166.320312 44.316406 C 154.664062 11.066406 143.5 1.761719 123.367188 8.519531 C 113.101562 11.964844 112.375 11.96875 102.792969 8.605469 C 93.066406 5.195312 88.101562 5.015625 82.375 7.867188 M 85.371094 49.585938 C 69.445312 50.890625 67.394531 52.152344 76.160156 55.265625 C 99.246094 63.464844 140.515625 62.109375 155.457031 52.667969 C 159.820312 49.910156 108.796875 47.667969 85.371094 49.585938 M 44.234375 79.988281 C 41.246094 81.902344 37.332031 87.59375 36 91.960938 C 34.726562 96.136719 34.972656 164.753906 36.285156 171.132812 C 38.050781 179.726562 44.109375 186.835938 52.015625 189.59375 C 58.28125 191.777344 167.707031 191.777344 173.972656 189.59375 C 189 184.351562 190.730469 177.890625 190.40625 128.257812 C 190.140625 87.800781 190.175781 88.035156 183.085938 81.5 C 178.941406 77.679688 178.410156 77.675781 171.09375 81.421875 L 165.269531 84.402344 L 168.542969 84.957031 C 180.753906 87.019531 181.609375 90.527344 181 136.019531 C 180.332031 185.933594 187.40625 181.234375 112.992188 181.234375 C 38.015625 181.234375 45.40625 186.398438 44.933594 133.695312 C 44.546875 90.324219 45.074219 88.113281 56.402344 85.394531 L 60.363281 84.445312 L 54.070312 81.40625 C 46.734375 77.855469 47.410156 77.953125 44.234375 79.988281 M 76.710938 106.621094 C 63.355469 115.625 71.667969 142.847656 85.699219 136.054688 C 98.148438 130.03125 95.476562 104.867188 82.390625 104.867188 C 80.488281 104.867188 78.316406 105.539062 76.710938 106.621094 M 138.453125 106.835938 C 128.171875 115.484375 131.820312 136.808594 143.613281 136.96875 C 155.996094 137.140625 160.914062 114.828125 150.332031 106.5 C 147.265625 104.089844 141.523438 104.25 138.453125 106.835938 M 88.59375 148.679688 C 86.675781 150.597656 87.574219 153.722656 91.203125 157.757812 C 103.015625 170.898438 130.242188 168.609375 138.003906 153.828125 C 141.296875 147.550781 135.140625 145.519531 129.988281 151.179688 C 121.070312 160.976562 105.605469 161.347656 96.601562 151.976562 C 92.566406 147.777344 90.390625 146.882812 88.59375 148.679688" />
                          </svg>
                        </div>
                        <span className="text-base font-bold text-white">Prompt Reviews</span>
                      </div>
                    </th>
                    {/* Competitor columns */}
                    {selectedCompetitors.map((comp) => (
                      <th key={comp.id} className="px-4 py-6 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-300/50 to-purple-400/50 flex items-center justify-center overflow-hidden">
                            {comp.logo_url ? (
                              <img
                                src={comp.logo_url}
                                alt={comp.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('span');
                                    fallback.className = 'text-lg font-bold text-white';
                                    fallback.textContent = comp.name.charAt(0);
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-lg font-bold text-white">{comp.name.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-base font-bold text-white max-w-[120px] truncate">
                            {comp.name}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {featuresByCategory.map((category, catIndex) => (
                    <React.Fragment key={category.id}>
                      {/* Category header */}
                      <tr className="bg-black/10 border-b border-white/20">
                        <td
                          colSpan={2 + selectedCompetitors.length}
                          className="px-6 py-4 text-sm font-bold text-white/90 uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
                            {category.name}
                          </div>
                        </td>
                      </tr>

                      {/* Features */}
                      {category.features.map((feature, featureIndex) => {
                        const prFeature = getPromptReviewsFeature(feature.slug);
                        const isLastInCategory = featureIndex === category.features.length - 1;
                        const isLastCategory = catIndex === featuresByCategory.length - 1;

                        return (
                          <tr
                            key={feature.id}
                            className={`hover:bg-white/5 transition-colors ${
                              !isLastInCategory || !isLastCategory ? 'border-b border-white/10' : ''
                            }`}
                          >
                            <td className="px-6 py-4 text-sm text-white/90 font-medium">
                              {feature.benefit_framing || feature.name}
                            </td>
                            {/* Prompt Reviews value */}
                            <td className="px-4 py-4 text-center bg-white/5 border-x border-white/10">
                              {renderFeatureValue(prFeature.hasFeature, prFeature.isLimited, true)}
                            </td>
                            {/* Competitor values */}
                            {selectedCompetitors.map((comp) => {
                              const compFeature = getCompetitorFeature(comp, feature.id);
                              return (
                                <td key={comp.id} className="px-4 py-4 text-center">
                                  {renderFeatureValue(
                                    compFeature?.has_feature || false,
                                    compFeature?.is_limited || false,
                                    false
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}

                  {/* Pricing notes row */}
                  {table.pricing_notes && Object.keys(table.pricing_notes).length > 0 && (
                    <>
                      <tr className="bg-black/10 border-b border-white/20">
                        <td
                          colSpan={2 + selectedCompetitors.length}
                          className="px-6 py-4 text-sm font-bold text-white/90 uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
                            Pricing
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white/90 font-medium">
                          Starting price
                        </td>
                        <td className="px-4 py-4 text-center bg-white/5 border-x border-white/10">
                          <span className="text-sm text-white/80">
                            {table.pricing_notes.promptreviews || "—"}
                          </span>
                        </td>
                        {selectedCompetitors.map((comp) => (
                          <td key={comp.id} className="px-4 py-4 text-center">
                            <span className="text-sm text-white/70">
                              {table.pricing_notes?.[comp.slug] || "—"}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Viewport indicator */}
          <div className="mt-6 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/60 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="sm:hidden">Mobile (&lt;640px)</span>
              <span className="hidden sm:inline md:hidden">Tablet (640-768px)</span>
              <span className="hidden md:inline lg:hidden">Small Desktop (768-1024px)</span>
              <span className="hidden lg:inline">Desktop (1024px+)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
