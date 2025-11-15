"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";
import { ColDef } from "ag-grid-community";
import { SearchIcon } from "lucide-react";

import { apiFetch } from "@/lib/api";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Button } from "@/components/admin_ui/button";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), { 
  ssr: false 
});

// -----------------------------
// Types
// -----------------------------
interface VendorContact {
  id: number;
  full_name?: string;
  phone?: string;
  email?: string;
  extraction_date?: string;
  moved_to_vendor?: boolean;
  linkedin_id?: string;
  company_name?: string;
  source_email?: string;
  location?: string;
  created_at?: string;
  internal_linkedin_id?: string;
}

// -----------------------------
// Cell Renderers
// -----------------------------
const MovedToVendorRenderer = ({ value }: { value?: boolean }) => (
  <Badge className={value ?"bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"}>
    {value ? "Yes" : "No"}
  </Badge>
);

const EmailRenderer = ({ value }: { value?: string }) =>
  value ? (
    <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
      {value}
    </a>
  ) : null;

const PhoneRenderer = ({ value }: { value?: string }) =>
  value ? (
    <a href={`tel:${value}`} className="text-blue-600 hover:underline">
      {value}
    </a>
  ) : null;

// -----------------------------
// Utility Functions
// -----------------------------
const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  return dateString.slice(0, 10);
};

// Convert string to boolean for moved_to_vendor field
const parseMovedToVendor = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
  }
  if (typeof value === 'number') return value === 1;
  return false;
};

// -----------------------------
// Main Component
// -----------------------------
export default function VendorContactsGrid() {
  const [contacts, setContacts] = useState<VendorContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<VendorContact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Fetch Contacts
  // -----------------------------
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/vendor_contact_extracts/");
      const contactsList = Array.isArray(data) ? data : data?.data ?? [];
      
      // Ensure moved_to_vendor is boolean
      const processedContacts = contactsList.map(contact => ({
        ...contact,
        moved_to_vendor: parseMovedToVendor(contact.moved_to_vendor)
      }));
      
      setContacts(processedContacts);
      setFilteredContacts(processedContacts);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // -----------------------------
  // Search Filter
  // -----------------------------
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = contacts.filter((contact) =>
      Object.values(contact).some((value) =>
        typeof value === "string" 
          ? value.toLowerCase().includes(term) 
          : false
      )
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  // -----------------------------
  // Update Contact - FIXED VERSION
  // -----------------------------
  const handleRowUpdated = async (updatedData: any) => {
    try {
      // Process the data before sending to API
      const processedData = { ...updatedData };
      
      // Convert moved_to_vendor to proper boolean
      if (processedData.moved_to_vendor !== undefined) {
        processedData.moved_to_vendor = parseMovedToVendor(processedData.moved_to_vendor);
      }

      await apiFetch(`/api/vendor_contact_extracts/${processedData.id}`, {
        method: "PUT",
        body: processedData,
      });
      toast.success("Contact updated successfully");
      
      await fetchContacts();
    } catch (error) {
      console.error("Failed to update contact:", error);
      toast.error("Failed to update contact");

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
  };

  // -----------------------------
  // Move All Contacts to Vendor
  // -----------------------------
  const handleMoveAll = async () => {
    if (contacts.length === 0) {
      toast.warning("No contacts to move");
      return;
    }

    try {
      setLoading(true);

      const response = await apiFetch(
        "/api/vendor_contact_extracts/bulk/move-all",
        { method: "PUT" }
      );

      const count = response?.updated_count ?? 0;
      
      if (count === 0) {
        toast.info("All contacts are already marked as moved to vendor");
      } else {
        toast.success(
          `Successfully moved ${count} contact${count !== 1 ? 's' : ''} to vendor`
        );
      }
      
      await fetchContacts();
    } catch (error) {
      console.error("Failed to move contacts:", error);
      toast.error("Failed to move contacts to vendor");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Column Definitions - FIXED VERSION
  // -----------------------------
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        pinned: "left",
        filter: "agNumberColumnFilter",
      },
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
        width: 220,
        editable: true,
        cellRenderer: EmailRenderer,
      },
      {
        field: "company_name",
        headerName: "Company",
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
        field: "moved_to_vendor",
        headerName: "Moved to Vendor",
        width: 150,
        cellRenderer: MovedToVendorRenderer,
        filter: "agSetColumnFilter",
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['Yes', 'No'],
        },
        valueFormatter: (params) => params.value ? 'Yes' : 'No',
        valueParser: (params) => {
          // Convert string back to boolean when editing
          return params.newValue === 'Yes';
        },
        valueGetter: (params) => {
          // Ensure we always return boolean for display
          return parseMovedToVendor(params.data.moved_to_vendor);
        },
        valueSetter: (params) => {
          // Set the boolean value properly
          params.data.moved_to_vendor = parseMovedToVendor(params.newValue);
          return true;
        }
      },
      {
        field: "linkedin_id",
        headerName: "LinkedIn ID",
        width: 180,
        editable: true,
      },
      {
        field: "internal_linkedin_id",
        headerName: "Internal LinkedIn ID",
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
        field: "extraction_date",
        headerName: "Extraction Date",
        width: 140,
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        field: "created_at",
        headerName: "Created At",
        width: 140,
        valueFormatter: (params) => formatDate(params.value),
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
      editable: true,
    }),
    []
  );

  return (
    <div className="space-y-4 p-4">
      <Toaster position="top-center" richColors />

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Vendor Contact Extracts
        </h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
          onClick={handleMoveAll}
          disabled={loading || contacts.length === 0}
        >
          {loading ? "Moving..." : "Move All to Vendor"}
        </Button>
      </div>


      {/* Search Bar */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search contacts..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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

      {/* Data Grid */}
      <AGGridTable
        rowData={filteredContacts}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        loading={loading}
        height="calc(100vh - 250px)"
        title={`Total: ${filteredContacts.length} contact${filteredContacts.length !== 1 ? 's' : ''}`}
        onRowUpdated={handleRowUpdated}
        showSearch={false}
      />
    </div>
  );
}