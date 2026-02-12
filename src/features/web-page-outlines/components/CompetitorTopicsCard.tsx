"use client";

import Icon from "@/components/Icon";
import HelpBubble from "@/components/ui/HelpBubble";
import type { CompetitorData } from "../types";

interface CompetitorTopicsCardProps {
  data: CompetitorData;
  keyword: string;
}

export default function CompetitorTopicsCard({
  data,
  keyword,
}: CompetitorTopicsCardProps) {
  const { urls, topics, wordCountTarget } = data;
  const totalCompetitors = urls.length;

  const mustCover = topics.filter((t) => t.frequency === totalCompetitors);
  const recommended = topics.filter(
    (t) => t.frequency > 1 && t.frequency < totalCompetitors
  );
  const unique = topics.filter((t) => t.frequency === 1);

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-white/40 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <Icon name="FaChartLine" size={14} className="text-slate-blue" />
        <h3 className="font-semibold text-gray-900">Competitive landscape</h3>
        <HelpBubble
          tooltip="Topics extracted from the top-ranking pages for your keyword. Must-cover topics appear on every competitor page."
          label="Learn about competitor topics"
          size="sm"
        />
      </div>

      {/* Top section: competitor URLs + word count target */}
      {(urls.length > 0 || wordCountTarget) && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Competitor URLs */}
            {urls.length > 0 && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Top {urls.length} result{urls.length !== 1 ? "s" : ""} for
                  &ldquo;{keyword}&rdquo;
                </p>
                <ol className="space-y-1 list-decimal list-inside">
                  {urls.map((comp) => (
                    <li key={comp.url} className="text-sm text-gray-600">
                      <a
                        href={comp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-blue hover:underline"
                      >
                        {comp.title || comp.url}
                      </a>
                      <span className="text-gray-500 ml-1">
                        (~{comp.wordCount.toLocaleString()} words)
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Word count target */}
            {wordCountTarget && (
              <div className="sm:border-l sm:border-gray-200 sm:pl-4 flex-shrink-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Target length
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {wordCountTarget.min.toLocaleString()}&ndash;{wordCountTarget.max.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500 ml-1">words</span>
                </p>
                <p className="text-xs text-gray-500">
                  Median: ~{wordCountTarget.median.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topic clusters */}
      {topics.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Topic coverage
          </p>

          <div className="space-y-4">
            {mustCover.length > 0 && (
              <TopicGroup
                label={`Must-cover (all ${totalCompetitors} pages)`}
                topics={mustCover}
                badgeColor="bg-green-100 text-green-700"
                dotColor="bg-green-500"
              />
            )}
            {recommended.length > 0 && (
              <TopicGroup
                label={`Recommended (${recommended[0].frequency} of ${totalCompetitors})`}
                topics={recommended}
                badgeColor="bg-amber-100 text-amber-700"
                dotColor="bg-amber-500"
              />
            )}
            {unique.length > 0 && (
              <TopicGroup
                label="Unique angles (1 page)"
                topics={unique}
                badgeColor="bg-gray-100 text-gray-600"
                dotColor="bg-gray-400"
              />
            )}
          </div>
        </div>
      )}

      {topics.length === 0 && urls.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-sm text-gray-500">
            Not enough competitor data to identify shared topics.
          </p>
        </div>
      )}
    </div>
  );
}

function TopicGroup({
  label,
  topics,
  badgeColor,
  dotColor,
}: {
  label: string;
  topics: { topic: string; sampleSnippet?: string }[];
  badgeColor: string;
  dotColor: string;
}) {
  return (
    <div>
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 whitespace-nowrap ${badgeColor}`}>
        {label}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {topics.map((t) => (
          <div key={t.topic} className="flex items-start gap-2 text-sm">
            <span
              className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5 flex-shrink-0`}
            />
            <div className="min-w-0">
              <span className="font-medium text-gray-900">{t.topic}</span>
              {t.sampleSnippet && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {t.sampleSnippet}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
