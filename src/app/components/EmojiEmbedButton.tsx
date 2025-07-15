"use client";

import React, { useState } from "react";
import { FaSmile } from "react-icons/fa";
import EmojiEmbedModal from "./EmojiEmbedModal";

interface EmojiEmbedButtonProps {
  slug: string;
  question?: string;
  enabled?: boolean;
}

/**
 * EmojiEmbedButton Component
 * 
 * A standalone button that can be placed on Universal and Location pages
 * to provide quick access to emoji sentiment embed code generation.
 * 
 * Features:
 * - Smiley icon with "Embed" text
 * - Opens modal with embed settings
 * - Only shows when emoji sentiment is enabled
 */
const EmojiEmbedButton: React.FC<EmojiEmbedButtonProps> = ({
  slug,
  question = "How was your experience?",
  enabled = true
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!enabled || !slug) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
        title="Get embed code for emoji sentiment widget"
      >
        <FaSmile className="w-4 h-4" />
        Embed
      </button>

      <EmojiEmbedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        slug={slug}
        question={question}
      />
    </>
  );
};

export default EmojiEmbedButton; 