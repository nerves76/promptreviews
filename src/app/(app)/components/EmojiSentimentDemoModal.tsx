/**
 * Emoji Sentiment Demo Modal Component
 * 
 * This component displays the emoji sentiment demo in a popup modal.
 * It embeds the live demo HTML file in an iframe for interactive demonstration.
 */

import React from "react";
import { DraggableModal } from "@/app/dashboard/widget/components/DraggableModal";

interface EmojiSentimentDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmojiSentimentDemoModal: React.FC<EmojiSentimentDemoModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Emoji Sentiment Flow Demo"
      maxWidth="max-w-2xl"
    >
      <div className="w-full flex justify-center items-center" style={{ minHeight: 720 }}>
        <iframe
          src={`${typeof window !== 'undefined' ? window.location.origin : ''}/emoji-sentiment-embed.html`}
          className="rounded-2xl border border-gray-200 shadow-lg"
          style={{ width: 400, height: 700 }}
          title="Emoji Sentiment Flow Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </DraggableModal>
  );
};

export default EmojiSentimentDemoModal; 