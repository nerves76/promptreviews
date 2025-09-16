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
import { createClient } from "@/auth/providers/supabase";
import { Kickstarter } from "./KickstartersFeature";

interface KickstartersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKickstarters: string[];
  customKickstarters?: Kickstarter[];
  businessName: string;
  onSave: (selected: string[], customKickstarters: Kickstarter[]) => void;
  allKickstarters: Kickstarter[];
  loading: boolean;
  onRefreshKickstarters?: () => void;
  accountId: string; // Account context for security
}

const MAX_SELECTED_KICKSTARTERS = 50; // Increased from 10 to allow more selections
const MAX_KICKSTARTER_LENGTH = 89; // Based on longest default question

export default function KickstartersManagementModal({
  isOpen,
  onClose,
  selectedKickstarters,
  customKickstarters = [],
  businessName,
  onSave,
  allKickstarters,
  loading,
  onRefreshKickstarters,
  accountId
}: KickstartersManagementModalProps) {
  const supabase = createClient();
  const modalRef = useRef<HTMLDivElement>(null);

  // Validate account context for security
  React.useEffect(() => {
    if (isOpen && !accountId) {
    }
  }, [isOpen, accountId]);
  
  const [activeTab, setActiveTab] = useState<'browse' | 'selected'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string[]>(selectedKickstarters);
  const [localCustomKickstarters, setLocalCustomKickstarters] = useState<Kickstarter[]>(customKickstarters || []);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Draggable modal state
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setSelected(selectedKickstarters);
  }, [selectedKickstarters]);

  useEffect(() => {
    setLocalCustomKickstarters(customKickstarters || []);
  }, [customKickstarters]);

  // Reset modal position when opened
  useEffect(() => {
    if (isOpen) {
      setModalPos({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle modal click outside (removed since we don't have a backdrop)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const categories = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'PROCESS', label: 'Process' },
    { key: 'EXPERIENCE', label: 'Experience' },
    { key: 'OUTCOMES', label: 'Outcomes' },
    { key: 'PEOPLE', label: 'People' },
    { key: 'CUSTOM', label: 'Custom' }
  ];

  const getFilteredKickstarters = () => {
    // Combine default kickstarters with custom ones
    let combined = [...allKickstarters, ...localCustomKickstarters];

    // Filter by category
    if (selectedCategory !== 'ALL') {
      combined = combined.filter(k => k.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      combined = combined.filter(k => 
        k.question.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return combined;
  };

  const getSelectedKickstarters = () => {
    const combined = [...allKickstarters, ...localCustomKickstarters];
    return combined.filter(k => selected.includes(k.id));
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

  const handleAddCustomKickstarter = () => {
    // Verify account context is available for security
    if (!accountId) {
      setError('Account context required for security.');
      return;
    }

    // Validate input
    const trimmedQuestion = customQuestion.trim();
    if (!trimmedQuestion) {
      setError('Please enter a question.');
      return;
    }

    if (trimmedQuestion.length > MAX_KICKSTARTER_LENGTH) {
      setError(`Question must be ${MAX_KICKSTARTER_LENGTH} characters or less.`);
      return;
    }

    // Clear any previous errors
    setError(null);

    // Generate a unique ID for the custom kickstarter
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    const customId = `custom_${timestamp}_${randomStr}`;
    
    // Create a custom kickstarter object - always use CUSTOM category
    // NOTE: This custom kickstarter will be scoped to accountId when saved by parent component
    const newCustomKickstarter: Kickstarter = {
      id: customId,
      question: trimmedQuestion,
      category: 'CUSTOM',
      is_default: false
    };

    // Add to the local custom kickstarters state
    setLocalCustomKickstarters(prevList => {
      const updatedList = [...prevList, newCustomKickstarter];
      return updatedList;
    });
    
    // Add to selected automatically
    setSelected(prevSelected => {
      const updatedSelected = [...prevSelected, customId];
      return updatedSelected;
    });
    
    // Reset form and close
    setCustomQuestion('');
    setShowAddCustom(false);
    
    // Log success for debugging (will remove later)
  };

  const handleSave = () => {
    onSave(selected, localCustomKickstarters);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Stop propagation to prevent other modals from also responding
    e.stopPropagation();
    
    // Only start dragging if clicking directly on the kickstarters modal header
    if (e.target instanceof HTMLElement && e.target.closest('.kickstarters-modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPos.x,
        y: e.clientY - modalPos.y,
      });
    }
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
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl shadow-2xl max-w-4xl w-full relative flex flex-col border border-white/20 backdrop-blur-sm"
        style={{
          position: 'absolute',
          left: modalPos.x,
          top: modalPos.y,
          transform: 'none',
          height: '85vh',
          maxHeight: '85vh',
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular close button that exceeds modal borders */}
        <button
          className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
          style={{ width: 36, height: 36 }}
          onClick={onClose}
          aria-label="Close kickstarters modal"
        >
          <Icon name="FaTimes" className="w-4 h-4 text-red-600" size={16} />
        </button>

        {/* Draggable header - unique class name to prevent interference */}
        <div className="kickstarters-modal-header flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Icon name="FaLightbulb" className="text-white text-xl" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Manage kickstarters</h2>
            <span className="text-sm text-white/70 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
              AKA Prompts
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-colors font-semibold"
            >
              Save selection
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
        <div className="px-6 pt-4 pb-2">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <nav className="flex space-x-6">
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
        <div className="flex-1 overflow-hidden px-6 pb-6 min-h-0">
          {activeTab === 'browse' && (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 h-full flex flex-col overflow-hidden border border-white/30">
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
                        disabled={!customQuestion.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add question
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
              <div className="flex-1 overflow-y-auto pr-2">
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
                                kickstarter.category === 'PEOPLE' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
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
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 h-full flex flex-col overflow-hidden border border-white/30">
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
                        disabled={!customQuestion.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add kickstarter
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

              {/* Add Custom Button - Only show when form is not visible */}
              {!showAddCustom && (
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
              )}

              {/* Selected Questions */}
              <div className="flex-1 overflow-y-auto pr-2">
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
                                kickstarter.category === 'PEOPLE' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
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
        <div className="px-6 py-4 bg-white/20 backdrop-blur-sm border-t border-white/30 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 font-medium">
              {selected.length} of {MAX_SELECTED_KICKSTARTERS} kickstarters selected
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected([])}
                className="px-4 py-2 bg-white/30 backdrop-blur-sm text-slate-600 rounded-lg font-medium hover:bg-white/40 transition text-sm border border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selected.length === 0}
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/30 backdrop-blur-sm text-slate-600 rounded-lg font-medium hover:bg-white/40 transition text-sm border border-white/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-white/50 backdrop-blur-sm text-slate-blue rounded-lg font-semibold hover:bg-white/60 transition text-sm border border-white/50"
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