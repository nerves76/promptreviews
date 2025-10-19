"use client";

import { useState, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Input } from "@/app/(app)/components/ui/input";
import { Button } from "@/app/(app)/components/ui/button";
import * as Icons from "lucide-react";

// Common icons used in the CMS
const COMMON_ICONS = [
  'Rocket', 'FileText', 'Star', 'Layout', 'Plug', 'Settings',
  'Lightbulb', 'Code2', 'Wrench', 'BookOpen', 'Home', 'Search',
  'Bell', 'Calendar', 'CheckCircle', 'ChevronRight', 'Circle',
  'Clock', 'Cloud', 'Code', 'Database', 'Download', 'Edit',
  'Eye', 'File', 'Filter', 'Flag', 'Folder', 'Gift', 'Globe',
  'Hash', 'Heart', 'HelpCircle', 'Image', 'Inbox', 'Info',
  'Key', 'Link', 'Lock', 'Mail', 'Map', 'Menu', 'MessageCircle',
  'Mic', 'Monitor', 'Moon', 'Music', 'Package', 'Paperclip',
  'Phone', 'Play', 'Plus', 'Power', 'Printer', 'Radio',
  'RefreshCw', 'Repeat', 'Save', 'Send', 'Share', 'Shield',
  'ShoppingCart', 'Shuffle', 'Sidebar', 'Sliders', 'Smartphone',
  'Sparkles', 'Sun', 'Tag', 'Target', 'Thermometer', 'ThumbsUp',
  'Tool', 'Trash', 'TrendingUp', 'Truck', 'Tv', 'Twitter',
  'Type', 'Umbrella', 'Upload', 'User', 'Users', 'Video',
  'Volume', 'Watch', 'Wifi', 'Wind', 'X', 'Zap', 'ZoomIn',
  // Google & Social
  'Chrome', 'Building2', 'MapPin', 'Store', 'BarChart3',
  'MessageSquare', 'ImagePlus'
];

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (iconName: string | null) => void;
  label?: string;
  placeholder?: string;
}

export default function IconPicker({ value, onChange, label = "Icon", placeholder = "Search icons..." }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    if (!search) return COMMON_ICONS;
    const lower = search.toLowerCase();
    return COMMON_ICONS.filter(icon => icon.toLowerCase().includes(lower));
  }, [search]);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange(null);
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="w-5 h-5" />;
  };

  const currentIcon = value ? renderIcon(value) : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:border-indigo-500 transition-colors bg-white"
        >
          {currentIcon ? (
            <>
              {currentIcon}
              <span className="text-sm text-gray-700">{value}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Select an icon...</span>
          )}
        </button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            Clear
          </Button>
        )}
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-gray-900 mb-4"
                  >
                    Select Icon
                  </Dialog.Title>

                  <Input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-4"
                    autoFocus
                  />

                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {filteredIcons.map((iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => handleSelect(iconName)}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:border-indigo-500 hover:bg-indigo-50 ${
                            value === iconName
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200'
                          }`}
                          title={iconName}
                        >
                          {renderIcon(iconName)}
                          <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                            {iconName}
                          </span>
                        </button>
                      ))}
                    </div>
                    {filteredIcons.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No icons found matching &quot;{search}&quot;
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
