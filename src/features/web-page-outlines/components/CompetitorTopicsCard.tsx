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
    <div
      className="border border-gray-200 rounded-lg p-4 backdrop-blur-sm shadow-sm space-y-4"
      style={{ background: "rgba(255,255,255,0.92)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-1">
        <h3 className="font-semibold text-gray-900">Competitor topics</h3>
        <HelpBubble
          tooltip="Topics extracted from the top-ranking pages for your keyword. Must-cover topics appear on every competitor page."
          label="Learn about competitor topics"
          size="sm"
        />
      </div>

      {/* Competitor URLs */}
      {urls.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
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
        <div className="flex items-center gap-1.5 text-sm">
          <Icon name="FaFileAlt" size={11} className="text-gray-500" />
          <span className="text-gray-600">
            Target length:{" "}
            <span className="font-medium text-gray-900">
              {wordCountTarget.min.toLocaleString()}&ndash;{wordCountTarget.max.toLocaleString()} words
            </span>
            <span className="text-gray-500 ml-1">
              (median: ~{wordCountTarget.median.toLocaleString()})
            </span>
          </span>
        </div>
      )}

      {/* Topic clusters */}
      {topics.length > 0 && (
        <div className="space-y-3">
          {mustCover.length > 0 && (
            <TopicGroup
              label={`Must-cover (all ${totalCompetitors} pages)`}
              topics={mustCover}
              dotColor="bg-green-500"
            />
          )}
          {recommended.length > 0 && (
            <TopicGroup
              label={`Recommended (${recommended[0].frequency} of ${totalCompetitors})`}
              topics={recommended}
              dotColor="bg-amber-500"
            />
          )}
          {unique.length > 0 && (
            <TopicGroup
              label="Unique angles (1 page)"
              topics={unique}
              dotColor="bg-gray-400"
            />
          )}
        </div>
      )}

      {topics.length === 0 && urls.length > 0 && (
        <p className="text-xs text-gray-500">
          Not enough competitor data to identify shared topics.
        </p>
      )}
    </div>
  );
}

function TopicGroup({
  label,
  topics,
  dotColor,
}: {
  label: string;
  topics: { topic: string; sampleSnippet?: string }[];
  dotColor: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <ul className="space-y-1">
        {topics.map((t) => (
          <li key={t.topic} className="flex items-start gap-1.5 text-sm">
            <span
              className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5 flex-shrink-0`}
            />
            <div>
              <span className="font-medium text-gray-900">{t.topic}</span>
              {t.sampleSnippet && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {t.sampleSnippet}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
