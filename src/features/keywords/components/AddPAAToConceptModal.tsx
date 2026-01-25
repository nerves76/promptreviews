'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { ConceptPicker } from './ConceptPicker';
import { useKeywords } from '../hooks/useKeywords';
import type { KeywordData, RelatedQuestion } from '../keywordUtils';

type FunnelStage = 'top' | 'middle' | 'bottom';
type AddMode = 'new' | 'existing';

interface AddPAAToConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: string[];
  mode: 'bulk' | 'individual';
  onSuccess: () => void;
}

interface BulkCreateResponse {
  created: number;
  skipped: number;
  concepts: KeywordData[];
}

const FUNNEL_STAGE_LABELS: Record<FunnelStage, { label: string; description: string }> = {
  top: { label: 'Top of funnel', description: 'Awareness / educational' },
  middle: { label: 'Middle of funnel', description: 'Consideration / comparison' },
  bottom: { label: 'Bottom of funnel', description: 'Decision / intent' },
};

/**
 * Modal for adding PAA questions to LLM tracking.
 * Supports two modes:
 * - individual: Add a single question to an existing concept or create a new one
 * - bulk: Create new concepts from multiple questions
 */
export function AddPAAToConceptModal({
  isOpen,
  onClose,
  questions,
  mode,
  onSuccess,
}: AddPAAToConceptModalProps) {
  const { keywords, groups, updateKeyword, refresh } = useKeywords();

  // Individual mode state
  const [addMode, setAddMode] = useState<AddMode>('new');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [newConceptName, setNewConceptName] = useState('');

  // Common state
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('middle');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  // Reset state when modal opens/closes
  const handleClose = useCallback(() => {
    setAddMode('new');
    setSelectedConceptId(null);
    setNewConceptName('');
    setFunnelStage('middle');
    setSelectedGroupId(null);
    setError(null);
    setResult(null);
    onClose();
  }, [onClose]);

  // Initialize concept name when modal opens (for individual mode)
  const displayQuestion = questions[0] || '';
  if (isOpen && mode === 'individual' && !newConceptName && displayQuestion) {
    setNewConceptName(displayQuestion.slice(0, 100));
  }

  // Handle individual submit
  const handleIndividualSubmit = useCallback(async () => {
    const question = questions[0];
    if (!question) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (addMode === 'existing' && selectedConceptId) {
        // Add question to existing concept
        const concept = keywords.find(k => k.id === selectedConceptId);
        if (!concept) {
          throw new Error('Selected concept not found');
        }

        // Check for duplicate
        const existingQuestions = concept.relatedQuestions || [];
        const isDuplicate = existingQuestions.some(
          q => q.question.toLowerCase().trim() === question.toLowerCase().trim()
        );

        if (isDuplicate) {
          throw new Error('This question is already added to this concept');
        }

        // Add the new question
        const newQuestion: RelatedQuestion = {
          question: question,
          funnelStage: funnelStage,
          addedAt: new Date().toISOString(),
        };

        await updateKeyword(selectedConceptId, {
          relatedQuestions: [...existingQuestions, newQuestion],
        });

        await refresh();
        onSuccess();
        handleClose();
      } else {
        // Create new concept
        const response = await apiClient.post<BulkCreateResponse>('/keywords/bulk-from-paa', {
          questions: [question],
          funnelStage: funnelStage,
          groupId: selectedGroupId || undefined,
        });

        if (response.created > 0) {
          await refresh();
          onSuccess();
          handleClose();
        } else {
          throw new Error('A concept with this question already exists');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add question';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    questions,
    addMode,
    selectedConceptId,
    funnelStage,
    selectedGroupId,
    keywords,
    updateKeyword,
    refresh,
    onSuccess,
    handleClose,
  ]);

  // Handle bulk submit
  const handleBulkSubmit = useCallback(async () => {
    if (questions.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post<BulkCreateResponse>('/keywords/bulk-from-paa', {
        questions: questions,
        funnelStage: funnelStage,
        groupId: selectedGroupId || undefined,
      });

      setResult({ created: response.created, skipped: response.skipped });
      await refresh();

      // Auto-close after short delay to show result
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create concepts';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  }, [questions, funnelStage, selectedGroupId, refresh, onSuccess, handleClose]);

  // Render individual mode content
  const renderIndividualContent = () => (
    <>
      {/* Question display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700 italic">&quot;{displayQuestion}&quot;</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setAddMode('new')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            addMode === 'new'
              ? 'bg-slate-blue text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Create new concept
        </button>
        <button
          type="button"
          onClick={() => setAddMode('existing')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            addMode === 'existing'
              ? 'bg-slate-blue text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Add to existing
        </button>
      </div>

      {/* Mode-specific content */}
      {addMode === 'new' ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concept name
            </label>
            <input
              type="text"
              value={newConceptName}
              onChange={(e) => setNewConceptName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30"
              placeholder="Enter concept name..."
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be the name of the keyword concept
            </p>
          </div>

          {/* Group selector for new concept */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group (optional)
            </label>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30"
            >
              <option value="">General</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select concept
          </label>
          <ConceptPicker
            value={selectedConceptId}
            onChange={(id) => setSelectedConceptId(id)}
            placeholder="Search for a concept..."
          />
        </div>
      )}

      {/* Funnel stage selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Funnel stage
        </label>
        <div className="space-y-2">
          {(Object.entries(FUNNEL_STAGE_LABELS) as [FunnelStage, { label: string; description: string }][]).map(
            ([stage, { label, description }]) => (
              <label
                key={stage}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  funnelStage === stage
                    ? 'bg-slate-blue/5 border border-slate-blue/30'
                    : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="funnelStage"
                  value={stage}
                  checked={funnelStage === stage}
                  onChange={() => setFunnelStage(stage)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">{description}</div>
                </div>
              </label>
            )
          )}
        </div>
      </div>
    </>
  );

  // Render bulk mode content
  const renderBulkContent = () => (
    <>
      {/* Info message */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-2">
          <Icon name="FaInfoCircle" className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            This will create a new keyword concept for each question. The concepts will appear in your Library and be tracked for LLM visibility.
          </p>
        </div>
      </div>

      {/* Questions preview */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New concepts will be created from ({questions.length}):
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
          <ul className="divide-y divide-gray-100">
            {questions.slice(0, 5).map((q, i) => (
              <li key={i} className="px-3 py-2 text-sm text-gray-700">
                {q}
              </li>
            ))}
            {questions.length > 5 && (
              <li className="px-3 py-2 text-sm text-gray-500 italic">
                +{questions.length - 5} more
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Funnel stage selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Funnel stage for all
        </label>
        <div className="flex gap-2">
          {(Object.entries(FUNNEL_STAGE_LABELS) as [FunnelStage, { label: string; description: string }][]).map(
            ([stage, { label }]) => (
              <button
                key={stage}
                type="button"
                onClick={() => setFunnelStage(stage)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  funnelStage === stage
                    ? 'bg-slate-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label.split(' ')[0]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Group selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Group (optional)
        </label>
        <select
          value={selectedGroupId || ''}
          onChange={(e) => setSelectedGroupId(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30"
        >
          <option value="">General</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Result message */}
      {result && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <Icon name="FaCheckCircle" className="w-4 h-4" />
            <span className="text-sm font-medium">
              Created {result.created} concept{result.created !== 1 ? 's' : ''}
              {result.skipped > 0 && `, skipped ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      )}
    </>
  );

  // Determine if submit is disabled
  const isSubmitDisabled =
    isSubmitting ||
    result !== null ||
    (mode === 'individual' && addMode === 'existing' && !selectedConceptId) ||
    (mode === 'individual' && addMode === 'new' && !newConceptName.trim());

  // Determine submit button text
  const getSubmitText = () => {
    if (isSubmitting) return 'Processing...';
    if (result) return 'Done';
    if (mode === 'bulk') return `Create ${questions.length} concept${questions.length !== 1 ? 's' : ''}`;
    if (addMode === 'existing') return 'Add question';
    return 'Create concept';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        mode === 'bulk'
          ? `Create ${questions.length} new concept${questions.length !== 1 ? 's' : ''}`
          : 'Add question to LLM tracking'
      }
      size="md"
    >
      <div className="p-4">
        {mode === 'individual' ? renderIndividualContent() : renderBulkContent()}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <Icon name="FaExclamationTriangle" className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>

      <Modal.Footer>
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={mode === 'bulk' ? handleBulkSubmit : handleIndividualSubmit}
          disabled={isSubmitDisabled}
          className="px-4 py-2 bg-slate-blue text-white rounded-lg text-sm font-medium hover:bg-slate-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />}
          {getSubmitText()}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
