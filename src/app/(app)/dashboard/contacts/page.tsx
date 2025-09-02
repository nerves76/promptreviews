"use client";

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/utils/authGuard";
import { createClient, getSessionOrMock } from "@/utils/supabaseClient";
import Icon from "@/components/Icon";
import AppLoader from "@/app/(app)/components/AppLoader";
import PageCard from "@/app/(app)/components/PageCard";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";

import UnifiedPromptTypeSelectModal from "@/app/(app)/components/UnifiedPromptTypeSelectModal";
import ManualContactForm from "@/app/(app)/components/ManualContactForm";
import ContactMergeModal from "@/app/(app)/components/ContactMergeModal";
import CommunicationHistory from "@/app/(app)/components/communication/CommunicationHistory";
import UpcomingReminders from "@/app/(app)/components/communication/UpcomingReminders";
import { checkAccountLimits } from "@/utils/accountLimits";

export default function UploadContactsPage() {
  const supabase = createClient();

  useAuthGuard();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [preview, setPreview] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [showNameChangeDialog, setShowNameChangeDialog] = useState(false);
  const [pendingNameChange, setPendingNameChange] = useState<{firstName: string, lastName: string} | null>(null);
  const [nameChangeAction, setNameChangeAction] = useState<'update-all' | 'contact-only' | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const allSelected =
    contacts.length > 0 && selectedContactIds.length === contacts.length;
  const anySelected = selectedContactIds.length > 0;
  const router = useRouter();
  // Unified prompt creation state
  const [showUnifiedTypeModal, setShowUnifiedTypeModal] = useState(false);
  const [promptModalMode, setPromptModalMode] = useState<'individual' | 'bulk'>('individual');
  const [selectedContactForPrompt, setSelectedContactForPrompt] =
    useState<any>(null);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ created: 0, failed: 0, total: 0 });
  const [showBulkSuccessModal, setShowBulkSuccessModal] = useState(false);
  const [bulkSuccessData, setBulkSuccessData] = useState<{ created: number; promptType: string } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Manual contact form state
  const [showManualContactForm, setShowManualContactForm] = useState(false);

  // Account limits state
  const [canAddContacts, setCanAddContacts] = useState(true);
  const [contactLimitMessage, setContactLimitMessage] = useState("");

  // Reviews state for contact edit modal
  const [contactReviews, setContactReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // Prompt pages state for contact edit modal
  const [contactPromptPages, setContactPromptPages] = useState<any[]>([]);
  const [promptPagesLoading, setPromptPagesLoading] = useState(false);

  // Duplicate merge state
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [findingDuplicates, setFindingDuplicates] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<any>(null);

  // Sorting state
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Tab state for edit modal
  const [activeTab, setActiveTab] = useState<'details' | 'reviews-reminders'>('details');

  // Function to check contact limits
  const checkContactLimits = async () => {
    try {
      const { data: { session } } = await getSessionOrMock(supabase);
      if (session?.user) {
        const limitCheck = await checkAccountLimits(supabase, session.user.id, 'contact');
        setCanAddContacts(limitCheck.allowed);
        if (!limitCheck.allowed) {
          const message = limitCheck.reason || 'Contact creation not allowed for your account plan';
          setContactLimitMessage(message);
        }
              }
    } catch (error) {
      console.error('Error checking contact limits:', error);
    }
  };

  // Function to handle new contact creation
  const handleContactCreated = () => {
    setSuccess("Contact created successfully!");
    setTimeout(() => setSuccess(""), 3000);
    // Re-check limits after adding a contact
    checkContactLimits();
    // Manually trigger contacts refresh without relying on success state
    setCurrentPage(1); // This will trigger the useEffect
  };

  // Update contact helper function
  const updateContact = async (updated: any, updatePromptPages: boolean = false) => {
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    
    try {
      // Update the contact
      const { error: contactError } = await supabase
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
      
      if (contactError) throw contactError;
      
      // If requested, update associated prompt pages
      if (updatePromptPages && contactPromptPages.length > 0) {
        const promptPageIds = contactPromptPages.map(p => p.id);
        const { error: promptError } = await supabase
          .from("prompt_pages")
          .update({
            first_name: updated.first_name,
            last_name: updated.last_name,
          })
          .in("id", promptPageIds);
        
        if (promptError) {
          console.error("Failed to update prompt pages:", promptError);
          setEditError("Contact updated but failed to update prompt pages");
        } else {
          setEditSuccess("Contact and prompt pages updated!");
        }
      } else {
        setEditSuccess("Contact updated!");
      }
      
      // Update local state
      setContacts(prev => prev.map(c => 
        c.id === editContact.id 
          ? { ...c, first_name: updated.first_name, last_name: updated.last_name }
          : c
      ));
      
      setTimeout(() => {
        setShowEditModal(false);
        setShowNameChangeDialog(false);
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || "Failed to update contact");
    } finally {
      setEditLoading(false);
    }
  };

  // Helper function to get platform info
  const getPlatformInfo = (platform: string) => {
    const lower = (platform || "").toLowerCase();
    if (lower.includes("google"))
      return { icon: "FaGoogle" as const, label: "Google Business Profile" };
    if (lower.includes("yelp")) return { icon: "FaYelp" as const, label: "Yelp" };
    if (lower.includes("facebook"))
      return { icon: "FaFacebook" as const, label: "Facebook" };
    if (lower.includes("tripadvisor"))
      return { icon: "FaTripadvisor" as const, label: "TripAdvisor" };
    return { icon: "FaRegStar" as const, label: platform || "Other" };
  };

  // Function to load reviews for a contact
  const loadContactReviews = async (contactId: string) => {
    setReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .from('review_submissions')
        .select('id, platform, star_rating, review_content, verified, created_at, imported_from_google')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setContactReviews(data || []);
    } catch (error) {
      console.error('Error loading contact reviews:', error);
      setContactReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };
  
  // Function to load prompt pages for a contact
  const loadContactPromptPages = async (contactId: string) => {
    setPromptPagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompt_pages')
        .select(`
          id, 
          slug, 
          status, 
          created_at, 
          campaign_type, 
          name,
          first_name,
          last_name,
          type
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setContactPromptPages(data || []);
    } catch (error) {
      console.error('Error loading contact prompt pages:', error);
      setContactPromptPages([]);
    } finally {
      setPromptPagesLoading(false);
    }
  };

  // Using singleton Supabase client from supabaseClient.ts

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await getSessionOrMock(supabase);
      if (error || !session) {
        setError("Please sign in to upload contacts");
      } else {
        // Check contact limits when authenticated
        checkContactLimits();
      }
    };
    checkAuth();
  }, [supabase]);

  useEffect(() => {
    console.log("State updated:", { selectedFile, preview, error, success });
  }, [selectedFile, preview, error, success]);

  // Helper function to render review count
  const renderReviewCount = (contact: any) => {
    // For now, use the review_count field that we'll add to the query
    // This will include all verified reviews from review_submissions table
    const reviewCount = contact.review_count || 0;

    return (
      <span className={`text-sm font-medium ${reviewCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
        {reviewCount}
      </span>
    );
  };

  // Function to refresh contacts data
  const refreshContacts = async () => {
    setContactsLoading(true);
    
    // Get total count
    const { count, error: countError } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true });
    
    if (!countError && count !== null) {
      setTotalCount(count);
    }
    
    // Get paginated data with review counts
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage - 1;
    
    const { data, error } = await supabase
      .from("contacts")
      .select(`
        *
      `)
      .order("created_at", { ascending: false })
      .range(startIndex, endIndex);
      
    // Get review counts for each contact separately
    if (data && data.length > 0) {
      const contactIds = data.map(contact => contact.id);
      const { data: reviewCounts } = await supabase
        .from("review_submissions")
        .select("contact_id")
        .in("contact_id", contactIds)
        .eq("verified", true);
        
      // Count reviews per contact
      const reviewCountMap = (reviewCounts || []).reduce((acc: {[key: string]: number}, review) => {
        acc[review.contact_id] = (acc[review.contact_id] || 0) + 1;
        return acc;
      }, {});
      
      // Add review counts to contacts
      data.forEach(contact => {
        contact.review_count = reviewCountMap[contact.id] || 0;
      });
    }
      
    if (!error && data) {
      setContacts(data);
      // Clear selections when refreshing
      setSelectedContactIds([]);
    }
    setContactsLoading(false);
  };

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
      
      // Get paginated data with review counts
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;
      
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *
        `)
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);
        
      // Get review counts for each contact separately
      if (data && data.length > 0) {
        const contactIds = data.map(contact => contact.id);
        const { data: reviewCounts } = await supabase
          .from("review_submissions")
          .select("contact_id")
          .in("contact_id", contactIds)
          .eq("verified", true);
          
        // Count reviews per contact
        const reviewCountMap = (reviewCounts || []).reduce((acc: {[key: string]: number}, review) => {
          acc[review.contact_id] = (acc[review.contact_id] || 0) + 1;
          return acc;
        }, {});
        
        // Add review counts to contacts
        data.forEach(contact => {
          contact.review_count = reviewCountMap[contact.id] || 0;
        });
      }
        
      if (!error && data) {
        setContacts(data);
        // Clear selections when changing pages
        setSelectedContactIds([]);
      }
      setContactsLoading(false);
    };
    fetchContacts();
  }, [supabase, currentPage]);

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
      // Optional review columns (up to 15 reviews)
      "review_1_content",
      "review_1_platform",
      "review_1_rating",
      "review_1_date",
      "review_1_reviewer_first_name",
      "review_1_reviewer_last_name",
      "review_1_reviewer_role",
      "review_2_content",
      "review_2_platform",
      "review_2_rating",
      "review_2_date",
      "review_2_reviewer_first_name",
      "review_2_reviewer_last_name",
      "review_2_reviewer_role",
      "review_3_content",
      "review_3_platform",
      "review_3_rating",
      "review_3_date",
      "review_3_reviewer_first_name",
      "review_3_reviewer_last_name",
      "review_3_reviewer_role",
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
      // Sample review data
      "Great service and very professional!",
      "Google",
      "5",
      "2024-01-15",
      "John",
      "Doe",
      "Customer",
      "Excellent experience working with this team.",
      "Yelp",
      "5",
      "2024-01-10",
      "John",
      "Doe",
      "Client",
      "Highly recommend their services.",
      "Facebook",
      "5",
      "2024-01-05",
      "John",
      "Doe",
      "Customer",
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
    // Optional review columns (up to 15 reviews)
    "review_1_content",
    "review_1_platform",
    "review_1_rating",
    "review_1_date",
    "review_1_reviewer_first_name",
    "review_1_reviewer_last_name",
    "review_1_reviewer_role",
    "review_2_content",
    "review_2_platform",
    "review_2_rating",
    "review_2_date",
    "review_2_reviewer_first_name",
    "review_2_reviewer_last_name",
    "review_2_reviewer_role",
    "review_3_content",
    "review_3_platform",
    "review_3_rating",
    "review_3_date",
    "review_3_reviewer_first_name",
    "review_3_reviewer_last_name",
    "review_3_reviewer_role",
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



  // Unified handler for both individual and bulk prompt creation
  async function handleUnifiedPromptTypeSelect(promptType: string, includeReviews: boolean) {
    if (promptModalMode === 'individual') {
      // Handle individual creation
      if (!selectedContactForPrompt) return;
      
      // Pass contact info as query params for prefill
      const params = new URLSearchParams({
        type: promptType,
        first_name: selectedContactForPrompt.first_name || "",
        last_name: selectedContactForPrompt.last_name || "",
        email: selectedContactForPrompt.email || "",
        phone: selectedContactForPrompt.phone || "",
        business_name: selectedContactForPrompt.business_name || "",
        role: selectedContactForPrompt.role || "",
        contact_id: selectedContactForPrompt.id || "",
        campaign_type: "individual", // Always force individual campaign type for contacts
        include_reviews: includeReviews.toString(), // Add include reviews parameter
      });
      router.push(`/create-prompt-page?${params.toString()}`);
      return;
    }

    // Handle bulk creation  
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
          promptType: promptType,
          includeReviews: includeReviews
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

      // Show success modal
      if (result.created > 0) {
        setBulkSuccessData({ created: result.created, promptType: promptType });
        setShowBulkSuccessModal(true);
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

  // Find duplicates function
  const handleFindDuplicates = async () => {
    setFindingDuplicates(true);
    setError('');
    
    try {
      const response = await fetch('/api/contacts/find-duplicates', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to find duplicates');
      }

      setDuplicateGroups(data.duplicateGroups || []);
      
      if (data.duplicateGroups.length === 0) {
        setSuccess('No duplicate contacts found!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Find duplicates error:', error);
      setError(error instanceof Error ? error.message : 'Failed to find duplicates');
    } finally {
      setFindingDuplicates(false);
    }
  };

  // Handle merge contacts
  const handleMergeContacts = async (primaryContactId: string, fieldsToKeep: Record<string, any>) => {
    if (!selectedDuplicateGroup) return;
    
    try {
      const contactIds = selectedDuplicateGroup.contacts.map((c: any) => c.id);
      
      const response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          primaryContactId,
          fieldsToKeep,
          contactIdsToMerge: contactIds
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to merge contacts');
      }

      setSuccess(`Successfully merged ${result.deletedContacts + 1} contacts with ${result.transferredReviews} reviews and ${result.transferredPromptPages} prompt pages!`);
      setTimeout(() => setSuccess(''), 5000);
      
      // Refresh contacts list immediately
      await refreshContacts();
      
      // Remove the merged group from duplicates list
      setDuplicateGroups(prev => prev.filter(group => 
        group.contacts[0].id !== selectedDuplicateGroup.contacts[0].id
      ));
      
    } catch (error) {
      console.error('Merge error:', error);
      setError(error instanceof Error ? error.message : 'Failed to merge contacts');
    }
  };

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sortable value for a contact
  const getSortValue = (contact: any, field: string): string => {
    switch (field) {
      case 'name':
        if (contact.imported_from_google && contact.first_name === "Google User" && contact.google_reviewer_name) {
          return contact.google_reviewer_name.toLowerCase();
        }
        return `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase().trim();
      case 'first_name':
        return (contact.first_name || '').toLowerCase();
      case 'last_name':
        return (contact.last_name || '').toLowerCase();
      case 'email':
        return (contact.email || '').toLowerCase();
      case 'company':
        return (contact.business_name || '').toLowerCase();
      case 'category':
        return (contact.category || '').toLowerCase();
      case 'google_name':
        return (contact.google_reviewer_name || '').toLowerCase();
      default:
        return '';
    }
  };

  // Sort contacts
  const sortedContacts = [...contacts].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = getSortValue(a, sortField);
    const bValue = getSortValue(b, sortField);
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Sortable header component
  const SortableHeader = ({ field, children }: { field: string, children: React.ReactNode }) => (
    <th 
      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <Icon 
            name={sortDirection === 'asc' ? "FaChevronUp" : "FaChevronDown"} 
            className="w-3 h-3 text-gray-400" 
          />
        )}
      </div>
    </th>
  );

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
    <PageCard icon={<Icon name="FaUsers" className="w-8 h-8 text-slate-blue" size={32} />}>
      <div className="w-full mx-auto relative" style={{ maxWidth: 1000 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
                            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">Contacts</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFindDuplicates}
              disabled={findingDuplicates || contacts.length < 2}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                !findingDuplicates && contacts.length >= 2
                  ? 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
                  : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Icon name="FaSearch" className="w-4 h-4" />
              {findingDuplicates ? 'Finding...' : 'Find dupes'}
            </button>
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
              className="px-3 py-1.5 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 text-sm flex items-center gap-2"
            >
              <Icon name="MdDownload" className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => canAddContacts ? setShowManualContactForm(true) : router.push('/dashboard/plan')}
              disabled={!canAddContacts}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                canAddContacts
                  ? 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                  : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Icon name="FaPlus" className="w-4 h-4" />
              Add contact
            </button>
            <button
              onClick={() => canAddContacts ? setShowUploadModal(true) : router.push('/dashboard/plan')}
              disabled={!canAddContacts}
              className={`px-3 py-1.5 rounded-lg text-sm shadow flex items-center gap-2 ${
                canAddContacts
                  ? 'bg-slate-blue text-white hover:bg-slate-blue/90'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              <Icon name="FaUpload" className="w-4 h-4" />
              Upload contacts
            </button>
          </div>
        </div>

        {/* Contact Limits Message */}
        {!canAddContacts && contactLimitMessage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              {contactLimitMessage}
              <button 
                onClick={() => router.push('/dashboard/plan')}
                className="ml-2 text-yellow-900 underline hover:no-underline"
              >
                Upgrade your plan
              </button>
              {' '}to add contacts.
            </p>
          </div>
        )}

        {/* Duplicate Contacts Section */}
        {duplicateGroups.length > 0 && (
          <div className="mb-8 bg-orange-50 p-6 rounded-lg border border-orange-200">
            <h2 className="text-2xl font-bold text-orange-600 mb-4 flex items-center gap-2">
              <Icon name="FaExclamationTriangle" className="w-6 h-6" />
              Potential Duplicates Found ({duplicateGroups.length})
            </h2>
            <p className="text-orange-700 mb-4 text-sm">
              Review these potential duplicate contacts and merge them to clean up your contact list.
            </p>
            <div className="space-y-4">
              {duplicateGroups.map((group, index) => {
                const getReasonDisplay = () => {
                  switch (group.reason) {
                    case 'exact_email':
                      return { label: 'Same email address', color: 'bg-red-100 text-red-700 border-red-200', icon: 'FaEnvelope' };
                    case 'exact_phone':
                      return { label: 'Same phone number', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'FaPhone' };
                    case 'similar_name':
                      return { label: `Similar names (${Math.round(group.score * 100)}% match)`, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'FaUser' };
                    default:
                      return { label: 'Similar contacts', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: 'FaUser' };
                  }
                };

                const reasonDisplay = getReasonDisplay();
                const getDisplayName = (contact: any) => {
                  if (contact.imported_from_google && contact.first_name === "Google User" && contact.google_reviewer_name) {
                    return contact.google_reviewer_name;
                  }
                  return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact';
                };

                return (
                  <div key={index} className="bg-white border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${reasonDisplay.color}`}>
                          <Icon name={reasonDisplay.icon as any} className="w-3 h-3 inline mr-1" />
                          {reasonDisplay.label}
                        </span>
                        <span className="text-sm text-gray-600">
                          {group.contacts.length} contacts
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          console.log('Merge button clicked for group:', group);
                          setSelectedDuplicateGroup(group);
                          setShowMergeModal(true);
                        }}
                        className="px-4 py-2 text-sm rounded-lg font-semibold shadow-lg"
                        style={{
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                          border: '2px solid #3730A3',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4338CA';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#4F46E5';
                        }}
                      >
                        Review & Merge
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.contacts.map((contact: any) => (
                        <div key={contact.id} className="bg-gray-50 rounded p-3 text-sm">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {getDisplayName(contact)}
                            {contact.imported_from_google && (
                              <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                                G
                              </span>
                            )}
                          </div>
                          {contact.email && (
                            <div className="text-gray-600 flex items-center gap-1 mt-1">
                              <Icon name="FaEnvelope" className="w-3 h-3" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="text-gray-600 flex items-center gap-1 mt-1">
                              <Icon name="FaPhone" className="w-3 h-3" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                Delete selected ({selectedContactIds.length})
              </button>
              <button
                className="px-4 py-2 bg-slate-blue text-white rounded hover:bg-slate-blue/90 font-semibold shadow flex items-center gap-2"
                onClick={() => {
                  setPromptModalMode('bulk');
                  setShowUnifiedTypeModal(true);
                }}
                disabled={bulkCreating}
              >
                <Icon name="FaHandshake" className="w-4 h-4" size={16} />
                {bulkCreating ? 'Creating...' : `Bulk create Prompt Pages (${selectedContactIds.length})`}
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
                <table className="min-w-full divide-y divide-gray-200 table-auto">
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
                      <SortableHeader field="first_name">First Name</SortableHeader>
                      <SortableHeader field="last_name">Last Name</SortableHeader>
                      <SortableHeader field="email">Email</SortableHeader>
                      <SortableHeader field="company">Company</SortableHeader>
                      <SortableHeader field="category">Category</SortableHeader>
                      <SortableHeader field="google_name">Google Name</SortableHeader>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reviews
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => handleSelectOne(contact.id)}
                          aria-label={`Select contact ${contact.google_reviewer_name || `${contact.first_name} ${contact.last_name}`}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {contact.imported_from_google && contact.first_name === "Google User" 
                            ? contact.google_reviewer_name?.split(' ')[0] || ""
                            : contact.first_name || ""}
                          {contact.imported_from_google && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                              G
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.imported_from_google && contact.first_name === "Google User" 
                          ? contact.google_reviewer_name?.split(' ').slice(1).join(' ') || ""
                          : contact.last_name || ""}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.email}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.business_name || ""}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.category || ""}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {contact.google_reviewer_name && contact.imported_from_google ? contact.google_reviewer_name : ""}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {renderReviewCount(contact)}
                      </td>
                      <td className="px-3 py-2 text-sm whitespace-nowrap">
                        <button
                          className="text-slate-blue underline hover:text-slate-800 text-xs mr-4 bg-transparent border-none p-0 shadow-none"
                          style={{ background: "none", border: "none" }}
                          onClick={() => {
                            setEditContact(contact);
                            setShowEditModal(true);
                            setEditError("");
                            setEditSuccess("");
                            setActiveTab('details'); // Reset to details tab when opening
                            loadContactReviews(contact.id);
                            loadContactPromptPages(contact.id);
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
                              
                              // IMPORTANT: Don't use .single() as accounts can have multiple businesses
                              const { data: businessesData } = await supabase
                                .from("businesses")
                                .select("name")
                                .eq("account_id", user.id)
                                .order('created_at', { ascending: true }); // Get oldest business first
                              
                              const businessData = businessesData && businessesData.length > 0 ? businessesData[0] : null;
                              
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
                              setPromptModalMode('individual');
                              setShowUnifiedTypeModal(true);
                            } catch (error) {
                              console.error('Error checking business profile:', error);
                              alert('There was an error checking your business profile. Please try again.');
                            }
                          }}
                        >
                          + Prompt Page
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

        {/* Unified Prompt Type Select Modal */}
        <UnifiedPromptTypeSelectModal
          open={showUnifiedTypeModal}
          onClose={() => setShowUnifiedTypeModal(false)}
          onSelectType={handleUnifiedPromptTypeSelect}
          selectedCount={promptModalMode === 'bulk' ? selectedContactIds.length : 1}
          mode={promptModalMode}
          contactName={promptModalMode === 'individual' ? 
            (selectedContactForPrompt?.google_reviewer_name || 
             `${selectedContactForPrompt?.first_name || ''} ${selectedContactForPrompt?.last_name || ''}`.trim()) 
            : undefined}
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
                    <Icon name="MdDownload" className="text-slate-blue" />
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
                    <div className="flex items-center justify-between">
                      <span>{success}</span>
                      {success.includes('Prompt Page') && (
                        <button
                          onClick={() => router.push('/dashboard')}
                          className="ml-4 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-semibold transition-colors"
                        >
                          Click here to see them, edit and share
                        </button>
                      )}
                    </div>
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
                      Upload contacts
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
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto p-8 z-10">
              {/* Close button */}
              <button
                className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none"
                style={{ zIndex: 20, width: 40, height: 40 }}
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                <Icon name="FaTimes" className="w-5 h-5 text-red-600" />
              </button>
              <Dialog.Title className="text-lg font-bold mb-2">
                Edit contact
              </Dialog.Title>
              
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="FaUser" className="w-4 h-4" />
                      Contact Details
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reviews-reminders')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews-reminders'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="FaStar" className="w-4 h-4" />
                      Reviews & Reminders
                    </div>
                  </button>
                </nav>
              </div>
              
              {editContact && activeTab === 'details' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    const updated = Object.fromEntries(formData.entries());
                    
                    // Check if name has changed
                    const nameChanged = 
                      updated.first_name !== editContact.first_name || 
                      updated.last_name !== editContact.last_name;
                    
                    // Check if there are associated prompt pages
                    const hasPromptPages = contactPromptPages.length > 0;
                    
                    if (nameChanged && hasPromptPages) {
                      // Show confirmation dialog for name change
                      setPendingNameChange({
                        firstName: updated.first_name as string,
                        lastName: updated.last_name as string
                      });
                      setShowNameChangeDialog(true);
                      return;
                    }
                    
                    // No name change or no prompt pages, proceed with normal update
                    await updateContact(updated);
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        name="first_name"
                        defaultValue={
                          editContact.imported_from_google && editContact.first_name === "Google User" && editContact.google_reviewer_name
                            ? editContact.google_reviewer_name
                            : editContact.first_name || ""
                        }
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
              
              {/* Reviews & Reminders Tab Content */}
              {editContact && activeTab === 'reviews-reminders' && (
                <div className="space-y-6">
                  {/* Reviews Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Icon name="FaComments" className="w-4 h-4" />
                      Reviews ({contactReviews.length})
                    </h3>
                    
                    {reviewsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading reviews...</span>
                      </div>
                    ) : contactReviews.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <Icon name="FaComments" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No reviews associated with this contact
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {contactReviews.map((review) => {
                          const platformInfo = getPlatformInfo(review.platform);
                          return (
                            <div key={review.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon 
                                    name={platformInfo.icon} 
                                    className="w-4 h-4 text-gray-600" 
                                  />
                                  <span className="text-xs font-medium text-gray-700">
                                    {platformInfo.label}
                                  </span>
                                  {review.star_rating && (
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Icon
                                          key={i}
                                          name="FaStar"
                                          className={`w-3 h-3 ${
                                            i < review.star_rating
                                              ? 'text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {review.verified ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                      <Icon name="FaCheckCircle" className="w-3 h-3" />
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                      <Icon name="FaClock" className="w-3 h-3" />
                                      Unverified
                                    </span>
                                  )}
                                  {review.imported_from_google && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                      <Icon name="FaGoogle" className="w-3 h-3" />
                                      Imported
                                    </span>
                                  )}
                                </div>
                              </div>
                              {review.review_content && (
                                <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                                  {review.review_content}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>
                                  Submitted: {new Date(review.created_at).toLocaleDateString()}
                                </span>
                                <button 
                                  type="button"
                                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                                  onClick={() => {
                                    // Navigate to reviews page with this review highlighted
                                    router.push(`/dashboard/reviews?highlight=${review.id}`);
                                  }}
                                >
                                  View in Reviews →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>
                  
                  {/* Prompt Pages Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Icon name="FaLink" className="w-4 h-4" />
                      Prompt Pages ({contactPromptPages.length})
                    </h3>
                    
                    {promptPagesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading prompt pages...</span>
                      </div>
                    ) : contactPromptPages.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <Icon name="FaLink" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No prompt pages created for this contact
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {contactPromptPages.map((page) => {
                          const statusColors = {
                            draft: 'bg-gray-100 text-gray-700',
                            in_queue: 'bg-blue-100 text-blue-700',
                            in_progress: 'bg-yellow-100 text-yellow-700',
                            complete: 'bg-green-100 text-green-700'
                          };
                          
                          const campaignTypeLabels: Record<string, string> = {
                            service: 'Service',
                            product: 'Product',
                            event: 'Event',
                            photo: 'Photo',
                            video: 'Video',
                            employee: 'Employee',
                            individual: 'Individual'
                          };
                          
                          // Get the prompt page type label
                          const promptTypeLabel = page.type || campaignTypeLabels[page.campaign_type] || page.campaign_type || 'Standard';
                          const displayType = typeof promptTypeLabel === 'string' 
                            ? promptTypeLabel.charAt(0).toUpperCase() + promptTypeLabel.slice(1).replace('_', ' ')
                            : 'Standard';
                          
                          return (
                            <div key={page.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                      {page.first_name || page.last_name ? (
                                        <>{page.first_name} {page.last_name} - {displayType} Page</>
                                      ) : (
                                        page.name || `${displayType} Page`
                                      )}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[page.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
                                      {page.status?.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1 font-medium text-gray-600">
                                      <Icon name="FaTags" className="w-3 h-3" />
                                      Type: {displayType}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Icon name="FaCalendarAlt" className="w-3 h-3" />
                                      {new Date(page.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <button
                                    type="button"
                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                                    onClick={() => {
                                      window.open(`${window.location.origin}/r/${page.slug}`, '_blank');
                                    }}
                                  >
                                    <Icon name="FaArrowRight" className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                                    onClick={() => {
                                      router.push(`/dashboard/edit-prompt-page/${page.slug}`);
                                    }}
                                  >
                                    Edit →
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>
                  
                  {/* Communication Reminders and History */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Reminders */}
                    <div>
                      <UpcomingReminders 
                        contactId={editContact.id}
                        className="mb-6"
                      />
                    </div>
                    
                    {/* Communication History */}
                    <div>
                      <CommunicationHistory 
                        contactId={editContact.id}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 text-red-600">
                Delete contacts
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

        {/* Name Change Confirmation Dialog */}
        {showNameChangeDialog && pendingNameChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Name Change Detected
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You're changing the contact name from <strong>{editContact.first_name} {editContact.last_name}</strong> to <strong>{pendingNameChange.firstName} {pendingNameChange.lastName}</strong>.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Icon name="FaExclamationTriangle" className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">This contact has {contactPromptPages.length} associated prompt page{contactPromptPages.length > 1 ? 's' : ''}.</p>
                      <p className="mb-2">To maintain data consistency, prompt pages must be updated along with the contact.</p>
                      <p className="font-medium">Is this a correction to the existing person's name?</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    setNameChangeAction('update-all');
                    const updated = {
                      first_name: pendingNameChange.firstName,
                      last_name: pendingNameChange.lastName,
                      email: (document.querySelector('input[name="email"]') as HTMLInputElement)?.value,
                      phone: (document.querySelector('input[name="phone"]') as HTMLInputElement)?.value,
                      address_line1: (document.querySelector('input[name="address_line1"]') as HTMLInputElement)?.value,
                      address_line2: (document.querySelector('input[name="address_line2"]') as HTMLInputElement)?.value,
                      city: (document.querySelector('input[name="city"]') as HTMLInputElement)?.value,
                      state: (document.querySelector('input[name="state"]') as HTMLInputElement)?.value,
                      postal_code: (document.querySelector('input[name="postal_code"]') as HTMLInputElement)?.value,
                      country: (document.querySelector('input[name="country"]') as HTMLInputElement)?.value,
                      business_name: (document.querySelector('input[name="business_name"]') as HTMLInputElement)?.value,
                      role: (document.querySelector('input[name="role"]') as HTMLInputElement)?.value,
                      notes: (document.querySelector('textarea[name="notes"]') as HTMLTextAreaElement)?.value,
                      category: (document.querySelector('input[name="category"]') as HTMLInputElement)?.value,
                    };
                    await updateContact(updated, true);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon name="FaCheck" className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Yes, Update Everything</div>
                      <div className="text-sm opacity-90">This is a correction - update contact and all prompt pages</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setShowNameChangeDialog(false);
                    setPendingNameChange(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon name="FaTimes" className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">No, Cancel Changes</div>
                      <div className="text-sm opacity-90">Keep the original name</div>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800">
                  <strong>Important:</strong> If you're trying to repurpose this contact for a different person, you should instead:
                  <br />1. Create a new contact for the new person
                  <br />2. Delete or archive this contact and its prompt pages
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Prompt Type Select Modal */}
        <ManualContactForm
          isOpen={showManualContactForm}
          onClose={() => setShowManualContactForm(false)}
          onContactCreated={handleContactCreated}
        />


        {/* Bulk Success Modal */}
        {showBulkSuccessModal && bulkSuccessData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                {/* Success Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon name="FaCheck" className="w-8 h-8 text-green-600" />
                </div>
                
                {/* Success Message */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Success!
                </h3>
                <p className="text-gray-600 mb-6">
                  {bulkSuccessData.created} Prompt Page{bulkSuccessData.created > 1 ? 's' : ''} created successfully.
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowBulkSuccessModal(false);
                      router.push('/prompt-pages?tab=individual');
                    }}
                    className="px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-semibold transition-colors"
                  >
                    View, Edit & Share Pages
                  </button>
                  
                  <button
                    onClick={() => setShowBulkSuccessModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Continue Managing Contacts
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Merge Modal */}
        <ContactMergeModal
          open={showMergeModal}
          onClose={() => {
            setShowMergeModal(false);
            setSelectedDuplicateGroup(null);
          }}
          contacts={selectedDuplicateGroup?.contacts || []}
          onMerge={handleMergeContacts}
          reason={selectedDuplicateGroup?.reason || 'similar_name'}
          score={selectedDuplicateGroup?.score || 0}
        />
      </div>
    </PageCard>
  );
}
