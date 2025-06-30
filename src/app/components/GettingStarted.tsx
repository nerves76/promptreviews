/**
 * GettingStarted Component
 * 
 * Displays a checklist of onboarding tasks for new users.
 * Tasks can be marked as completed and the component disappears when all are done.
 * Now uses database persistence for task completion status.
 */

import React, { useState, useEffect } from "react";
import { FaCheck, FaBusinessTime, FaPalette, FaCog, FaPlus, FaShare } from "react-icons/fa";
import Link from "next/link";
import { fetchOnboardingTasks, markTaskAsCompleted, markTaskAsIncomplete } from "@/utils/onboardingTasks";

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  // Initialize default tasks for new users via API
  useEffect(() => {
    const initializeTasks = async () => {
      if (!userId) return;

      try {
        const response = await fetch('/api/initialize-onboarding-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error initializing default tasks:', errorData);
        } else {
          const result = await response.json();
          console.log('Default tasks initialized:', result);
        }
      } catch (error) {
        console.error('Error calling initialize-onboarding-tasks API:', error);
      }
    };

    initializeTasks();
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
            icon: <FaBusinessTime className="w-5 h-5" />,
            completed: taskStatus["business-profile"] || hasBusiness
          },
          {
            id: "style-prompt-pages",
            title: "Style your prompt pages",
            description: "Match your brand with custom styling",
            link: "/dashboard/style",
            icon: <FaPalette className="w-5 h-5" />,
            completed: taskStatus["style-prompt-pages"] || false
          },
          {
            id: "customize-universal",
            title: "Customize your universal prompt options",
            description: "Configure your universal prompt page settings",
            link: "/dashboard", // This opens the universal prompt modal
            icon: <FaCog className="w-5 h-5" />,
            completed: taskStatus["customize-universal"] || hasUniversalPromptPage
          },
          {
            id: "create-prompt-page",
            title: "Create a new prompt page",
            description: "Build your first custom prompt page",
            link: "/dashboard/create-prompt-page",
            icon: <FaPlus className="w-5 h-5" />,
            completed: taskStatus["create-prompt-page"] || hasCustomPromptPages
          },
          {
            id: "share",
            title: "Share with customers and clients!",
            description: "Start collecting reviews from your customers",
            icon: <FaShare className="w-5 h-5" />,
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
            icon: <FaBusinessTime className="w-5 h-5" />,
            completed: hasBusiness
          },
          {
            id: "style-prompt-pages",
            title: "Style your prompt pages",
            description: "Match your brand with custom styling",
            link: "/dashboard/style",
            icon: <FaPalette className="w-5 h-5" />,
            completed: false
          },
          {
            id: "customize-universal",
            title: "Customize your universal prompt options",
            description: "Configure your universal prompt page settings",
            link: "/dashboard",
            icon: <FaCog className="w-5 h-5" />,
            completed: hasUniversalPromptPage
          },
          {
            id: "create-prompt-page",
            title: "Create a new prompt page",
            description: "Build your first custom prompt page",
            link: "/dashboard/create-prompt-page",
            icon: <FaPlus className="w-5 h-5" />,
            completed: hasCustomPromptPages
          },
          {
            id: "share",
            title: "Share with customers and clients!",
            description: "Start collecting reviews from your customers",
            icon: <FaShare className="w-5 h-5" />,
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

  if (!isVisible || loading) {
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
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
              task.completed 
                ? 'bg-white bg-opacity-20' 
                : 'bg-white bg-opacity-10 hover:bg-opacity-15 cursor-pointer'
            }`}
            onClick={() => !task.completed && handleTaskClick(task.id)}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white bg-opacity-20 mr-3">
              {task.completed ? (
                <FaCheck className="w-4 h-4 text-green-300" />
              ) : (
                <div className="text-white">
                  {task.icon}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className={`font-medium ${task.completed ? 'line-through opacity-75' : ''}`}>
                  {task.title}
                </h3>
                {task.link && !task.completed && (
                  <Link
                    href={task.link}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskLinkClick(task.id);
                    }}
                    className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors"
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