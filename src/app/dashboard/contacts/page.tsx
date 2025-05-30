"use client";

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/utils/authGuard';
import { createBrowserClient } from '@supabase/ssr';
import { FaDownload, FaUpload, FaInfoCircle, FaQuestionCircle, FaList, FaEye, FaUsers } from 'react-icons/fa';
import { getSessionOrMock } from '@/utils/supabase';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';
import PageCard from '@/app/components/PageCard';

export default function UploadContactsPage() {
  useAuthGuard();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [preview, setPreview] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleUrlHelp, setShowGoogleUrlHelp] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await getSessionOrMock(supabase);
      if (error || !session) {
        setError('Please sign in to upload contacts');
      }
    };
    checkAuth();
  }, [supabase]);

  useEffect(() => {
    console.log('State updated:', { selectedFile, preview, error, success });
  }, [selectedFile, preview, error, success]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select event:', e);
    const file = e.target.files?.[0];
    console.log('Selected file:', file);
    if (!file) return;

    if (file.type !== 'text/csv') {
      console.log('Invalid file type:', file.type);
      setError('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Read and preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('File read complete');
      const text = event.target?.result as string;
      console.log('File content:', text);
      
      // Parse CSV with proper handling of quoted fields
      const parseCSV = (csv: string) => {
        const rows = csv.split('\n');
        return rows.map(row => {
          const fields: string[] = [];
          let currentField = '';
          let inQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              if (inQuotes && row[i + 1] === '"') {
                // Handle escaped quotes
                currentField += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              fields.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          fields.push(currentField.trim());
          return fields;
        });
      };
      
      const rows = parseCSV(text).slice(0, 6); // Preview first 5 rows + header
      console.log('Parsed rows:', rows);
      setPreview(rows);
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setError('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'first_name',
      'last_name',
      'role',
      'email',
      'phone',
      'review_type',
      'offer_url',
      'offer_title',
      'offer_body',
      'friendly_note',
      'services_offered',
      'outcomes'
    ];
    const sampleData = [
      'John',
      'Doe',
      'Customer',
      'john@example.com',
      '555-123-4567',
      'prompt',
      'https://yourbusiness.com/reward',
      'Special Offer',
      'Use this code "1234" to get a discount on your next purchase.',
      'Thanks for being a great customer!',
      'Web Design',
      'Increased website traffic by 30%'
    ];
    
    // Format CSV with proper quoting
    const formatCSVRow = (row: string[]) => {
      return row.map(field => {
        // Quote fields that contain commas, quotes, or newlines
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',');
    };
    
    const csvContent = [
      formatCSVRow(headers),
      formatCSVRow(sampleData)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PromptReview Contact Upload.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const { data: { session }, error } = await getSessionOrMock(supabase);
      if (error || !session) {
        setError('Please sign in to upload contacts');
        return;
      }

      console.log('Session:', session);

      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/upload-contacts', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      console.log('Upload response:', data);
      
      if (!response.ok) {
        console.error('Upload error response:', data);
        if (data.invalidRecords) {
          const errorDetails = data.invalidRecords.map((r: any) => 
            `Row ${r.row}: Missing ${r.missingFields}`
          ).join('\n');
          setError(`Some records are missing required fields:\n${errorDetails}`);
        } else if (data.details) {
          setError(`Error: ${data.error}. Details: ${data.details}`);
        } else {
          setError(data.error || 'Failed to upload contacts');
        }
        return;
      }
      
      if (data.contactsCreated > 0) {
        setSuccess(`Successfully uploaded ${data.contactsCreated} contacts${data.promptPagesCreated ? ` and created ${data.promptPagesCreated} prompt pages` : ''}!`);
        setSelectedFile(null);
        setPreview([]);
      } else {
        setError('No contacts were created. Please check your CSV file.');
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="mb-4"><FiveStarSpinner /></div>
          <p className="mt-4 text-gray-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <PageCard icon={<FaUsers className="w-9 h-9 text-[#1A237E]" />}>
      <div className="w-full mx-auto relative" style={{maxWidth: 1000}}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-slate-blue">Contacts</h1>
            {/* Optionally add subcopy here if needed */}
          </div>
        </div>

        {/* Upload Instructions Section */}
        <div className="mb-16">
          <h2 className="mt-20 text-2xl font-bold text-slate-blue flex items-center gap-3 mb-12">
            <FaInfoCircle className="w-7 h-7 text-slate-blue" />
            How to upload contacts
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-indigo-800">
            <li>Download the CSV template using the button below</li>
            <li>Fill in your contacts' information</li>
            <li>Required columns: <strong>first_name (required), and at least one of email or phone</strong></li>
            <li>Optional Columns: Learn more below</li>
            <li>
              If you are adding Google Business Review URLs to the spreadsheet: 
              <button
                onClick={() => setShowGoogleUrlHelp(!showGoogleUrlHelp)}
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                See Instructions
              </button>
              {showGoogleUrlHelp && (
                <div className="absolute mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-w-md">
                  <h4 className="font-semibold text-gray-900 mb-2">How to get your Google review URL:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Make sure you're logged into your Google Business Profile account</li>
                    <li>Go to your Google Business Profile</li>
                    <li>Click on "Reviews" in the left menu</li>
                    <li>Click the "Get more reviews" button</li>
                    <li>Copy the URL from the popup that appears</li>
                    <li>The URL should look like: <code className="bg-gray-100 px-1 rounded">https://g.page/r/your-business-name/review</code></li>
                  </ol>
                  <p className="mt-2 text-sm text-gray-600">
                    Note: Incorrect Google Business URLs may be rejected by CSV uploader.
                  </p>
                  <button
                    onClick={() => setShowGoogleUrlHelp(false)}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Close
                  </button>
                </div>
              )}
            </li>
            <li>Upload your CSV and your contacts will be added to your prompt pages table in the drafts tab.</li>
          </ol>
        </div>

        {/* Upload Section with Preview */}
        <div className="mb-16 bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3 mb-12">
            <FaUsers className="w-7 h-7 text-slate-blue" />
            Add Your Contacts
          </h2>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <FaUpload className="text-slate-blue" />
                <span className="text-blue-700">Choose CSV file</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {selectedFile && (
                <div className="text-sm text-blue-600 max-w-[200px] truncate">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaDownload className="text-slate-blue" />
              Download CSV Template
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3 mb-12">
                <FaEye className="w-7 h-7 text-slate-blue" />
                Preview
              </h2>
              <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0].map((header: string, index: number) => (
                        <th
                          key={index}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(1).map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex}>
                        {row.map((cell: string, cellIndex: number) => (
                          <td
                            key={cellIndex}
                            className="px-3 py-2 text-sm text-gray-500"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Save Button - Only show when file is selected */}
          {selectedFile && (
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                onClick={handleUpload}
                className="px-6 py-2 bg-indigo text-white rounded-lg hover:bg-indigo/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo transition-colors"
              >
                Upload Contacts
              </button>
            </div>
          )}
        </div>

        {/* CSV Column Descriptions Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3 mb-12">
            <FaList className="w-7 h-7 text-slate-blue" />
            CSV column descriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-gray-500">Required fields</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li><span className="font-bold">first_name</span> - Contact's first name</li>
                  <li><span className="font-bold">email</span> - Contact's email address (required if phone not provided)</li>
                  <li><span className="font-bold">phone</span> - Contact's phone number (required if email not provided)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-500">Basic information</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li><span className="font-bold">last_name</span> - Contact's last name</li>
                  <li><span className="font-bold">category</span> - Contact category (e.g., VIP, Regular)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-500">Prompt Page Type</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li><span className="font-bold">review_type</span> - Type of prompt page. <span className="italic">Valid values: <span className='text-gray-700'>prompt</span> or <span className='text-gray-700'>photo</span></span></li>
                </ul>
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-bold text-gray-700">prompt</span>: A standard review request page.<br />
                  <span className="font-bold text-gray-700">photo</span>: A page for collecting photo testimonials.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-500">Reward Information</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li><span className="font-bold">review_rewards</span> - Description of the reward for leaving a review</li>
                  <li><span className="font-bold">offer_url</span> - URL where customers can claim their reward</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageCard>
  );
} 