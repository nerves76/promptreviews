"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { trackWidgetCreated } from "../../../../utils/analytics";
import { getAccountIdForUser } from "@/utils/accountUtils";

export interface Widget {
  id: string;
  name: string;
  account_id: string;
  created_at: string;
  widget_type: string;
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 useWidgets: User auth result:', { user: !!user, userId: user?.id });
    
    if (!user) {
      console.log('❌ useWidgets: No user found, setting empty widgets');
      setWidgets([]);
      setLoading(false);
      return;
    }
    
    // Get account ID using the utility function
    const accountId = await getAccountIdForUser(user.id, supabase);
    
    console.log('🏢 useWidgets: Account lookup result:', { 
      accountId: accountId,
      hasAccount: !!accountId
    });
    
    if (!accountId) {
      console.error('❌ useWidgets: No account found for user:', user.id);
      setError('Account not found');
      setLoading(false);
      return;
    }
    
    // Now query widgets using the account_id
    const { data: widgetsData, error: widgetsError } = await supabase
      .from("widgets")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });
      
    console.log('📊 useWidgets: Widgets query result:', { 
      widgetsCount: widgetsData?.length, 
      error: widgetsError?.message,
      widgets: widgetsData 
    });
      
    if (widgetsError) {
      console.error('❌ useWidgets: Widgets query error:', widgetsError);
      setError(widgetsError.message);
      setLoading(false);
      return;
    }

    console.log('🔄 useWidgets: Fetching reviews for widgets...');
    const widgetsWithReviews = await Promise.all(
      (widgetsData || []).map(async (widget) => {
        const { data: reviews, error: reviewsError } = await supabase
          .from("widget_reviews")
          .select("*")
          .eq("widget_id", widget.id)
          .order("created_at", { ascending: false });
        
        console.log(`📝 useWidgets: Reviews for widget ${widget.id}:`, { 
          reviewsCount: reviews?.length, 
          error: reviewsError?.message 
        });
        
        return { ...widget, reviews: reviews || [] };
      })
    );

    console.log('✅ useWidgets: Final widgets with reviews:', widgetsWithReviews);
    setWidgets(widgetsWithReviews);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);
  
  const createWidget = async (name: string, widgetType: string, theme: any) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get account ID using the utility function
    const accountId = await getAccountIdForUser(user.id, supabase);
      
    if (!accountId) {
      throw new Error("Account not found");
    }

    const { data, error } = await supabase
      .from("widgets")
      .insert([{ name, widget_type: widgetType, account_id: accountId, theme }])
      .select()
      .single();

    if (error) throw error;
    
    // Track widget creation
    trackWidgetCreated(widgetType, user.id);
    
    fetchWidgets(); // Refresh after creating
    return data;
  };

  const updateWidget = async (widgetId: string, updates: Partial<Widget>) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from("widgets")
      .update(updates)
      .eq("id", widgetId)
      .select()
      .single();

    if (error) throw error;
    fetchWidgets(); // Refresh after updating
    return data;
  };

  const deleteWidget = async (widgetId: string) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { error } = await supabase
      .from("widgets")
      .delete()
      .eq("id", widgetId);

    if (error) throw error;
    fetchWidgets(); // Refresh after deleting
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