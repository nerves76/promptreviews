"use client";

import React, { useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "easymde/dist/easymde.min.css";

// Dynamically import SimpleMDE to avoid SSR issues
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
  loading: () => (
    <div className="border rounded-md p-4 bg-gray-50 animate-pulse h-96">
      Loading editor...
    </div>
  ),
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content in Markdown...",
  className = "",
}: MarkdownEditorProps) {
  const editorRef = useRef<any>(null);

  // SimpleMDE configuration
  const editorOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      placeholder,
      status: ["lines", "words", "cursor"],
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "link",
        "image",
        "code",
        "table",
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
        "|",
        "guide",
      ],
      previewRender: (text: string) => {
        // Custom preview rendering
        const container = document.createElement("div");
        container.className = "markdown-preview prose max-w-none";
        return container;
      },
    };
  }, [placeholder]);

  const handleChange = useCallback(
    (value: string) => {
      onChange(value);
    },
    [onChange]
  );

  return (
    <div className={`markdown-editor-container ${className}`}>
      <style jsx global>{`
        .markdown-editor-container .EasyMDEContainer {
          height: 100%;
        }
        .markdown-editor-container .EasyMDEContainer .CodeMirror {
          min-height: 400px;
          height: auto;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 14px;
        }
        .markdown-editor-container .EasyMDEContainer .CodeMirror-scroll {
          max-height: 600px;
          overflow-y: auto;
        }
        .markdown-editor-container .editor-toolbar {
          border: 1px solid #e5e7eb;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
          background-color: #f9fafb;
        }
        .markdown-editor-container .editor-toolbar button {
          color: #374151 !important;
        }
        .markdown-editor-container .editor-toolbar button.active,
        .markdown-editor-container .editor-toolbar button:hover {
          background-color: #e5e7eb;
          border-color: #d1d5db;
        }
        .markdown-editor-container .editor-toolbar.fullscreen {
          background-color: #f9fafb;
        }
        .markdown-editor-container .CodeMirror-fullscreen {
          z-index: 9999;
        }
        .markdown-editor-container .editor-preview-side {
          border: 1px solid #e5e7eb;
        }
        .markdown-editor-container .editor-statusbar {
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
          background-color: #f9fafb;
          color: #6b7280;
          font-size: 12px;
        }
      `}</style>
      <SimpleMDE
        value={value}
        onChange={handleChange}
        options={editorOptions}
        ref={editorRef}
      />
    </div>
  );
}

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({
  content,
  className = "",
}: MarkdownPreviewProps) {
  return (
    <div className={`markdown-preview ${className}`}>
      <style jsx global>{`
        .markdown-preview {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: #374151;
        }
        .markdown-preview h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 1rem;
          color: #111827;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        .markdown-preview h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #1f2937;
        }
        .markdown-preview h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .markdown-preview p {
          margin-bottom: 1rem;
        }
        .markdown-preview ul,
        .markdown-preview ol {
          margin-bottom: 1rem;
          padding-left: 2rem;
        }
        .markdown-preview li {
          margin-bottom: 0.5rem;
        }
        .markdown-preview code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: "Courier New", monospace;
        }
        .markdown-preview pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        .markdown-preview pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        .markdown-preview blockquote {
          border-left: 4px solid #452f9f;
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 1rem;
          color: #6b7280;
          font-style: italic;
        }
        .markdown-preview a {
          color: #452f9f;
          text-decoration: underline;
        }
        .markdown-preview a:hover {
          color: #5b3fc5;
        }
        .markdown-preview table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }
        .markdown-preview th,
        .markdown-preview td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }
        .markdown-preview th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .markdown-preview img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
      `}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
