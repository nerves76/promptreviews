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
  getActiveAnnouncement
} from '../../utils/admin';

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
      const [announcementsData, quotesData] = await Promise.all([
        getAllAnnouncements(supabase),
        getAllQuotes(supabase)
      ]);
      console.log('Admin: Loaded announcements:', announcementsData);
      console.log('Admin: Loaded quotes:', quotesData);
      setAnnouncements(announcementsData);
      setQuotes(quotesData);
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
            <Link
              href="/admin"
              className="border-b-2 border-white py-2 px-1 text-sm font-medium text-white"
            >
              Content Management
            </Link>
            <Link
              href="/admin/analytics"
              className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-indigo-200 hover:text-white hover:border-indigo-300"
            >
              Analytics
            </Link>
          </nav>
        </div>

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
