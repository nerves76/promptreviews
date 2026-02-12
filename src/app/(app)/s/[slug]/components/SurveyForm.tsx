'use client';

import { useState } from 'react';
import { SurveyQuestion } from './SurveyQuestion';
import { ProgressBar } from './ProgressBar';
import { SurveyAnswer } from '@/features/surveys/types';

interface StyleConfig {
  cardBg: string;
  cardText: string;
  cardTransparency: number;
  cardPlaceholderColor: string;
  cardInnerShadow: boolean;
  secondaryColor: string;
  primaryFont: string;
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

const QUESTIONS_PER_PAGE = 10;

export function SurveyForm({ survey, questions, styleConfig, onSubmitted, onError }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const needsPagination = questions.length > QUESTIONS_PER_PAGE;
  const pageQuestions = needsPagination
    ? questions.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE)
    : questions;
  const isLastPage = currentPage >= totalPages - 1;

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

  const validateCurrentPage = (): boolean => {
    for (const q of pageQuestions) {
      if (q.is_required) {
        const answer = answers[q.id];
        if (answer === undefined || answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          onError(`Please answer: "${q.question_text}"`);
          return false;
        }
      }
    }
    onError('');
    return true;
  };

  const handleNextPage = () => {
    if (!validateCurrentPage()) return;
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    onError('');
    setCurrentPage(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const placeholderColor = styleConfig.cardPlaceholderColor;
  const inputBg = styleConfig.cardBg || '#F9FAFB';
  const innerShadow = styleConfig.cardInnerShadow
    ? 'inset 0 2px 4px 0 rgba(0,0,0,0.2), inset 0 1px 2px 0 rgba(0,0,0,0.15)'
    : 'none';

  // Input style matching prompt page pattern
  const inputStyle: React.CSSProperties = {
    background: inputBg,
    boxShadow: innerShadow,
    border: 'none',
    color: inputColor,
    WebkitTextFillColor: inputColor,
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* CSS for placeholder colors */}
      <style>{`
        .survey-input::placeholder {
          color: ${placeholderColor} !important;
          opacity: 1 !important;
        }
      `}</style>

      {survey.show_progress_bar && totalQuestions > 0 && (
        <ProgressBar current={answeredCount} total={totalQuestions} textColor={textColor} />
      )}

      {/* Respondent info */}
      {survey.collect_respondent_info && (
        <div className="mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
              Name
            </label>
            <input
              type="text"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              className="w-full py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm survey-input"
              style={inputStyle}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
              Email {survey.require_respondent_email && <span className="text-red-500">*</span>}
            </label>
            <input
              type="email"
              value={respondentEmail}
              onChange={(e) => setRespondentEmail(e.target.value)}
              required={survey.require_respondent_email}
              className="w-full py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm survey-input"
              style={inputStyle}
              placeholder="your@email.com"
            />
          </div>
        </div>
      )}

      {/* Page indicator */}
      {needsPagination && (
        <div className="flex justify-between items-center mb-4 text-sm" style={{ color: textColor }}>
          <span className="opacity-70">Page {currentPage + 1} of {totalPages}</span>
          <span className="opacity-70">Questions {currentPage * QUESTIONS_PER_PAGE + 1}–{Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, questions.length)} of {questions.length}</span>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {pageQuestions.map((question, index) => (
          <SurveyQuestion
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value)}
            textColor={textColor}
            inputColor={inputColor}
            inputBg={inputBg}
            innerShadow={innerShadow}
            placeholderColor={placeholderColor}
            index={currentPage * QUESTIONS_PER_PAGE + index}
          />
        ))}
      </div>

      {/* Navigation and submit */}
      <div className="mt-8 flex gap-3">
        {needsPagination && currentPage > 0 && (
          <button
            type="button"
            onClick={handlePrevPage}
            className="py-3 px-6 rounded-lg font-semibold text-base shadow-lg hover:opacity-90 focus:outline-none transition whitespace-nowrap"
            style={{
              backgroundColor: inputBg,
              color: textColor,
              fontFamily: styleConfig.primaryFont || 'Inter',
            }}
          >
            Previous
          </button>
        )}
        {needsPagination && !isLastPage ? (
          <button
            type="button"
            onClick={handleNextPage}
            className="flex-1 py-3 px-6 rounded-lg font-semibold text-base shadow-lg text-white hover:opacity-90 focus:outline-none transition whitespace-nowrap"
            style={{
              backgroundColor: styleConfig.secondaryColor || '#2E4A7D',
              fontFamily: styleConfig.primaryFont || 'Inter',
            }}
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 px-6 rounded-lg font-semibold text-lg shadow-lg text-white hover:opacity-90 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{
              backgroundColor: styleConfig.secondaryColor || '#2E4A7D',
              fontFamily: styleConfig.primaryFont || 'Inter',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </form>
  );
}
