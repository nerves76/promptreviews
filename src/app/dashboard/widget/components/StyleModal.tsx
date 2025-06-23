import React, { useState, useEffect } from 'react';
import StyleForm from './StyleForm';
import { DraggableModal } from './DraggableModal';
import { DesignState } from './widgets/multi/index';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWidget: string | null;
  design: DesignState;
  onDesignChange: (design: DesignState) => void;
  onSaveDesign: () => void;
  onResetDesign?: () => void;
}

export const StyleModal: React.FC<StyleModalProps> = ({
  isOpen,
  onClose,
  selectedWidget,
  design,
  onDesignChange,
  onSaveDesign,
  onResetDesign,
}) => {
  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Style"
      onSave={onSaveDesign}
    >
      <StyleForm 
        design={design} 
        onDesignChange={onDesignChange} 
        onSave={onSaveDesign}
        onReset={onResetDesign}
      />
    </DraggableModal>
  );
}; 