/**
 * EmailTemplatesSection Component
 * 
 * Admin interface for managing email templates
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';

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

export default function EmailTemplatesSection() {
  const supabase = createClient();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResults, setReminderResults] = useState<any>(null);

  // Using singleton Supabase client from supabaseClient.ts

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates');
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data.templates);
      } else {
        console.error('Error fetching templates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTemplate.id,
          updates: {
            subject: editingTemplate.subject,
            html_content: editingTemplate.html_content,
            text_content: editingTemplate.text_content,
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTemplates(templates.map(t => 
          t.id === editingTemplate.id ? editingTemplate : t
        ));
        setEditingTemplate(null);
      } else {
        console.error('Error saving template:', data.error);
        alert('Error saving template: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTrialReminders = async () => {
    setSendingReminders(true);
    try {
      const response = await fetch('/api/send-trial-reminders', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        setReminderResults(data);
        alert(`Trial reminders sent! ${data.summary.sent} successful, ${data.summary.failed} failed.`);
      } else {
        console.error('Error sending reminders:', data.error);
        alert('Error sending reminders: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Error sending reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const getTemplateDisplayName = (name: string) => {
    const names: { [key: string]: string } = {
      'welcome': 'Welcome Email',
      'trial_reminder': 'Trial Reminder (3 days before)',
      'trial_expired': 'Trial Expired',
    };
    return names[name] || name;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-white">Email Templates</h3>
        <div className="text-indigo-200">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Email Templates</h3>
        <button
          onClick={handleSendTrialReminders}
          disabled={sendingReminders}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {sendingReminders ? 'Sending...' : 'Send Trial Reminders'}
        </button>
      </div>

      {reminderResults && (
        <div className="bg-indigo-900/50 border border-indigo-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Trial Reminder Results</h4>
          <div className="text-indigo-200 text-sm">
            <p>Total: {reminderResults.summary.total}</p>
            <p>Sent: {reminderResults.summary.sent}</p>
            <p>Failed: {reminderResults.summary.failed}</p>
            {reminderResults.summary.skipped > 0 && (
              <p>Skipped: {reminderResults.summary.skipped}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-indigo-900/50 border border-indigo-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-white font-medium">
                  {getTemplateDisplayName(template.name)}
                </h4>
                <p className="text-indigo-300 text-sm">
                  Subject: {template.subject}
                </p>
              </div>
              <button
                onClick={() => setEditingTemplate(editingTemplate?.id === template.id ? null : template)}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
              >
                {editingTemplate?.id === template.id ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingTemplate?.id === template.id && (
              <div className="space-y-4">
                <div>
                  <label className="block text-indigo-200 text-sm font-medium mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      subject: e.target.value
                    })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-indigo-200 text-sm font-medium mb-1">
                    HTML Content
                  </label>
                  <textarea
                    value={editingTemplate.html_content}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      html_content: e.target.value
                    })}
                    rows={8}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-indigo-200 text-sm font-medium mb-1">
                    Text Content (optional)
                  </label>
                  <textarea
                    value={editingTemplate.text_content || ''}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      text_content: e.target.value
                    })}
                    rows={6}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {editingTemplate?.id !== template.id && (
              <div className="text-indigo-300 text-sm">
                <p className="mb-2">
                  <strong>Available variables:</strong> {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, {'{{dashboardUrl}}'}, {'{{loginUrl}}'}, {'{{upgradeUrl}}'}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-indigo-200 hover:text-white">
                    Preview HTML Content
                  </summary>
                  <pre className="mt-2 p-2 bg-indigo-800 rounded text-xs overflow-x-auto">
                    {template.html_content.substring(0, 200)}...
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 