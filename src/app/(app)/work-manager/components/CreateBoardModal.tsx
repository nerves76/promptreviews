"use client";

import React, { useState } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { Modal } from "@/app/(app)/components/ui/modal";

interface Account {
  account_id: string;
  account_name?: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
}

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  existingBoardAccountIds: string[];
  onBoardCreated: (boardId: string) => void;
}

export default function CreateBoardModal({
  isOpen,
  onClose,
  accounts,
  existingBoardAccountIds,
  onBoardCreated,
}: CreateBoardModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [boardName, setBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter to accounts that don't have boards yet
  const availableAccounts = accounts.filter(
    (a) => !existingBoardAccountIds.includes(a.account_id)
  );

  const getAccountDisplayName = (account: Account): string => {
    if (account.business_name) return account.business_name;
    if (account.account_name) return account.account_name;
    if (account.first_name || account.last_name) {
      return `${account.first_name || ""} ${account.last_name || ""}`.trim();
    }
    return "Unknown Account";
  };

  const handleCreate = async () => {
    if (!selectedAccountId) {
      setError("Please select an account");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await apiClient.post<{ board: { id: string } }>("/work-manager/boards", {
        account_id: selectedAccountId,
        name: boardName.trim() || undefined,
      });

      if (response.board) {
        onBoardCreated(response.board.id);
        onClose();
        // Reset form
        setSelectedAccountId("");
        setBoardName("");
      }
    } catch (err: any) {
      console.error("Failed to create board:", err);
      setError(err.message || "Failed to create board");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedAccountId("");
    setBoardName("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="Create task board">
      {/* Subtitle */}
      <p className="text-sm text-gray-600 -mt-3 mb-4">
        Set up a task board for a client account
      </p>

      {/* Body */}
      <div className="space-y-4">
        {availableAccounts.length === 0 ? (
          <div className="text-center py-6">
            <Icon name="FaCheckCircle" size={48} className="mx-auto mb-3 text-emerald-500" />
            <p className="text-gray-600">All your accounts already have task boards!</p>
          </div>
        ) : (
          <>
            {/* Account selection */}
            <div className="space-y-2">
              <label htmlFor="account" className="text-sm font-medium text-gray-700">
                Select account *
              </label>
              <select
                id="account"
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
              >
                <option value="">Choose an account...</option>
                {availableAccounts.map((account) => (
                  <option key={account.account_id} value={account.account_id}>
                    {getAccountDisplayName(account)}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional board name */}
            <div className="space-y-2">
              <label htmlFor="boardName" className="text-sm font-medium text-gray-700">
                Board name (optional)
              </label>
              <input
                id="boardName"
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Leave blank to use account name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                If not provided, the board will use the account or business name
              </p>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <Icon name="FaExclamationTriangle" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Modal.Footer>
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          Cancel
        </button>
        {availableAccounts.length > 0 && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !selectedAccountId}
            className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 whitespace-nowrap"
          >
            {isCreating && (
              <Icon name="FaSpinner" size={14} className="animate-spin" />
            )}
            {isCreating ? "Creating..." : "Create board"}
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
