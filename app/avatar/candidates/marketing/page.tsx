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
import { ConfirmDialog } from "@/components/ConfirmDialog";


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

const WorkStatusRenderer = ({ value }: { value?: string }) => {
  if (!value) return null;
  const statusKey = value.toUpperCase().replace(/\s+/g, "_");
  const variantMap: Record<string, string> = {
    US_CITIZEN: "bg-blue-100 text-blue-800",
    GREEN_CARD: "bg-emerald-100 text-emerald-800",
    GC_EAD: "bg-teal-100 text-teal-800",
    I485_EAD: "bg-teal-100 text-teal-800",
    I140_APPROVED: "bg-cyan-100 text-cyan-800",
    F1: "bg-pink-100 text-pink-800",
    F1_OPT: "bg-pink-100 text-pink-800",
    F1_CPT: "bg-pink-100 text-pink-800",
    J1: "bg-amber-100 text-amber-800",
    J1_AT: "bg-amber-100 text-amber-800",
    H1B: "bg-indigo-100 text-indigo-800",
    H1B_TRANSFER: "bg-indigo-100 text-indigo-800",
    H1B_CAP_EXEMPT: "bg-indigo-100 text-indigo-800",
    H4: "bg-purple-100 text-purple-800",
    H4_EAD: "bg-purple-100 text-purple-800",
    L1A: "bg-violet-100 text-violet-800",
    L1B: "bg-violet-100 text-violet-800",
    L2: "bg-violet-100 text-violet-800",
    L2_EAD: "bg-violet-100 text-violet-800",
    O1: "bg-fuchsia-100 text-fuchsia-800",
    TN: "bg-sky-100 text-sky-800",
    E3: "bg-lime-100 text-lime-800",
    E3_EAD: "bg-lime-100 text-lime-800",
    E2: "bg-lime-100 text-lime-800",
    E2_EAD: "bg-lime-100 text-lime-800",
    TPS_EAD: "bg-yellow-100 text-yellow-800",
    ASYLUM_EAD: "bg-orange-100 text-orange-800",
    REFUGEE_EAD: "bg-orange-100 text-orange-800",
    DACA_EAD: "bg-orange-100 text-orange-800",
  };
  return (
    <Badge className={`${variantMap[statusKey] || "bg-gray-100 text-gray-800"} capitalize`}>
      {value}
    </Badge>
  );
};

const workStatusOptions = [
  "US_CITIZEN",
  "GREEN_CARD",
  "GC_EAD",
  "I485_EAD",
  "I140_APPROVED",
  "F1",
  "F1_OPT",
  "F1_CPT",
  "J1",
  "J1_AT",
  "H1B",
  "H1B_TRANSFER",
  "H1B_CAP_EXEMPT",
  "H4",
  "H4_EAD",
  "L1A",
  "L1B",
  "L2",
  "L2_EAD",
  "O1",
  "TN",
  "E3",
  "E3_EAD",
  "E2",
  "E2_EAD",
  "TPS_EAD",
  "ASYLUM_EAD",
  "REFUGEE_EAD",
  "DACA_EAD",
];

const FilterHeaderComponent = ({
  selectedItems,
  setSelectedItems,
  options,
  label,
  color = "blue",
  displayName,
  renderOption = (option: any) => option,
  getOptionValue = (option: any) => option,
  getOptionKey = (option: any) => option,
}: {
  selectedItems: any[];
  setSelectedItems: React.Dispatch<React.SetStateAction<any[]>>;
  options: any[];
  label: string;
  color?: string;
  displayName?: string;
  renderOption?: (option: any) => React.ReactNode;
  getOptionValue?: (option: any) => any;
  getOptionKey?: (option: any) => any;
}) => {
  const handleItemChange = (item: any) => {
    const value = getOptionValue(item);
    setSelectedItems((prev: any[]) => {
      const isSelected = prev.some((i) => getOptionValue(i) === value);
      return isSelected
        ? prev.filter((i) => getOptionValue(i) !== value)
        : [...prev, item];
    });
    // Close dropdown after selection
    setFilterVisible(false);
  };

  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
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
    setSelectedItems(e.target.checked ? [...options] : []);
  };

  const isAllSelected = selectedItems.length === options.length && options.length > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < options.length;

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
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
        <span className="ag-header-cell-text">{displayName || label}</span>
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
          {selectedItems.length > 0 && (
            <span
              className={`${colorMap[color]} min-w-[20px] rounded-full px-2 py-0.5 text-center text-xs text-white`}
              style={{ marginRight: "4px" }}
            >
              {selectedItems.length}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            style={{ color: selectedItems.length > 0 ? "#8b5cf6" : "#6b7280" }}
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
            {options.map((option) => {
              const value = getOptionValue(option);
              const key = getOptionKey(option);
              const isSelected = selectedItems.some((i) => getOptionValue(i) === value);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleItemChange(option)}
                    className="mr-3"
                  />
                  {renderOption(option)}
                </label>
              );
            })}
            {selectedItems.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItems([]);
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
        className="h-4 w-4  text-gray-500 hover:text-gray-700"
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
                  className={`block w-full px-4 py-2 text-left text-sm ${selectedStatuses.includes(value)
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
    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((c) =>
        selectedWorkStatuses.includes(c.workstatus)
      );
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

  const CreateJobRenderer = (params: any) => {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleCreateJob = async () => {
      try {
        setLoading(true);
        await api.post("/job-request", {
          candidate_marketing_id: params.data.id,
          job_type: "MASS_EMAIL",
          status: "PENDING"
        });
        toast.success("Job Request Created! Please go to 'Job Automation > Requests' to approve it.");
      } catch (err: any) {
        console.error(err);
        if (err.status === 409) {
          toast.info("A pending job request already exists for this candidate.");
        } else {
          toast.error("Failed: " + (err.response?.data?.message || err.message));
        }
      } finally {
        setLoading(false);
        setConfirmOpen(false);
      }
    };

    return (
      <>
        <button
          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${loading ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!params.data.candidate_intro) {
              toast.error("Cannot create job: Candidate Intro is missing.");
              return;
            }
            setConfirmOpen(true);
          }}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Job"}
        </button>

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleCreateJob}
          title="Create Job Request"
          message={`Create a MASS EMAIL job request for ${params.data.candidate?.full_name || "this candidate"}?`}
          confirmText="Create Job"
        />
      </>
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
        field: "job_actions",
        headerName: "Job Actions",
        width: 140,
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: CreateJobRenderer,
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        sortable: true,
        width: 180,
        editable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        cellRenderer: (params: any) => <WorkStatusRenderer value={params.value} />,
        headerComponent: FilterHeaderComponent,
        headerComponentParams: {
          selectedItems: selectedWorkStatuses,
          setSelectedItems: setSelectedWorkStatuses,
          options: workStatusOptions,
          label: "Work Status",
          displayName: "Work Status",
          color: "green",
          renderOption: (option: string) => <WorkStatusRenderer value={option} />,
          getOptionValue: (option: string) => option,
          getOptionKey: (option: string) => option,
        },
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
        editable: true,
        headerComponent: StatusHeaderComponent,
        headerComponentParams: { selectedStatuses, setSelectedStatuses },
      },
      {
        field: "batch",
        headerName: "Batch",
        sortable: true,
        maxWidth: 150,
        valueGetter: (params) =>
          params.data.candidate?.batch?.batchname || "N/A",
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
        field: "linkedin_id",
        headerName: "LinkedIn",
        minWidth: 150,
        valueGetter: (params) => params.data?.candidate?.linkedin_id || null,
        cellRenderer: LinkCellRenderer,
      },
      {
        field: "priority",
        headerName: "Priority",
        width: 100,
        editable: true,
        sortable: true,
        valueGetter: (params) => params.data.priority || null,
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
        field: "mass_email",
        headerName: "Mass Email",
        width: 120,
        editable: true,
        cellRenderer: (params: any) => (
          <span>{params.value ? "Yes" : "No"}</span>
        ),
        cellEditor: "agCheckboxCellEditor",
      },
      {
        field: "candidate_intro",
        headerName: "Candidate Intro",
        width: 300,
        editable: true,
        cellEditor: "agLargeTextCellEditor",
        cellEditorParams: {
          maxLength: 10000,
        },
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

    try {
      const res = await api.put(`/candidate/marketing/${marketingId}`, payload);

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
      {/* Data Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="w-full">
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
      )}
    </div>
  );
}