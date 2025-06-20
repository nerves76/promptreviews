import React, { useState, useEffect } from 'react';
import { StyleForm } from './StyleForm';
import { DraggableModal } from './DraggableModal';
import { DesignState } from '../WidgetList';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWidget: string | null;
  design: DesignState;
  onDesignChange: (design: DesignState) => void;
  onSaveDesign: () => void;
}

export const StyleModal: React.FC<StyleModalProps> = ({
  isOpen,
  onClose,
  selectedWidget,
  design,
  onDesignChange,
  onSaveDesign,
}) => {
  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Style"
      onSave={onSaveDesign}
    >
      <StyleForm design={design} onDesignChange={onDesignChange} />
    </DraggableModal>
  );
}; 