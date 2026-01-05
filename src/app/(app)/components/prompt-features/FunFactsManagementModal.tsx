/**
 * FunFactsManagementModal Component
 *
 * A modal for managing fun facts (key-value pairs) for prompt pages.
 * Allows creating new facts, selecting which to display, and deleting facts.
 *
 * Features:
 * - Create new fun facts with label and value
 * - Select up to 10 facts to display on a prompt page
 * - Delete facts from the library
 * - Uses standardized Modal component
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { Modal } from "@/app/(app)/components/ui/modal";
import { Button } from "@/app/(app)/components/ui/button";
import { FunFact } from "@/types/funFacts";
import { apiClient } from "@/utils/apiClient";

interface FunFactsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  allFacts: FunFact[];
  selectedFactIds: string[];
  onSave: (selectedIds: string[], updatedFacts: FunFact[]) => void;
  loading?: boolean;
  accountId: string;
}

const MAX_SELECTED_FACTS = 10;
const MAX_LABEL_LENGTH = 50;
const MAX_VALUE_LENGTH = 100;

export default function FunFactsManagementModal({
  isOpen,
  onClose,
  allFacts,
  selectedFactIds,
  onSave,
  loading = false,
  accountId,
}: FunFactsManagementModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "selected">("library");
  const [localFacts, setLocalFacts] = useState<FunFact[]>(allFacts);
  const [selected, setSelected] = useState<string[]>(selectedFactIds);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFacts(allFacts);
      setSelected(selectedFactIds);
      setShowAddForm(false);
      setNewLabel("");
      setNewValue("");
      setError(null);
    }
  }, [isOpen, allFacts, selectedFactIds]);

  const toggleFact = (factId: string) => {
    setSelected((prev) => {
      if (prev.includes(factId)) {
        return prev.filter((id) => id !== factId);
      } else {
        if (prev.length >= MAX_SELECTED_FACTS) {
          setError(`You can select up to ${MAX_SELECTED_FACTS} fun facts.`);
          setTimeout(() => setError(null), 3000);
          return prev;
        }
        return [...prev, factId];
      }
    });
  };

  const handleAddFact = async () => {
    if (!accountId) {
      setError("Account context required.");
      return;
    }

    const trimmedLabel = newLabel.trim();
    const trimmedValue = newValue.trim();

    if (!trimmedLabel || !trimmedValue) {
      setError("Both label and value are required.");
      return;
    }

    if (trimmedLabel.length > MAX_LABEL_LENGTH) {
      setError(`Label must be ${MAX_LABEL_LENGTH} characters or less.`);
      return;
    }

    if (trimmedValue.length > MAX_VALUE_LENGTH) {
      setError(`Value must be ${MAX_VALUE_LENGTH} characters or less.`);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const response = await apiClient.post<{ fact: FunFact; facts: FunFact[] }>(
        "/fun-facts",
        { label: trimmedLabel, value: trimmedValue }
      );

      setLocalFacts(response.facts);
      // Auto-select the new fact
      if (selected.length < MAX_SELECTED_FACTS) {
        setSelected((prev) => [...prev, response.fact.id]);
      }
      setNewLabel("");
      setNewValue("");
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to add fun fact.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFact = async (factId: string) => {
    if (!accountId) {
      setError("Account context required.");
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.delete<{ facts: FunFact[] }>("/fun-facts", {
        body: JSON.stringify({ factId }),
      });

      setLocalFacts(response.facts);
      setSelected((prev) => prev.filter((id) => id !== factId));
    } catch (err: any) {
      setError(err.message || "Failed to delete fun fact.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    onSave(selected, localFacts);
    onClose();
  };

  const getSelectedFacts = () => {
    return localFacts.filter((f) => selected.includes(f.id));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Manage fun facts">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "library"
              ? "border-slate-blue text-slate-blue"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Library ({localFacts.length})
        </button>
        <button
          onClick={() => setActiveTab("selected")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "selected"
              ? "border-slate-blue text-slate-blue"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Selected ({selected.length}/{MAX_SELECTED_FACTS})
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
        {activeTab === "library" ? (
          <>
            {/* Add New Fact Form */}
            {showAddForm ? (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Add new fun fact
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Label (e.g., "Year founded")
                    </label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Enter label..."
                      maxLength={MAX_LABEL_LENGTH}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    />
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {newLabel.length}/{MAX_LABEL_LENGTH}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Value (e.g., "1995")
                    </label>
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter value..."
                      maxLength={MAX_VALUE_LENGTH}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    />
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {newValue.length}/{MAX_VALUE_LENGTH}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddFact}
                      disabled={saving || !newLabel.trim() || !newValue.trim()}
                      size="sm"
                    >
                      {saving ? "Adding..." : "Add fact"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewLabel("");
                        setNewValue("");
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="mb-4 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-slate-blue hover:text-slate-blue transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="FaPlus" size={14} />
                <span>Add new fun fact</span>
              </button>
            )}

            {/* Facts List */}
            {localFacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="FaLightbulb" size={32} className="mx-auto mb-2 opacity-50" />
                <p>No fun facts yet.</p>
                <p className="text-sm">Add your first fun fact above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {localFacts.map((fact) => (
                  <div
                    key={fact.id}
                    className={`p-3 rounded-lg border transition-all ${
                      selected.includes(fact.id)
                        ? "border-slate-blue bg-slate-blue/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => toggleFact(fact.id)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selected.includes(fact.id)
                                ? "border-slate-blue bg-slate-blue text-white"
                                : "border-gray-300"
                            }`}
                          >
                            {selected.includes(fact.id) && (
                              <Icon name="FaCheck" size={10} />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              {fact.label}:
                            </span>{" "}
                            <span className="text-gray-600">{fact.value}</span>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteFact(fact.id)}
                        disabled={saving}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete fact"
                      >
                        <Icon name="FaTrash" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Selected Tab */
          <>
            {selected.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="FaLightbulb" size={32} className="mx-auto mb-2 opacity-50" />
                <p>No fun facts selected.</p>
                <p className="text-sm">
                  Go to the Library tab to select facts to display.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {getSelectedFacts().map((fact, index) => (
                  <div
                    key={fact.id}
                    className="p-3 rounded-lg border border-slate-blue/30 bg-slate-blue/5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium text-gray-700">
                            {fact.label}:
                          </span>{" "}
                          <span className="text-gray-600">{fact.value}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFact(fact.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Remove from selection"
                      >
                        <Icon name="FaTimes" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading || saving}>
          Save selection
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
