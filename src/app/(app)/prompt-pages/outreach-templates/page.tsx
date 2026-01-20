"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/apiClient";
import Icon from "@/components/Icon";
import { Button } from "@/app/(app)/components/ui/button";
import { Modal } from "@/app/(app)/components/ui/modal";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import PageCard from "@/app/(app)/components/PageCard";

type TemplateCategory = "initial_ask" | "follow_up" | "on_behalf_of" | "thank_you" | "short_simple";

interface Template {
  id: string;
  name: string;
  communication_type: "email" | "sms";
  template_type: TemplateCategory;
  subject_template?: string;
  message_template: string;
  is_default: boolean;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
}

interface TemplateFormData {
  name: string;
  communication_type: "email" | "sms";
  template_type: TemplateCategory;
  subject_template: string;
  message_template: string;
}

const INITIAL_FORM_DATA: TemplateFormData = {
  name: "",
  communication_type: "sms",
  template_type: "initial_ask",
  subject_template: "",
  message_template: "",
};

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
  { value: "initial_ask", label: "Initial ask" },
  { value: "follow_up", label: "Follow up" },
  { value: "on_behalf_of", label: "On behalf of" },
  { value: "thank_you", label: "Thank you" },
  { value: "short_simple", label: "Short & simple" },
];

const CATEGORY_STYLES: Record<TemplateCategory, { bg: string; text: string }> = {
  initial_ask: { bg: "bg-blue-50", text: "text-blue-700" },
  follow_up: { bg: "bg-amber-50", text: "text-amber-700" },
  on_behalf_of: { bg: "bg-green-50", text: "text-green-700" },
  thank_you: { bg: "bg-pink-50", text: "text-pink-700" },
  short_simple: { bg: "bg-gray-50", text: "text-gray-700" },
};

const AVAILABLE_VARIABLES = [
  { name: "{{business_name}}", description: "Your business name" },
  { name: "{{customer_name}}", description: "Customer's first name" },
  { name: "{{review_url}}", description: "Link to the review page" },
];

export default function OutreachTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  // Handle tab navigation
  const handleTabChange = (tab: string) => {
    if (tab === 'catch-all') {
      router.push('/prompt-pages?tab=catch-all');
    } else if (tab === 'campaign') {
      router.push('/prompt-pages?tab=campaign');
    } else if (tab === 'locations') {
      router.push('/prompt-pages?tab=locations');
    } else if (tab === 'settings') {
      router.push('/dashboard/prompt-page-settings');
    }
    // 'templates' is current page, no navigation needed
  };

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ templates: Template[] }>("/outreach-templates");
      setTemplates(response.templates || []);
    } catch (err: any) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData(INITIAL_FORM_DATA);
    setIsModalOpen(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      communication_type: template.communication_type,
      template_type: template.template_type,
      subject_template: template.subject_template || "",
      message_template: template.message_template,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }
    if (!formData.message_template.trim()) {
      setError("Message is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingTemplate) {
        // Update existing template
        await apiClient.patch(`/outreach-templates/${editingTemplate.id}`, formData);
      } else {
        // Create new template
        await apiClient.post("/outreach-templates", formData);
      }
      await fetchTemplates();
      closeModal();
    } catch (err: any) {
      console.error("Error saving template:", err);
      setError(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/outreach-templates/${id}`);
      await fetchTemplates();
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Error deleting template:", err);
      setError(err.message || "Failed to delete template");
    }
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      message_template: prev.message_template + variable,
    }));
  };

  // Filter templates by selected category
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.template_type === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#527DE7] via-[#7B6BA8] to-[#E8A87C]">
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              Prompt Pages
            </h1>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex justify-center w-full mt-0 mb-8 z-20 px-4">
        <div className="grid grid-cols-3 sm:flex bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl sm:rounded-full p-1 shadow-lg w-full max-w-3xl gap-1 sm:gap-0">
          <button
            type="button"
            onClick={() => handleTabChange('catch-all')}
            className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-transparent text-white"
          >
            <Icon name="FaUsers" className="w-5 h-5" size={20} />
            <span className="whitespace-nowrap">Catch-all</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('campaign')}
            className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-transparent text-white"
          >
            <Icon name="FaUserCircle" className="w-5 h-5" size={20} />
            <span className="whitespace-nowrap">Campaign</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('locations')}
            className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-transparent text-white"
          >
            <Icon name="FaMapMarker" className="w-5 h-5" size={20} />
            <span className="whitespace-nowrap">Locations</span>
          </button>
          <button
            type="button"
            className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-slate-blue text-white"
          >
            <Icon name="FaEnvelope" className="w-5 h-5" size={20} />
            <span className="whitespace-nowrap">Templates</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-transparent text-white"
          >
            <Icon name="FaCog" className="w-5 h-5" size={20} />
            <span className="whitespace-nowrap">Settings</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PageCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Outreach templates</h2>
                <p className="text-gray-600 mt-1">
                  Create and manage reusable message templates for SMS and email outreach.
                </p>
              </div>
              <Button onClick={openCreateModal} className="flex items-center gap-2 whitespace-nowrap">
                <Icon name="FaPlus" className="w-4 h-4" />
                Add template
              </Button>
            </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Category filter tabs */}
        {!isLoading && templates.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({templates.length})
            </button>
            {CATEGORY_OPTIONS.map(category => {
              const count = templates.filter(t => t.template_type === category.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    selectedCategory === category.value
                      ? `${CATEGORY_STYLES[category.value].bg} ${CATEGORY_STYLES[category.value].text} ring-2 ring-offset-1 ring-current`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="FaSpinner" className="w-6 h-6 animate-spin text-slate-blue" />
            <span className="ml-2 text-gray-600">Loading templates...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="FaEnvelope" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-4">Create your first template to get started.</p>
            <Button onClick={openCreateModal}>Create template</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => openEditModal(template)}
                onDelete={() => setDeleteConfirmId(template.id)}
                isDeleting={deleteConfirmId === template.id}
                onConfirmDelete={() => handleDelete(template.id)}
                onCancelDelete={() => setDeleteConfirmId(null)}
              />
            ))}
          </div>
        )}
          </PageCard>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTemplate ? "Edit template" : "Create template"}
        size="lg"
      >
        <div className="space-y-4">
          {/* Template Name */}
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
              Template name
            </label>
            <input
              id="template-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue"
              placeholder="e.g., Friendly follow-up"
            />
          </div>

          {/* Type Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="communication-type" className="block text-sm font-medium text-gray-700 mb-1">
                Message type
              </label>
              <select
                id="communication-type"
                value={formData.communication_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    communication_type: e.target.value as "email" | "sms",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label htmlFor="template-type" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="template-type"
                value={formData.template_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    template_type: e.target.value as TemplateCategory,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email Subject (only for email) */}
          {formData.communication_type === "email" && (
            <div>
              <label htmlFor="subject-template" className="block text-sm font-medium text-gray-700 mb-1">
                Subject line
              </label>
              <input
                id="subject-template"
                type="text"
                value={formData.subject_template}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject_template: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue"
                placeholder="e.g., {{business_name}} would love your feedback!"
              />
            </div>
          )}

          {/* Message Template */}
          <div>
            <label htmlFor="message-template" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <Textarea
              id="message-template"
              value={formData.message_template}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message_template: e.target.value }))
              }
              rows={formData.communication_type === "email" ? 8 : 4}
              className="w-full resize-none"
              placeholder="Enter your message template..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.message_template.length} characters
              {formData.communication_type === "sms" && formData.message_template.length > 160 && (
                <span className="text-amber-600">
                  {" "}
                  ({Math.ceil(formData.message_template.length / 160)} SMS segments)
                </span>
              )}
            </p>
          </div>

          {/* Variable Hints */}
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Available variables:</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <button
                  key={variable.name}
                  type="button"
                  onClick={() => insertVariable(variable.name)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                  title={variable.description}
                >
                  {variable.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click a variable to insert it into your message.
            </p>
          </div>
        </div>

        <Modal.Footer>
          <Button variant="outline" onClick={closeModal} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : editingTemplate ? (
              "Save changes"
            ) : (
              "Create template"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onEdit,
  onDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
}: {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
            {!template.is_system && (
              <span className="px-2 py-0.5 text-xs bg-teal-50 text-teal-700 rounded-full whitespace-nowrap">
                Custom
              </span>
            )}
          </div>
          {template.communication_type === "email" && template.subject_template && (
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Subject:</span> {template.subject_template}
            </p>
          )}
          <p className="text-sm text-gray-600 line-clamp-2">{template.message_template}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {isDeleting ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelDelete}
                className="text-gray-600"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-slate-blue transition-colors"
                aria-label="Edit template"
              >
                <Icon name="FaEdit" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Delete template"
              >
                <Icon name="FaTrash" className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
