/**
 * Admin Announcements Management Page
 * 
 * This page provides comprehensive announcement management capabilities for administrators,
 * including creating, editing, activating/deactivating, and deleting banner announcements.
 */

"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/auth/providers/supabase";
import { getAllAnnouncements, createAnnouncement, toggleAnnouncement } from "@/utils/admin";

interface Announcement {
  id: string;
  message: string;
  button_text?: string;
  button_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export default function AdminAnnouncementsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    buttonText: '',
    buttonUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const announcementsData = await getAllAnnouncements(supabase);
      setAnnouncements(announcementsData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading announcements:", error);
      setError("Failed to load announcements");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const success = await createAnnouncement(
        formData.message,
        formData.buttonText || undefined,
        formData.buttonUrl || undefined,
        supabase
      );

      if (success) {
        setSuccess("Announcement created successfully!");
        setFormData({ message: '', buttonText: '', buttonUrl: '' });
        setShowForm(false);
        await loadAnnouncements();
      } else {
        setError("Failed to create announcement");
      }
    } catch (error) {
      setError("Error creating announcement: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const success = await toggleAnnouncement(id, !currentActive, supabase);
      if (success) {
        await loadAnnouncements();
        setSuccess(`Announcement ${!currentActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        setError("Failed to update announcement status");
      }
    } catch (error) {
      setError("Error updating announcement: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue"></div>
    </div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Announcements Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
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

        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create new announcement</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                  placeholder="Enter announcement message..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Learn More"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.buttonUrl}
                    onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Announcement'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Announcements</h2>
          </div>
          
          {announcements.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No announcements found. Create your first announcement above.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          announcement.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(announcement.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 mb-2">{announcement.message}</p>
                      
                      {(announcement.button_text || announcement.button_url) && (
                        <div className="text-sm text-gray-600">
                          {announcement.button_text && (
                            <span className="mr-4">
                              Button: {announcement.button_text}
                            </span>
                          )}
                          {announcement.button_url && (
                            <span>
                              URL: {announcement.button_url}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <button
                        onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          announcement.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {announcement.is_active ? 'Deactivate' : 'Activate'}
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