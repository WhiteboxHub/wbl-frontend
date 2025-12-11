"use client";
import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, CalendarIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { toast, Toaster } from "sonner";
import api, { smartUpdate } from "@/lib/api";
import { format } from "date-fns";

// Add work status options to match candidate page exactly
const workStatusOptions = [
  "Waiting for Status",
  "Citizen",
  "Visa",
  "Permanent resident",
  "EAD",
  "H4",
  "CPT", 
  "OPT",
  "F1",
  "H1B",
];

const StatusRenderer = (params: any) => {
  const status = params.value?.toLowerCase();
  let badgeClass =
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  if (status === "active") {
    badgeClass =
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  } else if (status === "inactive") {
    badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  }
  return <Badge className={badgeClass}>{params.value?.toUpperCase()}</Badge>;
};

// Update WorkStatusRenderer to match candidate page colors
const WorkStatusRenderer = (params: any) => {
  const workstatus = params.value;
  
  // If workstatus is null, undefined, or empty
  if (!workstatus || workstatus.trim() === "" || workstatus === "N/A") {
    return <span className="text-gray-500">N/A</span>;
  }
  
  // Determine badge color based on workstatus value - matching candidate page
  let badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  const statusLower = workstatus.toLowerCase();
  
  if (statusLower === "citizen") {
    badgeClass = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
  } else if (statusLower === "visa") {
    badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  } else if (statusLower === "permanent resident") {
    badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  } else if (statusLower === "ead") {
    badgeClass = "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
  } else if (statusLower.includes("waiting for status")) {
    badgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  } else if (statusLower.includes("h4") || statusLower.includes("h-4")) {
    badgeClass = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
  } else if (statusLower.includes("cpt")) {
    badgeClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  } else if (statusLower.includes("opt")) {
    badgeClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  } else if (statusLower.includes("f1") || statusLower.includes("f-1")) {
    badgeClass = "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
  } else if (statusLower.includes("h1") || statusLower.includes("h-1")) {
    badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  }
  
  return <Badge className={badgeClass}>{workstatus}</Badge>;
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

interface FilterOption {
  value: string;
  label: string;
}

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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
    { top: 0, left: 0 }
  );
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
    <div className="relative flex w-full items-center" ref={filterButtonRef}>
      <span className="mr-2">Status</span>
      <svg
        onClick={toggleFilter}
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
        />
      </svg>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[99999] max-h-60 w-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
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
                  className={`block w-full px-4 py-2 text-left text-sm ${
                    selectedStatuses.includes(value)
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

// NEW: Create WorkStatusHeaderComponent that matches candidate page exactly
interface WorkStatusHeaderProps {
  selectedWorkStatuses: string[];
  setSelectedWorkStatuses: (values: string[]) => void;
}

const WorkStatusHeaderComponent = ({
  selectedWorkStatuses,
  setSelectedWorkStatuses,
}: WorkStatusHeaderProps) => {
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
    { top: 0, left: 0 }
  );
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: Math.max(0, rect.left + window.scrollX - 100),
      });
    }
    setFilterVisible((v) => !v);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedWorkStatuses(e.target.checked ? [...workStatusOptions] : []);
  };

  const isAllSelected = selectedWorkStatuses.length === workStatusOptions.length && workStatusOptions.length > 0;
  const isIndeterminate = selectedWorkStatuses.length > 0 && selectedWorkStatuses.length < workStatusOptions.length;

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
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setFilterVisible(false);
      }
    };
    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="ag-cell-label-container" role="presentation">
      <div className="ag-header-cell-label" role="presentation">
        <span className="ag-header-cell-text">Work Status</span>
        <div
          ref={filterButtonRef}
          className="ag-header-icon ag-header-label-icon"
          onClick={toggleFilter}
          style={{
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            marginLeft: "4px",
          }}
        >
          {selectedWorkStatuses.length > 0 && (
            <span
              className="bg-green-500 min-w-[20px] rounded-full px-2 py-0.5 text-center text-xs text-white"
              style={{ marginRight: "4px" }}
            >
              {selectedWorkStatuses.length}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            style={{ color: selectedWorkStatuses.length > 0 ? "#8b5cf6" : "#6b7280" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
            />
          </svg>
        </div>
      </div>

      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="filter-dropdown pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: "300px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 border-b pb-2">
              <label
                className="font-medium text-sm flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="mr-3"
                />
                Select All
              </label>
            </div>
            {workStatusOptions.map((option) => {
              const isSelected = selectedWorkStatuses.includes(option);
              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      if (selectedWorkStatuses.includes(option)) {
                        setSelectedWorkStatuses(selectedWorkStatuses.filter((v) => v !== option));
                      } else {
                        setSelectedWorkStatuses([...selectedWorkStatuses, option]);
                      }
                    }}
                    className="mr-3"
                  />
                  <WorkStatusRenderer value={option} />
                </label>
              );
            })}
            {selectedWorkStatuses.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkStatuses([]);
                  }}
                  className="w-full py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default function CandidatesMarketingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "active",
  ]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      
      // Transform data to include workstatus
      const transformedData = data.map((item: any) => {
        // Get workstatus exactly as it appears in candidate table
        const workstatus = item.workstatus || 
                          item.candidate?.workstatus || 
                          "N/A";
        
        return {
          ...item,
          // Ensure nested fields are properly structured
          candidate_name: item.candidate?.full_name || "N/A",
          workstatus: workstatus,
          instructor1_name: item.instructor1?.name || item.instructor1_name || "N/A",
          instructor2_name: item.instructor2?.name || item.instructor2_name || "N/A",
          instructor3_name: item.instructor3?.name || item.instructor3_name || "N/A",
          marketing_manager: item.marketing_manager_obj?.name || item.marketing_manager || "N/A",
        };
      });
      
      setAllCandidates(transformedData);
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
    
    // Filter by work status
    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((c) => {
        const candidateWorkStatus = (c.workstatus || "").toLowerCase();
        return selectedWorkStatuses.some(
          (ws) => ws.toLowerCase() === candidateWorkStatus
        );
      });
    }
    
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) =>
        getAllValues(c).some((val) => val.toLowerCase().includes(term))
      );
    }
    setFilteredCandidates(filtered);
  }, [allCandidates, searchTerm, selectedStatuses, selectedWorkStatuses]);

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
        className="cursor-pointer font-medium text-blue-600 underline hover:text-blue-800"
      >
        {candidateName}
      </Link>
    );
  };

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
        valueGetter: (params) =>
          params.data.candidate?.batch?.batchname || "N/A",
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
        field: "workstatus",
        headerName: "Work Status",
        sortable: true,
        width: 140,
        cellRenderer: WorkStatusRenderer,
        editable: false,
        headerComponent: WorkStatusHeaderComponent,
        headerComponentParams: { 
          selectedWorkStatuses, 
          setSelectedWorkStatuses,
        },
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
      { field: "password", headerName: "Email Password", width: 150, editable: true },
      { field: "imap_password", headerName: "Imap Password", width: 190, editable: true },
      {
        field: "linkedin_username",
        headerName: "Linkedin Username",
        width: 190,
        editable: true,
      },
      {
        field: "linkedin_passwd",
        headerName: "Linkedin Password",
        width: 190,
        editable: true,
      },
      {
        field: "linkedin_premium_end_date",
        headerName: "LinkedIn Premium End Date",
        width: 200,
        sortable: true,
        filter: true,
        editable: false,
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(new Date(params.value), "yyyy-MM-dd");
        },
      },

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
        filter: "agTextColumnFilter",
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
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: params.value }}
            />
          );
        },
      },
    ],
    [selectedStatuses, selectedWorkStatuses]
  );

  const handleRowUpdated = async (updatedRow: any) => {
    const marketingId = updatedRow?.id;
    if (!marketingId) {
      toast.error("Failed to update candidate: Missing marketing record ID.");
      return;
    }
    const payload = { ...updatedRow };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") {
        payload[key] = null;
      }
    });

    // Remove workstatus from payload as it comes from candidate table
    delete payload.workstatus;
    delete payload.candidate_name;
    delete payload.instructor1_name;
    delete payload.instructor2_name;
    delete payload.instructor3_name;
    delete payload.marketing_manager_obj;

    try {
      const res = await api.put(`/candidate/marketing/${marketingId}`, payload);

      const updatedRecord = res.data;

      // Transform updated record
      const transformedRecord = {
        ...updatedRecord,
        candidate_name: updatedRecord.candidate?.full_name || "N/A",
        workstatus: updatedRecord.workstatus || updatedRecord.candidate?.workstatus || "N/A",
        instructor1_name: updatedRecord.instructor1?.name || updatedRecord.instructor1_name || "N/A",
        instructor2_name: updatedRecord.instructor2?.name || updatedRecord.instructor2_name || "N/A",
        instructor3_name: updatedRecord.instructor3?.name || updatedRecord.instructor3_name || "N/A",
        marketing_manager: updatedRecord.marketing_manager_obj?.name || updatedRecord.marketing_manager || "N/A",
      };

      setFilteredCandidates((prev) =>
        prev.map((row) =>
          row.id === marketingId ? { ...row, ...transformedRecord } : row
        )
      );
      setAllCandidates((prev) =>
        prev.map((row) =>
          row.id === marketingId ? { ...row, ...transformedRecord } : row
        )
      );

      toast.success("Candidate updated successfully!");
    } catch (err: any) {
      console.error("Failed to update candidate:", err);

      let message = "Failed to update candidate.";

      if (Array.isArray(err?.body?.detail)) {
        message = err.body.detail.map((e: any) => e.msg).join(", ");
      } else if (err?.body?.message) {
        message = err.body.message;
      } else if (err?.message) {
        message = err.message;
      }

      toast.error(message);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await api.delete(`/candidate/marketing/${id}`);
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

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedWorkStatuses([]);
    setSelectedStatuses(["active"]);
  };

  // ---------------- Render ----------------
  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between">
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
      
      {/* Active filters indicator */}
      {(selectedWorkStatuses.length > 0 || selectedStatuses.length > 1) && (
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Active filters:
              </span>
              {selectedWorkStatuses.length > 0 && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Work Status: {selectedWorkStatuses.length} selected
                </Badge>
              )}
              {selectedStatuses.length > 0 && selectedStatuses.length < 2 && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Status: {selectedStatuses.join(", ")}
                </Badge>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
      
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
              title={`Marketing Phase (${filteredCandidates.length})`}
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