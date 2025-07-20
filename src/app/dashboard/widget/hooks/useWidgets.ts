"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabaseClient";
import { useAccountSelection } from "@/utils/accountSelectionHooks";

const supabase = createClient();
import { trackWidgetCreated } from "../../../../utils/analytics";

export interface Widget {
  id: string;
  name: string;
  account_id: string;
  created_at: string;
  type: string;
  theme: any;
  reviews?: any[];
}

export function useWidgets() {
  const { selectedAccount, loading: accountLoading } = useAccountSelection();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debug logging for account selection
  console.log('🎨 useWidgets - Account Selection State:', {
    selectedAccount,
    accountLoading,
    selectedAccountId: selectedAccount?.account_id,
    selectedAccountName: selectedAccount?.account_name
  });

  const fetchWidgets = useCallback(async () => {
    console.log('🔄 useWidgets: Starting fetchWidgets', {
      accountLoading,
      selectedAccountId: selectedAccount?.account_id
    });
    
    // Wait for account selection to complete
    if (accountLoading || !selectedAccount?.account_id) {
      console.log('⏸️ useWidgets: Waiting for account selection to complete');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('✅ useWidgets: Fetching widgets for account:', selectedAccount.account_id);
      
      // Fetch widgets directly from database using selected account ID
      const { data: widgetsData, error: fetchError } = await supabase
        .from('widgets')
        .select('*')
        .eq('account_id', selectedAccount.account_id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw new Error(`Failed to fetch widgets: ${fetchError.message}`);
      }
      
      console.log('🎨 useWidgets: Widgets fetched successfully:', widgetsData?.length || 0);
      setWidgets(widgetsData || []);
      setError(null);
    } catch (err) {
      console.error('❌ useWidgets: Error fetching widgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch widgets');
      setWidgets([]);
    } finally {
      setLoading(false);
    }
  }, [accountLoading, selectedAccount?.account_id]);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);
  
  const createWidget = async (name: string, widgetType: string, theme: any) => {
    if (!selectedAccount?.account_id) {
      throw new Error('No account selected');
    }
    
    try {
      console.log('🎨 useWidgets: Creating widget for account:', selectedAccount.account_id);
      
      // Create widget directly in database using selected account ID
      const widgetData = {
        account_id: selectedAccount.account_id,
        name: name.trim(),
        type: widgetType,
        theme: theme || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error: createError } = await supabase
        .from('widgets')
        .insert(widgetData)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create widget: ${createError.message}`);
      }
      
      // Track widget creation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        trackWidgetCreated(widgetType, user.id);
      }
      
      fetchWidgets(); // Refresh after creating
      return data;
    } catch (err) {
      console.error('❌ useWidgets: Error creating widget:', err);
      throw err;
    }
  };

  const updateWidget = async (widgetId: string, updates: Partial<Widget>) => {
    try {
      console.log('🎨 useWidgets: Updating widget:', widgetId, updates);
      
      // Update widget directly in database
      const { data, error: updateError } = await supabase
        .from('widgets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', widgetId)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Failed to update widget: ${updateError.message}`);
      }
      
      fetchWidgets(); // Refresh after updating
      return data;
    } catch (err) {
      console.error('❌ useWidgets: Error updating widget:', err);
      throw err;
    }
  };

  const deleteWidget = async (widgetId: string) => {
    try {
      console.log('🎨 useWidgets: Deleting widget:', widgetId);
      
      // Delete widget directly from database
      const { error: deleteError } = await supabase
        .from('widgets')
        .delete()
        .eq('id', widgetId);
      
      if (deleteError) {
        throw new Error(`Failed to delete widget: ${deleteError.message}`);
      }
      
      fetchWidgets(); // Refresh after deleting
    } catch (err) {
      console.error('❌ useWidgets: Error deleting widget:', err);
      throw err;
    }
  };

  const saveWidgetName = async (id: string, name: string) => {
    return updateWidget(id, { name });
  };

  const saveWidgetDesign = async (id: string, theme: any) => {
    return updateWidget(id, { theme });
  };

  return {
    widgets,
    loading,
    error,
    fetchWidgets,
    createWidget,
    updateWidget,
    deleteWidget,
    saveWidgetName,
    saveWidgetDesign,
  };
} 