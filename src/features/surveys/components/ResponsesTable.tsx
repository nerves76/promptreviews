'use client';

import { SurveyResponse, SurveyQuestion } from '../types';

interface ResponsesTableProps {
  responses: SurveyResponse[];
  questions: SurveyQuestion[];
}

export function ResponsesTable({ responses, questions }: ResponsesTableProps) {
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  if (responses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No responses yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Respondent
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Source
            </th>
            {sortedQuestions.map((q) => (
              <th
                key={q.id}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[200px] truncate"
                title={q.question_text}
              >
                {q.question_text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {responses.map((response) => {
            const answerMap = new Map<string, any>();
            for (const a of response.answers || []) {
              answerMap.set(a.question_id, a.answer);
            }

            return (
              <tr key={response.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(response.submitted_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {response.respondent_name || response.respondent_email || 'Anonymous'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap capitalize">
                  {response.source_channel}
                </td>
                {sortedQuestions.map((q) => {
                  const answer = answerMap.get(q.id);
                  let displayValue = '';
                  if (answer === undefined || answer === null) {
                    displayValue = '-';
                  } else if (Array.isArray(answer)) {
                    displayValue = answer.join(', ');
                  } else if (q.question_type === 'rating_star') {
                    displayValue = '★'.repeat(Number(answer));
                  } else {
                    displayValue = String(answer);
                  }

                  return (
                    <td
                      key={q.id}
                      className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate"
                      title={displayValue}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
