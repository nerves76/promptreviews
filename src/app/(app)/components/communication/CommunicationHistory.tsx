"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/app/(app)/components/ui/card";
import Icon, { IconName } from "@/components/Icon";
import { formatDistanceToNow, format } from "date-fns";
import { apiClient } from "@/utils/apiClient";

interface CommunicationRecord {
  id: string;
  communication_type: 'email' | 'sms';
  status: 'draft' | 'sent' | 'failed';
  subject?: string;
  message_content: string;
  sent_at?: string;
  created_at: string;
  follow_up_reminders?: FollowUpReminder[];
}

interface FollowUpReminder {
  id: string;
  reminder_type: string;
  reminder_date: string;
  status: 'pending' | 'sent' | 'completed' | 'cancelled';
}

interface CommunicationHistoryProps {
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

const getStatusColor = (status: string, type: 'record' | 'reminder' = 'record'): string => {
  if (type === 'record') {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  } else {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'sent': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
};

const getCommunicationIcon = (type: 'email' | 'sms'): IconName => {
  return type === 'email' ? 'FaEnvelope' : 'FaComments';
};

export default function CommunicationHistory({
  contactId,
  className = ""
}: CommunicationHistoryProps) {
  const [records, setRecords] = useState<CommunicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  const fetchCommunicationHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use apiClient which automatically includes auth headers and X-Selected-Account
      const data = await apiClient.get(`/communication/records?contactId=${contactId}`);
      setRecords(data.records);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch communication history');
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);
  
  useEffect(() => {
    if (contactId) {
      fetchCommunicationHistory();
    }
  }, [contactId, fetchCommunicationHistory]);

  const toggleExpanded = (recordId: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Loading communication history...</span>
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
            <p className="text-sm font-medium text-red-800">Failed to load communication history</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center py-6">
          <Icon name="FaComments" className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No communication history</h3>
          <p className="text-xs text-gray-500">
            No emails or text messages have been sent to this contact yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Icon name="FaHistory" className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Communication History</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {records.length}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {records.map((record) => {
          const isExpanded = expandedRecords.has(record.id);
          const hasReminders = record.follow_up_reminders && record.follow_up_reminders.length > 0;
          
          return (
            <div key={record.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Communication Icon */}
                  <div className={`p-2 rounded-lg ${
                    record.communication_type === 'email' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'bg-green-50 text-green-600'
                  }`}>
                    <Icon name={getCommunicationIcon(record.communication_type)} className="w-4 h-4" />
                  </div>
                  
                  {/* Communication Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {record.communication_type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                      {hasReminders && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                          Follow-up set
                        </span>
                      )}
                    </div>
                    
                    {/* Subject (for emails) */}
                    {record.subject && (
                      <p className="text-sm text-gray-700 mb-1 font-medium">
                        {record.subject}
                      </p>
                    )}
                    
                    {/* Message Preview */}
                    <p className="text-sm text-gray-600 mb-2">
                      {isExpanded 
                        ? record.message_content
                        : `${record.message_content.substring(0, 100)}${record.message_content.length > 100 ? '...' : ''}`
                      }
                    </p>
                    
                    {/* Date */}
                    <p className="text-xs text-gray-500">
                      {record.sent_at 
                        ? `Sent ${formatDistanceToNow(new Date(record.sent_at))} ago`
                        : `Created ${formatDistanceToNow(new Date(record.created_at))} ago`
                      }
                    </p>
                  </div>
                </div>
                
                {/* Expand/Collapse Button */}
                {(record.message_content.length > 100 || hasReminders) && (
                  <button
                    onClick={() => toggleExpanded(record.id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <Icon 
                      name={isExpanded ? "FaChevronUp" : "FaChevronDown"} 
                      className="w-4 h-4" 
                    />
                  </button>
                )}
              </div>
              
              {/* Follow-up Reminders */}
              {isExpanded && hasReminders && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="FaBell" className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">Follow-up Reminders</span>
                  </div>
                  <div className="space-y-2">
                    {record.follow_up_reminders!.map((reminder) => (
                      <div key={reminder.id} className="flex items-center justify-between text-xs bg-purple-50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-700">
                            {getReminderTypeLabel(reminder.reminder_type)}
                          </span>
                          <span className={`px-2 py-1 rounded-full border ${getStatusColor(reminder.status, 'reminder')}`}>
                            {reminder.status}
                          </span>
                        </div>
                        <span className="text-purple-600">
                          {format(new Date(reminder.reminder_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}