"use client";

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/utils/authGuard";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock, getSessionOrMock } from "@/utils/supabaseClient";
import { useAccountSelection } from "@/utils/accountSelectionHooks";
import Icon from "@/components/Icon";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/components/AppLoader";

export default function UploadContactsPage() {
  const supabase = createClient();

  useAuthGuard();
  const { selectedAccount, loading: accountLoading } = useAccountSelection();
  
  // Debug logging for account selection
  console.log('📥 Upload Contacts Page - Account Selection State:', {
    selectedAccount,
    accountLoading,
    selectedAccountId: selectedAccount?.account_id,
    selectedAccountName: selectedAccount?.account_name
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [preview, setPreview] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleUrlHelp, setShowGoogleUrlHelp] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState<string | null>(
    null,
  );
  const [account, setAccount] = useState<any>(null);
  const router = useRouter();

  // Using singleton Supabase client from supabaseClient.ts

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await getSessionOrMock(supabase);
      if (error || !session) {
        setError("Please sign in to upload contacts");
      }
    };
    checkAuth();
  }, [supabase]);

  useEffect(() => {
    const fetchAccount = async () => {
      console.log('🔄 Upload Contacts Page - fetchAccount called:', {
        accountLoading,
        selectedAccountId: selectedAccount?.account_id
      });
      
      // Wait for account selection to complete
      if (accountLoading || !selectedAccount?.account_id) {
        console.log('⏸️ Upload Contacts Page - Waiting for account selection to complete');
        return;
      }
      
      console.log('✅ Upload Contacts Page - Fetching account data for:', selectedAccount.account_id);
      
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", selectedAccount.account_id)
        .single();
      
      if (error) {
        console.error('❌ Upload Contacts Page - Error loading account:', error);
      } else {
        console.log('📥 Upload Contacts Page - Account data loaded successfully');
        setAccount(data);
      }
    };
    fetchAccount();
  }, [supabase, accountLoading, selectedAccount?.account_id]);

  useEffect(() => {
    console.log("State updated:", { selectedFile, preview, error, success });
  }, [selectedFile, preview, error, success]);

  // Helper to determine if user is blocked from uploading contacts
  const isUploadBlocked =
    account && account.plan === "grower" && !account.is_free_account;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploadBlocked) {
      setUpgradeModalMessage(
        "Looking to upgrade? Upload your contact list and start doing personal outreach and growing your reviews and testimonials. Create review workflows, track activity, do follow ups, and send special offers. Not in a spammy way. In a human to human way.",
      );
      setShowUpgradeModal(true);
      return;
    }
    console.log("File select event:", e);
    const file = e.target.files?.[0];
    console.log("Selected file:", file);
    if (!file) return;

    if (file.type !== "text/csv") {
      console.log("Invalid file type:", file.type);
      setError("Please select a CSV file");
      return;
    }

    setSelectedFile(file);
    setError("");

    // Read and preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log("File read complete");
      const text = event.target?.result as string;
      console.log("File content:", text);

      // Parse CSV with proper handling of quoted fields
      const parseCSV = (csv: string) => {
        const rows = csv.split("\n");
        return rows.map((row) => {
          const fields: string[] = [];
          let currentField = "";
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
            } else if (char === "," && !inQuotes) {
              fields.push(currentField.trim());
              currentField = "";
            } else {
              currentField += char;
            }
          }
          fields.push(currentField.trim());
          return fields;
        });
      };

      const rows = parseCSV(text).slice(0, 6); // Preview first 5 rows + header
      console.log("Parsed rows:", rows);
      setPreview(rows);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setError("Error reading file");
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "offer_url",
      "offer_title",
      "offer_body",
      "role",
      "review_type",
      "friendly_note",
      "features_or_benefits",
      "product_description",
    ];
    const sampleData = [
      "John",
      "Doe",
      "john@example.com",
      "555-123-4567",
      "https://yourbusiness.com/reward",
      "Special Offer",
      'Use this code "1234" to get a discount on your next purchase.',
      "Customer",
      "prompt",
      "Thanks for being a great customer!",
      "Web Design",
      "Increased website traffic by 30%",
    ];

    // Format CSV with proper quoting
    const formatCSVRow = (row: string[]) => {
      return row
        .map((field) => {
          // Quote fields that contain commas, quotes, or newlines
          if (
            field.includes(",") ||
            field.includes('"') ||
            field.includes("\n")
          ) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        })
        .join(",");
    };

    const csvContent = [formatCSVRow(headers), formatCSVRow(sampleData)].join(
      "\n",
    );

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PromptReview Contact Upload.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await getSessionOrMock(supabase);
      if (error || !session) {
        setError("Please sign in to upload contacts");
        return;
      }

      console.log("Session:", session);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload-contacts", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Upload response:", data);

      if (!response.ok) {
        if (
          response.status === 403 &&
          data.error &&
          data.error.includes("Limit reached for your plan")
        ) {
          setUpgradeModalMessage(
            `Contact Limit Reached\n\n${data.error}\nUpgrade your plan to add more contacts.`
          );
          setShowUpgradeModal(true);
          return;
        }
        if (data.invalidRecords) {
          const errorDetails = data.invalidRecords
            .map((r: any) => `Row ${r.row}: Missing ${r.missingFields}`)
            .join("\n");
          setError(
            `Some records are missing required fields:\n${errorDetails}`,
          );
        } else if (data.details) {
          setError(`Error: ${data.error}. Details: ${data.details}`);
        } else {
          setError(data.error || "Failed to upload contacts");
        }
        return;
      }

      if (data.contactsCreated > 0) {
        setSuccess(
          `Successfully uploaded ${data.contactsCreated} contacts${data.promptPagesCreated ? ` and created ${data.promptPagesCreated} prompt pages` : ""}!`,
        );
        setSelectedFile(null);
        setPreview([]);
      } else {
        setError("No contacts were created. Please check your CSV file.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload contacts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-2">
      {/* Upgrade Modal */}
      <Dialog
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black opacity-30"
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-8 z-10">
            <Dialog.Title className="text-lg font-bold mb-4">
              {upgradeModalMessage &&
              upgradeModalMessage.startsWith("Contact Limit Reached")
                ? "Contact Limit Reached"
                : "Looking to upgrade?"}
            </Dialog.Title>
            <Dialog.Description className="mb-6 text-gray-700 whitespace-pre-line">
              {upgradeModalMessage}
            </Dialog.Description>
            {/* Show 'Contact us' for 10,000+ contacts, otherwise 'Upgrade now' */}
            {upgradeModalMessage && /10,000|10000|more than 9999/.test(upgradeModalMessage) ? (
              <a
                href="https://promptreviews.app/contact"
                className="w-full block py-2 px-4 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 font-semibold text-center mb-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact us
              </a>
            ) : (
              <button
                className="w-full py-2 px-4 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 font-semibold mb-2"
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.location.href = "/dashboard/plan";
                }}
              >
                Upgrade now
              </button>
            )}
            <button
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              onClick={() => setShowUpgradeModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Dialog>
      <div
        className="w-full mx-auto bg-white rounded-lg shadow-lg p-8 relative mt-0 md:mt-[30px]"
        style={{ maxWidth: 1000 }}
      >
        <div className="absolute left-0 md:left-[-24px] top-0 md:top-[30px] z-10 bg-white rounded-full shadow p-3 flex items-center justify-center">
          <Icon name="FaUpload" className="w-9 h-9 text-[#1A237E]" />
        </div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-[#1A237E]">
              Upload contacts
            </h1>
            {/* Optionally add subcopy here if needed */}
          </div>
        </div>

        {/* Upload Instructions Section */}
        <div className="mb-16">
          <h2 className="mt-20 text-2xl font-bold text-[#1A237E] flex items-center gap-3 mb-12">
            <Icon name="FaInfoCircle" className="w-7 h-7 text-[#1A237E]" />
            How to upload contacts
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-indigo-800">
            <li>Download the CSV template using the button below</li>
            <li>Fill in your contacts' information</li>
            <li>
              Required columns:{" "}
              <strong>
                first_name (required), and at least one of email or phone
              </strong>
            </li>
            <li>Optional Columns: Learn more below</li>
            <li>
              Upload your CSV and your contacts will be added to your prompt
              pages table in the drafts tab.
            </li>
          </ol>
        </div>

        {/* Upload Section with Preview */}
        <div className="mb-16 bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h2 className="text-2xl font-bold text-[#1A237E] flex items-center gap-3 mb-12">
            <Icon name="FaUsers" className="w-7 h-7 text-[#1A237E]" />
            Add your contacts
          </h2>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploadBlocked}
                />
                <span
                  className={`text-blue-700 ${isUploadBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Choose CSV file
                </span>
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
                                  <Icon name="FaDownload" className="text-[#1A237E]" />
              Download CSV template
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
              <h2 className="text-2xl font-bold text-[#1A237E] flex items-center gap-3 mb-12">
                <Icon name="FaEye" className="w-7 h-7 text-[#1A237E]" />
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Contacts
              </button>
            </div>
          )}
        </div>

        {/* CSV Column Descriptions Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1A237E] flex items-center gap-3 mb-12">
                          <Icon name="FaList" className="w-7 h-7 text-[#1A237E]" />
            CSV column descriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-gray-900">Required fields</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li>
                    <span className="font-bold">first_name</span> - Contact's
                    first name
                  </li>
                  <li>
                    <span className="font-bold">email</span> - Contact's email
                    address (required if phone not provided)
                  </li>
                  <li>
                    <span className="font-bold">phone</span> - Contact's phone
                    number (required if email not provided)
                  </li>
                  <li>
                    <span className="font-bold">review_type</span> - Type of
                    prompt page.{" "}
                    <span className="italic">
                      Valid values:{" "}
                      <span className="text-gray-700">prompt</span> or{" "}
                      <span className="text-gray-700">photo</span>
                    </span>
                    <p className="mt-2 text-xs text-gray-500">
                      <span className="font-bold text-gray-700">prompt</span>: A
                      standard review request page.
                      <br />
                      <span className="font-bold text-gray-700">photo</span>: A
                      page for collecting photo testimonials.
                    </p>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Offer & Rewards</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li>
                    <span className="font-bold">offer_url</span> - URL where
                    customers can claim their reward or offer
                  </li>
                  <li>
                    <span className="font-bold">offer_title</span> - Title of
                    the special offer or reward
                  </li>
                  <li>
                    <span className="font-bold">offer_body</span> - Description
                    or details of the offer
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Basic information
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li>
                    <span className="font-bold">last_name</span> - Contact's
                    last name
                  </li>
                  <li>
                    <span className="font-bold">role</span> - Contact's role or
                    relationship to your business (e.g., Customer, Client,
                    Partner)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Prompt Page Content
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li>
                    <span className="font-bold">friendly_note</span> - A
                    personal note to the contact (displayed on the prompt page)
                  </li>
                  <li>
                    <span className="font-bold">features_or_benefits</span> -
                    Features or benefits you provided to this contact
                    (comma-separated or single value)
                  </li>
                  <li>
                    <span className="font-bold">product_description</span> -
                    Description or details of the product or service
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
