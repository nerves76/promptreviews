"use client";

import { useState, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Input } from "@/app/(app)/components/ui/input";
import { Button } from "@/app/(app)/components/ui/button";
import * as Icons from "lucide-react";

// Common icons used in the CMS - organized by category
const COMMON_ICONS = [
  // General UI
  'Rocket', 'Star', 'Layout', 'Settings', 'Lightbulb', 'Home', 'Search',
  'Bell', 'CheckCircle', 'Circle', 'Clock', 'Eye', 'EyeOff', 'Filter',
  'Flag', 'Gift', 'Globe', 'Hash', 'Heart', 'HelpCircle', 'Info',
  'Key', 'Link', 'Lock', 'Unlock', 'Menu', 'Moon', 'Sun', 'Plus', 'Minus',
  'Power', 'RefreshCw', 'Repeat', 'Save', 'Share', 'Shield', 'Sliders',
  'Sparkles', 'Tag', 'Tags', 'Target', 'ThumbsUp', 'ThumbsDown', 'Trash',
  'X', 'Zap', 'ZoomIn', 'ZoomOut', 'Check', 'AlertCircle', 'AlertTriangle',

  // Documents & Files
  'FileText', 'File', 'Folder', 'FolderOpen', 'Files', 'FileCheck', 'FilePlus',
  'BookOpen', 'Book', 'Bookmark', 'Newspaper', 'ScrollText', 'ClipboardList',
  'ClipboardCheck', 'Paperclip', 'Archive', 'FileSearch',

  // Charts & Analytics
  'BarChart', 'BarChart2', 'BarChart3', 'BarChart4', 'LineChart', 'PieChart',
  'TrendingUp', 'TrendingDown', 'Activity', 'Gauge', 'Signal', 'Percent',

  // Communication
  'Mail', 'MessageCircle', 'MessageSquare', 'MessagesSquare', 'Send', 'Inbox',
  'Phone', 'PhoneCall', 'Video', 'Mic', 'AtSign', 'Reply', 'Forward',

  // Users & People
  'User', 'Users', 'UserPlus', 'UserCheck', 'UserX', 'Contact', 'CircleUser',

  // Faces & Expressions
  'Smile', 'SmilePlus', 'Frown', 'Meh', 'Laugh', 'Angry', 'Annoyed',

  // Business & Commerce
  'Building', 'Building2', 'Store', 'Briefcase', 'CreditCard', 'Wallet',
  'ShoppingCart', 'ShoppingBag', 'Receipt', 'DollarSign', 'Coins', 'PiggyBank',
  'BadgeCheck', 'Award', 'Trophy', 'Medal', 'Crown',

  // Location & Maps
  'Map', 'MapPin', 'MapPinned', 'Navigation', 'Compass', 'Locate', 'Globe2',

  // Technology & Devices
  'Monitor', 'Smartphone', 'Tablet', 'Laptop', 'Tv', 'Camera', 'Printer',
  'Wifi', 'Cloud', 'Database', 'Server', 'HardDrive', 'Cpu', 'Terminal',
  'Code', 'Code2', 'Braces', 'Binary', 'Bug', 'Plug', 'Cable',

  // AI & Smart
  'Bot', 'Brain', 'Wand2', 'Sparkle', 'Stars', 'Aperture', 'Scan', 'ScanSearch',

  // Actions & Tools
  'Download', 'Upload', 'Edit', 'Edit2', 'Edit3', 'Pencil', 'PenTool',
  'Wrench', 'Tool', 'Hammer', 'Scissors', 'Copy', 'Clipboard', 'Move',
  'RotateCw', 'RotateCcw', 'Undo', 'Redo', 'Play', 'Pause', 'Square',

  // Navigation & Arrows
  'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown', 'ChevronsRight',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowUpRight',
  'ExternalLink', 'CornerRightDown', 'MoveRight', 'Expand', 'Shrink',

  // Social & Brands
  'Chrome', 'Twitter', 'Facebook', 'Instagram', 'Linkedin', 'Youtube', 'Github',

  // Calendar & Time
  'Calendar', 'CalendarDays', 'CalendarCheck', 'Timer', 'Hourglass', 'History',

  // Media & Content
  'Image', 'ImagePlus', 'Images', 'Camera', 'Film', 'Music', 'Volume', 'Volume2',
  'Type', 'Bold', 'Italic', 'Underline', 'List', 'ListOrdered', 'AlignLeft',

  // Grid & Layout
  'Grid', 'Grid3x3', 'LayoutGrid', 'LayoutList', 'LayoutDashboard', 'Columns',
  'Rows', 'Table', 'Kanban', 'Sidebar', 'PanelLeft', 'PanelRight',

  // Misc
  'Package', 'Box', 'Truck', 'Radio', 'Thermometer', 'Umbrella', 'Wind',
  'Flame', 'Droplet', 'Leaf', 'Mountain', 'Waves', 'Anchor', 'Plane',
  'Car', 'Bike', 'Train', 'Ship', 'Footprints', 'Fingerprint', 'QrCode'
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
