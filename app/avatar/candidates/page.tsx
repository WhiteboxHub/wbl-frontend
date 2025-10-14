"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { AGGridTable } from "@/components/AGGridTable";
import axios from "axios";
import Link from "next/link";
import { createPortal } from "react-dom";

/* -------------------------------------- */
/* 🔹 Token helper utilities              */
/* -------------------------------------- */
const TOKEN_KEYS = ["access_token", "token", "accesstoken"];

const getToken = () => {
  if (typeof window === "undefined") return null;
  for (const k of TOKEN_KEYS) {
    const val = localStorage.getItem(k);
    if (val) return val;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

/* -------------------------------------- */
/* 🔹 Candidate type definitions          */
/* -------------------------------------- */
type Candidate = {
  id: number;
  full_name?: string;
  enrolled_date?: string;
  email?: string;
  phone?: string;
  status?: string;
  workstatus?: string;
  education?: string;
  workexperience?: string;
  ssn?: string;
  agreement?: string;
  secondaryemail?: string;
  secondaryphone?: string;
  address?: string;
  linkedin_id?: string;
  dob?: string;
  emergcontactname?: string;
  emergcontactemail?: string;
  emergcontactphone?: string;
  emergcontactaddrs?: string;
  fee_paid?: number;
  notes?: string;
  batchid: number;
  candidate_folder?: string;
};

/* -------------------------------------- */
/* 🔹 Utility renderers & formatters       */
/* -------------------------------------- */
const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const color =
    status === "active"
      ? "bg-green-100 text-green-800"
      : status === "discontinued"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
  return <Badge className={`${color} capitalize`}>{value || "N/A"}</Badge>;
};

const WorkStatusRenderer = ({ value }: { value?: string }) => {
  const status = (value || "").toLowerCase();
  const map: Record<string, string> = {
    citizen: "bg-indigo-100 text-indigo-800",
    visa: "bg-blue-100 text-blue-800",
    "permanent resident": "bg-emerald-100 text-emerald-800",
    ead: "bg-teal-100 text-teal-800",
    "waiting for status": "bg-orange-100 text-orange-800",
  };
  return (
    <Badge className={`${map[status] || "bg-gray-100 text-gray-800"} capitalize`}>
      {value || "N/A"}
    </Badge>
  );
};

/* -------------------------------------- */
/* 🔹 Main Component                      */
/* -------------------------------------- */
export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiEndpoint = useMemo(() => `${getBaseUrl()}/candidates`, []);

  /* -------------------------------------- */
  /* 🔸 Fetch Candidates                   */
  /* -------------------------------------- */
 // paste above helpers getAuthHeaders() and getBaseUrl() if not present
// (getAuthHeaders() should return { Authorization: `Bearer ${token}` } or {} )

const fetchCandidates = useCallback(
  async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const tokenHeaders = getAuthHeaders();
      const params: Record<string, string> = {};
      if (query && query.trim()) params["search"] = query.trim();

      const url = apiEndpoint; // already normalized in useMemo

      console.debug("[fetchCandidates] — sending request:", { url, params, headers: tokenHeaders });

      const res = await axios.get(url, {
        headers: {
          ...tokenHeaders,
          // ensure content-type not forcing body on GET (safe)
        },
        params,
        validateStatus: (s) => true // allow us to log non-2xx here and throw manually
      });

      // Log full response for debugging
      console.debug("[fetchCandidates] response status:", res.status);
      console.debug("[fetchCandidates] response headers:", res.headers);
      console.debug("[fetchCandidates] response data:", res.data);

      if (res.status >= 200 && res.status < 300) {
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setCandidates(data);
        setError(null);
      } else {
        // Try to extract meaningful error message from body
        let serverMsg = "(no server message)";
        try {
          // if res.data is object, pick likely keys
          if (res.data) {
            if (typeof res.data === "string") serverMsg = res.data;
            else if (res.data.message) serverMsg = String(res.data.message);
            else if (res.data.error) serverMsg = String(res.data.error);
            else serverMsg = JSON.stringify(res.data);
          }
        } catch (e) {
          serverMsg = "(could not parse server message)";
        }

        console.error("[fetchCandidates] server returned error:", res.status, serverMsg);

        if (res.status === 401 || res.status === 403) {
          toast.error("Unauthorized — please sign in again");
          // optionally: redirect to login page
        } else if (res.status >= 500) {
          toast.error(`Server error (${res.status}): ${serverMsg}`);
        } else {
          toast.error(`Request failed (${res.status}): ${serverMsg}`);
        }

        setError(`Request failed (${res.status}): ${serverMsg}`);
      }
    } catch (err: any) {
      // Network / unexpected errors
      console.error("[fetchCandidates] unexpected error:", err);

      // axios-specific data (if available)
      if (err.response) {
        // server responded with a status outside 2xx
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        console.error("Response headers:", err.response.headers);
        toast.error(`Server error: ${err.response.status} - ${err.response.data?.message || JSON.stringify(err.response.data)}`);
        setError(String(err.response.data?.message || `HTTP ${err.response.status}`));
      } else if (err.request) {
        // request sent but no response
        console.error("No response received. Request:", err.request);
        toast.error("No response from server. Check server or network.");
        setError("No response from server.");
      } else {
        // something else
        toast.error("Failed to fetch candidates: " + (err.message || String(err)));
        setError("Failed to fetch candidates: " + (err.message || String(err)));
      }
    } finally {
      setLoading(false);
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  },
  [apiEndpoint]
);


  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  /* -------------------------------------- */
  /* 🔸 Update a candidate (PUT)           */
  /* -------------------------------------- */
  const handleRowUpdated = useCallback(
    async (updatedRow: Candidate) => {
      try {
        const tokenHeaders = {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        };

        await axios.put(`${apiEndpoint}/${updatedRow.id}`, updatedRow, {
          headers: tokenHeaders,
        });

        setCandidates((prev) =>
          prev.map((c) => (c.id === updatedRow.id ? updatedRow : c))
        );

        toast.success("Candidate updated successfully");
      } catch (err: any) {
        console.error("Update failed:", err?.response?.data ?? err);
        toast.error("Failed to update candidate");
      }
    },
    [apiEndpoint]
  );

  /* -------------------------------------- */
  /* 🔸 Delete a candidate (DELETE)        */
  /* -------------------------------------- */
  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        const tokenHeaders = getAuthHeaders();
        await axios.delete(`${apiEndpoint}/${id}`, { headers: tokenHeaders });
        setCandidates((prev) => prev.filter((c) => c.id !== id));
        toast.success("Candidate deleted");
      } catch (err: any) {
        console.error("Delete failed:", err?.response?.data ?? err);
        toast.error("Failed to delete candidate");
      }
    },
    [apiEndpoint]
  );

  /* -------------------------------------- */
  /* 🔸 Filter and search locally           */
  /* -------------------------------------- */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = candidates.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        String(c.id).includes(term)
    );
    setFilteredCandidates(filtered);
  }, [candidates, searchTerm]);

  /* -------------------------------------- */
  /* 🔸 AG Grid column definitions          */
  /* -------------------------------------- */
  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90, pinned: "left" },
      {
        field: "full_name",
        headerName: "Full Name",
        width: 200,
        cellRenderer: (params: any) =>
          params.value ? (
            <Link
              href={`/avatar/candidates/search?candidateId=${params.data.id}`}
              className="text-blue-600 hover:underline"
            >
              {params.value}
            </Link>
          ) : (
            "N/A"
          ),
      },
      { field: "email", headerName: "Email", width: 220 },
      { field: "phone", headerName: "Phone", width: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        cellRenderer: StatusRenderer,
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        width: 160,
        cellRenderer: WorkStatusRenderer,
      },
      {
        field: "enrolled_date",
        headerName: "Enrolled Date",
        width: 180,
        valueFormatter: (params: ValueFormatterParams) =>
          params.value ? new Date(params.value).toLocaleDateString() : "",
      },
      { field: "education", headerName: "Education", width: 180 },
      { field: "fee_paid", headerName: "Fee Paid ($)", width: 150 },
      { field: "notes", headerName: "Notes", width: 300 },
    ],
    []
  );

  /* -------------------------------------- */
  /* 🔸 Render                             */
  /* -------------------------------------- */
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() => fetchCandidates()}
          className="ml-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all candidates ({filteredCandidates.length})
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Candidate
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search by Name, Email, or ID
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center mt-8">Loading candidates...</p>
      ) : (
        <AGGridTable
          rowData={filteredCandidates}
          columnDefs={columnDefs}
          title={`Candidates (${filteredCandidates.length})`}
          height="600px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}
    </div>
  );
}
