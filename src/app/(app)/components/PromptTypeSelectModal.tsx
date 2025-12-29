import React from "react";
import Icon from "@/components/Icon";

interface PromptType {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  comingSoon?: boolean;
}

interface PromptTypeSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (typeKey: string) => void;
  promptTypes: PromptType[];
}

const PromptTypeSelectModal: React.FC<PromptTypeSelectModalProps> = ({
  open,
  onClose,
  onSelectType,
  promptTypes,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      
      {/* Modal */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full relative my-8 flex flex-col border border-white/40" style={{ width: '100%', maxWidth: '56rem' }}>
        {/* Header */}
        <div className="bg-white/20 backdrop-blur-md border-b border-white/30 rounded-t-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Select prompt page type
          </h2>
        </div>
        
        {/* Close button */}
        <button
          className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
          style={{ width: 36, height: 36 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="FaTimes" className="w-4 h-4 text-red-600" size={16} />
        </button>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {promptTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => !type.comingSoon && onSelectType(type.key)}
                  className={`flex flex-col items-center gap-2 rounded-xl border border-white/50 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all bg-white/80 hover:bg-indigo-50/80 focus:outline-none w-full backdrop-blur-sm ${type.comingSoon ? "opacity-60 cursor-not-allowed relative" : ""}`}
                style={{
                  minHeight: '140px',
                  maxHeight: '200px',
                  minWidth: 0,
                  padding: '1.5rem',
                  aspectRatio: window.innerWidth >= 640 ? '1 / 1' : undefined
                }}
                disabled={!!type.comingSoon}
                tabIndex={type.comingSoon ? -1 : 0}
              >
                {type.icon}
                <span className="font-semibold text-lg text-slate-blue">
                  {type.label}
                </span>
                <span className="text-sm text-gray-600 text-center">
                  {type.description}
                </span>
                {type.comingSoon && (
                  <span className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
                    Coming soon
                  </span>
                )}
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptTypeSelectModal; 