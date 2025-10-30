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
import { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { toast, Toaster } from "sonner";
import  api, { smartUpdate }  from "@/lib/api";

// ---------------- Status Renderer ----------------
const StatusRenderer = (params: any) => {
  const status = params.value?.toLowerCase();
  let badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  if (status === "active") {
    badgeClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  } else if (status === "inactive") {
    badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  }
  return <Badge className={badgeClass}>{params.value?.toUpperCase()}</Badge>;
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
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left });
    }
    setFilterVisible((v) => !v);
  };

  const handleValueChange = (value: string) => {
    if (selectedStatuses.includes(value)) {
      setSelectedStatuses(selectedStatuses.filter((v) => v !== value));
    } else {
      setSelectedStatuses([...selectedStatuses, value]);
    }
    setFilterVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilterVisible(false);
      }
    };
    const handleScroll = () => setFilterVisible(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const statusOptions: FilterOption[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <div className="relative flex items-center w-full" ref={filterButtonRef}>
      <span className="mr-2">Status</span>
      <svg
        onClick={toggleFilter}
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
      </svg>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[99999] bg-white border border-gray-200 rounded-md shadow-lg w-48 max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              position: "absolute",
            }}
          >
            <div className="py-1">
              {statusOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleValueChange(value)}
                  className={`block w-full text-left px-4 py-2 text-sm ${selectedStatuses.includes(value)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
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

  // ---------------- Fetch Data ----------------
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/candidate/marketing?page=1&limit=100`);
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : Array.isArray(res.data)
            ? res.data
            : [];
      setAllCandidates(data);
    } catch (err: any) {
      console.error("Failed to fetch candidates:", err);
      setError(err.response?.data?.message || "Failed to load candidates.");
      toast.error("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);



const LinkCellRenderer = (params: any) => {
  let url = (params.value || "").trim(); 

    if (!url) return <span className="text-gray-500">N/A</span>;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Click Here
      </a>
    );
  };

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
      {/* <label
        htmlFor={`fileInput-${params.data.candidate_id}`}
        className="text-blue-600 hover:underline cursor-pointer"
      >
        Upload
      </label> */}
      <input
        type="file"
        id={`fileInput-${params.data.candidate_id}`}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.append("resume", file);
          try {
            const res = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${params.data.candidate_id}/resume`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            const updatedResume = res.data.candidate_resume;
            setFilteredCandidates((prev) =>
              prev.map((row) =>
                row.candidate_id === params.data.candidate_id
                  ? { ...row, candidate_resume: updatedResume }
                  : row
              )
            );
            setAllCandidates((prev) =>
              prev.map((row) =>
                row.candidate_id === params.data.candidate_id
                  ? { ...row, candidate_resume: updatedResume }
                  : row
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
    const candidateId = params.data?.candidate_id;
    const candidateName = params.data?.candidate?.full_name || params.value;
    if (!candidateId || !candidateName) {
      return <span className="text-gray-500">{candidateName || "N/A"}</span>;
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
        valueGetter: (params) => params.data.candidate?.full_name || "N/A",
      },
      {
        headerName: "Batch",
        sortable: true,
        maxWidth: 150,
        valueGetter: (params) => params.data.candidate?.batch?.batchname || "N/A",
      },
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
        headerName: "LinkedIn",
        minWidth: 150,
        valueGetter: (params) => params.data?.candidate?.linkedin_id || null,
        cellRenderer: LinkCellRenderer,
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
        valueGetter: (params) =>
          params.data.marketing_manager_obj?.name || "N/A",
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
      { field: "priority", headerName: "Priority", width: 100, editable: true },
      {
        field: "move_to_placement",
        headerName: "Move to Placement",
        width: 190,
        sortable: true,
        filter: "agSetColumnFilter",
        cellRenderer: (params: any) => (
          <span>{params.value ? "Yes" : "No"}</span>
        ),
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

const handleRowUpdated = async (updatedRow: any) => {
    // Use the marketing record ID instead of candidate_id
    const marketingId = updatedRow?.id; // This should be the marketing record ID
    if (!marketingId) {
      console.error("Updated row missing marketing record ID", updatedRow);
      toast.error("Failed to update candidate: Missing marketing record ID.");
      return;
    }
    try {
      console.log("Updating marketing record:", marketingId, updatedRow);
      
      const res = await api.put(
        `/candidate/marketing/${marketingId}`, // Use marketing record ID
        updatedRow
      );
      
      console.log("Update response:", res.data);
      const updatedRecord = res.data;
      
      setFilteredCandidates((prev) =>
        prev.map((row) =>
          row.id === marketingId ? { ...row, ...updatedRecord } : row
        )
      );
      setAllCandidates((prev) =>
        prev.map((row) =>
          row.id === marketingId ? { ...row, ...updatedRecord } : row
        )
      );
      toast.success("Candidate updated successfully!");
    } catch (err: any) {
      console.error("Failed to update candidate:", err);
      if (err.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        const errorMessage =
          err.body?.detail ??
          err.body?.message ??
          err.message ??
          "Failed to update candidate.";
        toast.error(errorMessage);
      }
    }
  };

const handleRowDeleted = async (id: number | string) => {
    try {
      // Use the marketing record ID for deletion
      await api.delete(`/candidate/marketing/${id}`);
      
      // Filter by the correct ID field - try both id and candidate_id
      setFilteredCandidates((prev) => 
        prev.filter((row) => row.id !== id && row.candidate_id !== id)
      );
      setAllCandidates((prev) => 
        prev.filter((row) => row.id !== id && row.candidate_id !== id)
      );
      
      toast.success("Marketing candidate deleted successfully!");
    } catch (err: any) {
      console.error("Failed to delete marketing candidate:", err);
      
      if (err.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        const errorMessage =
          err.body?.detail ??
          err.body?.message ??
          err.message ??
          "Failed to delete marketing candidate.";
        toast.error(errorMessage);
      }
    }
  };
// const handleRowDeleted = async (id: number | string) => {
//     try {
//       // Use the marketing record ID for deletion
//       await api.delete(`/candidate/marketing/${id}`);
      
//       setFilteredCandidates((prev) => prev.filter((row) => row.id === id));
//       setAllCandidates((prev) => prev.filter((row) => row.id === id));
      
//       toast.success("Marketing candidate deleted successfully!");
//     } catch (err: any) {
//       console.error("Failed to delete marketing candidate:", err);
      
//       if (err.status === 401) {
//         toast.error("Session expired. Please login again.");
//       } else {
//         const errorMessage =
//           err.body?.detail ??
//           err.body?.message ??
//           err.message ??
//           "Failed to delete marketing candidate.";
//         toast.error(errorMessage);
//       }
//     }
//   };
  // ---------------- Render ----------------
  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Marketing Phase Candidates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates currently in marketing phase
          </p>
        </div>
      </div>
      {/* Search */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Candidates
        </Label>
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
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredCandidates.length} candidate(s) found
          </p>
        )}
      </div>
      {/* Data Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
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
