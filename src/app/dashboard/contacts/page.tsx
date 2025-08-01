"use client";

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/utils/authGuard";
import { createClient, getSessionOrMock } from "@/utils/supabaseClient";
import Icon from "@/components/Icon";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import TopLoaderOverlay from "@/app/components/TopLoaderOverlay";
import { Dialog } from "@headlessui/react";
import PromptPageForm from "@/app/components/PromptPageForm";
import { useRouter } from "next/navigation";

import PromptTypeSelectModal from "@/app/components/PromptTypeSelectModal";
import BulkPromptTypeSelectModal from "@/app/components/BulkPromptTypeSelectModal";
import { promptTypes } from "@/config/promptTypes";

export default function UploadContactsPage() {
  const supabase = createClient();

  useAuthGuard();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [preview, setPreview] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleUrlHelp, setShowGoogleUrlHelp] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPromptFormModal, setShowPromptFormModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [promptFormInitialData, setPromptFormInitialData] = useState<any>(null);
  const [promptFormLoading, setPromptFormLoading] = useState(false);
  const [promptFormError, setPromptFormError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const allSelected =
    contacts.length > 0 && selectedContactIds.length === contacts.length;
  const anySelected = selectedContactIds.length > 0;
  const router = useRouter();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedContactForPrompt, setSelectedContactForPrompt] =
    useState<any>(null);

  // Bulk creation state
  const [showBulkTypeModal, setShowBulkTypeModal] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ created: 0, failed: 0, total: 0 });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

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
    console.log("State updated:", { selectedFile, preview, error, success });
  }, [selectedFile, preview, error, success]);

  // Fetch contacts with pagination
  useEffect(() => {
    const fetchContacts = async () => {
      setContactsLoading(true);
      
      // Get total count
      const { count, error: countError } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true });
      
      if (!countError && count !== null) {
        setTotalCount(count);
      }
      
      // Get paginated data
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;
      
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);
        
      if (!error && data) {
        setContacts(data);
        // Clear selections when changing pages
        setSelectedContactIds([]);
      }
      setContactsLoading(false);
    };
    fetchContacts();
  }, [supabase, success, currentPage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      "address_line1",
      "address_line2",
      "city",
      "state",
      "postal_code",
      "country",
      "business_name",
      "role",
      "notes",
      "category",
    ];
    const sampleData = [
      "John",
      "Doe",
      "john@example.com",
      "555-123-4567",
      "123 Main St",
      "Apt 4B",
      "Springfield",
      "IL",
      "62704",
      "USA",
      "Acme Corp",
      "Manager",
      "VIP customer",
      "VIP",
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

  const expectedHeaders = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address_line1",
    "address_line2",
    "city",
    "state",
    "postal_code",
    "country",
    "business_name",
    "role",
    "notes",
    "category",
  ];
  const isHeaderRowValid =
    preview.length > 0 &&
    Array.isArray(preview[0]) &&
    expectedHeaders.every((h, i) => (preview[0][i] || "").toLowerCase() === h);

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!isHeaderRowValid) {
      setError(
        "The first row of your CSV must be the header row. Please remove any extra rows above your column headers.",
      );
      return;
    }

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
      });

      const data = await response.json();
      console.log("Upload response:", data);

      if (!response.ok) {
        console.error("Upload error response:", data);
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

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map((c) => c.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (!anySelected) return;
    if (
      !window.confirm(
        `Delete ${selectedContactIds.length} contact(s)? This cannot be undone.`,
      )
    )
      return;
    try {
      await supabase.from("contacts").delete().in("id", selectedContactIds);
      setContacts((prev) =>
        prev.filter((c) => !selectedContactIds.includes(c.id)),
      );
      setSelectedContactIds([]);
      setSuccess(`${selectedContactIds.length} contact(s) deleted.`);
    } catch (err) {
      setError("Failed to delete contacts.");
    }
  };



  function handlePromptTypeSelect(typeKey: string) {
    setShowTypeModal(false);
    if (!selectedContactForPrompt) return;
    // Pass contact info as query params for prefill
    const params = new URLSearchParams({
      type: typeKey,
      first_name: selectedContactForPrompt.first_name || "",
      last_name: selectedContactForPrompt.last_name || "",
      email: selectedContactForPrompt.email || "",
      phone: selectedContactForPrompt.phone || "",
      business_name: selectedContactForPrompt.business_name || "",
      role: selectedContactForPrompt.role || "",
      contact_id: selectedContactForPrompt.id || "",
      campaign_type: "individual", // Always force individual campaign type for contacts
    });
    router.push(`/create-prompt-page?${params.toString()}`);
  }

  async function handleBulkPromptTypeSelect(promptType: string) {
    setShowBulkTypeModal(false);
    setBulkCreating(true);
    setBulkProgress({ created: 0, failed: 0, total: selectedContactIds.length });

    try {
      const response = await fetch('/api/contacts/bulk-create-prompt-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          contactIds: selectedContactIds,
          promptType: promptType
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create prompt pages');
      }

      setBulkProgress({
        created: result.created,
        failed: result.failed,
        total: selectedContactIds.length
      });

      // Show success message
      if (result.created > 0) {
        setSuccess(`Successfully created ${result.created} prompt pages!`);
        // Clear selection
        setSelectedContactIds([]);
      }

      if (result.failed > 0) {
        setError(`${result.failed} prompt pages failed to create. Please try again.`);
      }

    } catch (error) {
      console.error('Bulk creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create prompt pages');
    } finally {
      setBulkCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  const contactFieldKeys = contacts.length > 0 ? Object.keys(contacts[0]) : [];
  let fieldKeys = contactFieldKeys.includes("category")
    ? contactFieldKeys
    : [...contactFieldKeys, "category"];
  if (!fieldKeys.includes("role")) fieldKeys = [...fieldKeys, "role"];
  fieldKeys = fieldKeys.filter(
    (k) =>
      k !== "id" && k !== "first_name" && k !== "last_name" && k !== "category",
  );
  fieldKeys = fieldKeys.sort();
  fieldKeys = ["Name", ...fieldKeys, "role", "category"];

  return (
    <PageCard icon={<Icon name="FaUsers" className="w-9 h-9 text-[#1A237E]" />}>
      <div className="w-full mx-auto relative" style={{ maxWidth: 1000 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
                            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">Contacts</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/contacts/export', {
                    headers: {
                      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    },
                  });
                  
                  if (!response.ok) {
                    throw new Error('Export failed');
                  }
                  
                  // Create download
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  const currentDate = new Date().toISOString().split('T')[0];
                  a.download = `contacts-${currentDate}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Export error:', error);
                  alert('Failed to export contacts. Please try again.');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow flex items-center gap-2"
            >
              <Icon name="FaDownload" className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-semibold shadow flex items-center gap-2"
            >
              <Icon name="FaUpload" className="w-4 h-4" />
              Upload contacts
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-blue mb-6">
            Your contacts
          </h2>
          {anySelected && (
            <div className="mb-4 flex items-center gap-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold shadow"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Selected ({selectedContactIds.length})
              </button>
              <button
                className="px-4 py-2 bg-slate-blue text-white rounded hover:bg-slate-blue/90 font-semibold shadow flex items-center gap-2"
                onClick={() => setShowBulkTypeModal(true)}
                disabled={bulkCreating}
              >
                <Icon name="FaHandshake" className="w-4 h-4" size={16} />
                {bulkCreating ? 'Creating...' : `Bulk Create Prompt Pages (${selectedContactIds.length})`}
              </button>
              <span className="text-sm text-gray-600">
                {selectedContactIds.length} selected
              </span>
            </div>
          )}
          {contactsLoading ? (
            <AppLoader />
          ) : contacts.length === 0 ? (
            <div className="text-gray-500">
              No contacts found. Upload your contacts to get started.
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          aria-label="Select all contacts"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => handleSelectOne(contact.id)}
                          aria-label={`Select contact ${contact.first_name} ${contact.last_name}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.email}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.phone}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.role || ""}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.status}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.category || ""}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <button
                          className="text-slate-blue underline hover:text-slate-800 text-xs mr-4 bg-transparent border-none p-0 shadow-none"
                          style={{ background: "none", border: "none" }}
                          onClick={() => {
                            setEditContact(contact);
                            setShowEditModal(true);
                            setEditError("");
                            setEditSuccess("");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 bg-slate-blue text-white rounded hover:bg-slate-blue/90 text-xs shadow"
                          onClick={async () => {
                            // Validate business profile before allowing prompt page creation
                            try {
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user) {
                                alert('Please sign in to create prompt pages.');
                                return;
                              }
                              
                              const { data: businessData } = await supabase
                                .from("businesses")
                                .select("name")
                                .eq("account_id", user.id)
                                .single();
                              
                              if (!businessData) {
                                alert('Please create a business profile first before creating prompt pages. You can do this from the "Your Business" section in the dashboard.');
                                router.push('/dashboard/business-profile');
                                return;
                              }
                              
                              if (!businessData.name || businessData.name.trim() === '') {
                                alert('Please complete your business profile by adding your business name. This is required for creating prompt pages.');
                                router.push('/dashboard/business-profile');
                                return;
                              }
                              
                              setSelectedContactForPrompt(contact);
                              setShowTypeModal(true);
                            } catch (error) {
                              console.error('Error checking business profile:', error);
                              alert('There was an error checking your business profile. Please try again.');
                            }
                          }}
                        >
                          Create prompt page
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} contacts
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const totalPages = Math.ceil(totalCount / itemsPerPage);
                      const pages = [];
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, startPage + 4);
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`px-3 py-1 rounded text-sm ${
                              i === currentPage
                                ? 'bg-slate-blue text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      return pages;
                    })()}
                    
                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage >= Math.ceil(totalCount / itemsPerPage)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt Type Select Modal */}
        <PromptTypeSelectModal
          open={showTypeModal}
          onClose={() => setShowTypeModal(false)}
          onSelectType={handlePromptTypeSelect}
          promptTypes={promptTypes}
        />

        {/* Upload Modal */}
        <Dialog
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          className="fixed z-50 inset-0 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black opacity-30"
              aria-hidden="true"
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto p-8 z-10">
              {/* Close button */}
              <button
                className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none"
                style={{ zIndex: 20, width: 40, height: 40 }}
                onClick={() => setShowUploadModal(false)}
                aria-label="Close"
              >
                <Icon name="FaTimes" className="w-5 h-5 text-red-600" />
              </button>
              {/* Upload Section with Preview */}
              <div className="mb-16 bg-blue-50 rounded-lg p-6 border border-blue-100">
                <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3 mb-12">
                  <Icon name="FaUsers" className="w-7 h-7 text-slate-blue" />
                  Add your contacts
                </h2>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Icon name="FaUpload" className="text-slate-blue" />
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
                    <Icon name="FaDownload" className="text-slate-blue" />
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
                    <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3 mb-12">
                      <Icon name="FaEye" className="w-7 h-7 text-slate-blue" />
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
                          {preview
                            .slice(1)
                            .map((row: string[], rowIndex: number) => (
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
              <button
                className="w-full mt-6 py-2 px-4 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 font-semibold"
                onClick={() => setShowUploadModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Dialog>

        {/* Edit Contact Modal */}
        <Dialog
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          className="fixed z-50 inset-0 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black opacity-30"
              aria-hidden="true"
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto p-8 z-10">
              {/* Close button */}
              <button
                className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none"
                style={{ zIndex: 20, width: 40, height: 40 }}
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                <Icon name="FaTimes" className="w-5 h-5 text-red-600" />
              </button>
              <Dialog.Title className="text-lg font-bold mb-4">
                Edit Contact
              </Dialog.Title>
              {editContact && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setEditLoading(true);
                    setEditError("");
                    setEditSuccess("");
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    const updated = Object.fromEntries(formData.entries());
                    try {
                      const { error } = await supabase
                        .from("contacts")
                        .update({
                          first_name: updated.first_name,
                          last_name: updated.last_name,
                          email: updated.email,
                          phone: updated.phone,
                          address_line1: updated.address_line1,
                          address_line2: updated.address_line2,
                          city: updated.city,
                          state: updated.state,
                          postal_code: updated.postal_code,
                          country: updated.country,
                          business_name: updated.business_name,
                          role: updated.role,
                          notes: updated.notes,
                          category: updated.category,
                        })
                        .eq("id", editContact.id);
                      if (error) throw error;
                      setEditSuccess("Contact updated!");
                      setTimeout(() => setShowEditModal(false), 1000);
                    } catch (err: any) {
                      setEditError(err.message || "Failed to update contact");
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        name="first_name"
                        defaultValue={editContact.first_name || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        name="last_name"
                        defaultValue={editContact.last_name || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        name="email"
                        defaultValue={editContact.email || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        name="phone"
                        defaultValue={editContact.phone || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Address Line 1
                      </label>
                      <input
                        name="address_line1"
                        defaultValue={editContact.address_line1 || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Address Line 2
                      </label>
                      <input
                        name="address_line2"
                        defaultValue={editContact.address_line2 || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        name="city"
                        defaultValue={editContact.city || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        name="state"
                        defaultValue={editContact.state || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Postal Code
                      </label>
                      <input
                        name="postal_code"
                        defaultValue={editContact.postal_code || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        name="country"
                        defaultValue={editContact.country || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Business Name
                      </label>
                      <input
                        name="business_name"
                        defaultValue={editContact.business_name || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Role / Position
                      </label>
                      <input
                        name="role"
                        defaultValue={editContact.role || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <input
                        name="notes"
                        defaultValue={editContact.notes || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <input
                        name="category"
                        defaultValue={editContact.category || ""}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  {editError && (
                    <div className="mt-2 text-red-600 text-sm">{editError}</div>
                  )}
                  {editSuccess && (
                    <div className="mt-2 text-green-600 text-sm">
                      {editSuccess}
                    </div>
                  )}
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 font-semibold"
                      disabled={editLoading}
                    >
                      {editLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Dialog>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 text-red-600">
                Delete Contacts
              </h3>
              <p className="mb-4 text-gray-600">
                You are about to delete {selectedContactIds.length} contact
                {selectedContactIds.length !== 1 ? "s" : ""}. This action cannot
                be undone.
              </p>
              <p className="mb-4 text-gray-600">
                Please type DELETE in the box below to continue.
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                placeholder="Type DELETE to confirm"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (deleteConfirmation !== "DELETE") return;
                    await handleBulkDelete();
                    setShowDeleteModal(false);
                    setDeleteConfirmation("");
                  }}
                  disabled={deleteConfirmation !== "DELETE"}
                  className={`px-4 py-2 rounded ${
                    deleteConfirmation === "DELETE"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Prompt Type Select Modal */}
        <BulkPromptTypeSelectModal
          open={showBulkTypeModal}
          onClose={() => setShowBulkTypeModal(false)}
          onSelectType={handleBulkPromptTypeSelect}
          selectedCount={selectedContactIds.length}
        />
      </div>
    </PageCard>
  );
}
