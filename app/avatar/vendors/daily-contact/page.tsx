

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
import { SearchIcon, UserPlus } from "lucide-react";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";

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

function formatDateFromDB(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  //  SIMPLIFIED: Single fetch function
  const fetchContacts = useCallback(async () => {
    setLoading(true);

    try {
      // Try using the apiFetch utility first
      if (typeof apiFetch === "function") {
        console.log("[fetchContacts] Using apiFetch");
        const data = await apiFetch("/vendor_contact_extracts");
        console.log("[fetchContacts] Response:", data);

        // Normalize response
        const contactsList = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : [];

        setContacts(contactsList);
        setFilteredContacts(contactsList);
        return;
      }

      // Fallback to api.get if available
      if (api?.get) {
        console.log("[fetchContacts] Using api.get");
        const response = await api.get("/vendor_contact_extracts");
        console.log("[fetchContacts] Response:", response);

        const contactsList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        setContacts(contactsList);
        setFilteredContacts(contactsList);
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

  // Search filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredContacts(contacts);
      } else {
        const term = searchTerm.toLowerCase();
        setFilteredContacts(
          contacts.filter(
            (c) =>
              c.full_name?.toLowerCase().includes(term) ||
              c.source_email?.toLowerCase().includes(term) ||
              c.email?.toLowerCase().includes(term) ||
              c.phone?.toLowerCase().includes(term) ||
              c.linkedin_id?.toLowerCase().includes(term) ||
              c.internal_linkedin_id?.toLowerCase().includes(term) ||
              c.company_name?.toLowerCase().includes(term) ||
              c.location?.toLowerCase().includes(term)
          )
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, contacts]);

  //  SIMPLIFIED: Update handler
  const handleRowUpdated = useCallback(async (updatedData: any) => {
    try {
      await apiFetch(`/vendor_contact/${updatedData.id}`, {
        method: "PUT",
        body: updatedData,
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
      console.log("CREATING NEW VENDOR CONTACT:", newContact);
      
      // Send POST request to create new vendor contact
      const response = await apiFetch("/vendor_contact", {
        method: "POST",
        body: JSON.stringify(newContact),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("VENDOR CONTACT CREATED:", response);
      
      // Refresh the contacts list
      fetchContacts();
      
      toast.success("Vendor contact created successfully");
    } catch (err: any) {
      console.error("FAILED TO CREATE VENDOR CONTACT:", err);
      toast.error(err?.message || "Failed to create vendor contact");
    }
  };

  // FIXED: Properly defined handleRowDeleted function
  const handleRowDeleted = useCallback(async (contactId: number | string) => {
    try {
      await apiFetch(`/vendor_contact/${contactId}`, {
        method: "DELETE",
      });
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err?.message || "Failed to delete contact");
    }
  }, [fetchContacts]);

  // ✨ SIMPLIFIED: Bulk delete handler
  const handleDeleteMovedContacts = useCallback(async () => {
    const contactsToDelete = contacts.filter((c) => c.moved_to_vendor === true);

    if (!contactsToDelete.length) {
      toast.info("No contacts with 'Yes' in Moved To Vendor to delete");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${contactsToDelete.length} contacts that have been moved to vendor? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      let deleted = 0;
      let failed = 0;

      for (const contact of contactsToDelete) {
        try {
          await apiFetch(`/vendor_contact/${contact.id}`, {
            method: "DELETE",
          });
          deleted++;
        } catch (e: any) {
          console.error(`Failed to delete contact ${contact.id}:`, e);
          failed++;
        }
      }

      if (deleted > 0) {
        toast.success(
          `Successfully deleted ${deleted} contact${deleted > 1 ? "s" : ""}${
            failed ? `, ${failed} failed` : ""
          }`
        );
      }

      if (failed > 0) {
        toast.error(`${failed} contact${failed > 1 ? "s" : ""} failed to delete`);
      }

      await fetchContacts();
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      toast.error(err?.message || "Failed to delete contacts");
    } finally {
      setDeleting(false);
    }
  }, [contacts, fetchContacts]);

  // Initial fetch
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

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
        width: 150,
        filter: "agDateColumnFilter",
        valueFormatter: (params) => formatDateFromDB(params.value),
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
        field: "created_at",
        headerName: "Created At",
        width: 180,
        filter: "agDateColumnFilter",
        valueFormatter: (params) => formatDateFromDB(params.value),
      },
      {
        field: "internal_linkedin_id",
        headerName: "Internal LinkedIn ID",
        width: 200,
        editable: true,
      },
    ],
    []
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
              Vendor Contact Extracts
            </h1>
          </div>

          {/* Optional Bulk Delete Button */}
          {/* <div className="sm:w-auto">
            <Button
              onClick={handleDeleteMovedContacts}
              disabled={deleting}
              className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Moved Contacts"}
            </Button>
          </div> */}
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
          <AGGridTable
            rowData={filteredContacts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            loading={loading}
            height="600px"
            title={`Vendor Contacts (${filteredContacts.length})`}
            showSearch={false}
            onRowAdded={handleRowAdded} 
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>
    </div>
  );
}