/**
 * Business Hours Editor Component
 * Handles editing of business operating hours for Google Business Profile
 */

'use client';

import Icon from '@/components/Icon';

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

interface BusinessHoursEditorProps {
  businessHours: BusinessHours;
  onBusinessHoursChange: (hours: BusinessHours) => void;
  selectedLocationCount: number;
  detailsLoaded: boolean;
}

const daysOfWeek = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' }
];

export default function BusinessHoursEditor({
  businessHours,
  onBusinessHoursChange,
  selectedLocationCount,
  detailsLoaded
}: BusinessHoursEditorProps) {
  
  const handleHoursChange = (day: string, type: 'open' | 'close' | 'closed', value: string | boolean) => {
    const updatedHours = {
      ...businessHours,
      [day]: {
        ...businessHours[day],
        [type]: value
      }
    };
    onBusinessHoursChange(updatedHours);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
        <FaClock className="w-5 h-5 text-slate-blue" />
        <span>Business hours</span>
      </h4>
      
      <div className="space-y-3">
        {daysOfWeek.map((day) => (
          <div key={day.key} className="flex items-center space-x-4">
            <div className="w-24 text-sm font-medium text-gray-700">
              {day.label}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!businessHours[day.key]?.closed}
                onChange={(e) => handleHoursChange(day.key, 'closed', !e.target.checked)}
                className="h-4 w-4 text-slate-blue focus:ring-slate-blue border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">Open</span>
            </div>

            {!businessHours[day.key]?.closed && (
              <>
                <input
                  type="time"
                  value={businessHours[day.key]?.open || '09:00'}
                  onChange={(e) => handleHoursChange(day.key, 'open', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={businessHours[day.key]?.close || '17:00'}
                  onChange={(e) => handleHoursChange(day.key, 'close', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                />
              </>
            )}

            {businessHours[day.key]?.closed && (
              <span className="text-sm text-gray-500 italic">Closed</span>
            )}
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        {selectedLocationCount === 1 
          ? (detailsLoaded 
              ? "Update your business hours. Changes will sync to your Google Business Profile."
              : "Set your business hours. This will update what customers see on your Google Business Profile."
            )
          : `Set regular business hours that apply to all ${selectedLocationCount} selected locations. Individual location hours can be adjusted in Google Business Profile if needed.`
        }
      </p>
    </div>
  );
} 