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
import { createClient } from "@/auth/providers/supabase";
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
  // Storage key for form data persistence, include account to avoid cross-account bleed for 'new' widgets
  const accountIdPart = selectedAccountId || account?.id || 'noacct';
  const formStorageKey = `widgetEditorForm_${accountIdPart}_${widgetToEdit?.id || 'new'}`;
  
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

  const widgetTypes = [
    {
      value: 'multi',
      label: 'Multi review',
      description: 'Shows 3 reviews at a time in a carousel.',
      preview: (
        <div className="flex gap-1.5 justify-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-12 h-16 bg-white rounded border border-gray-200 shadow-sm flex flex-col items-center justify-center p-1">
              <div className="w-5 h-5 rounded-full bg-gray-200 mb-1" />
              <div className="w-8 h-1 bg-gray-200 rounded mb-0.5" />
              <div className="w-6 h-1 bg-gray-100 rounded" />
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="w-1 h-1 rounded-full bg-amber-400" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      value: 'single',
      label: 'Single review',
      description: 'Shows reviews one-at-a-time in a carousel.',
      preview: (
        <div className="flex justify-center">
          <div className="w-24 h-16 bg-white rounded border border-gray-200 shadow-sm flex flex-col items-center justify-center p-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-200 mb-1" />
            <div className="w-16 h-1 bg-gray-200 rounded mb-0.5" />
            <div className="w-12 h-1 bg-gray-100 rounded" />
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'photo',
      label: 'Photo review',
      description: 'Displays a photo alongside the review. Best with photo prompt pages.',
      preview: (
        <div className="flex justify-center">
          <div className="w-28 h-16 bg-white rounded border border-gray-200 shadow-sm flex overflow-hidden">
            <div className="w-12 h-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-1.5">
              <div className="w-10 h-1 bg-gray-200 rounded mb-0.5" />
              <div className="w-8 h-1 bg-gray-100 rounded mb-0.5" />
              <div className="w-6 h-1 bg-gray-100 rounded" />
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="w-1 h-1 rounded-full bg-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const isTypeDisabled = !!widgetToEdit || isLoading;

  return (
    <div className="p-4">
      <div className="space-y-5">
        <div>
          <label htmlFor="widget-name" className="block text-sm font-medium text-white">Widget name</label>
          <input
            id="widget-name"
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
          <label className="block text-sm font-medium text-white mb-2">Choose a layout</label>
          <div className="grid grid-cols-3 gap-3">
            {widgetTypes.map((type) => {
              const isSelected = form.widgetType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    if (!isTypeDisabled) {
                      setForm({ ...form, widgetType: type.value });
                    }
                  }}
                  disabled={isTypeDisabled}
                  className={`relative rounded-lg p-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 ${
                    isSelected
                      ? 'bg-white ring-2 ring-slate-blue shadow-md'
                      : 'bg-white/60 hover:bg-white/80 border border-white/40'
                  } ${isTypeDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  aria-label={`${type.label}: ${type.description}`}
                >
                  <div className="h-20 flex items-center justify-center mb-2">
                    {type.preview}
                  </div>
                  <p className={`text-xs font-semibold whitespace-nowrap ${isSelected ? 'text-slate-blue' : 'text-gray-700'}`}>
                    {type.label}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-white/80">
            {form.widgetType === 'single' && 'Shows reviews one-at-a-time in a carousel.'}
            {form.widgetType === 'multi' && 'Shows 3 reviews at a time in a carousel.'}
            {form.widgetType === 'photo' && 'Displays a photo alongside the review. Best with photo prompt pages.'}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 focus:ring-offset-2 disabled:opacity-50 font-medium whitespace-nowrap"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (widgetToEdit ? 'Save widget' : 'Create widget')}
        </button>
      </div>
    </div>
  );
}; 
