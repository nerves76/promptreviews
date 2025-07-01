/**
 * Admin Quotes Management Page
 * 
 * This page provides comprehensive quotes management capabilities for administrators,
 * including creating, editing, activating/deactivating, and deleting quotes displayed on the dashboard.
 */

"use client";

import { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabaseClient";
import { getAllQuotes, createQuote, toggleQuote, deleteQuote, updateQuote } from "@/utils/admin";

interface Quote {
  id: string;
  text: string;
  author?: string;
  button_text?: string;
  button_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminQuotesPage() {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    author: '',
    buttonText: '',
    buttonUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const quotesData = await getAllQuotes(supabase);
      setQuotes(quotesData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading quotes:", error);
      setError("Failed to load quotes");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ text: '', author: '', buttonText: '', buttonUrl: '' });
    setEditingQuote(null);
    setShowForm(false);
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      text: quote.text,
      author: quote.author || '',
      buttonText: quote.button_text || '',
      buttonUrl: quote.button_url || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let success = false;
      
      if (editingQuote) {
        // Update existing quote
        success = await updateQuote(
          editingQuote.id,
          formData.text,
          formData.author || undefined,
          formData.buttonText || undefined,
          formData.buttonUrl || undefined,
          supabase
        );
      } else {
        // Create new quote
        success = await createQuote(
          formData.text,
          formData.author || undefined,
          formData.buttonText || undefined,
          formData.buttonUrl || undefined,
          supabase
        );
      }

      if (success) {
        setSuccess(`Quote ${editingQuote ? 'updated' : 'created'} successfully!`);
        resetForm();
        await loadQuotes();
      } else {
        setError(`Failed to ${editingQuote ? 'update' : 'create'} quote`);
      }
    } catch (error) {
      setError(`Error ${editingQuote ? 'updating' : 'creating'} quote: ` + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const success = await toggleQuote(id, !currentActive, supabase);
      if (success) {
        await loadQuotes();
        setSuccess(`Quote ${!currentActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        setError("Failed to update quote status");
      }
    } catch (error) {
      setError("Error updating quote: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteQuote(id, supabase);
      if (success) {
        await loadQuotes();
        setSuccess("Quote deleted successfully!");
      } else {
        setError("Failed to delete quote");
      }
    } catch (error) {
      setError("Error deleting quote: " + (error instanceof Error ? error.message : 'Unknown error'));
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
          <h1 className="text-3xl font-bold text-gray-900">Quotes Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : 'New Quote'}
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
            <h2 className="text-xl font-semibold mb-4">
              {editingQuote ? 'Edit Quote' : 'Create New Quote'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quote Text *
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                  placeholder="Enter quote text..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John Doe"
                  />
                </div>
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
                  {isSubmitting ? (editingQuote ? 'Updating...' : 'Creating...') : (editingQuote ? 'Update Quote' : 'Create Quote')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
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
            <h2 className="text-lg font-semibold text-gray-900">All Quotes</h2>
          </div>
          
          {quotes.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No quotes found. Create your first quote above.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {quotes.map((quote) => (
                <div key={quote.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          quote.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {quote.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(quote.created_at)}
                        </span>
                      </div>
                      
                      <blockquote className="text-gray-900 mb-2 italic">
                        "{quote.text}"
                      </blockquote>
                      
                      {quote.author && (
                        <p className="text-sm text-gray-600 mb-2">
                          — {quote.author}
                        </p>
                      )}
                      
                      {(quote.button_text || quote.button_url) && (
                        <div className="text-sm text-gray-600">
                          {quote.button_text && (
                            <span className="mr-4">
                              Button: {quote.button_text}
                            </span>
                          )}
                          {quote.button_url && (
                            <span>
                              URL: {quote.button_url}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(quote)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(quote.id, quote.is_active)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          quote.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {quote.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(quote.id)}
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