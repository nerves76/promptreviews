"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import Icon, { IconName } from "@/components/Icon";
import { formatDistanceToNow, format } from "date-fns";

interface UpcomingReminder {
  id: string;
  reminder_type: string;
  reminder_date: string;
  status: 'pending' | 'sent' | 'completed' | 'cancelled';
  communication_records: {
    id: string;
    communication_type: 'email' | 'sms';
    subject?: string;
    message_content: string;
    sent_at: string;
  };
}

interface UpcomingRemindersProps {
  contactId: string;
  className?: string;
}

const getReminderTypeLabel = (reminderType: string): string => {
  const labels: Record<string, string> = {
    '1_week': '1 week',
    '2_weeks': '2 weeks', 
    '3_weeks': '3 weeks',
    '1_month': '1 month',
    '2_months': '2 months',
    '3_months': '3 months',
    '4_months': '4 months',
    '5_months': '5 months',
    '6_months': '6 months',
  };
  return labels[reminderType] || reminderType;
};

const getCommunicationIcon = (type: 'email' | 'sms'): IconName => {
  return type === 'email' ? 'FaEnvelope' : 'FaComments';
};

export default function UpcomingReminders({
  contactId,
  className = ""
}: UpcomingRemindersProps) {
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingReminders, setUpdatingReminders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (contactId) {
      fetchReminders();
    }
  }, [contactId]);

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/communication/reminders?contactId=${contactId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reminders');
      }

      const data = await response.json();
      setReminders(data.reminders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReminderAction = async (reminderId: string, action: 'complete' | 'cancel') => {
    try {
      setUpdatingReminders(prev => new Set([...prev, reminderId]));

      const response = await fetch('/api/communication/reminders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminderId, action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} reminder`);
      }

      // Remove the reminder from the list
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(reminderId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Loading upcoming reminders...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 border-red-200 bg-red-50 ${className}`}>
        <div className="flex items-center gap-3">
          <Icon name="FaExclamationTriangle" className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load reminders</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (reminders.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center py-4">
          <Icon name="FaBell" className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No upcoming reminders</h3>
          <p className="text-xs text-gray-500">
            All follow-up reminders for this contact are up to date.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Icon name="FaBell" className="w-5 h-5 text-yellow-600" />
          <h3 className="text-sm font-medium text-gray-900">Upcoming Reminders</h3>
          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
            {reminders.length} due
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {reminders.map((reminder) => {
          const isUpdating = updatingReminders.has(reminder.id);
          const isOverdue = new Date(reminder.reminder_date) < new Date();
          
          return (
            <div 
              key={reminder.id} 
              className={`border rounded-lg p-3 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Communication Icon */}
                  <div className={`p-2 rounded-lg ${
                    reminder.communication_records.communication_type === 'email' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <Icon 
                      name={getCommunicationIcon(reminder.communication_records.communication_type)} 
                      className="w-4 h-4" 
                    />
                  </div>
                  
                  {/* Reminder Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        Follow-up ({getReminderTypeLabel(reminder.reminder_type)})
                      </span>
                      {isOverdue && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                          Overdue
                        </span>
                      )}
                    </div>
                    
                    {/* Original Communication Subject/Preview */}
                    {reminder.communication_records.subject && (
                      <p className="text-sm text-gray-700 mb-1 font-medium">
                        "{reminder.communication_records.subject}"
                      </p>
                    )}
                    
                    {/* Original Message Preview */}
                    <p className="text-sm text-gray-600 mb-2">
                      {reminder.communication_records.message_content.substring(0, 80)}
                      {reminder.communication_records.message_content.length > 80 ? '...' : ''}
                    </p>
                    
                    {/* Due Date */}
                    <p className="text-xs text-gray-500">
                      {isOverdue 
                        ? `Was due ${formatDistanceToNow(new Date(reminder.reminder_date))} ago`
                        : `Due ${format(new Date(reminder.reminder_date), 'MMM d, yyyy')}`
                      }
                    </p>
                    
                    {/* Original Send Date */}
                    <p className="text-xs text-gray-500 mt-1">
                      Original sent {formatDistanceToNow(new Date(reminder.communication_records.sent_at))} ago
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReminderAction(reminder.id, 'complete')}
                  disabled={isUpdating}
                  className="flex items-center gap-1 text-green-700 border-green-200 hover:bg-green-50"
                >
                  {isUpdating ? (
                    <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name="FaCheck" className="w-3 h-3" />
                  )}
                  Mark Complete
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReminderAction(reminder.id, 'cancel')}
                  disabled={isUpdating}
                  className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50"
                >
                  {isUpdating ? (
                    <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name="FaTimes" className="w-3 h-3" />
                  )}
                  Cancel
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}