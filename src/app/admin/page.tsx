/**
 * Admin page for managing announcements and quotes
 * This page is only accessible to admin users and provides tools to manage site content
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  isAdmin, 
  createAnnouncement, 
  createQuote, 
  getAllAnnouncements, 
  getAllQuotes,
  toggleAnnouncement,
  toggleQuote
} from '../../utils/admin';

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
  is_active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Announcement state
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  
  // Quote state
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [creatingQuote, setCreatingQuote] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      router.push('/dashboard');
      return;
    }
    setIsAdminUser(true);
    setLoading(false);
    loadContent();
  };

  const loadContent = async () => {
    const [announcementsData, quotesData] = await Promise.all([
      getAllAnnouncements(),
      getAllQuotes()
    ]);
    setAnnouncements(announcementsData);
    setQuotes(quotesData);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMessage.trim()) return;

    setCreatingAnnouncement(true);
    const success = await createAnnouncement(announcementMessage.trim());
    if (success) {
      setAnnouncementMessage('');
      await loadContent();
    }
    setCreatingAnnouncement(false);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim()) return;

    setCreatingQuote(true);
    const success = await createQuote(quoteText.trim(), quoteAuthor.trim() || undefined);
    if (success) {
      setQuoteText('');
      setQuoteAuthor('');
      await loadContent();
    }
    setCreatingQuote(false);
  };

  const handleToggleAnnouncement = async (id: string, currentStatus: boolean) => {
    const success = await toggleAnnouncement(id, !currentStatus);
    if (success) {
      await loadContent();
    }
  };

  const handleToggleQuote = async (id: string, currentStatus: boolean) => {
    const success = await toggleQuote(id, !currentStatus);
    if (success) {
      await loadContent();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slateblue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">Manage announcements and inspirational quotes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Announcements Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
            
            {/* Create Announcement Form */}
            <form onSubmit={handleCreateAnnouncement} className="mb-6">
              <div className="mb-4">
                <label htmlFor="announcement" className="block text-sm font-medium text-gray-700 mb-2">
                  New Announcement
                </label>
                <textarea
                  id="announcement"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slateblue focus:border-transparent"
                  rows={3}
                  placeholder="Enter announcement message..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creatingAnnouncement || !announcementMessage.trim()}
                className="w-full bg-slateblue text-white py-2 px-4 rounded-md hover:bg-slateblue/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingAnnouncement ? 'Creating...' : 'Create Announcement'}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inspirational Quotes</h2>
            
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slateblue focus:border-transparent"
                  rows={3}
                  placeholder="Enter inspirational quote..."
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slateblue focus:border-transparent"
                  placeholder="Quote author..."
                />
              </div>
              <button
                type="submit"
                disabled={creatingQuote || !quoteText.trim()}
                className="w-full bg-slateblue text-white py-2 px-4 rounded-md hover:bg-slateblue/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingQuote ? 'Creating...' : 'Create Quote'}
              </button>
            </form>

            {/* Quotes List */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">All Quotes</h3>
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <div key={quote.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 italic">"{quote.text}"</p>
                        {quote.author && (
                          <p className="text-sm text-gray-600 mt-1">— {quote.author}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(quote.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleQuote(quote.id, quote.is_active)}
                        className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                          quote.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {quote.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
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
            className="text-slateblue hover:text-slateblue/80 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
