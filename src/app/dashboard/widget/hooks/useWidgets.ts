"use client";
import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface Widget {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  widget_type: string;
  theme: any;
}

export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWidgets = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setWidgets([]);
      return;
    }
    
    // Only fetch widgets for the current user
    const { data, error } = await supabase
      .from("widgets")
      .select("*")
      .eq("account_id", user.id)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching widgets:", error);
      setError(error.message);
    } else {
      console.log("Fetched widgets data:", data);
      setWidgets(data || []);
    }
  }, []);

  const createWidget = useCallback(async (name: string, widgetType: string, theme: any) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("widgets")
      .insert([
        {
          name,
          widget_type: widgetType,
          account_id: user.id,
          theme,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Refresh the widgets list
    await fetchWidgets();
    return data;
  }, [fetchWidgets]);

  const updateWidget = useCallback(async (widgetId: string, updates: Partial<Widget>) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from("widgets")
      .update(updates)
      .eq("id", widgetId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Refresh the widgets list
    await fetchWidgets();
    return data;
  }, [fetchWidgets]);

  const deleteWidget = useCallback(async (widgetId: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { error } = await supabase
      .from("widgets")
      .delete()
      .eq("id", widgetId);

    if (error) {
      throw error;
    }

    // Refresh the widgets list
    await fetchWidgets();
  }, [fetchWidgets]);

  const saveWidgetName = useCallback(async (id: string, name: string) => {
    return updateWidget(id, { name });
  }, [updateWidget]);

  const saveWidgetDesign = useCallback(async (id: string, theme: any) => {
    return updateWidget(id, { theme });
  }, [updateWidget]);

  // Initial fetch
  useEffect(() => {
    fetchWidgets().finally(() => setLoading(false));
  }, [fetchWidgets]);

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