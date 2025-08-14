/**
 * KickstartersManagementModal Component
 * 
 * A modal for managing kickstarters (prompt questions) selection and customization.
 * Based on the ReviewManagementModal pattern but adapted for kickstarters functionality.
 * 
 * Features:
 * - Category-based organization (PROCESS, EXPERIENCE, OUTCOMES, PEOPLE)
 * - Selection interface with visual feedback
 * - Custom kickstarter creation with character limit validation
 * - Dynamic business name replacement preview
 * - Search and filter functionality
 */

"use client";
import React, { useState, useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import { createClient } from "@/utils/supabaseClient";
import { Kickstarter } from "./KickstartersFeature";

interface KickstartersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKickstarters: string[];
  businessName: string;
  onSave: (selected: string[]) => void;
  allKickstarters: Kickstarter[];
  loading: boolean;
  onRefreshKickstarters?: () => void;
}

const MAX_SELECTED_KICKSTARTERS = 50; // Increased from 10 to allow more selections
const MAX_KICKSTARTER_LENGTH = 89; // Based on longest default question

export default function KickstartersManagementModal({
  isOpen,
  onClose,
  selectedKickstarters,
  businessName,
  onSave,
  allKickstarters,
  loading,
  onRefreshKickstarters
}: KickstartersManagementModalProps) {
  const supabase = createClient();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'browse' | 'selected'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string[]>(selectedKickstarters);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customCategory, setCustomCategory] = useState<'PROCESS' | 'EXPERIENCE' | 'OUTCOMES' | 'PEOPLE'>('EXPERIENCE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(selectedKickstarters);
  }, [selectedKickstarters]);

  // Handle modal click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const categories = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'PROCESS', label: 'Process' },
    { key: 'EXPERIENCE', label: 'Experience' },
    { key: 'OUTCOMES', label: 'Outcomes' },
    { key: 'PEOPLE', label: 'People' }
  ];

  const getFilteredKickstarters = () => {
    let filtered = allKickstarters;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(k => k.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(k => 
        k.question.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getSelectedKickstarters = () => {
    return allKickstarters.filter(k => selected.includes(k.id));
  };

  const replaceBusinessName = (question: string) => {
    return question.replace(/\[Business Name\]/g, businessName);
  };

  const toggleKickstarter = (kickstarterId: string) => {
    setSelected(prev => {
      if (prev.includes(kickstarterId)) {
        return prev.filter(id => id !== kickstarterId);
      } else {
        if (prev.length >= MAX_SELECTED_KICKSTARTERS) {
          setError(`You can select up to ${MAX_SELECTED_KICKSTARTERS} kickstarters.`);
          setTimeout(() => setError(null), 3000);
          return prev;
        }
        return [...prev, kickstarterId];
      }
    });
  };

  const handleAddCustomKickstarter = async () => {
    if (!customQuestion.trim()) {
      setError('Please enter a question.');
      return;
    }

    if (customQuestion.length > MAX_KICKSTARTER_LENGTH) {
      setError(`Question must be ${MAX_KICKSTARTER_LENGTH} characters or less.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('kickstarters')
        .insert({
          question: customQuestion.trim(),
          category: customCategory,
          is_default: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to selected automatically
      setSelected(prev => [...prev, data.id]);
      
      // Reset form
      setCustomQuestion('');
      setShowAddCustom(false);
      
      // Refresh the kickstarters list from parent
      if (onRefreshKickstarters) {
        onRefreshKickstarters();
      }
      
      setError(null);
    } catch (error: any) {
      console.error('Error creating custom kickstarter:', error);
      setError('Failed to create custom kickstarter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    onSave(selected);
  };

  const getCategoryStats = () => {
    const stats = categories.slice(1).map(cat => ({
      category: cat.key,
      label: cat.label,
      total: allKickstarters.filter(k => k.category === cat.key).length,
      selected: selected.filter(id => {
        const kickstarter = allKickstarters.find(k => k.id === id);
        return kickstarter?.category === cat.key;
      }).length
    }));
    return stats;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Icon name="FaLightbulb" className="text-slate-blue text-xl" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Manage kickstarters</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              AKA Prompts
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue-dark focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 transition-colors"
            >
              Save selection
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <Icon name="FaTimes" className="w-4 h-4 text-gray-600" size={16} />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'browse'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Browse Questions ({getFilteredKickstarters().length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('selected')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'selected'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Selected ({selected.length}/{MAX_SELECTED_KICKSTARTERS})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(90vh - 200px)' }}>
          {activeTab === 'browse' && (
            <div className="p-6 h-full flex flex-col min-h-0">
              {/* Controls */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Icon name="FaSearch" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>

              </div>

              {/* Add Custom Form */}
              {showAddCustom && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="FaPlus" className="text-blue-600" size={16} />
                    <h3 className="font-medium text-blue-900">Add custom kickstarter</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PROCESS">Process</option>
                        <option value="EXPERIENCE">Experience</option>
                        <option value="OUTCOMES">Outcomes</option>
                        <option value="PEOPLE">People</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question ({customQuestion.length}/{MAX_KICKSTARTER_LENGTH})
                      </label>
                      <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="Enter your custom question... Use [Business Name] for dynamic replacement."
                        rows={3}
                        maxLength={MAX_KICKSTARTER_LENGTH}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      {customQuestion.includes('[Business Name]') && (
                        <p className="text-xs text-gray-600 mt-1">
                          Preview: "{replaceBusinessName(customQuestion)}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddCustomKickstarter}
                        disabled={saving || !customQuestion.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Adding...' : 'Add question'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCustom(false);
                          setCustomQuestion('');
                          setError(null);
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 350px)' }}>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading questions...</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredKickstarters().map((kickstarter) => (
                      <div
                        key={kickstarter.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selected.includes(kickstarter.id)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleKickstarter(kickstarter.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                kickstarter.category === 'PROCESS' ? 'bg-green-100 text-green-800' :
                                kickstarter.category === 'EXPERIENCE' ? 'bg-blue-100 text-blue-800' :
                                kickstarter.category === 'OUTCOMES' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {kickstarter.category}
                              </span>
                              {!kickstarter.is_default && (
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  Custom
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">
                              {replaceBusinessName(kickstarter.question)}
                            </p>
                            {kickstarter.question !== replaceBusinessName(kickstarter.question) && (
                              <p className="text-xs text-gray-500 mt-1">
                                Original: {kickstarter.question}
                              </p>
                            )}
                          </div>
                          {selected.includes(kickstarter.id) && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white ml-3">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {getFilteredKickstarters().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No questions found matching your criteria.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'selected' && (
            <div className="p-6 h-full flex flex-col min-h-0">
              {/* Category Stats */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Selection by category</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {getCategoryStats().map(stat => (
                    <div key={stat.category} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">{stat.selected}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Icon name="FaPlus" className="w-4 h-4" size={16} />
                  Add custom question
                </button>
              </div>

              {/* Selected Questions */}
              <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 350px)' }}>
                {selected.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No kickstarters selected yet. Switch to the "Browse Questions" tab to select some.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getSelectedKickstarters().map((kickstarter, index) => (
                      <div key={kickstarter.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-blue-900">#{index + 1}</span>
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                kickstarter.category === 'PROCESS' ? 'bg-green-100 text-green-800' :
                                kickstarter.category === 'EXPERIENCE' ? 'bg-blue-100 text-blue-800' :
                                kickstarter.category === 'OUTCOMES' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {kickstarter.category}
                              </span>
                              {!kickstarter.is_default && (
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  Custom
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">
                              {replaceBusinessName(kickstarter.question)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleKickstarter(kickstarter.id)}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white ml-3"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selected.length} of {MAX_SELECTED_KICKSTARTERS} kickstarters selected
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected([])}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={selected.length === 0}
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue-dark focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              >
                Save selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 