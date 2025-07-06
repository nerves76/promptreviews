/**
 * Admin Feedback Management Page
 * 
 * This page provides comprehensive feedback management capabilities for administrators,
 * including viewing, marking as read/unread, and deleting user feedback.
 */

"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabaseClient";
import { getAllFeedback, markFeedbackAsRead, deleteFeedback } from "@/utils/admin";

interface Feedback {
  id: string;
  user_id: string;
  user_email?: string;
  message: string;
  rating?: number;
  category?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminFeedbackPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const feedbackData = await getAllFeedback(supabase);
      setFeedback(feedbackData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading feedback:", error);
      setError("Failed to load feedback");
      setLoading(false);
    }
  };

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      const success = await markFeedbackAsRead(id, !currentRead, supabase);
      if (success) {
        await loadFeedback();
        setSuccess(`Feedback marked as ${!currentRead ? 'read' : 'unread'} successfully!`);
      } else {
        setError("Failed to update feedback status");
      }
    } catch (error) {
      setError("Error updating feedback: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteFeedback(id, supabase);
      if (success) {
        await loadFeedback();
        setSuccess("Feedback deleted successfully!");
      } else {
        setError("Failed to delete feedback");
      }
    } catch (error) {
      setError("Error deleting feedback: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredFeedback = feedback.filter(item => {
    if (filter === 'unread') return !item.is_read;
    if (filter === 'read') return item.is_read;
    return true;
  });

  const unreadCount = feedback.filter(item => !item.is_read).length;
  const readCount = feedback.filter(item => item.is_read).length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue"></div>
    </div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <div className="flex gap-2">
            <span className="text-sm text-gray-600">
              {unreadCount} unread, {readCount} read
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({feedback.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Read ({readCount})
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {filter === 'all' ? 'All Feedback' : filter === 'unread' ? 'Unread Feedback' : 'Read Feedback'}
            </h2>
          </div>
          
          {filteredFeedback.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              {filter === 'all' 
                ? 'No feedback found.' 
                : filter === 'unread' 
                ? 'No unread feedback.' 
                : 'No read feedback.'
              }
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeedback.map((item) => (
                <div key={item.id} className={`px-6 py-4 ${!item.is_read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.is_read 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.is_read ? 'Read' : 'Unread'}
                        </span>
                        {item.rating && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {item.rating}/5 ⭐
                          </span>
                        )}
                        {item.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {item.category}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      
                      {item.user_email && (
                        <p className="text-sm text-gray-600 mb-2">
                          From: {item.user_email}
                        </p>
                      )}
                      
                      <p className="text-gray-900 mb-2">{item.message}</p>
                    </div>
                    
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleToggleRead(item.id, item.is_read)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          item.is_read
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {item.is_read ? 'Mark Unread' : 'Mark Read'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
} 