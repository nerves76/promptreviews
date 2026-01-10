/**
 * Email Templates Admin Page
 * 
 * This page provides comprehensive email template management capabilities for administrators,
 * including editing templates like welcome emails, review notifications, and trial reminders.
 */

"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/auth/providers/supabase";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const supabase = createClient();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates');
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates || []);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (error) {
      setError('Error fetching templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      is_active: template.is_active
    });
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTemplate.id,
          updates: {
            subject: formData.subject,
            html_content: formData.html_content,
            text_content: formData.text_content || null,
            is_active: formData.is_active
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Template updated successfully');
        setEditingTemplate(null);
        fetchTemplates();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update template');
      }
    } catch (error) {
      setError('Error updating template');
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      is_active: true
    });
    setPreviewMode(false);
  };

  const getTemplateDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'welcome': 'Sent to new users when they sign up',
      'trial_reminder': 'Sent to users 3 days before their trial expires',
      'trial_expired': 'Sent to users when their trial has expired',
      'review_notification': 'Sent to businesses when they receive a new review',
      'password_reset': 'Sent when users request a password reset',
      'invitation': 'Sent when team members are invited to join an account'
    };
    return descriptions[name] || 'Custom email template';
  };

  const renderPreview = () => {
    const previewVariables = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      businessName: 'Example Business',
      dashboardUrl: 'https://app.promptreviews.app/dashboard',
      loginUrl: 'https://app.promptreviews.app/auth/sign-in',
      upgradeUrl: 'https://app.promptreviews.app/dashboard/plan',
      promptPagesUrl: 'https://app.promptreviews.app/dashboard/edit-prompt-page/universal',
      businessProfileUrl: 'https://app.promptreviews.app/dashboard/business-profile',
      widgetUrl: 'https://app.promptreviews.app/dashboard/widget',
      reviewsUrl: 'https://app.promptreviews.app/dashboard/reviews',
      contactsUrl: 'https://app.promptreviews.app/dashboard/contacts',
      analyticsUrl: 'https://app.promptreviews.app/dashboard/analytics',
      planUrl: 'https://app.promptreviews.app/dashboard/plan',
      teamUrl: 'https://app.promptreviews.app/dashboard/team',
      googleBusinessUrl: 'https://app.promptreviews.app/dashboard/google-business',
      communityUrl: 'https://app.promptreviews.app/dashboard/community',
      gameUrl: 'https://app.promptreviews.app/game'
    };

    let previewContent = formData.html_content;
    Object.entries(previewVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(regex, value);
    });

    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-2">Preview (with sample data)</h4>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewContent }} />
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue"></div>
    </div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Email templates</h1>
        <div className="text-sm text-white/80">
          {templates.length} templates
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

      {/* Template List */}
      {!editingTemplate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {template.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getTemplateDescription(template.name)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {template.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-slate-blue hover:text-slate-blue/80"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Template Form */}
      {editingTemplate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Template: {editingTemplate.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 text-sm font-medium text-slate-blue bg-slate-blue/10 hover:bg-slate-blue/20 rounded-md transition-colors"
              >
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 rounded-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {getTemplateDescription(editingTemplate.name)}
            </p>
          </div>

          {previewMode ? (
            renderPreview()
          ) : (
            <div className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                  placeholder="Enter email subject..."
                />
              </div>

              {/* HTML Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content
                </label>
                <textarea
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                  rows={12}
                  placeholder="Enter HTML content..."
                />
              </div>

              {/* Text Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plain Text Version (Optional)
                </label>
                <textarea
                  value={formData.text_content}
                  onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                  rows={6}
                  placeholder="Enter plain text version..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Template is active</span>
                </label>
              </div>

              {/* Variable Reference */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Available Variables</h4>
                <div className="text-sm text-blue-800 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <p className="font-medium text-blue-900 mb-1">User Info</p>
                    <p><code>{'{{firstName}}'}</code> - User's first name</p>
                    <p><code>{'{{lastName}}'}</code> - User's last name</p>
                    <p><code>{'{{email}}'}</code> - User's email address</p>
                    <p><code>{'{{businessName}}'}</code> - Business name</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Page URLs</p>
                    <p><code>{'{{dashboardUrl}}'}</code> - Main dashboard</p>
                    <p><code>{'{{loginUrl}}'}</code> - Login page</p>
                    <p><code>{'{{promptPagesUrl}}'}</code> - Prompt Pages</p>
                    <p><code>{'{{businessProfileUrl}}'}</code> - Business profile</p>
                    <p><code>{'{{widgetUrl}}'}</code> - Widget management</p>
                    <p><code>{'{{reviewsUrl}}'}</code> - Reviews dashboard</p>
                    <p><code>{'{{contactsUrl}}'}</code> - Contacts</p>
                    <p><code>{'{{analyticsUrl}}'}</code> - Analytics</p>
                    <p><code>{'{{planUrl}}'}</code> - Pricing/plan page</p>
                    <p><code>{'{{teamUrl}}'}</code> - Team management</p>
                    <p><code>{'{{googleBusinessUrl}}'}</code> - Google Business</p>
                    <p><code>{'{{communityUrl}}'}</code> - Community page</p>
                    <p><code>{'{{gameUrl}}'}</code> - Get Found Online game</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 