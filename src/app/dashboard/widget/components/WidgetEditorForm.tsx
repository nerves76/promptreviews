import React, { useState, useRef, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

// Assuming Widget and DesignState types might be needed from a shared types file in the future
// For now, defining them locally.
type DesignState = any;
type Widget = {
  id: string;
  name: string;
  widget_type: string;
  theme: DesignState;
};

interface WidgetEditorFormProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
  widgetToEdit: Widget | null;
  design: DesignState;
}

export const WidgetEditorForm: React.FC<WidgetEditorFormProps> = ({ onSaveSuccess, onCancel, widgetToEdit, design }) => {
  const [form, setForm] = useState({ name: "", widgetType: "multi" });
  const [nameError, setNameError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (widgetToEdit) {
      setForm({ name: widgetToEdit.name, widgetType: widgetToEdit.widget_type || "multi" });
    } else {
      setForm({ name: "New Widget", widgetType: "multi" });
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [widgetToEdit]);

  const handleSave = async () => {
    // This is the logic from lines 336-449 of WidgetList.tsx
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be signed in to save a widget");
      return;
    }
    try {
      if (!form.name.trim() || form.name.trim().toLowerCase() === "new widget") {
        setNameError("Please enter a unique widget name");
        nameInputRef.current?.focus();
        return; // Don't throw, just return
      }
      setNameError("");

      let { data: accountData } = await supabase.from('accounts').select('id').eq('id', user.id).single();
      if (!accountData) {
        const { data: newAccount, error: createError } = await supabase.from('accounts').insert({ id: user.id }).select('id').single();
        if (createError) {
             if (createError.code === '23505') {
                 const { data: existingAccount } = await supabase.from('accounts').select('id').eq('id', user.id).single();
                 accountData = existingAccount;
             } else {
                 throw new Error(`Failed to create account: ${createError.message}`);
             }
        } else {
             accountData = newAccount;
        }
      }

      if (!accountData) throw new Error("No account found or created for user");
      
      const accountId = accountData.id;

      const widgetData = {
        account_id: accountId,
        name: form.name.trim(),
        theme: design,
        widget_type: form.widgetType || 'multi',
        updated_at: new Date().toISOString(),
      };

      if (widgetToEdit) {
        const { error } = await supabase.from('widgets').update(widgetData).eq('id', widgetToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('widgets').insert({ ...widgetData, created_at: new Date().toISOString() });
        if (error) throw error;
      }

      onSaveSuccess();
    } catch (error: any) {
      alert(error.message || "An error occurred");
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Widget Name</label>
          <input
            ref={nameInputRef}
            type="text"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Widget Type</label>
          <select
            value={form.widgetType || ""}
            onChange={(e) => setForm({ ...form, widgetType: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={!!widgetToEdit}
          >
            <option value="multi">Multi-Card Carousel</option>
            <option value="single">Single Card</option>
            <option value="photo">Photo Grid</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-6">
        <button onClick={onCancel} className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100">Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Widget</button>
      </div>
    </div>
  );
}; 