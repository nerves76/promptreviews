import React from 'react';

interface StyleFormProps {
  design: any;
}

export const StyleForm: React.FC<StyleFormProps> = ({ design }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Font</label>
        <select
          value={design.font}
          onChange={(e) => design.onFontChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="inter">Inter</option>
          <option value="roboto">Roboto</option>
          <option value="open-sans">Open Sans</option>
          <option value="lato">Lato</option>
          <option value="montserrat">Montserrat</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Text Color</label>
        <select
          value={design.textColor}
          onChange={(e) => design.onTextColorChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="black">Black</option>
          <option value="gray-700">Dark Gray</option>
          <option value="gray-500">Medium Gray</option>
          <option value="gray-300">Light Gray</option>
          <option value="white">White</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Background Color</label>
        <select
          value={design.backgroundColor}
          onChange={(e) => design.onBackgroundColorChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="white">White</option>
          <option value="gray-50">Light Gray</option>
          <option value="gray-100">Medium Gray</option>
          <option value="gray-200">Dark Gray</option>
          <option value="black">Black</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Border Radius</label>
        <select
          value={design.borderRadius}
          onChange={(e) => design.onBorderRadiusChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Shadow</label>
        <select
          value={design.shadow}
          onChange={(e) => design.onShadowChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </div>
    </div>
  );
}; 