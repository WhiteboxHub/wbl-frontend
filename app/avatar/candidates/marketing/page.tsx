"use client";
import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast, Toaster } from "sonner";
import api from "@/lib/api"; // <-- thin wrapper around your apiFetch

// ---------------- Status Renderer ----------------
const StatusRenderer = (params: any) => {
  const status = (params.value || "").toString().toLowerCase();
  let badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  if (status === "active") {
    badgeClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  } else if (status === "inactive") {
    badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  }
  const label = (params.value || "N/A").toString();
  return <Badge className={badgeClass}>{label}</Badge>;
};



const getAllValues = (obj: any): string[] => {
  let values: string[] = [];
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      values = values.concat(getAllValues(val));
    } else if (val !== null && val !== undefined) {
      values.push(String(val));
    }
  }
  return values;
};



// ---------------- Filter Option Interface ----------------
interface FilterOption {
  value: string;
  label: string;
}

// ---------------- Status Filter Header ----------------
interface StatusHeaderProps {
  selectedStatuses: string[];
  setSelectedStatuses: (values: string[]) => void;
}

const StatusHeaderComponent = ({
  selectedStatuses,
  setSelectedStatuses,
}: StatusHeaderProps) => {
  const filterButtonRef = (null as unknown) as HTMLDivElement | null;
  // Using createPortal so we don't need fully typed refs here; original implementation works visually.

  const statusOptions: FilterOption[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Local open state handled via document click (simple approach)
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // close if clicked outside - simple global handler
      const target = e.target as Node;
      if (!target || (filterButtonRef && filterButtonRef.contains && !filterButtonRef.contains(target))) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterButtonRef]);

  return (
    <div className="relative flex items-center w-full" ref={(el) => { /* no-op - for layout */ }}>
      <span className="mr-2">Status</span>
      <svg
        onClick={() => setOpen((v) => !v)}
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
      </svg>

      {open &&
        createPortal(
          <div className="z-[99999] bg-white border border-gray-200 rounded-md shadow-lg w-48 max-h-60 overflow-y-auto p-1">
            {statusOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  if (selectedStatuses.includes(value)) {
                    setSelectedStatuses(selectedStatuses.filter((v) => v !== value));
                  } else {
                    setSelectedStatuses([...selectedStatuses, value]);
                  }
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  selectedStatuses.includes(value) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

// ---------------- Main Page ----------------
export default function CandidatesMarketingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["active"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(100);

  // ---------------- Fetch Data ----------------
  const fetchCandidates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/candidate/marketing?page=${page}&limit=${limit}`);
      // api wrapper returns { data: ... } — normalize defensively
      const body = (res && (res as any).data) ?? res ?? {};
      const arr = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
      setAllCandidates(arr);
    } catch (err: any) {
      console.error("Failed to load candidates:", err);
      setError(err?.body?.message || err?.message || "Failed to load candidates.");
      toast.error("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // ---------------- Filtering ----------------

useEffect(() => {
  let filtered = [...allCandidates];

  if (selectedStatuses.length > 0) {
    filtered = filtered.filter((c) =>
      selectedStatuses.includes(c.status?.toLowerCase())
    );
  }

  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter((c) =>
      getAllValues(c).some((val) => val.toLowerCase().includes(term))
    );
  }

  setFilteredCandidates(filtered);
}, [allCandidates, searchTerm, selectedStatuses]);



  // ---------------- Resume Renderer ----------------
  const ResumeRenderer = (params: any) => (
    <div className="flex items-center space-x-2">
      {params.value ? (
        <a
          href={params.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View
        </a>
      ) : (
        <span className="text-gray-400">N/A</span>
      )}

      <label htmlFor={`fileInput-${params.data.candidate_id}`} className="text-sm cursor-pointer text-blue-600 hover:underline">
        Upload
      </label>

      <input
        type="file"
        id={`fileInput-${params.data.candidate_id}`}
        className="hidden"
        onChange={async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.append("resume", file);
          try {
            // Use api wrapper which will preserve FormData properly
            const uploadRes = await api.post(`/candidate/marketing/${params.data.candidate_id}/resume`, formData);
            const body = (uploadRes && (uploadRes as any).data) ?? uploadRes ?? {};
            const updatedResume = body.candidate_resume ?? body.data?.candidate_resume;
            // Update lists
            setFilteredCandidates((prev) =>
              prev.map((row) =>
                row.candidate_id === params.data.candidate_id ? { ...row, candidate_resume: updatedResume } : row
              )
            );
            setAllCandidates((prev) =>
              prev.map((row) =>
                row.candidate_id === params.data.candidate_id ? { ...row, candidate_resume: updatedResume } : row
              )
            );
            toast.success("Resume uploaded successfully!");
          } catch (err) {
            console.error("Resume upload failed", err);
            toast.error("Failed to upload resume.");
          }
        }}
      />
    </div>
  );

  // ---------------- Candidate Name Renderer ----------------
  const CandidateNameRenderer = (params: any) => {
    const candidateId = params.data?.candidate_id || params.data?.candidate?.id;
    const candidateName = params.data?.candidate?.full_name || params.value || "N/A";
    if (!candidateId) {
      return <span className="text-gray-500">{candidateName}</span>;
    }
    return (
      <Link
        href={`/avatar/candidates/search?candidateId=${candidateId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
      >
        {candidateName}
      </Link>
    );
  };

  // ---------------- Column Defs ----------------
  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      {
        field: "candidate_name",
        headerName: "Full Name",
        sortable: true,
        width: 200,
        editable: true,
        cellRenderer: CandidateNameRenderer,
        valueGetter: (params) => params.data?.candidate?.full_name ?? "N/A",
      },
      { headerName: "Batch", sortable: true, maxWidth: 150, valueGetter: (params) => params.data.candidate?.batch?.batchname || "N/A" },
      {
        field: "start_date",
        headerName: "Start Date",
        sortable: true,
        width: 120,
        editable: true,
      },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        width: 140,
        headerComponent: StatusHeaderComponent,
        headerComponentParams: { selectedStatuses, setSelectedStatuses },
      },
      {
        field: "instructor1_name",
        headerName: "Instructor 1",
        width: 190,
        editable: false,
      },
      {
        field: "instructor2_name",
        headerName: "Instructor 2",
        width: 190,
        editable: false,
      },
      {
        field: "instructor3_name",
        headerName: "Instructor 3",
        width: 190,
        editable: false,
      },
      {
        field: "resume_url",
        headerName: "Resume",
        width: 200,
        cellRenderer: ResumeRenderer,
      },
      {
        field: "marketing_manager_obj",
        headerName: "Marketing Manager",
        width: 150,
        editable: false,
        valueGetter: (params) => params.data?.marketing_manager_obj?.name ?? "N/A",
      },
      {
        field: "email",
        headerName: "Email",
        width: 250,
        editable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={`mailto:${params.value}`}
              className="text-blue-600 underline hover:text-blue-800"
              onClick={(event) => event.stopPropagation()}
            >
              {params.value}
            </a>
          );
        },
      },
      { field: "password", headerName: "Password", width: 150, editable: true },
      {
        field: "google_voice_number",
        headerName: "Google Voice Number",
        width: 150,
        editable: true,
      },
      // { field: "rating", headerName: "Rating", width: 100, editable: true },
      { field: "priority", headerName: "Priority", width: 100, editable: true },
      {
        field: "move_to_placement",
        headerName: "Move to Placement",
        width: 190,
        sortable: true,
        filter: "agSetColumnFilter",
        cellRenderer: (params: any) => <span>{params.value ? "Yes" : "No"}</span>,
      },
      {
        field: "notes",
        headerName: "Notes",
        width: 300,
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: params.value }}
            />
          );
        },
      },
    ],
    [selectedStatuses]
  );

  // ---------------- CRUD Handlers ----------------
  const handleRowUpdated = async (updatedRow: any) => {
    // Use candidate_id if available, otherwise fall back to id
    const id = updatedRow?.candidate_id ?? updatedRow?.id;
    if (!id) {
      console.error("Updated row missing candidate_id/id", updatedRow);
      toast.error("Failed to update candidate: Missing candidate ID.");
      return;
    }
    try {
      const res = await api.put(`/candidate/marketing/${id}`, updatedRow);
      const body = (res && (res as any).data) ?? res ?? {};
      const updatedRecord = Array.isArray(body) ? body[0] : (body.data ?? body);
      setFilteredCandidates((prev) =>
        prev.map((row) =>
          (row.candidate_id ?? row.id) === (updatedRecord.candidate_id ?? updatedRecord.id ?? id)
            ? { ...row, ...updatedRecord }
            : row
        )
      );
      setAllCandidates((prev) =>
        prev.map((row) =>
          (row.candidate_id ?? row.id) === (updatedRecord.candidate_id ?? updatedRecord.id ?? id)
            ? { ...row, ...updatedRecord }
            : row
        )
      );
      toast.success("Candidate updated successfully!");
    } catch (err) {
      console.error("Failed to update candidate:", err);
      toast.error("Failed to update candidate.");
    }
  };

  const handleRowDeleted = async (candidate_id: number | string) => {
    try {
      const id = candidate_id;
      if (!id) {
        toast.error("Cannot delete: missing candidate id");
        return;
      }
      await api.delete(`/candidate/marketing/${id}`);
      setFilteredCandidates((prev) => prev.filter((row) => (row.candidate_id ?? row.id) !== id));
      setAllCandidates((prev) => prev.filter((row) => (row.candidate_id ?? row.id) !== id));
      toast.success("Candidate deleted successfully!");
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      toast.error("Failed to delete candidate.");
    }
  };

  // ---------------- Render ----------------
  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Marketing Phase Candidates</h1>
          <p className="text-gray-600 dark:text-gray-400">Candidates currently in marketing phase</p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Candidates</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{filteredCandidates.length} candidate(s) found</p>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex w-full justify-center">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Marketing Phase (${allCandidates.length})`}
              height="calc(70vh)"
              showSearch={false}
              onRowDeleted={handleRowDeleted}
              onRowUpdated={handleRowUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
