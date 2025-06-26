/**
 * Admin page for managing announcements and quotes
 * This page is only accessible to admin users and provides tools to manage site content
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { 
  isAdmin, 
  createAnnouncement, 
  createQuote, 
  getAllAnnouncements, 
  getAllQuotes,
  toggleAnnouncement,
  toggleQuote,
  deleteQuote,
  updateQuote,
  getActiveAnnouncement,
  getAllFeedback,
  markFeedbackAsRead,
  deleteFeedback
} from '../../utils/admin';
import { trackAdminAction } from '../../utils/analytics';
import TrialBanner from '../components/TrialBanner';
import EmailTemplatesSection from '../components/EmailTemplatesSection';

// Use the same Supabase client as the Header component
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

interface Quote {
  id: string;
  text: string;
  author?: string;
  button_text?: string;
  button_url?: string;
  is_active: boolean;
  created_at: string;
}

interface Feedback {
  id: string;
  user_id: string;
  category: string;
  message: string;
  email?: string;
  is_read: boolean;
  created_at: string;
  users?: {
    email?: string;
    user_metadata?: any;
  };
}

export default function AdminPage() {
  console.log('Admin page: Component rendering');
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Announcement state
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementButtonText, setAnnouncementButtonText] = useState('');
  const [announcementButtonUrl, setAnnouncementButtonUrl] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  
  // Quote state
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteButtonText, setQuoteButtonText] = useState('');
  const [quoteButtonUrl, setQuoteButtonUrl] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [creatingQuote, setCreatingQuote] = useState(false);
  
  // Edit quote state
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editQuoteText, setEditQuoteText] = useState('');
  const [editQuoteAuthor, setEditQuoteAuthor] = useState('');
  const [editQuoteButtonText, setEditQuoteButtonText] = useState('');
  const [editQuoteButtonUrl, setEditQuoteButtonUrl] = useState('');
  const [updatingQuote, setUpdatingQuote] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'content' | 'feedback' | 'analytics' | 'email-templates'>('content');
  
  // Trial banner test state
  const [showTrialBannerTest, setShowTrialBannerTest] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    console.log('Admin page: Starting admin status check');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Admin page: User check result:', { user: user?.id, email: user?.email, error: userError });
      
      if (userError) {
        console.log('Admin page: User error:', userError);
        setError('Authentication error: ' + userError.message);
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.log('Admin page: No user found');
        setError('No user found. Please sign in.');
        setLoading(false);
        return;
      }
      
      console.log('Admin page: Checking admin status for user:', user.id);
      const adminStatus = await isAdmin(user.id, supabase);
      console.log('Admin page: Admin status result:', adminStatus);
      
      if (!adminStatus) {
        console.log('Admin page: User is not admin');
        setError('Access denied. You do not have admin privileges.');
        setLoading(false);
        return;
      }
      
      console.log('Admin page: User is admin, setting state and loading content');
      setIsAdminUser(true);
      setLoading(false);
      loadContent();
    } catch (error) {
      console.log('Admin page: Error in checkAdminStatus:', error);
      setError('Error checking admin status: ' + (error as Error).message);
      setLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      console.log('Admin: Loading content...');
      const [announcementsData, quotesData, feedbackData] = await Promise.all([
        getAllAnnouncements(supabase),
        getAllQuotes(supabase),
        getAllFeedback(supabase)
      ]);
      console.log('Admin: Loaded announcements:', announcementsData);
      console.log('Admin: Loaded quotes:', quotesData);
      console.log('Admin: Loaded feedback:', feedbackData);
      setAnnouncements(announcementsData);
      setQuotes(quotesData);
      setFeedback(feedbackData);
    } catch (error) {
      console.log('Admin page: Error loading content:', error);
      setError('Error loading content: ' + (error as Error).message);
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMessage.trim()) return;

    console.log('Admin: Submitting announcement:', {
      message: announcementMessage,
      buttonText: announcementButtonText,
      buttonUrl: announcementButtonUrl
    });

    setCreatingAnnouncement(true);
    try {
      const success = await createAnnouncement(announcementMessage.trim(), announcementButtonText, announcementButtonUrl, supabase);
      console.log('Admin: Announcement save result:', success);
      if (success) {
        console.log('Admin: Announcement saved successfully, clearing form and reloading content');
        setAnnouncementMessage('');
        setAnnouncementButtonText('');
        setAnnouncementButtonUrl('');
        await loadContent();
        
        // Track the admin action
        trackAdminAction('announcement_created', {
          has_button: !!(announcementButtonText && announcementButtonUrl),
          message_length: announcementMessage.length,
        });
        
        // Test if the announcement can be retrieved immediately
        console.log('Admin: Testing announcement retrieval...');
        const testAnnouncement = await getActiveAnnouncement(supabase);
        console.log('Admin: Test announcement retrieval result:', testAnnouncement);
      } else {
        console.error('Admin: Failed to save announcement');
      }
    } catch (error) {
      console.error('Admin: Error saving announcement:', error);
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim()) return;

    setCreatingQuote(true);
    setError(null); // Clear previous errors
    try {
      console.log('Admin: Creating quote with data:', {
        text: quoteText.trim(),
        author: quoteAuthor.trim() || undefined,
        buttonText: quoteButtonText.trim() || undefined,
        buttonUrl: quoteButtonUrl.trim() || undefined
      });

      const success = await createQuote(quoteText.trim(), quoteAuthor.trim() || undefined, quoteButtonText, quoteButtonUrl, supabase);
      
      if (success) {
        console.log('Admin: Quote created successfully');
        setQuoteText('');
        setQuoteAuthor('');
        setQuoteButtonText('');
        setQuoteButtonUrl('');
        await loadContent();
        
        // Track the admin action
        trackAdminAction('quote_created', {
          has_author: !!quoteAuthor.trim(),
          has_button: !!(quoteButtonText && quoteButtonUrl),
          text_length: quoteText.length,
        });
      } else {
        console.error('Admin: Failed to create quote');
        setError('Failed to create quote. Please check the console for details.');
      }
    } catch (error) {
      console.log('Admin page: Error creating quote:', error);
      setError('Error creating quote: ' + (error as Error).message);
    }
    setCreatingQuote(false);
  };

  const handleToggleAnnouncement = async (id: string, currentStatus: boolean) => {
    try {
      const success = await toggleAnnouncement(id, !currentStatus, supabase);
      if (success) {
        await loadContent();
      }
    } catch (error) {
      console.log('Admin page: Error toggling announcement:', error);
      setError('Error updating announcement: ' + (error as Error).message);
    }
  };

  const handleToggleQuote = async (id: string, currentStatus: boolean) => {
    try {
      const success = await toggleQuote(id, !currentStatus, supabase);
      if (success) {
        await loadContent();
      }
    } catch (error) {
      console.log('Admin page: Error toggling quote:', error);
      setError('Error updating quote: ' + (error as Error).message);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteQuote(id, supabase);
      if (success) {
        console.log('Admin: Quote deleted successfully');
        await loadContent();
        
        // Track the admin action
        trackAdminAction('quote_deleted', {
          quote_id: id,
        });
      } else {
        console.error('Admin: Failed to delete quote');
        setError('Failed to delete quote. Please check the console for details.');
      }
    } catch (error) {
      console.log('Admin page: Error deleting quote:', error);
      setError('Error deleting quote: ' + (error as Error).message);
    }
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote.id);
    setEditQuoteText(quote.text);
    setEditQuoteAuthor(quote.author || '');
    setEditQuoteButtonText(quote.button_text || '');
    setEditQuoteButtonUrl(quote.button_url || '');
  };

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote || !editQuoteText.trim()) return;

    setUpdatingQuote(true);
    setError(null);
    try {
      console.log('Admin: Updating quote with data:', {
        id: editingQuote,
        text: editQuoteText.trim(),
        author: editQuoteAuthor.trim() || undefined,
        buttonText: editQuoteButtonText.trim() || undefined,
        buttonUrl: editQuoteButtonUrl.trim() || undefined
      });

      const success = await updateQuote(
        editingQuote,
        editQuoteText.trim(),
        editQuoteAuthor.trim() || undefined,
        editQuoteButtonText,
        editQuoteButtonUrl,
        supabase
      );
      
      if (success) {
        console.log('Admin: Quote updated successfully');
        handleCancelEdit();
        await loadContent();
        
        // Track the admin action
        trackAdminAction('quote_updated', {
          quote_id: editingQuote,
          has_author: !!editQuoteAuthor.trim(),
          has_button: !!(editQuoteButtonText && editQuoteButtonUrl),
          text_length: editQuoteText.length,
        });
      } else {
        console.error('Admin: Failed to update quote');
        setError('Failed to update quote. Please check the console for details.');
      }
    } catch (error) {
      console.log('Admin page: Error updating quote:', error);
      setError('Error updating quote: ' + (error as Error).message);
    }
    setUpdatingQuote(false);
  };

  const handleCancelEdit = () => {
    setEditingQuote(null);
    setEditQuoteText('');
    setEditQuoteAuthor('');
    setEditQuoteButtonText('');
    setEditQuoteButtonUrl('');
  };

  const handleMarkFeedbackAsRead = async (feedbackId: string, isRead: boolean) => {
    setLoadingFeedback(true);
    try {
      const success = await markFeedbackAsRead(feedbackId, isRead, supabase);
      if (success) {
        // Update local state
        setFeedback(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, is_read: isRead } : f
        ));
        
        // Track the admin action
        trackAdminAction('feedback_marked_read', {
          feedback_id: feedbackId,
          is_read: isRead,
        });
      }
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback submission? This action cannot be undone.')) {
      return;
    }

    setLoadingFeedback(true);
    try {
      const success = await deleteFeedback(feedbackId, supabase);
      if (success) {
        // Remove from local state
        setFeedback(prev => prev.filter(f => f.id !== feedbackId));
        
        // Track the admin action
        trackAdminAction('feedback_deleted', {
          feedback_id: feedbackId,
        });
      } else {
        console.error('Failed to delete feedback');
        setError('Failed to delete feedback. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setError('Error deleting feedback: ' + (error as Error).message);
    } finally {
      setLoadingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-slate-blue text-white py-2 px-4 rounded-md hover:bg-slate-blue/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="mt-2 text-indigo-100">Manage site content and view analytics</p>
        </div>

        {/* Admin Subnav */}
        <div className="mb-8 border-b border-indigo-300/30">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`border-b-2 py-2 px-1 text-sm font-medium ${
                activeTab === 'content'
                  ? 'border-white text-white'
                  : 'border-transparent text-indigo-200 hover:text-white hover:border-indigo-300'
              }`}
            >
              Content Management
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`border-b-2 py-2 px-1 text-sm font-medium ${
                activeTab === 'feedback'
                  ? 'border-white text-white'
                  : 'border-transparent text-indigo-200 hover:text-white hover:border-indigo-300'
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`border-b-2 py-2 px-1 text-sm font-medium ${
                activeTab === 'analytics'
                  ? 'border-white text-white'
                  : 'border-transparent text-indigo-200 hover:text-white hover:border-indigo-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('email-templates')}
              className={`border-b-2 py-2 px-1 text-sm font-medium ${
                activeTab === 'email-templates'
                  ? 'border-white text-white'
                  : 'border-transparent text-indigo-200 hover:text-white hover:border-indigo-300'
              }`}
            >
              Email Templates
            </button>
          </nav>
        </div>

        {/* Trial Banner Test Section */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trial Banner Test</h2>
          <p className="text-gray-600 mb-4">Test the trial countdown banner to see how it looks for users.</p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowTrialBannerTest(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Show Trial Banner
            </button>
            <button
              onClick={() => setShowTrialBannerTest(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Hide Trial Banner
            </button>
          </div>
        </div>

        {/* Test Trial Banner */}
        {showTrialBannerTest && (
          <div className="mb-8">
            <TrialBanner showForTesting={true} />
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Announcements Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
              
              {/* Create Announcement Form */}
              <form onSubmit={handleAnnouncementSubmit} className="mb-6">
                <div className="mb-4">
                  <label htmlFor="announcement" className="block text-sm font-medium text-gray-700 mb-2">
                    New Announcement
                  </label>
                  <textarea
                    id="announcement"
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    rows={3}
                    placeholder="Enter announcement message..."
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    id="buttonText"
                    value={announcementButtonText}
                    onChange={(e) => setAnnouncementButtonText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    placeholder="Enter button text..."
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="buttonUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Button URL
                  </label>
                  <input
                    type="text"
                    id="buttonUrl"
                    value={announcementButtonUrl}
                    onChange={(e) => setAnnouncementButtonUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    placeholder="Enter button URL..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingAnnouncement || !announcementMessage.trim()}
                  className="w-full bg-slate-blue text-white py-3 px-6 rounded-md hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                >
                  {creatingAnnouncement ? 'Saving...' : 'Save Announcement'}
                </button>
              </form>

              {/* Announcements List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">All Announcements</h3>
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-900">{announcement.message}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleAnnouncement(announcement.id, announcement.is_active)}
                          className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                            announcement.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No announcements yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quotes Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quotes</h2>
              
              {/* Create Quote Form */}
              <form onSubmit={handleCreateQuote} className="mb-6">
                <div className="mb-4">
                  <label htmlFor="quote" className="block text-sm font-medium text-gray-700 mb-2">
                    Quote Text
                  </label>
                  <textarea
                    id="quote"
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    rows={3}
                    placeholder="Enter quote text..."
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                    Author (Optional)
                  </label>
                  <input
                    type="text"
                    id="author"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    placeholder="Quote author..."
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    id="buttonText"
                    value={quoteButtonText}
                    onChange={(e) => setQuoteButtonText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    placeholder="Enter button text..."
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="buttonUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Button URL
                  </label>
                  <input
                    type="text"
                    id="buttonUrl"
                    value={quoteButtonUrl}
                    onChange={(e) => setQuoteButtonUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    placeholder="Enter button URL..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingQuote || !quoteText.trim()}
                  className="w-full bg-slate-blue text-white py-3 px-6 rounded-md hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                >
                  {creatingQuote ? 'Saving...' : 'Save Quote'}
                </button>
              </form>

              {/* Quotes List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">All Quotes</h3>
                <div className="space-y-3">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="border border-gray-200 rounded-md p-4">
                      {editingQuote === quote.id ? (
                        // Edit Form
                        <form onSubmit={handleUpdateQuote}>
                          <div className="mb-4">
                            <label htmlFor={`edit-quote-${quote.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                              Quote Text
                            </label>
                            <textarea
                              id={`edit-quote-${quote.id}`}
                              value={editQuoteText}
                              onChange={(e) => setEditQuoteText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                              rows={3}
                              placeholder="Enter quote text..."
                              required
                            />
                          </div>
                          <div className="mb-4">
                            <label htmlFor={`edit-author-${quote.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                              Author (Optional)
                            </label>
                            <input
                              type="text"
                              id={`edit-author-${quote.id}`}
                              value={editQuoteAuthor}
                              onChange={(e) => setEditQuoteAuthor(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                              placeholder="Quote author..."
                            />
                          </div>
                          <div className="mb-4">
                            <label htmlFor={`edit-buttonText-${quote.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                              Button Text
                            </label>
                            <input
                              type="text"
                              id={`edit-buttonText-${quote.id}`}
                              value={editQuoteButtonText}
                              onChange={(e) => setEditQuoteButtonText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                              placeholder="Enter button text..."
                            />
                          </div>
                          <div className="mb-4">
                            <label htmlFor={`edit-buttonUrl-${quote.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                              Button URL
                            </label>
                            <input
                              type="text"
                              id={`edit-buttonUrl-${quote.id}`}
                              value={editQuoteButtonUrl}
                              onChange={(e) => setEditQuoteButtonUrl(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                              placeholder="Enter button URL..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={updatingQuote || !editQuoteText.trim()}
                              className="flex-1 bg-slate-blue text-white py-2 px-4 rounded-md hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              {updatingQuote ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={updatingQuote}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        // Display Mode
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900 italic">"{quote.text}"</p>
                            {quote.author && (
                              <p className="text-sm text-gray-600 mt-1">— {quote.author}</p>
                            )}
                            {quote.button_text && quote.button_url && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm text-blue-800">
                                  <strong>Button:</strong> {quote.button_text}
                                </p>
                                <p className="text-sm text-blue-600 truncate">
                                  <strong>URL:</strong> {quote.button_url}
                                </p>
                              </div>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(quote.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => handleToggleQuote(quote.id, quote.is_active)}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                quote.is_active
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {quote.is_active ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => handleEditQuote(quote)}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {quotes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No quotes yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Feedback Management</h2>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">All Feedback Submissions</h3>
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className={`border rounded-md p-4 ${item.is_read ? 'bg-gray-50' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.category === 'bug_report' ? 'bg-red-100 text-red-800' :
                            item.category === 'feature_request' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.category.replace('_', ' ').toUpperCase()}
                          </span>
                          {!item.is_read && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              NEW
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-900 mb-2">{item.message}</p>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.users?.email && (
                            <p><strong>User:</strong> {item.users.email}</p>
                          )}
                          {item.email && (
                            <p><strong>Contact Email:</strong> {item.email}</p>
                          )}
                          <p><strong>Submitted:</strong> {new Date(item.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleMarkFeedbackAsRead(item.id, !item.is_read)}
                          disabled={loadingFeedback}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.is_read
                              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          } disabled:opacity-50`}
                        >
                          {loadingFeedback ? '...' : (item.is_read ? 'Mark Unread' : 'Mark Read')}
                        </button>
                        <button
                          onClick={() => handleDeleteFeedback(item.id)}
                          disabled={loadingFeedback}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            loadingFeedback ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } disabled:opacity-50`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {feedback.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No feedback submissions yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Analytics</h3>
            <p className="text-indigo-200">Analytics dashboard coming soon...</p>
          </div>
        )}

        {activeTab === 'email-templates' && (
          <EmailTemplatesSection />
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-slate-blue text-white py-2 px-4 rounded-md hover:bg-slate-blue/90"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
