'use client';

import { useState } from 'react';
import { SurveyQuestion } from './SurveyQuestion';
import { ProgressBar } from './ProgressBar';
import { SurveyAnswer } from '@/features/surveys/types';

interface StyleConfig {
  cardText: string;
  inputTextColor: string;
  [key: string]: any;
}

interface SurveyFormProps {
  survey: any;
  questions: any[];
  styleConfig: StyleConfig;
  onSubmitted: () => void;
  onError: (error: string) => void;
}

export function SurveyForm({ survey, questions, styleConfig, onSubmitted, onError }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = Object.keys(answers).filter(k => {
    const val = answers[k];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  const totalQuestions = questions.length;

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');

    // Validate required fields
    for (const q of questions) {
      if (q.is_required) {
        const answer = answers[q.id];
        if (answer === undefined || answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          onError(`Please answer: "${q.question_text}"`);
          return;
        }
      }
    }

    if (survey.require_respondent_email && !respondentEmail.trim()) {
      onError('Email is required for this survey');
      return;
    }

    setSubmitting(true);

    try {
      // Build answers array
      const formattedAnswers: SurveyAnswer[] = questions
        .filter(q => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '')
        .map(q => ({
          question_id: q.id,
          question_type: q.question_type,
          answer: answers[q.id],
        }));

      // Detect source channel from URL params
      const urlParams = new URLSearchParams(window.location.search);
      let sourceChannel = 'direct';
      if (urlParams.get('source') === 'qr') sourceChannel = 'qr';
      else if (urlParams.get('source') === 'email') sourceChannel = 'email';
      else if (urlParams.get('source') === 'sms') sourceChannel = 'sms';

      const response = await fetch('/api/surveys/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: survey.id,
          answers: formattedAnswers,
          respondent_name: respondentName || null,
          respondent_email: respondentEmail || null,
          source_channel: sourceChannel,
          utm_params: Object.fromEntries(
            Array.from(urlParams.entries()).filter(([k]) => k.startsWith('utm_'))
          ),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit response');
      }

      onSubmitted();
    } catch (err: any) {
      onError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const textColor = styleConfig.cardText;
  const inputColor = styleConfig.inputTextColor;

  return (
    <form onSubmit={handleSubmit}>
      {survey.show_progress_bar && totalQuestions > 0 && (
        <ProgressBar current={answeredCount} total={totalQuestions} textColor={textColor} />
      )}

      {/* Respondent info */}
      {survey.collect_respondent_info && (
        <div className="mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: textColor }}>
              Name
            </label>
            <input
              type="text"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              className="w-full p-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={{ color: inputColor }}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: textColor }}>
              Email {survey.require_respondent_email && <span className="text-red-300">*</span>}
            </label>
            <input
              type="email"
              value={respondentEmail}
              onChange={(e) => setRespondentEmail(e.target.value)}
              required={survey.require_respondent_email}
              className="w-full p-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={{ color: inputColor }}
              placeholder="your@email.com"
            />
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <SurveyQuestion
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value)}
            textColor={textColor}
            inputColor={inputColor}
            index={index}
          />
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="mt-8 w-full py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm whitespace-nowrap"
        style={{ color: textColor }}
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
