"use client";
import React from 'react';
import { FaCopy } from 'react-icons/fa';

export default function SimpleConsoleCopy() {
  const copyConsoleLogs = async () => {
    try {
      // This is a simple approach - in a real implementation, you'd need to
      // capture logs as they happen since we can't access the console buffer directly
      const logs = [
        'Console logs copied at: ' + new Date().toLocaleString(),
        'Note: This is a placeholder. For full console capture, use the ConsoleLogger component.',
        'To capture real logs, click the bug icon in the bottom-right corner.'
      ].join('\n');
      
      await navigator.clipboard.writeText(logs);
      alert('Console logs copied! (Note: This is a placeholder. Use the bug icon for real capture.)');
    } catch (err) {
      console.error('Failed to copy console logs:', err);
      alert('Failed to copy console logs. Please use the bug icon in the bottom-right corner instead.');
    }
  };

  return (
    <button
      onClick={copyConsoleLogs}
      className="fixed bottom-4 left-4 z-50 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      title="Copy Console Logs"
    >
      <FaCopy size={20} />
    </button>
  );
} 