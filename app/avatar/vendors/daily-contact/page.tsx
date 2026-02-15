"use client";
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import api, { apiFetch, API_BASE_URL } from "@/lib/api";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, UserPlus, Trash2, ArrowRight } from "lucide-react";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), {
  ssr: false,
});

const MovedToVendorRenderer = ({ value }: { value?: boolean }) => {
  const status = value ? "Yes" : "No";
  const colorMap: Record<string, string> = {
    yes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    no: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  const badgeClass =
    colorMap[status.toLowerCase()] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";
  return <Badge className={badgeClass}>{status}</Badge>;
};

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";

  // For date-only strings (YYYY-MM-DD), parse without timezone conversion
  // to avoid dates shifting due to UTC offset
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // For datetime strings, use normal parsing
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const EmailRenderer = ({ value }: { value?: string }) => {
  if (!value) return null;
  return (
    <a
      href={`mailto:${value}`}
      className="text-blue-600 hover:underline dark:text-blue-400"
    >
      {value}
    </a>
  );
};

const PhoneRenderer = ({ value }: { value?: string }) => {
  if (!value) return null;
  return (
    <a
      href={`tel:${value}`}
      className="text-blue-600 hover:underline dark:text-blue-400"
    >
      {value}
    </a>
  );
};

export default function VendorContactsGrid() {
  const gridRef = useRef<any>(null);
  const selectedRowsRef = useRef<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const showLoader = useMinimumLoadingTime(loading);
  const [deleting, setDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  //  SIMPLIFIED: Single fetch function
  const fetchContacts = useCallback(async () => {
    setLoading(true);

    try {
      // Try using the apiFetch utility first
      if (typeof apiFetch === "function") {
        const data = await apiFetch("/vendor_contact_extracts");

        // Normalize response
        const contactsList = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.results)
              ? data.results
              : [];

        setContacts(contactsList);
        return;
      }

      // Fallback to api.get if available
      if (api?.get) {
        const response = await api.get("/vendor_contact_extracts");

        const contactsList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

        setContacts(contactsList);
        return;
      }

      // If no API utilities available, show error
      toast.error("API client not configured properly");
    } catch (err: any) {
      console.error("[fetchContacts] Error:", err);

      // Handle authentication errors
      if (err?.response?.status === 401 || err?.status === 401) {
        toast.error("Session expired. Please log in again.");
        // Optional: Redirect to login
        // window.location.href = '/login';
      } else {
        toast.error(err?.message || "Failed to load contacts");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Stable filtered data with useMemo (no state updates to prevent re-renders)
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) {
      return contacts;
    }
    const term = searchTerm.toLowerCase();
    return contacts.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(term) ||
        c.source_email?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.linkedin_id?.toLowerCase().includes(term) ||
        c.linkedin_internal_id?.toLowerCase().includes(term) ||
        c.company_name?.toLowerCase().includes(term) ||
        c.location?.toLowerCase().includes(term) ||
        c.notes?.toLowerCase().includes(term) ||
        c.job_source?.toLowerCase().includes(term) ||
        c.extraction_date?.toLowerCase().includes(term) ||
        c.last_modified_datetime?.toLowerCase().includes(term) ||
        c.created_at?.toLowerCase().includes(term)
    );
  }, [searchTerm, contacts]);

  //  SIMPLIFIED: Update handler
  const handleRowUpdated = useCallback(async (updatedData: any) => {
    try {
      // Clean up the data: remove empty strings and undefined values
      const cleanedData = { ...updatedData };
      Object.keys(cleanedData).forEach(key => {
        const val = cleanedData[key];
        if (val === "" || val === undefined || (typeof val === "string" && val.trim() === "")) {
          delete cleanedData[key];
        }
      });

      await apiFetch(`/vendor_contact/${updatedData.id}`, {
        method: "PUT",
        body: cleanedData,
      });
      toast.success("Contact updated successfully");
      fetchContacts();
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error(err?.message || "Failed to update contact");
    }
  }, [fetchContacts]);

  const handleRowAdded = async (newContact: any) => {
    try {
      // Clean up the data: remove empty strings and undefined values that cause backend validation errors
      const cleanedContact = { ...newContact };
      Object.keys(cleanedContact).forEach(key => {
        const val = cleanedContact[key];
        if (val === "" || val === undefined || (typeof val === "string" && val.trim() === "")) {
          delete cleanedContact[key];
        }
      });

      // Send POST request to create new vendor contact extract
      const response = await apiFetch("/vendor_contact", {
        method: "POST",
        body: cleanedContact,
      });

      // Refresh the contacts list
      fetchContacts();

      toast.success("Vendor contact created successfully");
    } catch (err: any) {
      console.error("FAILED TO CREATE VENDOR CONTACT:", err);
      toast.error(err?.message || "Failed to create vendor contact");
    }
  };

  // Helper: Get only visible selected rows (after AG Grid column filters)
  const getVisibleSelectedRows = useCallback(() => {
    const currentSelectedRows = selectedRowsRef.current;
    if (!currentSelectedRows || currentSelectedRows.length === 0) return [];
    if (!gridRef.current?.api) return currentSelectedRows;

    // Get IDs of visible rows after AG Grid filters
    const visibleRowIds = new Set();
    gridRef.current.api.forEachNodeAfterFilter((node: any) => {
      if (node.data?.id) visibleRowIds.add(node.data.id);
    });

    // Return only selected rows that are visible
    return currentSelectedRows.filter((row: any) => visibleRowIds.has(row.id));
  }, []);

  // FIXED: Properly defined handleRowDeleted function that works for single and multiple
  const handleRowDeleted = useCallback(async (contactId: number | string) => {
    // Get only visible selected rows (respects AG Grid column filters)
    const visibleSelectedRows = getVisibleSelectedRows();
    const deleteCount = visibleSelectedRows.length > 1 ? visibleSelectedRows.length : 1;

    // Show confirmation with exact count
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Delete',
      message: `Delete ${deleteCount} contact${deleteCount > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        if (visibleSelectedRows.length > 1) {
          // Bulk delete - only visible rows
          try {
            const contactIds = visibleSelectedRows.map((row: any) => row.id);
            const queryString = contactIds.map(id => `contact_ids=${id}`).join('&');

            const result = await apiFetch(`/vendor_contact/bulk?${queryString}`, {
              method: "DELETE",
            });

            toast.success(`Deleted ${visibleSelectedRows.length} contacts`);
            setSelectedRows([]);
            fetchContacts();
          } catch (err: any) {
            console.error("Bulk delete error:", err);
            toast.error(err?.message || "Failed to delete contacts");
          }
        } else {
          // Single delete
          try {
            await apiFetch(`/vendor_contact/${contactId}`, {
              method: "DELETE",
            });
            toast.success("Deleted 1 contact");
            fetchContacts();
          } catch (err: any) {
            console.error("Delete error:", err);
            toast.error(err?.message || "Failed to delete contact");
          }
        }
      },
    });
  }, [fetchContacts, getVisibleSelectedRows]);


  // Move selected contacts to vendor
  const handleMoveToVendor = useCallback(async () => {
    // Get only visible selected rows (respects AG Grid column filters)
    const visibleSelectedRows = getVisibleSelectedRows();

    if (!visibleSelectedRows.length) {
      toast.info("Please select contacts to move to vendor");
      return;
    }

    // IMPORTANT: Only move contacts that are NOT already moved
    const unmovedContacts = visibleSelectedRows.filter(
      (row: any) => !row.moved_to_vendor || row.moved_to_vendor === 0 || row.moved_to_vendor === false
    );

    if (unmovedContacts.length === 0) {
      toast.info("All selected contacts are already moved to vendor");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Move to Vendor',
      message: `Are you sure you want to move ${unmovedContacts.length} selected contact${unmovedContacts.length > 1 ? 's' : ''} to vendor?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setDeleting(true);
        try {
          // Only get IDs from unmoved contacts (filtered selection)
          const contactIds = unmovedContacts.map((row: any) => row.id);

          // Use POST with request body instead of query string to avoid URL length limits
          const result = await apiFetch(`/vendor_contact/move-to-vendor`, {
            method: "POST",
            body: { contact_ids: contactIds }
          });

          toast.success(result?.message || `Successfully moved ${unmovedContacts.length} contact${unmovedContacts.length > 1 ? 's' : ''} to vendor`);
          setSelectedRows([]);
          await fetchContacts();
        } catch (err: any) {
          console.error("Move to vendor error:", err);
          toast.error(err?.message || "Failed to move contacts to vendor");
        } finally {
          setDeleting(false);
        }
      },
    });
  }, [fetchContacts, getVisibleSelectedRows]);

  // Initial fetch
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // --- CUSTOM DATE FILTER CONFIGURATION ---
  // This comparator handles ISO strings (e.g., "2023-10-27T...") correctly against the Date picker
  const dateFilterParams = useMemo(() => ({
    // Enable the native browser date picker for better UX
    browserDatePicker: true,
    // Set InRange as the default option (most common use case)
    defaultOption: 'equals',
    // Disable AND/OR condition to show only one filter at a time
    suppressAndOrCondition: true,
    // Robust comparator for ISO String comparison
    comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
      if (cellValue == null) return -1;

      let cellDate: Date;

      // For date-only strings (YYYY-MM-DD), parse without timezone conversion
      if (/^\d{4}-\d{2}-\d{2}$/.test(cellValue)) {
        const [year, month, day] = cellValue.split('-').map(Number);
        cellDate = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        // For datetime strings, use normal parsing
        cellDate = new Date(cellValue);
      }

      // Check for invalid date
      if (isNaN(cellDate.getTime())) return -1;

      // Create a date object at midnight for the cell value to ignore time components
      // This ensures that "10/27/2023 14:00" matches a filter for "10/27/2023"
      const cellDateOnly = new Date(
        cellDate.getFullYear(),
        cellDate.getMonth(),
        cellDate.getDate()
      );

      // Compare the timestamps
      if (cellDateOnly.getTime() === filterLocalDateAtMidnight.getTime()) {
        return 0;
      }
      if (cellDateOnly < filterLocalDateAtMidnight) {
        return -1;
      }
      return 1;
    },
  }), []);

  // Column definitions
  const columnDefs: ColDef[] = useMemo<ColDef[]>(
    () => [
      { field: "id", headerName: "ID", width: 100, pinned: "left" },
      {
        field: "full_name",
        headerName: "Full Name",
        width: 180,
        editable: true,
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        editable: true,
        cellRenderer: PhoneRenderer,
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
        editable: true,
        cellRenderer: EmailRenderer,
      },
      {
        field: "extraction_date",
        headerName: "Extraction Date",
        width: 140,
        filter: "agDateColumnFilter", // Explicitly set type
        filterParams: dateFilterParams, // Apply custom params
        valueFormatter: (params) => formatDate(params.value),
        editable: true,
      },
      {
        field: "moved_to_vendor",
        headerName: "Moved To Vendor",
        width: 150,
        cellRenderer: MovedToVendorRenderer,
      },
      {
        field: "linkedin_id",
        headerName: "LinkedIn ID",
        width: 180,
        editable: true,
      },
      {
        field: "job_source",
        headerName: "Job Source",
        width: 250,
        editable: true,
      },
      {
        field: "company_name",
        headerName: "Company Name",
        width: 200,
        editable: true,
      },
      {
        field: "source_email",
        headerName: "Source Email",
        width: 200,
        editable: true,
      },
      {
        field: "location",
        headerName: "Location",
        width: 150,
        editable: true,
      },
      {
        field: "linkedin_internal_id",
        headerName: "LinkedIn Internal ID",
        width: 200,
        editable: true,
      },
      {
        field: "created_at",
        headerName: "Created At",
        width: 200,
        filter: "agDateColumnFilter", // Explicitly set type
        filterParams: dateFilterParams, // Apply custom params
        valueFormatter: (params) => formatDateTime(params.value),
      },
      {
        field: "notes",
        headerName: "Notes",
        width: 250,
        editable: true,
      },
      {
        field: "last_modified_datetime",
        headerName: "Last Modified",
        width: 200,
        filter: "agDateColumnFilter", // Explicitly set type
        filterParams: dateFilterParams, // Apply custom params
        valueFormatter: (params) => formatDateTime(params.value),
        editable: true,
      },
    ],
    [dateFilterParams]
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  return (
    <div className="space-y-2">
      <Toaster position="top-center" richColors />

      {/* Header Section */}
      <div className="space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Daily Contact Extracts
            </h1>
          </div>

          {/* Move to Vendor Button */}
          <div>
            <Button
              onClick={handleMoveToVendor}
              disabled={deleting}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Move to Vendor
            </Button>
          </div>
        </div>

        {/* Search Box */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-md">
            <div className="relative mt-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex w-full justify-center">
        <div className="w-full max-w-7xl">
          {showLoader ? (
            <Loader />
          ) : (
            <AGGridTable
              rowData={filteredContacts}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              height="600px"
              title={`Daily Contacts (${filteredContacts.length})`}
              showSearch={false}
              onRowAdded={handleRowAdded}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
              skipDeleteConfirmation={true}
              onFilterChanged={() => {
                setSelectedRows([]);
                selectedRowsRef.current = [];
              }}
              onSelectionChanged={(rows: any[]) => {
                selectedRowsRef.current = rows;
                setSelectedRows(rows);
              }}
            />
          )}
        </div>

        {/* Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {confirmDialog.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDialog.onConfirm}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Proceed
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}