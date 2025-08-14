/**
 * GettingStarted Component
 * 
 * Displays a checklist of onboarding tasks for new users.
 * Tasks can be marked as completed and the component disappears when all are done.
 * Now uses database persistence for task completion status.
 */

import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import Link from "next/link";
import { fetchOnboardingTasks, markTaskAsCompleted, markTaskAsIncomplete } from "@/utils/onboardingTasks";
import { createClient } from '@/auth/providers/supabase';

interface GettingStartedProps {
  onComplete?: () => void;
  hasBusiness: boolean;
  hasCustomPromptPages: boolean;
  hasUniversalPromptPage: boolean;
  userId?: string;
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
  userId
}) => {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  // Initialize default tasks for new users via API
  useEffect(() => {
    const initializeTasks = async () => {
      if (!userId) return;

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
          console.log('Session not available yet, skipping task initialization');
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
                console.log(`Task initialization attempt ${attempt + 1} failed, retrying in 2 seconds...`);
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
              console.log('Default tasks initialized:', result);
              success = true;
              break;
            }
          } catch (fetchError) {
            lastError = fetchError;
            if (attempt < 2) {
              console.log(`Task initialization attempt ${attempt + 1} failed, retrying in 2 seconds...`);
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
  }, [userId]);

  // Fetch task completion status from database
  useEffect(() => {
    const loadTaskStatus = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const taskStatus = await fetchOnboardingTasks(userId);
        
        // Initialize tasks based on current state and database status
        const initialTasks: Task[] = [
          {
            id: "business-profile",
            title: "Fill out your business profile",
            description: "Complete your business information",
            link: "/dashboard/business-profile",
            icon: <Icon name="FaBuilding" className="w-5 h-5" size={20} />,
            completed: taskStatus["business-profile"] || false
          },
          {
            id: "style-prompt-pages",
            title: "Style your prompt pages",
            description: "Match your brand with custom styling",
            link: "/dashboard/style",
            icon: <Icon name="FaCog" className="w-5 h-5" size={20} />,
            completed: taskStatus["style-prompt-pages"] || false
          },
          {
            id: "customize-universal",
            title: "Customize your universal prompt options",
            description: "Configure your universal prompt page settings",
            link: "/dashboard/edit-prompt-page/universal",
            icon: <Icon name="FaCog" className="w-5 h-5" size={20} />,
            completed: taskStatus["customize-universal"] || false
          },
          {
            id: "create-prompt-page",
            title: "Create a new prompt page",
            description: "Build your first custom prompt page",
            link: "/dashboard/create-prompt-page",
            icon: <Icon name="FaPlus" className="w-5 h-5" size={20} />,
            completed: taskStatus["create-prompt-page"] || false
          },
          {
            id: "share",
            title: "Share with customers and clients!",
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
            link: "/dashboard/style",
            icon: <Icon name="FaPalette" className="w-5 h-5" size={20} />,
            completed: false
          },
          {
            id: "customize-universal",
            title: "Customize your universal prompt options",
            description: "Configure your universal prompt page settings",
            link: "/dashboard/edit-prompt-page/universal",
            icon: <Icon name="FaWrench" className="w-5 h-5" size={20} />,
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
            title: "Share with customers and clients!",
            description: "Start collecting reviews from your customers",
            icon: <Icon name="FaHandsHelping" className="w-5 h-5" size={20} />,
            completed: false
          }
        ];
        setTasks(fallbackTasks);
      } finally {
        setLoading(false);
      }
    };

    loadTaskStatus();
  }, [userId, hasBusiness, hasCustomPromptPages, hasUniversalPromptPage]);

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
    if (!userId) return;

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
        await markTaskAsCompleted(userId, taskId);
      } else {
        await markTaskAsIncomplete(userId, taskId);
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

  const handleTaskLinkClick = async (taskId: string) => {
    if (!userId) return;

    // Mark task as completed when user clicks the link
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: true } : task
      )
    );

    // Update database
    try {
      await markTaskAsCompleted(userId, taskId);
    } catch (error) {
      console.error('Error marking task as completed:', error);
    }
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
                  ? 'bg-white bg-opacity-15 hover:bg-opacity-20 cursor-pointer border-2 border-yellow-300 border-dashed animate-pulse'
                  : 'bg-white bg-opacity-10 hover:bg-opacity-15 cursor-pointer'
            }`}
            onClick={() => !task.completed && handleTaskClick(task.id)}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white bg-opacity-20 mr-3">
              {task.completed ? (
                <Icon name="FaCheck" className="w-4 h-4 text-green-300" size={16} />
              ) : (
                <div className="text-white">
                  {task.icon}
                </div>
              )}
            </div>
            
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
                  <Link
                    href={task.link}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskLinkClick(task.id);
                    }}
                    className={`text-sm rounded px-2 py-1 transition-colors ${
                      task.id === 'business-profile' 
                        ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300 font-bold' 
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                    }`}
                  >
                    Go →
                  </Link>
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