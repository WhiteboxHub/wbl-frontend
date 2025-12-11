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
import { createPortal } from "react-dom";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";

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
  "H1",
];

const StatusRenderer = (params: any) => {
  const status = (params?.value || "").toString().toLowerCase();
  let badgeClass =
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  if (status === "active") {
    badgeClass =
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  } else if (status === "inactive") {
    badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  }
  return (
    <Badge className={badgeClass}>{(status || "N/A").toUpperCase()}</Badge>
  );
};

// Add WorkStatusRenderer to match candidate page colors
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
    const valLower = value.toLowerCase();
    if (selectedStatuses.map((s) => s.toLowerCase()).includes(valLower)) {
      setSelectedStatuses(
        selectedStatuses.filter((v) => v.toLowerCase() !== valLower)
      );
    } else {
      setSelectedStatuses([...selectedStatuses, valLower]);
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
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
                    selectedStatuses
                      .map((s) => s.toLowerCase())
                      .includes(value.toLowerCase())
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
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

export default function CandidatesPrepPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "active",
  ]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [instructors, setInstructors] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [candidatesRes, instructorsRes] = await Promise.all([
          api.get("/candidate_preparations"),
          api.get("/employees?status=1"),
        ]);

        const candidatesBody = candidatesRes?.data ?? candidatesRes;
        const instructorsBody = instructorsRes?.data ?? instructorsRes;

        const candidates = Array.isArray(candidatesBody)
          ? candidatesBody
          : candidatesBody?.data ?? [];

        const instr = Array.isArray(instructorsBody)
          ? instructorsBody
          : instructorsBody?.data ?? [];

        if (!mounted) return;
        setAllCandidates(candidates);
        setInstructors(instr);
        setError("");
      } catch (err) {
        console.error("Failed to load data:", err);
        if (!mounted) return;
        setError("Failed to load data.");
        toast.error("Failed to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const getAllValues = (obj: any): string[] => {
    let values: string[] = [];
    for (const val of Object.values(obj || {})) {
      if (val && typeof val === "object") {
        values = values.concat(getAllValues(val));
      } else if (val !== null && val !== undefined) {
        values.push(String(val));
      }
    }
    return values;
  };

  useEffect(() => {
    let filtered = [...allCandidates];
    const selectedLower = selectedStatuses.map((s) => s.toLowerCase());

    if (selectedLower.length > 0) {
      filtered = filtered.filter((c) =>
        selectedLower.includes((c?.status || "").toString().toLowerCase())
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

    const term = (searchTerm || "").trim().toLowerCase();

    if (term !== "") {
      // If numeric, only search by ID fields
      if (/^\d+$/.test(term)) {
        filtered = filtered.filter(
          (c) =>
            String(c.id || "").toLowerCase() === term ||
            String(c.candidate_id || "").toLowerCase() === term
        );
      } else {
        // Text search across all fields
        filtered = filtered.filter((c) =>
          getAllValues(c).some((val) => val.toLowerCase().includes(term))
        );
      }
    }

    // Sort active first
    filtered.sort((a, b) => {
      const aStatus = (a?.status || "").toString().toLowerCase();
      const bStatus = (b?.status || "").toString().toLowerCase();
      if (aStatus === "active" && bStatus !== "active") return -1;
      if (aStatus !== "active" && bStatus === "active") return 1;
      const ai = Number(a?.id ?? a?.candidate_id ?? 0);
      const bi = Number(b?.id ?? b?.candidate_id ?? 0);
      return bi - ai;
    });

    setFilteredCandidates(filtered);
  }, [allCandidates, searchTerm, selectedStatuses, selectedWorkStatuses]);

  const CandidateNameRenderer = (params: any) => {
    const candidateId =
      params?.data?.candidate_id ||
      params?.data?.candidate?.id ||
      params?.data?.id;
    const candidateName =
      params?.data?.candidate?.full_name ||
      params?.data?.candidate_name ||
      params?.value ||
      "";

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

  const formatEnumValue = (value: string) => {
    if (!value) return "N/A";
    return value
      .toString()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      {
        field: "candidate_name",
        headerName: "Candidate Name",
        cellRenderer: CandidateNameRenderer,
        sortable: true,
        minWidth: 150,
        editable: false,
        valueGetter: (params) => params.data?.candidate?.full_name || "N/A",
      },
      {
        field: "batch_name",
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
        maxWidth: 130,
      },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        maxWidth: 150,
        headerComponent: StatusHeaderComponent,
        headerComponentParams: { selectedStatuses, setSelectedStatuses },
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        sortable: true,
        maxWidth: 150,
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
        minWidth: 150,
        valueGetter: (params) => params.data?.instructor1?.name || "N/A",
      },
      {
        field: "instructor2_name",
        headerName: "Instructor 2",
        minWidth: 150,
        valueGetter: (params) => params.data?.instructor2?.name || "N/A",
      },
      {
        field: "instructor3_name",
        headerName: "Instructor 3",
        minWidth: 150,
        valueGetter: (params) => params.data?.instructor3?.name || "N/A",
      },
      { field: "rating", headerName: "Rating", minWidth: 120, valueFormatter: (params) => formatEnumValue(params.value) },
      { field: "communication", headerName: "Communication", minWidth: 120, valueFormatter: (params) => formatEnumValue(params.value) },
      { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
      {
        headerName: "LinkedIn",
        minWidth: 150,
        valueGetter: (params) => params.data?.candidate?.linkedin_id || null,
        cellRenderer: LinkCellRenderer,
      },
      {
        field: "github_url",
        headerName: "GitHub",
        minWidth: 150,
        cellRenderer: LinkCellRenderer,
      },
      { field: "resume_url", headerName: "Resume", minWidth: 150, cellRenderer: LinkCellRenderer },
      {
        field: "target_date",
        headerName: "Target Date",
        width: 180,
        sortable: true,
        filter: "agDateColumnFilter",
        valueGetter: (params) => {
        return params.data?.entry_date ? new Date(params.data.entry_date) : null;
        },
        valueFormatter: (params) => {
          const value = params.value;
          if (!value) return "-";
          return value.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        },
      },
      {
        field: "move_to_mrkt",
        headerName: "Move to Marketing",
        width: 150,
        sortable: true,
        filter: "agTextColumnFilter",
        // filter: "agSetColumnFilter",
        cellRenderer: (params: any) => <span>{params.value ? "Yes" : "No"}</span>,
      },
      {
        field: "notes",
        headerName: "Notes",
        minWidth: 100,
        editable: true,
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
    ];
  }, [selectedStatuses, selectedWorkStatuses]);

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const prepId = updatedRow?.id;
      if (!prepId) {
        console.error("Missing preparation ID in updated row:", updatedRow);
        toast.error("Failed to update: Missing preparation ID");
        return;
      }

      console.log("Updating preparation record:", prepId, updatedRow);

      const payload = {
        ...updatedRow,
        instructor1_id: updatedRow.instructor1_id || null,
        instructor2_id: updatedRow.instructor2_id || null,
        instructor3_id: updatedRow.instructor3_id || null,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === "" || payload[key] === undefined) {
          payload[key] = null;
        }
      });

      const response = await api.put(
        `/candidate_preparation/${prepId}`,
        payload
      );
      const updatedRecord = response?.data || payload;

      setFilteredCandidates((prev) =>
        prev.map((row) => (row.id === prepId ? { ...updatedRecord } : row))
      );
      setAllCandidates((prev) =>
        prev.map((row) => (row.id === prepId ? { ...updatedRecord } : row))
      );

      toast.success("Candidate preparation updated successfully!");
    } catch (err: any) {
      console.error("Failed to update:", err);
      const errorMessage =
        err.body?.detail ||
        err.body?.message ||
        err.message ||
        "Failed to update candidate preparation.";
      toast.error(errorMessage);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      setFilteredCandidates((prev) => prev.filter((row) => row.id != id));
      setAllCandidates((prev) => prev.filter((row) => row.id != id));

      await api.delete(`/candidate_preparation/${id}`);
      toast.success("Candidate preparation deleted successfully!");
    } catch (err: any) {
      console.error("Failed to delete candidate preparation:", err);
      const errorMessage =
      err.body?.detail ?? err.body?.message ?? err.message ?? "Failed to delete candidate preparation.";
      toast.error(errorMessage);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedWorkStatuses([]);
    setSelectedStatuses(["active"]);
  };

  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-center" richColors />
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidate Preparations
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Tracking candidate preparation status
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
        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2 pl-10"
          />
        </div>
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
          <div className="w-full max-w-7xl rounded-lg bg-white p-2 shadow dark:bg-gray-800">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Candidate Preparations (${allCandidates.length})`}
              height="calc(80vh)"
              showSearch={false}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}