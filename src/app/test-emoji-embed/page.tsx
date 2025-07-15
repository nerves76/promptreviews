import EmojiSentimentEmbed from "../components/EmojiSentimentEmbed";
import { FaGrinHearts, FaSmile, FaMeh, FaFrown, FaAngry } from "react-icons/fa";

const emojiLinks = [
  {
    label: "Excellent",
    emoji: "😃",
    url: "/r/demo?emoji_sentiment=excellent&source=embed",
  },
  {
    label: "Satisfied",
    emoji: "🙂",
    url: "/r/demo?emoji_sentiment=satisfied&source=embed",
  },
  {
    label: "Neutral",
    emoji: "😐",
    url: "/r/demo?emoji_sentiment=neutral&source=embed",
  },
  {
    label: "Unsatisfied",
    emoji: "😕",
    url: "/r/demo?emoji_sentiment=unsatisfied&source=embed",
  },
  {
    label: "Frustrated",
    emoji: "😡",
    url: "/r/demo?emoji_sentiment=frustrated&source=embed",
  },
];

export default function TestEmojiEmbedPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Test Emoji Sentiment Embed - Size Comparison
      </h1>
      
      {/* Font Awesome Icon Test */}
      <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h3>Font Awesome Icon Test (Direct)</h3>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <FaGrinHearts size={32} className="text-pink-400" />
            <div>32px</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <FaSmile size={48} className="text-green-500" />
            <div>48px</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <FaMeh size={64} className="text-gray-400" />
            <div>64px</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <FaFrown size={80} className="text-orange-400" />
            <div>80px</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <FaAngry size={96} className="text-red-500" />
            <div>96px</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <h3>Small Size (32px)</h3>
          <EmojiSentimentEmbed
            header="How was your experience?"
            headerColor="#4F46E5"
            emojiLinks={emojiLinks}
            emojiSize={32}
            headerSize="sm"
          />
        </div>
        
        <div>
          <h3>Medium Size (48px)</h3>
          <EmojiSentimentEmbed
            header="How was your experience?"
            headerColor="#4F46E5"
            emojiLinks={emojiLinks}
            emojiSize={48}
            headerSize="md"
          />
        </div>
        
        <div>
          <h3>Large Size (64px)</h3>
          <EmojiSentimentEmbed
            header="How was your experience?"
            headerColor="#4F46E5"
            emojiLinks={emojiLinks}
            emojiSize={64}
            headerSize="lg"
          />
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Extra Large Size (80px)</h3>
        <EmojiSentimentEmbed
          header="How was your experience?"
          headerColor="#4F46E5"
          emojiLinks={emojiLinks}
          emojiSize={80}
          headerSize="xl"
        />
      </div>
    </div>
  );
}