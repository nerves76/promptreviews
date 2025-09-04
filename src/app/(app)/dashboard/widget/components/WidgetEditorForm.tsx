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
import { useAuth } from "@/auth";

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
  onSaveSuccess: (newWidget?: any) => void;
  onCancel: () => void;
  widgetToEdit: Widget | null;
  design: DesignState;
  createWidget?: (name: string, widgetType: string, theme: any) => Promise<any>;
  saveWidgetName?: (id: string, name: string) => Promise<any>;
}

export const WidgetEditorForm: React.FC<WidgetEditorFormProps> = ({ 
  onSaveSuccess, 
  onCancel, 
  widgetToEdit, 
  design,
  createWidget,
  saveWidgetName 
}) => {
  const supabase = createClient();
  const { selectedAccountId, account } = useAuth();
  // Storage key for form data persistence
  const formStorageKey = `widgetEditorForm_${widgetToEdit?.id || 'new'}`;
  
  const [form, setForm] = useState(() => {
    // Try to restore from localStorage first
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
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

      // Use the selected account from auth context
      const accountId = selectedAccountId || account?.id;
      
      if (!accountId) {
        throw new Error("No account selected. Please select an account and try again.");
      }

      const widgetData = {
        account_id: accountId,
        name: form.name.trim(),
        theme: design,
        type: form.widgetType || 'multi',
        updated_at: new Date().toISOString(),
      };

      let newWidget = null;
      
      if (widgetToEdit) {
        // For editing, use saveWidgetName if only the name changed, otherwise update directly
        if (saveWidgetName && widgetToEdit.name !== form.name.trim()) {
          await saveWidgetName(widgetToEdit.id, form.name.trim());
        } else {
          const { error } = await supabase.from('widgets').update(widgetData).eq('id', widgetToEdit.id);
          if (error) throw error;
        }
      } else {
        // For creating, use the createWidget function if provided (which updates local state)
        if (createWidget) {
          newWidget = await createWidget(form.name.trim(), form.widgetType || 'multi', design);
        } else {
          // Fallback to direct insert if createWidget is not provided
          const { data, error } = await supabase
            .from('widgets')
            .insert({ ...widgetData, created_at: new Date().toISOString() })
            .select()
            .single();
          if (error) throw error;
          newWidget = data;
        }
      }

      // Clear saved form data on successful save
      if (typeof window !== 'undefined') {
        localStorage.removeItem(formStorageKey);
      }
      
      onSaveSuccess(newWidget);
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
            <option value="single">Single</option>
            <option value="multi">Multi</option>
            <option value="photo">Photo</option>
          </select>
          {/* Widget type description */}
          <p className="mt-2 text-sm text-gray-600">
            {form.widgetType === 'single' && 'Shows reviews one-at-a-time in a carousel.'}
            {form.widgetType === 'multi' && 'Shows 3 reviews at a time in a carousel.'}
            {form.widgetType === 'photo' && 'Allows you to upload photos of reviewer (Photo + Testimonial Prompt Pages).'}
          </p>
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