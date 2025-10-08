import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import Icon from '@/components/Icon';

interface ContactMergeModalProps {
  open: boolean;
  onClose: () => void;
  contacts: any[];
  onMerge: (primaryContactId: string, fieldsToKeep: Record<string, any>) => Promise<void>;
  reason: 'exact_email' | 'similar_name' | 'exact_phone';
  score: number;
}

const ContactMergeModal: React.FC<ContactMergeModalProps> = ({
  open,
  onClose,
  contacts,
  onMerge,
  reason,
  score
}) => {
  const [primaryContactId, setPrimaryContactId] = useState(contacts[0]?.id || '');
  const [selectedFields, setSelectedFields] = useState<Record<string, string>>({});
  const [merging, setMerging] = useState(false);

  // Initialize selected fields when modal opens
  React.useEffect(() => {
    if (open && contacts.length > 0) {
      const primary = contacts.find(c => c.id === primaryContactId) || contacts[0];
      const initialFields: Record<string, string> = {};
      
      // Field priority mapping
      const fields = [
        'first_name', 'last_name', 'email', 'phone', 'business_name', 'role',
        'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
        'category', 'notes'
      ];

      fields.forEach(field => {
        // Find the best value for each field
        const values = contacts
          .map(c => ({ id: c.id, value: c[field] }))
          .filter(v => v.value && v.value.trim() !== '');
        
        if (values.length > 0) {
          // Prefer primary contact's value, otherwise take first non-empty
          const primaryValue = values.find(v => v.id === primary.id);
          initialFields[field] = primaryValue?.id || values[0].id;
        }
      });
      
      setSelectedFields(initialFields);
    }
  }, [open, contacts, primaryContactId]);

  const getDisplayName = (contact: any) => {
    if (contact.imported_from_google && contact.first_name === "Google User" && contact.google_reviewer_name) {
      return contact.google_reviewer_name;
    }
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact';
  };

  const getReasonDisplay = () => {
    switch (reason) {
      case 'exact_email':
        return { label: 'Same email address', color: 'text-red-600', icon: 'FaEnvelope' };
      case 'exact_phone':
        return { label: 'Same phone number', color: 'text-orange-600', icon: 'FaPhone' };
      case 'similar_name':
        return { label: `Similar names (${Math.round(score * 100)}% match)`, color: 'text-yellow-600', icon: 'FaUser' };
    }
  };

  const handleMerge = async () => {
    if (!primaryContactId) return;
    
    setMerging(true);
    try {
      // Build merged data object
      const mergedData: Record<string, any> = {};
      
      Object.entries(selectedFields).forEach(([field, contactId]) => {
        const contact = contacts.find(c => c.id === contactId);
        if (contact && contact[field]) {
          mergedData[field] = contact[field];
        }
      });

      await onMerge(primaryContactId, mergedData);
      onClose();
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setMerging(false);
    }
  };

  const renderFieldSelector = (fieldName: string, label: string) => {
    const values = contacts
      .map(contact => ({ 
        id: contact.id, 
        value: contact[fieldName],
        displayName: getDisplayName(contact)
      }))
      .filter(v => v.value && v.value.trim() !== '');

    if (values.length === 0) return null;

    return (
      <div key={fieldName} className="grid grid-cols-3 gap-4 items-start py-3 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-700">
          {label}
        </div>
        <div className="col-span-2 space-y-2">
          {values.map(({ id, value, displayName }) => (
            <label key={`${fieldName}-${id}`} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name={fieldName}
                value={id}
                checked={selectedFields[fieldName] === id}
                onChange={(e) => setSelectedFields(prev => ({
                  ...prev,
                  [fieldName]: e.target.value
                }))}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">from {displayName}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  if (!open || contacts.length < 2) return null;

  const reasonDisplay = getReasonDisplay();

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" />
        
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto border-2 border-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Merge duplicate contacts
              </Dialog.Title>
              <div className="flex items-center gap-2 mt-2">
                <Icon name={reasonDisplay.icon as any} className={`w-4 h-4 ${reasonDisplay.color}`} />
                <span className={`text-sm ${reasonDisplay.color}`}>
                  {reasonDisplay.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="FaTimes" className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Contact Selection */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Choose primary contact (this contact will be kept):
            </h3>
            <div className="space-y-2">
              {contacts.map(contact => (
                <label key={contact.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="primaryContact"
                    value={contact.id}
                    checked={primaryContactId === contact.id}
                    onChange={(e) => setPrimaryContactId(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {getDisplayName(contact)}
                      {contact.imported_from_google && (
                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                          G
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {[contact.email, contact.phone].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Choose which information to keep for each field:
            </h3>
            <div className="space-y-1">
              {renderFieldSelector('first_name', 'First name')}
              {renderFieldSelector('last_name', 'Last name')}
              {renderFieldSelector('email', 'Email')}
              {renderFieldSelector('phone', 'Phone')}
              {renderFieldSelector('business_name', 'Business name')}
              {renderFieldSelector('role', 'Role')}
              {renderFieldSelector('address_line1', 'Address line 1')}
              {renderFieldSelector('address_line2', 'Address line 2')}
              {renderFieldSelector('city', 'City')}
              {renderFieldSelector('state', 'State')}
              {renderFieldSelector('postal_code', 'Postal code')}
              {renderFieldSelector('country', 'Country')}
              {renderFieldSelector('category', 'Category')}
              {renderFieldSelector('notes', 'Notes')}
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="FaExclamationTriangle" className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Important:</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  • All reviews and prompt pages from duplicate contacts will be transferred to the primary contact
                  • Duplicate contacts will be permanently deleted (this cannot be undone)
                  • Verification dates and Google import status will be preserved
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={!primaryContactId || merging}
              className="px-6 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: primaryContactId && !merging ? '#4F46E5' : '#F3F4F6',
                color: primaryContactId && !merging ? '#FFFFFF' : '#9CA3AF',
                cursor: primaryContactId && !merging ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (primaryContactId && !merging) {
                  e.currentTarget.style.backgroundColor = '#4338CA';
                }
              }}
              onMouseLeave={(e) => {
                if (primaryContactId && !merging) {
                  e.currentTarget.style.backgroundColor = '#4F46E5';
                }
              }}
            >
              {merging ? 'Merging...' : `Merge ${contacts.length} contacts`}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ContactMergeModal;