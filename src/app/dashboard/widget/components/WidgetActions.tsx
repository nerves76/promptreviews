import React from 'react';
import { FaPlus, FaPalette, FaList, FaCode } from 'react-icons/fa';

interface WidgetActionsProps {
  onEditStyle: () => void;
  onManageReviews: () => void;
  onGetEmbedCode: () => void;
  selectedWidget: any;
}

export const WidgetActions: React.FC<WidgetActionsProps> = ({
  onEditStyle,
  onManageReviews,
  onGetEmbedCode,
  selectedWidget,
}) => {
  return (
    <div className="flex items-center space-x-2">
      {selectedWidget && (
        <>
          <button
            onClick={onEditStyle}
            className="p-2 text-white bg-gray-700/50 rounded-md hover:bg-gray-700"
          >
            <FaPalette size={18} />
          </button>
          <button
            onClick={onManageReviews}
            className="p-2 text-white bg-gray-700/50 rounded-md hover:bg-gray-700"
          >
            <FaList size={18} />
          </button>
          <button
            onClick={onGetEmbedCode}
            className="p-2 text-white bg-gray-700/50 rounded-md hover:bg-gray-700"
          >
            <FaCode size={18} />
          </button>
        </>
      )}
    </div>
  );
};
