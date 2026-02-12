'use client';

import { SurveyResponseSummary, QuestionSummary } from '../types';

interface ResponsesSummaryProps {
  summary: SurveyResponseSummary;
}

function RatingCard({ question }: { question: QuestionSummary }) {
  const avg = question.averageRating?.toFixed(1) ?? '-';
  const dist = question.ratingDistribution || {};

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-2 truncate" title={question.question_text}>
        {question.question_text}
      </h4>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-slate-blue">{avg}</span>
        <span className="text-sm text-gray-500">avg rating</span>
        <span className="text-xs text-gray-500 ml-auto">{question.responseCount} responses</span>
      </div>
      <div className="space-y-1">
        {Object.entries(dist)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([rating, count]) => {
            const pct = question.responseCount ? Math.round((count / question.responseCount!) * 100) : 0;
            return (
              <div key={rating} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right text-gray-600">{rating}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-slate-blue rounded-full h-2 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500">{pct}%</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function ChoiceCard({ question }: { question: QuestionSummary }) {
  const dist = question.choiceDistribution || {};
  const total = Object.values(dist).reduce((sum, n) => sum + n, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3 truncate" title={question.question_text}>
        {question.question_text}
      </h4>
      <div className="space-y-2">
        {Object.entries(dist)
          .sort(([, a], [, b]) => b - a)
          .map(([choice, count]) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={choice} className="flex items-center gap-2 text-sm">
                <span className="flex-1 text-gray-700 truncate" title={choice}>{choice}</span>
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-slate-blue rounded-full h-2 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs text-gray-500">{count} ({pct}%)</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export function ResponsesSummary({ summary }: ResponsesSummaryProps) {
  if (summary.totalResponses === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No responses to summarize yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-blue/5 border border-slate-blue/20 rounded-lg p-4 flex items-center gap-4">
        <div>
          <span className="text-3xl font-bold text-slate-blue">{summary.totalResponses}</span>
          <span className="text-sm text-gray-600 ml-2">total responses</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summary.questionSummaries.map((qs) => {
          if (qs.question_type === 'rating_star' || qs.question_type === 'rating_number') {
            return <RatingCard key={qs.question_id} question={qs} />;
          }
          if (qs.question_type === 'multiple_choice_single' || qs.question_type === 'multiple_choice_multi') {
            return <ChoiceCard key={qs.question_id} question={qs} />;
          }
          // Text questions - just show count
          return (
            <div key={qs.question_id} className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2 truncate" title={qs.question_text}>
                {qs.question_text}
              </h4>
              <span className="text-2xl font-bold text-slate-blue">{qs.responseCount}</span>
              <span className="text-sm text-gray-500 ml-2">text responses</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
