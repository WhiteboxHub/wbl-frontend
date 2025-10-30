"use client";
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import api, { apiFetch, API_BASE_URL } from "@/lib/api";
import axios from "axios";
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

// const DateFormatter = ({ value }: { value?: string | Date | null }) =>
//   value ? new Date(value).toLocaleDateString() : "-";

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
  const [isLoading, setIsLoading] = useState(true);
  const [movingToVendor, setMovingToVendor] = useState(false);

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`,
    []
  );

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    console.log("[fetchContacts] API_BASE_URL =", typeof window !== "undefined" ? (window as any).process?.env?.NEXT_PUBLIC_API_URL : API_BASE_URL);
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const endpointsToTry = [
      "/vendor_contact_extracts",
      "/vendor_contact_extracts/",
      "/vendor_contact_extracts?limit=100",
      "/vendor_contact_extracts/?limit=100",
    ];

    const normalize = (b: any) => {
      if (!b) return [];
      if (Array.isArray(b)) return b;
      if (Array.isArray(b.data)) return b.data;
      if (Array.isArray(b.results)) return b.results;
      for (const k of Object.keys(b || {})) if (Array.isArray(b[k])) return b[k];
      if (typeof b === "object") return [b];
      return [];
    };

    try {

      if (api?.get) {
        for (const ep of endpointsToTry) {
          try {
            console.log("[fetchContacts] trying api.get", ep);
            const resp = await api.get(ep);
            console.log("[fetchContacts] api.get response:", resp);
            const arr = normalize(resp?.data);
            setContacts(arr);
            setFilteredContacts(arr);
            return;
          } catch (err: any) {
            console.warn("[fetchContacts] api.get failed for", ep, err?.status ?? err?.message ?? err);
          }
        }
      }


      if (typeof apiFetch === "function") {
        for (const ep of endpointsToTry) {
          try {
            console.log("[fetchContacts] trying apiFetch", ep);
            const body = await apiFetch(ep);
            console.log("[fetchContacts] apiFetch body:", body);
            const arr = normalize(body);
            setContacts(arr);
            setFilteredContacts(arr);
            return;
          } catch (err: any) {
            console.warn("[fetchContacts] apiFetch failed for", ep, err?.status ?? err?.message ?? err);
          }
        }


        try {
          console.log("[fetchContacts] trying apiFetch with credentials", endpointsToTry[0]);
          const body = await apiFetch(endpointsToTry[0], { credentials: "include", useCookies: true });
          console.log("[fetchContacts] apiFetch(creds) body:", body);
          const arr = normalize(body);
          setContacts(arr);
          setFilteredContacts(arr);
          return;
        } catch (err: any) {
          console.warn("[fetchContacts] apiFetch(creds) failed", err);
        }
      }


      for (const ep of endpointsToTry) {
        const full = base ? `${base}${ep.startsWith("/") ? "" : "/"}${ep}` : ep;
        try {
          console.log("[fetchContacts] trying axios GET", full);
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("access_token") || localStorage.getItem("token") || localStorage.getItem("auth_token")
              : null;
          const headers: any = { Accept: "application/json" };
          if (token) headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
          const res = await axios.get(full, { headers, withCredentials: true });
          console.log("[fetchContacts] axios res status", res.status, "data:", res.data);
          const arr = normalize(res.data);
          setContacts(arr);
          setFilteredContacts(arr);
          return;
        } catch (err: any) {
          console.warn("[fetchContacts] axios failed for", full, err?.response?.status ?? err?.message ?? err);
        }
      }

      toast.error("Failed to load contacts — check console/network for details.");
    } catch (err: any) {
      console.error("[fetchContacts] unexpected", err);
      toast.error(err?.message || "Failed to load contacts");
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
      await apiFetch(`/vendor_contact/${updatedData.id}`, {
        method: "PUT",
        body: updatedData,
      });
      toast.success("Contact updated successfully");
      fetchContacts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update contact");
    }
  };

  const handleRowDeleted = async (contactId: number | string) => {
    try {
      await apiFetch(`/vendor_contact/${contactId}`, {
        method: "DELETE",
      });
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete contact");
    }
  };

  const handleMoveAllToVendor = async () => {
    setMovingToVendor(true);
    try {
      const toMove = contacts.filter((c) => !c.moved_to_vendor);
      if (!toMove.length) {
        toast.info("No contacts to move");
        return;
      }

      let inserted = 0, skipped = 0, failed = 0;
      for (const c of toMove) {
        const payload: any = {
          full_name: c.full_name || c.company_name || c.email || "Unknown",
          email: c.email || undefined,
          phone_number: c.phone || undefined,
        };
        try {

          await apiFetch("/vendors", { method: "POST", body: payload });


          await apiFetch(`/vendor_contact/${c.id}`, {
            method: "PUT",
            body: { moved_to_vendor: true },
          });
          inserted++;
        } catch (e: any) {
          const d = (e?.body || "").toString().toLowerCase();
          if (d.includes("email already exists")) {
            skipped++;
            try {
              await apiFetch(`/vendor_contact/${c.id}`, {
                method: "PUT",
                body: { moved_to_vendor: true },
              });
            } catch { }
          } else {
            failed++;
          }
        }
      }

      if (inserted) {
        toast.success(`Moved ${inserted} contacts${skipped ? `, ${skipped} skipped` : ""}${failed ? `, ${failed} failed` : ""}`);
      } else if (skipped && !failed) {
        toast.info(`${skipped} contacts already existed; marked as moved`);
      } else if (failed) {
        toast.error("Failed to move contacts");
      } else {
        toast.info("No contacts to move");
      }

      await fetchContacts();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to move contacts to vendor");
    } finally {
      setMovingToVendor(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // setIsLoading(true);
  }, [fetchContacts]);

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
        valueFormatter: "formatDateFromDB",
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
      { field: "location", headerName: "Location", width: 150, editable: true },
      {
        field: "created_at",
        headerName: "Created At",
        width: 180,
        valueFormatter: "formatDateFromDB",
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

          {/* Button */}
          <div className="sm:w-auto">
            <Button
              onClick={handleMoveAllToVendor}
              disabled={movingToVendor}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {movingToVendor ? "Moving..." : "Move All to Vendor"}
            </Button>
          </div>
        </div>

        {/* Search + Button — responsive layout */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {/* Search box */}
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
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>
    </div>
  );
}
