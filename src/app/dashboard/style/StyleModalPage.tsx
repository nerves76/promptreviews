"use client";
import * as React from "react";

export default function StylePage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-blue mb-4">Prompt page style</h2>
      <p className="text-gray-600 mb-6">
        Use these settings to make your prompt pages match your brand.
      </p>
      <div className="mb-8">
        <div className="p-6 rounded-lg bg-gray-50">
          <h3 className="text-xl font-bold mb-2 text-pink-600">Preview heading</h3>
          <p className="mb-4">
            This is how your background, text, and buttons will look with selected fonts and colors.
          </p>
          <button className="px-4 py-2 rounded bg-pink-400 text-white">Sample Button</button>
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-blue mb-4 flex items-center gap-2">
        <span>🎨</span> Color scheme
      </h3>
      {/* Add your color pickers and controls here */}
      <div className="mt-6 text-right">
        <button className="px-6 py-2 bg-slate-blue text-white rounded hover:bg-slate-700 transition">
          Save
        </button>
      </div>
    </div>
  );
}
