"use client";

import React, { useState } from "react";
import Icon from "@/components/Icon";
import PromptPageEmbedModal from "./PromptPageEmbedModal";

interface PromptPageEmbedButtonProps {
  slug: string;
  question?: string;
  emojiSentimentEnabled?: boolean;
  isUniversal?: boolean;
}

/**
 * PromptPageEmbedButton Component
 *
 * A standalone button that can be placed on Universal and Individual Prompt Pages
 * to provide quick access to both 5-Star and Emoji sentiment embed code generation.
 *
 * Features:
 * - Code icon with "Embed" text
 * - Opens modal with tabbed interface for 5-Star and Emoji embeds
 * - Works for all prompt pages (no longer requires emoji sentiment to be enabled)
 */
const PromptPageEmbedButton: React.FC<PromptPageEmbedButtonProps> = ({
  slug,
  question = "How was your experience?",
  emojiSentimentEnabled = false,
  isUniversal = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!slug) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
        title="Get embed code for this prompt page"
      >
        <Icon name="FaCode" className="w-4 h-4" size={16} />
        Embed
      </button>

      <PromptPageEmbedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        slug={slug}
        question={question}
        emojiSentimentEnabled={emojiSentimentEnabled}
        isUniversal={isUniversal}
      />
    </>
  );
};

export default PromptPageEmbedButton;
