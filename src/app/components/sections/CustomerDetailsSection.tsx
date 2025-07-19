/**
 * CustomerDetailsSection component
 * 
 * Handles the customer/client details section of the product prompt page form.
 * Includes fields for first name, last name, phone, email, and role.
 */

"use client";
import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import RobotTooltip from "../RobotTooltip";

interface CustomerDetailsSectionProps {
  formData: any;
  onFormDataChange: (data: any) => void;
}

function Tooltip(props: { text: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 text-gray-400 hover:text-gray-600"
      >
        <span className="inline-block w-4 h-4 rounded-full border border-gray-300 text-xs leading-4 text-center">
          ?
        </span>
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700">
          {props.text}
        </div>
      )}
    </span>
  );
}

export default function CustomerDetailsSection({ formData, onFormDataChange }: CustomerDetailsSectionProps) {
  const updateFormData = (field: string, value: any) => {
    onFormDataChange({ [field]: value });
  };

  return (
    <div className="custom-space-y">
      <div className="mb-6 flex items-center gap-3">
        <FaInfoCircle className="w-7 h-7 text-slate-blue" />
        <h2 className="text-2xl font-bold text-slate-blue">
          Customer/client details
        </h2>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
          >
            First name <span className="text-red-600">(required)</span>
            <RobotTooltip text="This field is passed to AI for prompt generation." />
          </label>
          <input
            type="text"
            id="first_name"
            value={formData.first_name || ""}
            onChange={(e) => updateFormData("first_name", e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
            placeholder="First name"
            required
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-gray-700 mt-4 mb-2"
          >
            Last name
          </label>
          <input
            type="text"
            id="last_name"
            value={formData.last_name || ""}
            onChange={(e) => updateFormData("last_name", e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
            placeholder="Last name"
            required
          />
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center"
          >
            Phone number
            <Tooltip text="So you can text/email them the prompt page." />
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone || ""}
            onChange={(e) => updateFormData("phone", e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
            placeholder="Phone number"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center"
          >
            Email
            <Tooltip text="So you can text/email them the prompt page." />
          </label>
          <input
            type="email"
            id="email"
            value={formData.email || ""}
            onChange={(e) => updateFormData("email", e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
            placeholder="Email address"
          />
        </div>
      </div>
      
      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center max-w-[85ch] gap-1"
        >
          Role/position
          <RobotTooltip text="This field is passed to AI for prompt generation." />
        </label>
        <input
          type="text"
          id="role"
          value={formData.role || ""}
          onChange={(e) => updateFormData("role", e.target.value)}
          className="mt-1 block w-full max-w-md rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
          placeholder="e.g., store manager, marketing director, student"
        />
      </div>
    </div>
  );
} 