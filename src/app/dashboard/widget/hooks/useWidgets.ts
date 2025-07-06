"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabaseClient";

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
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWidgets = useCallback(async () => {
    console.log('🔄 useWidgets: Starting fetchWidgets');
    setLoading(true);
    
    try {
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/widgets', {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch widgets: ${response.status}`);
      }
      
      const widgetsData = await response.json();
      console.log('✅ useWidgets: Widgets fetched successfully:', widgetsData);
      
      setWidgets(widgetsData || []);
      setError(null);
    } catch (err) {
      console.error('❌ useWidgets: Error fetching widgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch widgets');
      setWidgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);
  
  const createWidget = async (name: string, widgetType: string, theme: any) => {
    try {
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, type: widgetType, theme })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create widget: ${response.status}`);
      }
      
      const data = await response.json();
      
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
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update widget: ${response.status}`);
      }
      
      const data = await response.json();
      fetchWidgets(); // Refresh after updating
      return data;
    } catch (err) {
      console.error('❌ useWidgets: Error updating widget:', err);
      throw err;
    }
  };

  const deleteWidget = async (widgetId: string) => {
    try {
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete widget: ${response.status}`);
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