'use client';

export default function EmojiSentimentDemo() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xs mx-auto">
        <iframe 
          src="/emoji-sentiment-embed.html"
          width="100%" 
          height="500px"
          style={{ border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
          title="Emoji Sentiment Demo"
          className="bg-white"
        />
        <div className="text-center mt-3 text-sm text-gray-600">
          <p>Interactive Emoji Feedback Flow Demo</p>
          <p className="text-xs mt-1">Click the emojis to test the flow</p>
        </div>
      </div>
    </div>
  );
} 