"use client";

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import PageCard from '@/app/components/PageCard';
import AppLoader from '@/app/components/AppLoader';

interface MetadataTemplate {
  id: string;
  page_type: string;
  title_template: string;
  description_template: string;
  og_title_template: string;
  og_description_template: string;
  og_image_template: string;
  twitter_title_template: string;
  twitter_description_template: string;
  twitter_image_template: string;
  keywords_template: string;
  canonical_url_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PAGE_TYPES = [
  { value: 'universal', label: 'Universal', variables: ['[business_name]', '[logo]'] },
  { value: 'service', label: 'Service', variables: ['[business_name]', '[service_name]', '[logo]'] },
  { value: 'product', label: 'Product', variables: ['[business_name]', '[product_name]', '[logo]'] },
  { value: 'photo', label: 'Photo', variables: ['[business_name]', '[logo]'] },
  { value: 'video', label: 'Video', variables: ['[business_name]', '[logo]'] },
  { value: 'event', label: 'Event', variables: ['[business_name]', '[event_name]', '[logo]'] },
  { value: 'employee', label: 'Employee', variables: ['[business_name]', '[employee_name]', '[logo]'] },
];

export default function MetadataTemplatesPage() {
  const [templates, setTemplates] = useState<MetadataTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MetadataTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    page_type: '',
    title_template: '',
    description_template: '',
    og_title_template: '',
    og_description_template: '',
    og_image_template: '',
    twitter_title_template: '',
    twitter_description_template: '',
    twitter_image_template: '',
    keywords_template: '',
    canonical_url_template: '',
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metadata-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate
        ? `/api/metadata-templates/${editingTemplate.id}`
        : '/api/metadata-templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingTemplate ? 'update' : 'create'} template`);
      }

      await fetchTemplates();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleEdit = (template: MetadataTemplate) => {
    setEditingTemplate(template);
    setFormData({
      page_type: template.page_type,
      title_template: template.title_template || '',
      description_template: template.description_template || '',
      og_title_template: template.og_title_template || '',
      og_description_template: template.og_description_template || '',
      og_image_template: template.og_image_template || '',
      twitter_title_template: template.twitter_title_template || '',
      twitter_description_template: template.twitter_description_template || '',
      twitter_image_template: template.twitter_image_template || '',
      keywords_template: template.keywords_template || '',
      canonical_url_template: template.canonical_url_template || '',
      is_active: template.is_active
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/metadata-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const resetForm = () => {
    setFormData({
      page_type: '',
      title_template: '',
      description_template: '',
      og_title_template: '',
      og_description_template: '',
      og_image_template: '',
      twitter_title_template: '',
      twitter_description_template: '',
      twitter_image_template: '',
      keywords_template: '',
      canonical_url_template: '',
      is_active: true
    });
    setEditingTemplate(null);
    setShowCreateForm(false);
  };

  const getPageTypeInfo = (pageType: string) => {
    return PAGE_TYPES.find(type => type.value === pageType);
  };

  const getTemplatesByType = () => {
    const grouped: { [key: string]: MetadataTemplate[] } = {};
    templates.forEach(template => {
      if (!grouped[template.page_type]) {
        grouped[template.page_type] = [];
      }
      grouped[template.page_type].push(template);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard icon={<FaEdit className="w-9 h-9 text-slate-blue" />}>
          <AppLoader />
        </PageCard>
      </div>
    );
  }

  const groupedTemplates = getTemplatesByType();

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <PageCard icon={<FaEdit className="w-9 h-9 text-slate-blue" />}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Metadata Templates</h1>
              <p className="text-gray-600 mt-2">
                Manage SEO and social media metadata for different prompt page types
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-slate-blue text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              New Template
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Variable Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FaInfo className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Available Variables</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Use these variables in your templates - they will be replaced with actual values:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {PAGE_TYPES.map(type => (
                    <div key={type.value} className="bg-white rounded p-3 border">
                      <h4 className="font-medium text-blue-900">{type.label}</h4>
                      <div className="text-sm text-blue-700 space-y-1 mt-1">
                        {type.variables.map(variable => (
                          <div key={variable} className="font-mono">{variable}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Templates by Type */}
          <div className="space-y-6">
            {PAGE_TYPES.map(pageType => {
              const typeTemplates = groupedTemplates[pageType.value] || [];
              const activeTemplate = typeTemplates.find(t => t.is_active);
              
              return (
                <div key={pageType.value} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {pageType.label} Pages
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Variables: {pageType.variables.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeTemplate ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            Active Template
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                            No Active Template
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {typeTemplates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No templates created for {pageType.label} pages yet.</p>
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, page_type: pageType.value }));
                            setShowCreateForm(true);
                          }}
                          className="mt-2 text-slate-blue hover:underline"
                        >
                          Create one now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {typeTemplates.map(template => (
                          <div
                            key={template.id}
                            className={`border rounded-lg p-4 ${
                              template.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {template.is_active && (
                                    <FaCheck className="w-4 h-4 text-green-600" />
                                  )}
                                  <h3 className="font-medium">
                                    {template.title_template || 'Untitled Template'}
                                  </h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {template.description_template}
                                </p>
                                <div className="text-xs text-gray-500">
                                  Created: {new Date(template.created_at).toLocaleDateString()}
                                  {template.updated_at !== template.created_at && (
                                    <>
                                      {' • '}
                                      Updated: {new Date(template.updated_at).toLocaleDateString()}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEdit(template)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Edit template"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(template.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                                  title="Delete template"
                                >
                                  <FaTrash className="w-4 h-4" />
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
            })}
          </div>
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {editingTemplate ? 'Edit' : 'Create'} Metadata Template
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Type
                  </label>
                  <select
                    value={formData.page_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, page_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    required
                    disabled={!!editingTemplate}
                  >
                    <option value="">Select page type</option>
                    {PAGE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formData.page_type && (
                    <p className="text-sm text-gray-600 mt-1">
                      Available variables: {getPageTypeInfo(formData.page_type)?.variables.join(', ')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Title Template
                    </label>
                    <input
                      type="text"
                      value={formData.title_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, title_template: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      placeholder="e.g., Leave a Review for [business_name]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description Template
                    </label>
                    <textarea
                      value={formData.description_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_template: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      rows={3}
                      placeholder="e.g., Share your experience with [business_name]..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Open Graph Title
                    </label>
                    <input
                      type="text"
                      value={formData.og_title_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, og_title_template: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      placeholder="e.g., Review [business_name]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Open Graph Description
                    </label>
                    <textarea
                      value={formData.og_description_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, og_description_template: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      rows={3}
                      placeholder="e.g., Share your experience with [business_name]..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Title
                    </label>
                    <input
                      type="text"
                      value={formData.twitter_title_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, twitter_title_template: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      placeholder="e.g., Review [business_name]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Description
                    </label>
                    <textarea
                      value={formData.twitter_description_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, twitter_description_template: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      rows={3}
                      placeholder="e.g., Share your experience with [business_name]..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords Template
                  </label>
                  <input
                    type="text"
                    value={formData.keywords_template}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords_template: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="e.g., [business_name], reviews, customer feedback"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Set as active template (will deactivate other templates for this page type)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-700"
                  >
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageCard>
    </div>
  );
} 