"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/utils/apiClient";
import Icon from "@/components/Icon";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  communication_type: "email" | "sms";
  template_type: "initial" | "follow_up";
  subject_template?: string;
  message_template: string;
  is_default: boolean;
  is_system: boolean;
}

interface TemplateSelectorProps {
  communicationType: "email" | "sms";
  onSelect: (template: {
    id: string;
    name: string;
    subject_template?: string;
    message_template: string;
  }) => void;
  selectedTemplateId?: string;
  className?: string;
}

export default function TemplateSelector({
  communicationType,
  onSelect,
  selectedTemplateId,
  className = "",
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<{ templates: Template[] }>(
          `/outreach-templates?communication_type=${communicationType}`
        );
        setTemplates(response.templates || []);
      } catch (err: any) {
        console.error("Error fetching templates:", err);
        setError("Failed to load templates");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplates();
  }, [communicationType]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId) return;

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      onSelect({
        id: template.id,
        name: template.name,
        subject_template: template.subject_template,
        message_template: template.message_template,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
        <span>Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <label htmlFor="template-selector" className="block text-sm font-medium text-gray-700 mb-1">
          Templates
        </label>
        <select
          id="template-selector"
          value={selectedTemplateId || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue text-sm"
        >
          <option value="">Select a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
              {!template.is_system ? " ★" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="pt-6">
        <Link
          href="/prompt-pages/outreach-templates"
          className="text-sm text-slate-blue hover:text-slate-blue/80 whitespace-nowrap flex items-center gap-1"
        >
          <Icon name="FaCog" className="w-3 h-3" />
          Manage
        </Link>
      </div>
    </div>
  );
}
