/**
 * GettingStarted Component
 * 
 * Displays a checklist of onboarding tasks for new users.
 * Tasks can be marked as completed and the component disappears when all are done.
 * Now uses database persistence for task completion status.
 */

import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { useRouter } from "next/navigation";
import { fetchOnboardingTasks, markTaskAsCompleted, markTaskAsIncomplete } from "@/utils/onboardingTasks";
import { createClient } from '@/auth/providers/supabase';

interface BusinessData {
  id?: string;
  name?: string;
  keywords?: string[];
  ai_dos?: string;
  ai_donts?: string;
  about_us?: string;
  services_offered?: string[] | string;
  logo_url?: string;
  review_platforms?: string[];
  // Style settings
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  primary_font?: string;
  secondary_font?: string;
  style_preset?: string;
  [key: string]: unknown;
}

interface UniversalPromptPageData {
  id?: string;
  created_at?: string;
  updated_at?: string;
  review_platforms?: unknown;
  friendly_note?: string;
  show_friendly_note?: boolean;
  offer_enabled?: boolean;
  kickstarters_enabled?: boolean;
  [key: string]: unknown;
}

interface GettingStartedProps {
  onComplete?: () => void;
  hasBusiness: boolean;
  hasCustomPromptPages: boolean;
  hasUniversalPromptPage: boolean;
  accountId?: string;
  businessData?: BusinessData | null;
  universalPromptPageData?: UniversalPromptPageData | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  link?: string;
  icon: React.ReactNode;
  completed: boolean;
}

const GettingStarted: React.FC<GettingStartedProps> = ({
  onComplete,
  hasBusiness,
  hasCustomPromptPages,
  hasUniversalPromptPage,
  accountId,
  businessData,
  universalPromptPageData
}) => {
  const supabase = createClient();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  // Initialize default tasks for new users via API
  useEffect(() => {
    const initializeTasks = async () => {
      if (!accountId) return;

      try {
        // Get the authentication token from Supabase
        // Using singleton Supabase client from supabaseClient.ts
        
        // Wait for session to be available
        let retries = 0;
        const maxRetries = 5;
        let session = null;
        
        while (retries < maxRetries) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.access_token) {
            session = currentSession;
            break;
          }
          retries++;
          // Wait 500ms before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!session?.access_token) {
          return;
        }

        // Add retry logic for API calls to handle race conditions
        let success = false;
        let lastError = null;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetch('/api/initialize-onboarding-tasks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
            });

            if (!response.ok) {
              const errorData = await response.json();
              lastError = {
                status: response.status,
                statusText: response.statusText,
                errorData: errorData,
              };
              
              // If it's a 404 (account not found), retry after waiting
              if (response.status === 404 && attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
              }
              
              console.error('Error initializing default tasks:', {
                error: lastError,
                status: response.status,
                statusText: response.statusText,
                attempt: attempt + 1
              });
            } else {
              const result = await response.json();
              success = true;
              break;
            }
          } catch (fetchError) {
            lastError = fetchError;
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        if (!success && lastError) {
          console.error('Failed to initialize tasks after retries:', lastError);
        }
      } catch (error) {
        console.error('Error calling initialize-onboarding-tasks API:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          error: error,
        });
      }
    };

    // Add a small delay to ensure session is established
    const timer = setTimeout(initializeTasks, 1000);
    return () => clearTimeout(timer);
  }, [accountId]);

  // Helper function to check if business profile has meaningful data
  const checkBusinessProfileComplete = (data: BusinessData | null | undefined): boolean => {
    if (!data) return false;
    // Consider complete if they have a name AND at least one of: about_us, services
    const hasName = !!(data.name && data.name.trim().length > 0);
    const hasAboutUs = !!(data.about_us && data.about_us.trim().length > 0);
    const hasServices = Array.isArray(data.services_offered)
      ? data.services_offered.filter(s => s && s.trim()).length > 0
      : !!(data.services_offered && String(data.services_offered).trim().length > 0);
    return hasName && (hasAboutUs || hasServices);
  };

  // Helper function to check if keywords/AI guidelines have been added
  const checkKeywordsAndGuidelinesComplete = (data: BusinessData | null | undefined): boolean => {
    if (!data) return false;
    const hasKeywords = Array.isArray(data.keywords) && data.keywords.length > 0;
    const hasAiDos = !!(data.ai_dos && data.ai_dos.trim().length > 0);
    const hasAiDonts = !!(data.ai_donts && data.ai_donts.trim().length > 0);
    // Complete if they have keywords OR any AI guidelines
    return hasKeywords || hasAiDos || hasAiDonts;
  };

  // Helper function to check if universal prompt page has been customized
  const checkUniversalPromptPageCustomized = (data: UniversalPromptPageData | null | undefined): boolean => {
    if (!data) return false;

    // Check if updated_at is significantly different from created_at (more than 1 minute)
    if (data.created_at && data.updated_at) {
      const createdAt = new Date(data.created_at).getTime();
      const updatedAt = new Date(data.updated_at).getTime();
      const diffMinutes = (updatedAt - createdAt) / (1000 * 60);
      if (diffMinutes > 1) return true;
    }

    // Also check for specific customizations that indicate editing
    // Note: show_friendly_note defaults to true, so don't count it as customization
    const hasCustomNote = !!(data.friendly_note && data.friendly_note.trim().length > 0);
    const hasOfferEnabled = data.offer_enabled === true;
    const hasKickstartersEnabled = data.kickstarters_enabled === true;
    const hasReviewPlatforms = Array.isArray(data.review_platforms) && data.review_platforms.length > 0;

    return hasCustomNote || hasOfferEnabled || hasKickstartersEnabled || hasReviewPlatforms;
  };

  // Helper function to check if styling has been customized
  const checkStylingComplete = (data: BusinessData | null | undefined): boolean => {
    if (!data) return false;
    // Check if any style settings have been changed from actual defaults
    // Database defaults are #FFFFFF for all colors, so check for non-white values
    // or check if a style preset has been explicitly selected
    const hasCustomPrimaryColor = !!(data.primary_color && data.primary_color !== '#FFFFFF');
    const hasCustomSecondaryColor = !!(data.secondary_color && data.secondary_color !== '#FFFFFF');
    const hasCustomBackgroundColor = !!(data.background_color && data.background_color !== '#FFFFFF');
    const hasCustomPrimaryFont = !!(data.primary_font && data.primary_font !== 'Inter' && data.primary_font !== '');
    const hasCustomSecondaryFont = !!(data.secondary_font && data.secondary_font !== 'Inter' && data.secondary_font !== '');
    const hasStylePreset = !!(data.style_preset && data.style_preset.trim().length > 0);

    return hasCustomPrimaryColor || hasCustomSecondaryColor || hasCustomBackgroundColor ||
           hasCustomPrimaryFont || hasCustomSecondaryFont || hasStylePreset;
  };

  // Fetch task completion status from database
  useEffect(() => {
    const loadTaskStatus = async () => {
      if (!accountId) {
        setLoading(false);
        return;
      }

      try {
        const taskStatus = await fetchOnboardingTasks(accountId);

        // Check actual data for smart task completion
        const businessProfileComplete = checkBusinessProfileComplete(businessData);
        const keywordsComplete = checkKeywordsAndGuidelinesComplete(businessData);
        const stylingComplete = checkStylingComplete(businessData);
        const universalPageCustomized = checkUniversalPromptPageCustomized(universalPromptPageData);

        // Initialize tasks based on current state and database status
        // Use actual data checks OR manual completion status from database
        const initialTasks: Task[] = [
          {
            id: "business-profile",
            title: "Fill out your business profile",
            description: "Complete your business information",
            link: "/dashboard/business-profile",
            icon: <Icon name="FaStore" className="w-5 h-5" size={20} />,
            completed: businessProfileComplete || taskStatus["business-profile"] || false
          },
          {
            id: "style-prompt-pages",
            title: "Style your prompt pages",
            description: "Match your brand with custom styling",
            link: "/prompt-pages",
            icon: <Icon name="FaPalette" className="w-5 h-5" size={20} />,
            completed: stylingComplete || taskStatus["style-prompt-pages"] || false
          },
          {
            id: "prompt-page-settings",
            title: "Add keywords and AI guidelines",
            description: "Set keywords, dos and don'ts for better AI responses",
            link: "/prompt-pages?openSettings=true",
            icon: <Icon name="FaCog" className="w-5 h-5" size={20} />,
            completed: keywordsComplete || taskStatus["prompt-page-settings"] || false
          },
          {
            id: "customize-universal",
            title: "Customize your universal prompt options",
            description: "Configure your Universal Prompt Page settings",
            link: "/dashboard/edit-prompt-page/universal",
            icon: <Icon name="FaGlobe" className="w-5 h-5" size={20} />,
            completed: universalPageCustomized || taskStatus["customize-universal"] || false
          },
          {
            id: "create-prompt-page",
            title: "Create a new prompt page",
            description: "Build your first custom prompt page",
            link: "/dashboard/create-prompt-page",
            icon: <Icon name="FaPlus" className="w-5 h-5" size={20} />,
            completed: hasCustomPromptPages || taskStatus["create-prompt-page"] || false
          },
          {
            id: "share",
            title: "Share a Prompt Page with your audience",
            description: "Start collecting reviews from your customers",
            icon: <Icon name="FaShare" className="w-5 h-5" size={20} />,
            completed: taskStatus["share"] || false
          }
        ];

        setTasks(initialTasks);
      } catch (error) {
        console.error('Error loading task status:', error);
        // Fallback to basic task initialization
        const fallbackTasks: Task[] = [
          {
            id: "business-profile",
            title: "Fill out your business profile",
            description: "Complete your business information",
            link: "/dashboard/business-profile",
            icon: <Icon name="FaStore" className="w-5 h-5" size={20} />,
            completed: false
          },
          {
            id: "style-prompt-pages",
            title: "Style your prompt pages",
            description: "Match your brand with custom styling",
            link: "/prompt-pages",
            icon: <Icon name="FaPalette" className="w-5 h-5" size={20} />,
            completed: false
          },
          {
            id: "prompt-page-settings",
            title: "Add keywords and AI guidelines",
            description: "Set keywords, dos and don'ts for better AI responses",
            link: "/prompt-pages?openSettings=true",
            icon: <Icon name="FaCog" className="w-5 h-5" size={20} />,
            completed: false
          },
          {
            id: "customize-universal",
            title: "Customize your universal prompt options",
            description: "Configure your Universal Prompt Page settings",
            link: "/dashboard/edit-prompt-page/universal",
            icon: <Icon name="FaGlobe" className="w-5 h-5" size={20} />,
            completed: false
          },
          {
            id: "create-prompt-page",
            title: "Create a new prompt page",
            description: "Build your first custom prompt page",
            link: "/dashboard/create-prompt-page",
            icon: <Icon name="FaFileAlt" className="w-5 h-5" size={20} />,
            completed: false
          },
          {
            id: "share",
            title: "Share a Prompt Page with your audience",
            description: "Start collecting reviews from your customers",
            icon: <Icon name="FaHandshake" className="w-5 h-5" size={20} />,
            completed: false
          }
        ];
        setTasks(fallbackTasks);
      } finally {
        setLoading(false);
      }
    };

    loadTaskStatus();
  }, [accountId, hasBusiness, hasCustomPromptPages, hasUniversalPromptPage, businessData, universalPromptPageData]);

  useEffect(() => {
    // Check if all tasks are completed
    const allCompleted = tasks.every(task => task.completed);
    if (allCompleted && tasks.length > 0 && !loading) {
      // Hide the component after a short delay
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1000);
    }
  }, [tasks, onComplete, loading]);

  const handleTaskClick = async (taskId: string) => {
    if (!accountId) return;

    const newCompleted = !tasks.find(t => t.id === taskId)?.completed;
    
    // Update local state immediately for responsive UI
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: newCompleted } : task
      )
    );

    // Update database
    try {
      if (newCompleted) {
        await markTaskAsCompleted(accountId, taskId);
      } else {
        await markTaskAsIncomplete(accountId, taskId);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert local state if database update failed
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, completed: !newCompleted } : task
        )
      );
    }
  };

  const handleTaskLinkClick = (link: string) => {
    // Just navigate - task completion is detected automatically by checking actual data
    // (e.g., checkBusinessProfileComplete, checkKeywordsAndGuidelinesComplete, etc.)
    router.push(link);
  };

  if (!isVisible || loading || !hasBusiness) {
    return null;
  }

  const completedCount = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="bg-gradient-to-r from-slate-blue to-purple-600 rounded-lg p-6 text-white shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Getting Started</h2>
        <div className="text-sm bg-white bg-opacity-20 rounded-full px-3 py-1">
          {completedCount}/{totalTasks} completed
        </div>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`flex items-center p-3 rounded-lg transition-all duration-200 relative ${
              task.completed
                ? 'bg-white bg-opacity-20'
                : task.id === 'business-profile' && !task.completed
                  ? 'bg-white bg-opacity-15 border-2 border-yellow-300 border-dashed animate-pulse'
                  : 'bg-white bg-opacity-10'
            }`}
          >
            <button
              type="button"
              onClick={() => handleTaskClick(task.id)}
              className="group flex items-center justify-center w-8 h-8 rounded-full bg-white bg-opacity-20 mr-3 cursor-pointer hover:bg-opacity-40 transition-all"
              aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
            >
              {task.completed ? (
                <Icon name="FaCheck" className="w-4 h-4 text-green-300" size={16} />
              ) : (
                <>
                  <div className="text-white group-hover:hidden">
                    {task.icon}
                  </div>
                  <Icon name="FaCheck" className="w-4 h-4 text-white opacity-50 hidden group-hover:block" size={16} />
                </>
              )}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${task.completed ? 'line-through opacity-75' : ''}`}>
                    {task.title}
                  </h3>
                  {task.id === 'business-profile' && !task.completed && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold animate-bounce border border-yellow-300">
                      Start Here!
                    </span>
                  )}
                </div>
                {task.link && !task.completed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskLinkClick(task.link!);
                    }}
                    className={`text-sm rounded px-2 py-1 transition-colors ${
                      task.id === 'business-profile'
                        ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300 font-bold'
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                    }`}
                  >
                    Go →
                  </button>
                )}
                {!task.link && !task.completed && (
                  <span className="text-xs bg-white bg-opacity-20 rounded px-2 py-1">
                    Click icon to complete
                  </span>
                )}
              </div>
              <p className={`text-sm opacity-80 ${task.completed ? 'line-through' : ''}`}>
                {task.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {completedCount === totalTasks && (
        <div className="mt-4 text-center">
          <p className="text-green-300 font-medium">🎉 All set! You're ready to start collecting reviews!</p>
        </div>
      )}
    </div>
  );
};

export default GettingStarted; 