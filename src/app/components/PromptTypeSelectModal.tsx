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
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full text-center relative my-8 flex flex-col" style={{ width: '100%', maxWidth: '56rem' }}>
        <button
          className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow-lg z-20 flex items-center justify-center hover:bg-gray-100 focus:outline-none"
          style={{ width: 40, height: 40 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="FaTimes" className="w-5 h-5 text-red-600" size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-blue mb-6 sticky top-0 bg-white z-10 pt-2 pb-4">
          Select prompt page type
        </h2>
        <div className="overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {promptTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => !type.comingSoon && onSelectType(type.key)}
                className={`flex flex-col items-center gap-2 rounded-lg border border-gray-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all bg-gray-50 hover:bg-indigo-50 focus:outline-none w-full ${type.comingSoon ? "opacity-60 cursor-not-allowed relative" : ""}`}
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
  );
};

export default PromptTypeSelectModal; 