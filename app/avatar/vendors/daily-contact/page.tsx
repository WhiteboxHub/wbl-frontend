"use client";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";
import axios from "axios";


const AGGridTable = dynamic(() => import("@/components/AGGridTable"), { ssr: false });

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

const DateFormatter = ({ value }: { value?: string | Date | null }) =>
  value ? new Date(value).toLocaleDateString() : "-";

const EmailRenderer = ({ value }: { value?: string }) => {
  if (!value) return null;
  return (
    <a
      href={`mailto:${value}`}
      className="text-blue-600 dark:text-blue-400 hover:underline"
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
      className="text-blue-600 dark:text-blue-400 hover:underline"
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
  const [isLoading, setIsLoading] = useState(true);
  const [movingToVendor, setMovingToVendor] = useState(false); 

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`,
    []
  );

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

      const data = res.data || [];
      setContacts(data);
      setFilteredContacts(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) setFilteredContacts(contacts);
      else {
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

  const handleRowUpdated = async (updatedData: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact/${updatedData.id}`,
        updatedData
      );
      toast.success("Contact updated successfully");
      fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Failed to update contact");
    }
  };

  const handleRowDeleted = async (contactId: number | string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact/${contactId}`
      );
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contact");
    }
  };

  const handleMoveAllToVendor = async () => {
    try {
      setMovingToVendor(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact/move_to_vendor`,
        { contact_ids: null },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = response.data;
      
      if (result.inserted > 0) {
        toast.success(`Moved ${result.inserted} contacts to vendor`);
      }
      
      if (result.inserted === 0 && result.count === 0) {
        toast.info("No contacts to move");
      }
      
      await fetchContacts();
      
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.message || "Failed to move contacts to vendor");
    } finally {
      setMovingToVendor(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    setIsLoading(true)
  }, [fetchContacts]);

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "id", headerName: "ID", width: 100, pinned: "left" },
    { field: "full_name", headerName: "Full Name", width: 180, editable: true },
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
      valueFormatter: DateFormatter,
      editable: true,
    },
    {
      field: "moved_to_vendor",
      headerName: "Moved To Vendor",
      width: 150,
      cellRenderer: MovedToVendorRenderer,
    },
    { field: "linkedin_id", headerName: "LinkedIn ID", width: 180, editable: true },
    { field: "company_name", headerName: "Company Name", width: 200, editable: true },
    { field: "source_email", headerName: "Source Email", width: 200, editable: true },
    { field: "location", headerName: "Location", width: 150, editable: true },
    {
      field: "created_at",
      headerName: "Created At",
      width: 180,
      valueFormatter: DateFormatter,
    },
    {
      field: "internal_linkedin_id",
      headerName: "Internal LinkedIn ID",
      width: 200,
      editable: true,
    },
  ], []);

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
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Vendor Contact Extracts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {/* Browse, search, and manage all vendor contacts. */}
          </p>
        </div>
        
        <div>
          <Button
            onClick={handleMoveAllToVendor}
            disabled={movingToVendor}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {movingToVendor ? "Moving..." : "Move All to Vendor"}
          </Button>
        </div>
      </div>

      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {/* Search Contacts */}
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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

      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={filteredContacts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            loading={loading}
            height="600px"
            title={`Vendor Contacts (${filteredContacts.length})`}
            showSearch={false}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>
    </div>
  );
}

