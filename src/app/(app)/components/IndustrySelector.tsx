import React, { useMemo, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import React Select to prevent hydration mismatches
const SelectComponent = dynamic(() => import("react-select"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
      Loading industry selector...
    </div>
  ),
});

// Import types from react-select
import type { MultiValue } from "react-select";

// Expanded industry list with B2B/B2C/Both tags (sorted alphabetically within each category)
const INDUSTRY_OPTIONS = [
  // B2B (alphabetically sorted)
  { label: "Agriculture & Farming (B2B)", value: "Agriculture & Farming (B2B)", type: "B2B" },
  { label: "Architecture & Design", value: "Architecture & Design", type: "B2B" },
  { label: "Business Services", value: "Business Services", type: "B2B" },
  { label: "Call Centers & BPO", value: "Call Centers & BPO", type: "B2B" },
  { label: "Cloud Services", value: "Cloud Services", type: "B2B" },
  { label: "Commercial Insurance", value: "Commercial Insurance", type: "B2B" },
  { label: "Commercial Real Estate", value: "Commercial Real Estate", type: "B2B" },
  { label: "Construction", value: "Construction", type: "B2B" },
  { label: "Consulting", value: "Consulting", type: "B2B" },
  { label: "Creative Agency", value: "Creative Agency", type: "B2B" },
  { label: "Cybersecurity", value: "Cybersecurity", type: "B2B" },
  { label: "Data & Analytics", value: "Data & Analytics", type: "B2B" },
  { label: "Digital Agency", value: "Digital Agency", type: "B2B" },
  { label: "Energy & Utilities", value: "Energy & Utilities", type: "B2B" },
  { label: "Engineering", value: "Engineering", type: "B2B" },
  { label: "Environmental Services (B2B)", value: "Environmental Services (B2B)", type: "B2B" },
  { label: "Facilities Management", value: "Facilities Management", type: "B2B" },
  { label: "Financial Services (B2B)", value: "Financial Services (B2B)", type: "B2B" },
  { label: "Franchise Services", value: "Franchise Services", type: "B2B" },
  { label: "HR & Staffing", value: "HR & Staffing", type: "B2B" },
  { label: "Industrial Equipment", value: "Industrial Equipment", type: "B2B" },
  { label: "IT & Software", value: "IT & Software", type: "B2B" },
  { label: "Legal Services", value: "Legal Services", type: "B2B" },
  { label: "Logistics & Supply Chain", value: "Logistics & Supply Chain", type: "B2B" },
  { label: "Manufacturing", value: "Manufacturing", type: "B2B" },
  { label: "Market Research", value: "Market Research", type: "B2B" },
  { label: "Marketing & Advertising", value: "Marketing & Advertising", type: "B2B" },
  { label: "Marketing Agency", value: "Marketing Agency", type: "B2B" },
  { label: "Office Supplies & Equipment", value: "Office Supplies & Equipment", type: "B2B" },
  { label: "Payroll & Benefits", value: "Payroll & Benefits", type: "B2B" },
  { label: "PR Agency", value: "PR Agency", type: "B2B" },
  { label: "Printing & Publishing", value: "Printing & Publishing", type: "B2B" },
  { label: "Procurement & Sourcing", value: "Procurement & Sourcing", type: "B2B" },
  { label: "Professional Services", value: "Professional Services", type: "B2B" },
  { label: "SaaS (Software as a Service)", value: "SaaS", type: "B2B" },
  { label: "Scientific & Technical Services", value: "Scientific & Technical Services", type: "B2B" },
  { label: "Security Services", value: "Security Services", type: "B2B" },
  { label: "SEO Agency", value: "SEO Agency", type: "B2B" },
  { label: "Training & Development", value: "Training & Development", type: "B2B" },
  { label: "Translation & Localization", value: "Translation & Localization", type: "B2B" },
  { label: "Warehousing & Distribution", value: "Warehousing & Distribution", type: "B2B" },
  { label: "Wholesale", value: "Wholesale", type: "B2B" },
  // B2C (alphabetically sorted)
  { label: "Apparel & Fashion", value: "Apparel & Fashion", type: "B2C" },
  { label: "Arts & Entertainment", value: "Arts & Entertainment", type: "B2C" },
  { label: "Automotive Sales & Service", value: "Automotive Sales & Service", type: "B2C" },
  { label: "Bars & Nightlife", value: "Bars & Nightlife", type: "B2C" },
  { label: "Beauty & Personal Care", value: "Beauty & Personal Care", type: "B2C" },
  { label: "Cafes & Coffee Shops", value: "Cafes & Coffee Shops", type: "B2C" },
  { label: "Car Rentals", value: "Car Rentals", type: "B2C" },
  { label: "Car Wash & Detailing", value: "Car Wash & Detailing", type: "B2C" },
  { label: "Childcare & Parenting", value: "Childcare & Parenting", type: "B2C" },
  { label: "Credit Unions", value: "Credit Unions", type: "B2C" },
  { label: "Daycare Centers", value: "Daycare Centers", type: "B2C" },
  { label: "E-Commerce", value: "E-Commerce", type: "B2C" },
  { label: "Education & Tutoring", value: "Education & Tutoring", type: "B2C" },
  { label: "Electronics & Appliances", value: "Electronics & Appliances", type: "B2C" },
  { label: "Financial Services (B2C)", value: "Financial Services (B2C)", type: "B2C" },
  { label: "Fitness & Gyms", value: "Fitness & Gyms", type: "B2C" },
  { label: "Florists", value: "Florists", type: "B2C" },
  { label: "Gift Shops", value: "Gift Shops", type: "B2C" },
  { label: "Grocery & Supermarkets", value: "Grocery & Supermarkets", type: "B2C" },
  { label: "Health & Wellness", value: "Health & Wellness", type: "B2C" },
  { label: "Home Services (Plumbing, HVAC, Cleaning, etc.)", value: "Home Services", type: "B2C" },
  { label: "Hotels & Lodging", value: "Hotels & Lodging", type: "B2C" },
  { label: "Jewelry & Accessories", value: "Jewelry & Accessories", type: "B2C" },
  { label: "Landscaping & Lawn Care", value: "Landscaping & Lawn Care", type: "B2C" },
  { label: "Medical & Dental Practices", value: "Medical & Dental Practices", type: "B2C" },
  { label: "Mental Health Services", value: "Mental Health Services", type: "B2C" },
  { label: "Mobile Phone Stores", value: "Mobile Phone Stores", type: "B2C" },
  { label: "Moving & Storage", value: "Moving & Storage", type: "B2C" },
  { label: "Museums & Galleries", value: "Museums & Galleries", type: "B2C" },
  { label: "Personal Banking", value: "Personal Banking", type: "B2C" },
  { label: "Pest Control", value: "Pest Control", type: "B2C" },
  { label: "Pet Grooming & Boarding", value: "Pet Grooming & Boarding", type: "B2C" },
  { label: "Pet Services", value: "Pet Services", type: "B2C" },
  { label: "Photography Services", value: "Photography Services", type: "B2C" },
  { label: "Property Management", value: "Property Management", type: "B2C" },
  { label: "Real Estate (Residential)", value: "Real Estate (Residential)", type: "B2C" },
  { label: "Restaurants & Food", value: "Restaurants & Food", type: "B2C" },
  { label: "Retail (Brick & Mortar)", value: "Retail (Brick & Mortar)", type: "B2C" },
  { label: "Salons & Spas", value: "Salons & Spas", type: "B2C" },
  { label: "Specialty Food Stores", value: "Specialty Food Stores", type: "B2C" },
  { label: "Sporting Goods", value: "Sporting Goods", type: "B2C" },
  { label: "Sports & Recreation", value: "Sports & Recreation", type: "B2C" },
  { label: "Test Prep & College Counseling", value: "Test Prep & College Counseling", type: "B2C" },
  { label: "Theaters & Cinemas", value: "Theaters & Cinemas", type: "B2C" },
  { label: "Tour Operators", value: "Tour Operators", type: "B2C" },
  { label: "Transportation (Taxi, Rideshare, etc.)", value: "Transportation", type: "B2C" },
  { label: "Travel & Hospitality", value: "Travel & Hospitality", type: "B2C" },
  { label: "Vacation Rentals", value: "Vacation Rentals", type: "B2C" },
  { label: "Veterinary Clinics", value: "Veterinary Clinics", type: "B2C" },
  { label: "Wedding & Event Services", value: "Wedding & Event Services", type: "B2C" },
  { label: "Yoga & Pilates Studios", value: "Yoga & Pilates Studios", type: "B2C" },
  // Both (alphabetically sorted)
  { label: "Community Organizations", value: "Community Organizations", type: "Both" },
  { label: "Environmental Services (General)", value: "Environmental Services (General)", type: "Both" },
  { label: "Event Planning & Services", value: "Event Planning & Services", type: "Both" },
  { label: "Government", value: "Government", type: "Both" },
  { label: "Insurance (General)", value: "Insurance (General)", type: "Both" },
  { label: "Media & Communications", value: "Media & Communications", type: "Both" },
  { label: "Nonprofit", value: "Nonprofit", type: "Both" },
  { label: "Religious Organizations", value: "Religious Organizations", type: "Both" },
  { label: "Research & Development", value: "Research & Development", type: "Both" },
  { label: "Telecommunications", value: "Telecommunications", type: "Both" },
  { label: "Utilities", value: "Utilities", type: "Both" },
  // Other (always last)
  { label: "Other", value: "Other", type: "Both" },
];

type IndustryType = "B2B" | "B2C" | "Both";

interface IndustrySelectorProps {
  value: string[];
  onChange: (industries: string[], otherValue?: string) => void;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
  label?: React.ReactNode;
  required?: boolean;
  industryType: IndustryType;
  setIndustryType: (type: IndustryType) => void;
}

export default function IndustrySelector({
  value,
  onChange,
  otherValue = "",
  onOtherChange,
  label = "Industry",
  required = false,
  industryType,
  setIndustryType,
}: IndustrySelectorProps) {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const selectRef = useRef<any>(null);

  // Open menu when industryType changes
  useEffect(() => {
    if (industryType !== "Both") {
      setMenuIsOpen(true);
    }
  }, [industryType]);

  // Show error if required and nothing selected
  const showError = required && touched && value.length === 0;

  // Filter industries based on type
  const filteredOptions = useMemo(() => {
    if (industryType === "Both") return INDUSTRY_OPTIONS;
    return INDUSTRY_OPTIONS.filter(
      (opt) => opt.type === industryType || opt.type === "Both",
    );
  }, [industryType]);

  // Convert to react-select format
  const selectOptions = filteredOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  // Map value (string[]) to react-select MultiValue
  const selectedOptions = selectOptions.filter((opt) =>
    value.includes(opt.value),
  );

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIndustryType(e.target.value as IndustryType);
    onChange([], "");
    if (onOtherChange) onOtherChange("");
  };

  const handleSelectChange = (
    selected: MultiValue<{ label: string; value: string }>,
  ) => {
    const selectedValues = selected.map((opt) => opt.value);

    // If "Other" is newly selected, close the menu
    const wasOtherSelected = value.includes("Other");
    const isOtherSelected = selectedValues.includes("Other");
    if (!wasOtherSelected && isOtherSelected) {
      setMenuIsOpen(false);
    }

    // If "Other" is not selected anymore, clear the otherValue
    if (!selectedValues.includes("Other") && onOtherChange) {
      onOtherChange("");
    }
    onChange(
      selectedValues,
      selectedValues.includes("Other") ? otherValue : undefined,
    );
  };

  return (
    <div className="mb-4">
      <label
        htmlFor="industry-select"
        className="block font-semibold text-sm text-gray-500 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-4 mb-2">
        <label>
          <input
            type="radio"
            name="industry-type"
            value="B2B"
            checked={industryType === "B2B"}
            onChange={(e) => {
              handleTypeChange(e);
              setTouched(true);
            }}
          />{" "}
          B2B (business-to-business)
        </label>
        <label>
          <input
            type="radio"
            name="industry-type"
            value="B2C"
            checked={industryType === "B2C"}
            onChange={(e) => {
              handleTypeChange(e);
              setTouched(true);
            }}
          />{" "}
          B2C (business-to-customer)
        </label>
        <label>
          <input
            type="radio"
            name="industry-type"
            value="Both"
            checked={industryType === "Both"}
            onChange={(e) => {
              handleTypeChange(e);
              setTouched(true);
            }}
          />{" "}
          Both
        </label>
      </div>
      <SelectComponent
        ref={selectRef}
        inputId="industry-select"
        isMulti
        options={selectOptions}
        value={selectedOptions}
        onChange={(selected: any) => {
          handleSelectChange(selected);
          setTouched(true);
        }}
        classNamePrefix="react-select"
        placeholder="Select industries..."
        closeMenuOnSelect={false}
        isClearable={false}
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
        styles={{
          menu: (provided) => ({ ...provided, zIndex: 20 }),
        }}
      />
      {showError && (
        <div className="text-red-500 text-xs mt-1">
          Please select at least one industry after choosing B2B, B2C, or Both.
        </div>
      )}
      {value.includes("Other") && (
        <div className="mt-2">
          <label
            htmlFor="industry-other"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Please specify other industry
          </label>
          <input
            id="industry-other"
            type="text"
            className="border px-3 py-2 rounded w-full"
            placeholder="Please specify other industry"
            value={otherValue}
            onChange={(e) => onOtherChange && onOtherChange(e.target.value)}
            required={required}
          />
        </div>
      )}
    </div>
  );
}
