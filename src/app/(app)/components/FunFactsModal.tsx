/**
 * FunFactsModal Component
 *
 * Displays fun facts about a business in a draggable modal.
 * Used on public prompt pages when visitors click the "Fun facts" button.
 *
 * Features:
 * - Single column table layout (label on left, value on right)
 * - Business branding colors
 * - Draggable modal
 * - Max 10 facts displayed
 */

"use client";
import React from "react";
import { Modal } from "@/app/(app)/components/ui/modal";
import Icon from "@/components/Icon";
import { FunFact } from "@/types/funFacts";

interface FunFactsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Fun facts to display */
  facts: FunFact[];
  /** Business profile for branding */
  businessProfile?: {
    primary_color?: string;
    secondary_color?: string;
    primary_font?: string;
    business_name?: string;
    card_bg?: string;
    card_text?: string;
    card_transparency?: number;
  };
}

export default function FunFactsModal({
  isOpen,
  onClose,
  facts,
  businessProfile,
}: FunFactsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      draggable
      lightBackdrop
      className="!p-0"
    >
      {/* Custom draggable header */}
      <Modal.Header className="modal-header cursor-move bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-gray-100">
        <div className="flex items-center space-x-2 text-slate-600">
          <Icon name="FaInfoCircle" size={24} />
          <span className="text-xl font-semibold">Fun facts</span>
        </div>
      </Modal.Header>

      <Modal.Body className="bg-white/95">
        {/* Subheader */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            About {businessProfile?.business_name || "us"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Some interesting things to know
          </p>
        </div>

        {/* Facts List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {facts.length === 0 ? (
            <div className="text-center py-8">
              <Icon
                name="FaInfoCircle"
                size={32}
                className="text-gray-300 mx-auto mb-3"
              />
              <p className="text-gray-500">No fun facts available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {facts.slice(0, 10).map((fact) => (
                <div
                  key={fact.id}
                  className="rounded-lg p-3 flex items-center justify-between transition-all duration-200 bg-white shadow-sm"
                >
                  <span
                    className="font-medium text-gray-800 text-sm"
                    style={{
                      fontFamily: businessProfile?.primary_font || "Inter",
                    }}
                  >
                    {fact.label}
                  </span>
                  <span
                    className="text-gray-600 text-sm text-right"
                    style={{
                      fontFamily: businessProfile?.primary_font || "Inter",
                    }}
                  >
                    {fact.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}
