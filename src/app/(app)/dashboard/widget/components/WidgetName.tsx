import React, { useState } from 'react';
import { createClient } from '@/auth/providers/supabase';

interface WidgetNameProps {
  widget: {
    id: string;
    name: string;
  };
  onSave: (name: string) => void;
}

export const WidgetName: React.FC<WidgetNameProps> = ({ widget, onSave }) => {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(widget.name);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        setError('Widget name cannot be empty');
        return;
      }

      // Using singleton Supabase client from supabaseClient.ts

      const { error: updateError } = await supabase
        .from("widgets")
        .update({ name: name.trim() })
        .eq("id", widget.id);

      if (updateError) {
        console.error('[DEBUG] Error updating widget name:', updateError);
        setError('Failed to update widget name: ' + updateError.message);
        return;
      }

      onSave(name.trim());
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error('[DEBUG] Unexpected error in handleSave:', error);
      setError(error instanceof Error ? error.message : 'Failed to update widget name');
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={name || ""}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setName(widget.name);
            }
          }}
          className="text-lg font-semibold border-b border-gray-300 focus:border-slate-blue focus:outline-none"
          autoFocus
        />
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    );
  }

  return (
    <div
      className="text-lg font-semibold cursor-pointer hover:text-slate-blue"
      onClick={() => setIsEditing(true)}
    >
      {widget.name}
    </div>
  );
}; 