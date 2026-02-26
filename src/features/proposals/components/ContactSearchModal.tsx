'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { apiClient } from '@/utils/apiClient';
import Icon from '@/components/Icon';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
}

interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
}

export function ContactSearchModal({ isOpen, onClose, onSelect }: ContactSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const search = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await apiClient.get<{ contacts: Contact[] }>(
          `/contacts/search?q=${encodeURIComponent(query.trim())}`
        );
        setResults(data.contacts || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link to contact" size="md">
      <div className="space-y-4">
        <div className="relative">
          <Icon name="FaSearch" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts by name or email..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
            autoFocus
            aria-label="Search contacts"
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              <Icon name="FaSpinner" size={16} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    onSelect(contact);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors rounded"
                >
                  <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                  <p className="text-xs text-gray-500">{contact.email}</p>
                  {contact.company && (
                    <p className="text-xs text-gray-500">{contact.company}</p>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <p className="py-8 text-center text-sm text-gray-500">No contacts found</p>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">Type at least 2 characters to search</p>
          )}
        </div>
      </div>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
}
