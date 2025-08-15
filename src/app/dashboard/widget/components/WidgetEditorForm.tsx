/**
 * WidgetEditorForm
 *
 * Modal for creating/editing widgets in the dashboard.
 *
 * - Only a single action button is shown (Save/Create), no Cancel button.
 * - The Save/Create button uses the brand's accent color (slate blue) for high visibility:
 *   - bg-slate-blue (default), hover:bg-slate-blue/90, text-white
 * - All form fields (inputs, selects) have a clear outline for visibility:
 *   - border, border-gray-300, focus:border-slate-600, focus:ring-2, focus:ring-slate-400, rounded-md, px-3, py-2
 *   - This matches the convention used in other forms for clarity and accessibility.
 * - Button label is always clear: 'Save Widget' (or 'Create Widget' if you want to distinguish modes).
 *
 * Last updated: 2025-07-01
 */
import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/auth/utils/accounts";

// Assuming Widget and DesignState types might be needed from a shared types file in the future
// For now, defining them locally.
type DesignState = any;
type Widget = {
  id: string;
  name: string;
  type: string;
  theme: DesignState;
};

interface WidgetEditorFormProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
  widgetToEdit: Widget | null;
  design: DesignState;
}

export const WidgetEditorForm: React.FC<WidgetEditorFormProps> = ({ onSaveSuccess, onCancel, widgetToEdit, design }) => {
  const supabase = createClient();
  // Storage key for form data persistence
  const formStorageKey = `widgetEditorForm_${widgetToEdit?.id || 'new'}`;
  
  const [form, setForm] = useState(() => {
    // Try to restore from localStorage first
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('📝 Restored widget editor form data from localStorage');
          return parsed;
        } catch (e) {
          console.error('Failed to parse saved widget form data:', e);
        }
      }
    }
    return { name: "", widgetType: "multi" };
  });
  
  const [nameError, setNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-save form data to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && form && form.name.trim()) {
        localStorage.setItem(formStorageKey, JSON.stringify(form));
        console.log('💾 Auto-saved widget editor form data to localStorage');
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveTimeout);
  }, [form, formStorageKey]);

  useEffect(() => {
    if (widgetToEdit) {
      setForm({ name: widgetToEdit.name, widgetType: widgetToEdit.type || "multi" });
    } else {
      setForm({ name: "New Widget", widgetType: "multi" });
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [widgetToEdit]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be signed in to save a widget");
        return;
      }

      if (!form.name.trim() || form.name.trim().toLowerCase() === "new widget") {
        setNameError("Please enter a unique widget name");
        nameInputRef.current?.focus();
        return;
      }
      setNameError("");

      // Use the proper account lookup utility
      const accountId = await getAccountIdForUser(user.id, supabase);
      
      if (!accountId) {
        throw new Error("Account not found. Please ensure you have completed the signup process.");
      }

      const widgetData = {
        account_id: accountId,
        name: form.name.trim(),
        theme: design,
        type: form.widgetType || 'multi',
        updated_at: new Date().toISOString(),
      };

      if (widgetToEdit) {
        const { error } = await supabase.from('widgets').update(widgetData).eq('id', widgetToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('widgets').insert({ ...widgetData, created_at: new Date().toISOString() });
        if (error) throw error;
      }

      // Clear saved form data on successful save
      if (typeof window !== 'undefined') {
        localStorage.removeItem(formStorageKey);
        console.log('🗑️ Cleared widget editor form data from localStorage after successful save');
      }
      
      onSaveSuccess();
    } catch (error: any) {
      console.error('Widget save error:', error);
      alert(error.message || "An error occurred while saving the widget");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Widget name</label>
          <input
            ref={nameInputRef}
            type="text"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 block w-full border border-gray-300 focus:border-slate-600 focus:ring-2 focus:ring-slate-400 rounded-md px-3 py-2 shadow-sm"
            disabled={isLoading}
          />
          {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Widget type</label>
          <select
            value={form.widgetType || ""}
            onChange={(e) => setForm({ ...form, widgetType: e.target.value })}
            className="mt-1 block w-full border border-gray-300 focus:border-slate-600 focus:ring-2 focus:ring-slate-400 rounded-md px-3 py-2 shadow-sm"
            disabled={!!widgetToEdit || isLoading}
          >
            <option value="multi">Multi-card carousel</option>
            <option value="single">Single card</option>
            <option value="photo">Photo</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-6">
        {/* Only show the Save/Create button, styled with slate blue */}
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-slate-blue text-white rounded hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 focus:ring-offset-2 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (widgetToEdit ? 'Save widget' : 'Create widget')}
        </button>
      </div>
    </div>
  );
}; 