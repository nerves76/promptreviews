/**
 * GettingStarted Component
 * 
 * Displays a checklist of onboarding tasks for new users.
 * Tasks can be marked as completed and the component disappears when all are done.
 */

import React, { useState, useEffect } from "react";
import { FaCheck, FaBusinessTime, FaPalette, FaCog, FaPlus, FaShare } from "react-icons/fa";
import Link from "next/link";

interface GettingStartedProps {
  onComplete?: () => void;
  hasBusiness: boolean;
  hasCustomPromptPages: boolean;
  hasUniversalPromptPage: boolean;
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
  hasUniversalPromptPage
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Initialize tasks based on current state
    const initialTasks: Task[] = [
      {
        id: "business-profile",
        title: "Fill out your business profile",
        description: "Complete your business information",
        link: "/dashboard/business-profile",
        icon: <FaBusinessTime className="w-5 h-5" />,
        completed: false // User needs to manually complete this
      },
      {
        id: "style-prompt-pages",
        title: "Style your prompt pages",
        description: "Match your brand with custom styling",
        link: "/dashboard/style",
        icon: <FaPalette className="w-5 h-5" />,
        completed: false // This will be checked when user visits style page
      },
      {
        id: "customize-universal",
        title: "Customize your universal prompt options",
        description: "Configure your universal prompt page settings",
        link: "/dashboard", // This opens the universal prompt modal
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
        completed: false // This will be checked when user shares
      }
    ];

    setTasks(initialTasks);
  }, [hasBusiness, hasCustomPromptPages, hasUniversalPromptPage]);

  useEffect(() => {
    // Check if all tasks are completed
    const allCompleted = tasks.every(task => task.completed);
    if (allCompleted && tasks.length > 0) {
      // Hide the component after a short delay
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1000);
    }
  }, [tasks, onComplete]);

  const handleTaskClick = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleTaskLinkClick = (taskId: string) => {
    // Mark task as completed when user clicks the link
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: true } : task
      )
    );
  };

  if (!isVisible) {
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