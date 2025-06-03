"use client";

import { useState } from "react";
import { Input } from "@/app/components/ui/input";

interface ReviewPlatformLink {
  platform: string;
  url: string;
}

interface ReviewPlatformLinksProps {
  links: ReviewPlatformLink[];
  onChange: (links: ReviewPlatformLink[]) => void;
}

const PLATFORM_OPTIONS = [
  { value: "google", label: "Google" },
  { value: "yelp", label: "Yelp" },
  { value: "facebook", label: "Facebook" },
  { value: "trustpilot", label: "Trustpilot" },
  { value: "other", label: "Other" },
];

export default function ReviewPlatformLinks({
  links,
  onChange,
}: ReviewPlatformLinksProps) {
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddLink = () => {
    if (newPlatform && newUrl) {
      onChange([...links, { platform: newPlatform, url: newUrl }]);
      setNewPlatform("");
      setNewUrl("");
    }
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    onChange(newLinks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end space-x-4">
        <div className="flex-1">
          <label
            htmlFor="platform"
            className="block text-sm font-medium text-gray-700"
          >
            Platform
          </label>
          <select
            id="platform"
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
          >
            <option value="">Select a platform</option>
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700"
          >
            Review URL
          </label>
          <Input
            type="url"
            id="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <button
          type="button"
          onClick={handleAddLink}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add
        </button>
      </div>

      {links.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Added Platforms
          </h3>
          <ul className="space-y-2">
            {links.map((link, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
              >
                <div>
                  <span className="font-medium">
                    {PLATFORM_OPTIONS.find((p) => p.value === link.platform)
                      ?.label || link.platform}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">{link.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
