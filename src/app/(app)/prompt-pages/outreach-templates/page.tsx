"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/utils/apiClient";
import Icon from "@/components/Icon";
import { Button } from "@/app/(app)/components/ui/button";
import { Modal } from "@/app/(app)/components/ui/modal";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import PageCard from "@/app/(app)/components/PageCard";

interface Template {
  id: string;
  name: string;
  communication_type: "email" | "sms";
  template_type: "initial" | "follow_up";
  subject_template?: string;
  message_template: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface TemplateFormData {
  name: string;
  communication_type: "email" | "sms";
  template_type: "initial" | "follow_up";
  subject_template: string;
  message_template: string;
}

const INITIAL_FORM_DATA: TemplateFormData = {
  name: "",
  communication_type: "sms",
  template_type: "initial",
  subject_template: "",
  message_template: "",
};

const AVAILABLE_VARIABLES = [
  { name: "{{business_name}}", description: "Your business name" },
  { name: "{{customer_name}}", description: "Customer's first name" },
  { name: "{{review_url}}", description: "Link to the review page" },
];

export default function OutreachTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  // Group templates by type
  const emailTemplates = templates.filter((t) => t.communication_type === "email");
  const smsTemplates = templates.filter((t) => t.communication_type === "sms");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#527DE7] via-[#7B6BA8] to-[#E8A87C]">
      <PageCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Outreach templates</h1>
            <p className="text-gray-600 mt-1">
              Create and manage reusable message templates for SMS and email outreach.
            </p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Icon name="FaPlus" className="w-4 h-4" />
            Add template
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
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
          <div className="space-y-8">
            {/* SMS Templates */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon name="FaMobile" className="w-5 h-5 text-green-600" />
                SMS templates ({smsTemplates.length})
              </h2>
              {smsTemplates.length === 0 ? (
                <p className="text-gray-500 text-sm">No SMS templates yet.</p>
              ) : (
                <div className="grid gap-4">
                  {smsTemplates.map((template) => (
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
            </div>

            {/* Email Templates */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon name="FaEnvelope" className="w-5 h-5 text-blue-600" />
                Email templates ({emailTemplates.length})
              </h2>
              {emailTemplates.length === 0 ? (
                <p className="text-gray-500 text-sm">No email templates yet.</p>
              ) : (
                <div className="grid gap-4">
                  {emailTemplates.map((template) => (
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
            </div>
          </div>
        )}
      </PageCard>

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
                Purpose
              </label>
              <select
                id="template-type"
                value={formData.template_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    template_type: e.target.value as "initial" | "follow_up",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue"
              >
                <option value="initial">Initial request</option>
                <option value="follow_up">Follow-up</option>
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
            {template.is_default && (
              <span className="px-2 py-0.5 text-xs bg-slate-blue/10 text-slate-blue rounded-full whitespace-nowrap">
                Default
              </span>
            )}
            <span
              className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                template.template_type === "initial"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {template.template_type === "initial" ? "Initial" : "Follow-up"}
            </span>
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
