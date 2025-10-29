/**
 * ProductDetailsSection component
 * 
 * Handles the product details section of the product prompt page form.
 * Includes fields for product name, subcopy, and description.
 */

"use client";
import React from "react";
import Icon from "@/components/Icon";
import RobotTooltip from "../RobotTooltip";

interface ProductDetailsSectionProps {
  productName: string;
  onProductNameChange: (name: string) => void;
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

export default function ProductDetailsSection({ 
  productName, 
  onProductNameChange, 
  formData, 
  onFormDataChange 
}: ProductDetailsSectionProps) {
  
  const updateFormData = (field: string, value: any) => {
    onFormDataChange({ [field]: value });
  };

  return (
    <div className="custom-space-y">
      {/* Product Details Header */}
      <div className="flex items-center gap-3 mt-12 mb-6">
        <Icon name="FaBox" className="w-7 h-7 text-slate-blue" size={28} />
        <h2 className="text-2xl font-bold text-slate-blue">
          Product details
        </h2>
      </div>

      {/* Product Name */}
      <label
        htmlFor="product_name"
        className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
      >
        Product Name
        <RobotTooltip text="Made available for AI prompt generation." />
      </label>
      <input
        type="text"
        id="product_name"
        value={productName}
        onChange={(e) => onProductNameChange(e.target.value)}
        className="mt-1 mb-4 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
        placeholder="e.g., Eight-Nozzled Elephant-Toted Boom Blitz 2.0"
        required
      />
      
      {/* Product Sub Copy */}
      <label
        htmlFor="product_subcopy"
        className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
      >
        Subcopy under product name
        <Tooltip text="This message appears below the product name on the public page. It's customer-facing and not used for AI training." />
      </label>
      <textarea
        id="product_subcopy"
        value={
          formData.product_subcopy ??
          "Thanks so much for your business! We'd really appreciate it if you took a minute to leave us a review."
        }
        onChange={(e) => updateFormData("product_subcopy", e.target.value)}
        rows={2}
        className="mt-1 mb-4 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
        placeholder="Thanks so much for your business! We'd really appreciate it if you took a minute to leave us a review."
      />
      
      {/* Product Description */}
      <label
        htmlFor="product_description"
        className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
      >
        Product Description
        <RobotTooltip text="Made available for AI prompt generation." />
        <Tooltip text="Describe the product in detail. This is used to help AI generate more relevant reviews, but is not shown to customers." />
      </label>
      <textarea
        id="product_description"
        value={formData.product_description || ""}
        onChange={(e) => updateFormData("product_description", e.target.value)}
        rows={4}
        className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
        placeholder="Describe the product being reviewed"
        required
      />
    </div>
  );
} 