


"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { AGGridTable } from "@/components/AGGridTable";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useForm } from "react-hook-form";
import api from "@/lib/api";

type Candidate = {
  id: number;
  full_name?: string | null;
  enrolled_date?: string | Date | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  workstatus?: string | null;
  education?: string | null;
  workexperience?: string | null;
  ssn?: string | null;
  agreement?: string | null;
  secondaryemail?: string | null;
  secondaryphone?: string | null;
  address?: string | null;
  linkedin_id?: string | null;
  dob?: string | Date | null;
  emergcontactname?: string | null;
  emergcontactemail?: string | null;
  emergcontactphone?: string | null;
  emergcontactaddrs?: string | null;
  fee_paid?: number | null;
  github_link?: string | null;
  batchid: number;
  candidate_folder?: string | null;
  notes?: string | null;
  batch?: Batch | null;
};

type FormData = {
  full_name: string;
  enrolled_date?: string;
  email: string;
  phone: string;
  status: string;
  workstatus: string;
  education: string;
  workexperience: string;
  ssn: string;
  agreement: string;
  secondaryemail: string;
  secondaryphone: string;
  address: string;
  linkedin_id: string;
  dob?: string;
  emergcontactname: string;
  emergcontactemail: string;
  emergcontactphone: string;
  emergcontactaddrs: string;
  fee_paid: number;
  github_link: string;
  batchid: number;
  candidate_folder: string;
  notes: string;
};

type Batch = {
  batchid: number;
  batchname: string;
  subject?: string;
  courseid?: number;
  orientationdate?: string;
  startdate?: string;
  enddate?: string;
};

const statusOptions = ["active", "discontinued", "break", "closed"];
const workStatusOptions = [
  "Waiting for Status",
  "Citizen",
  "Visa",
  "Permanent resident",
  "EAD",
];

const initialFormData: FormData = {
  full_name: "",
  enrolled_date: new Date().toISOString().split("T")[0],
  email: "",
  phone: "",
  status: "active",
  workstatus: "Waiting for Status",
  education: "",
  workexperience: "",
  ssn: "",
  agreement: "N",
  secondaryemail: "",
  secondaryphone: "",
  address: "",
  linkedin_id: "",
  emergcontactname: "",
  emergcontactemail: "",
  emergcontactphone: "",
  emergcontactaddrs: "",
  fee_paid: 0,
  github_link: "",
  batchid: 0,
  candidate_folder: "",
  notes: "",
};

const cleanPhoneNumber = (phoneNumberString: string): string => {
  if (!phoneNumberString) return "";
  return ("" + phoneNumberString).replace(/\D/g, "");
};

const formatPhoneNumber = (phoneNumberString: string): string => {
  if (!phoneNumberString) return "";
  const cleaned = cleanPhoneNumber(phoneNumberString);

  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }

  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }

  return phoneNumberString;
};

const formatPhoneInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6)
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  if (cleaned.length <= 10)
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const formatted = formatPhoneInput(e.target.value);
  e.target.value = formatted;
};

const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  });
};

const toPascalCase = (str: string): string => {
  if (!str) return str;
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    discontinued: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    break: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <Badge className={`${variantMap[status] || variantMap.default} capitalize`}>
      {value || "N/A"}
    </Badge>
  );
};

const WorkStatusRenderer = ({ value }: { value?: string }) => {
  const workstatus = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    citizen: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    visa: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "permanent resident": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    ead: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    "waiting for status": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <Badge className={`${variantMap[workstatus] || variantMap.default} capitalize`}>
      {value || "N/A"}
    </Badge>
  );
};

const CandidateNameRenderer = (params: any) => {
  const candidateId = params.data?.id;
  const candidateName = params.value;
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

export default function CandidatesPage() {
  const gridRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewCandidate = searchParams.get("newcandidate") === "true";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState("all");
  const [sortModel, setSortModel] = useState([{ colId: "enrolled_date", sort: "desc" as "desc" }]);
  const [filterModel, setFilterModel] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(isNewCandidate);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [mlBatches, setMlBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  
  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Batch[]>([]);

  const apiPath = "/candidates";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: initialFormData,
  });

  const fullNameValue = watch("full_name");
  const emergContactNameValue = watch("emergcontactname");

  useEffect(() => {
    if (fullNameValue) {
      const pascalCased = toPascalCase(fullNameValue);
      if (fullNameValue !== pascalCased) {
        setValue("full_name", pascalCased, { shouldValidate: true });
      }
    }
  }, [fullNameValue, setValue]);

  useEffect(() => {
    if (emergContactNameValue) {
      const pascalCased = toPascalCase(emergContactNameValue);
      if (emergContactNameValue !== pascalCased) {
        setValue("emergcontactname", pascalCased, { shouldValidate: true });
      }
    }
  }, [emergContactNameValue, setValue]);

  // ============================================
  // KEY CHANGE: Filter candidates using useMemo
  // ============================================
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((candidate) => {
        const candidateStatus = (candidate.status || "").toLowerCase();
        return selectedStatuses.some(
          (status) => status.toLowerCase() === candidateStatus
        );
      });
    }

    // Filter by work status
    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((candidate) => {
        const candidateWorkStatus = (candidate.workstatus || "").toLowerCase();
        return selectedWorkStatuses.some(
          (ws) => ws.toLowerCase() === candidateWorkStatus
        );
      });
    }

    // Filter by batch
    if (selectedBatches.length > 0) {
      filtered = filtered.filter((candidate) => {
        return selectedBatches.some(
          (batch) => batch.batchid === candidate.batchid
        );
      });
    }

    return filtered;
  }, [candidates, selectedStatuses, selectedWorkStatuses, selectedBatches]);

  // Calculate counts for display
  const displayCount = filteredCandidates.length;
  const totalCount = candidates.length;
  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedWorkStatuses.length > 0 ||
    selectedBatches.length > 0;

  const columnDefs: ColDef<any, any>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        pinned: "left",
        sortable: true,
        filter: "agTextColumnFilter",
        valueGetter: (params) => params.data?.id || "N/A",
      },
      {
        field: "full_name",
        headerName: "Full Name",
        width: 180,
        sortable: true,
        filter: "agTextColumnFilter",
        valueGetter: (params) => {
          const name = params.data?.full_name;
          return name ? toPascalCase(name) : "";
        },
        cellRenderer: CandidateNameRenderer,
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        editable: true,
        sortable: true,
        filter: "agTextColumnFilter",
        valueFormatter: (params: ValueFormatterParams) => {
          if (!params.value) return "";
          return formatPhoneNumber(params.value);
        },
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          const formattedPhone = formatPhoneNumber(params.value);
          const cleanPhone = cleanPhoneNumber(params.value);
          return (
            <a href={`tel:+${cleanPhone}`} className="text-blue-600 underline hover:text-blue-800">
              {formattedPhone}
            </a>
          );
        },
        valueParser: (params) => cleanPhoneNumber(params.newValue),
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
        editable: true,
        sortable: true,
        filter: "agTextColumnFilter",
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
      {
        field: "batch",
        headerName: "Batch",
        width: 140,
        sortable: true,
        filter: false, // CHANGED: Disabled AG Grid's built-in filter
        suppressHeaderMenuButton: true,
        valueGetter: (params) => {
          const batch = params.data?.batch;
          return batch ? batch.batchname : "N/A";
        },
        comparator: (valueA, valueB) => {
          if (valueA === valueB) return 0;
          if (valueA === "N/A") return 1;
          if (valueB === "N/A") return -1;
          return valueA.localeCompare(valueB);
        },
        cellRenderer: (params: any) => {
          const batch = params.data?.batch;
          return batch ? batch.batchname : "N/A";
        },
        headerComponent: FilterHeaderComponent,
        headerComponentParams: {
          selectedItems: selectedBatches,
          setSelectedItems: setSelectedBatches,
          options: mlBatches,
          label: "Batch",
          displayName: "Batch",
          color: "purple",
          renderOption: (option: Batch) => option.batchname,
          getOptionValue: (option: Batch) => option,
          getOptionKey: (option: Batch) => option.batchid,
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        sortable: true,
        filter: false, // CHANGED: Disabled AG Grid's built-in filter
        suppressHeaderMenuButton: true,
        valueGetter: (params) => params.data?.status || "",
        comparator: (valueA, valueB) => {
          const order = ["active", "break", "discontinued", "closed"];
          const indexA = order.indexOf(valueA.toLowerCase());
          const indexB = order.indexOf(valueB.toLowerCase());
          if (indexA === -1 && indexB === -1) return valueA.localeCompare(valueB);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        },
        cellRenderer: StatusRenderer,
        headerComponent: FilterHeaderComponent,
        headerComponentParams: {
          selectedItems: selectedStatuses,
          setSelectedItems: setSelectedStatuses,
          options: statusOptions,
          label: "Status",
          displayName: "Status",
          color: "blue",
          renderOption: (option: string) => <StatusRenderer value={option} />,
          getOptionValue: (option: string) => option,
          getOptionKey: (option: string) => option,
        },
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        width: 150,
        sortable: true,
        filter: false, // CHANGED: Disabled AG Grid's built-in filter
        suppressHeaderMenuButton: true,
        valueGetter: (params) => params.data?.workstatus || "",
        comparator: (valueA, valueB) => {
          const order = ["waiting for status", "citizen", "permanent resident", "ead", "visa"];
          const indexA = order.indexOf(valueA.toLowerCase());
          const indexB = order.indexOf(valueB.toLowerCase());
          if (indexA === -1 && indexB === -1) return valueA.localeCompare(valueB);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        },
        cellRenderer: WorkStatusRenderer,
        headerComponent: FilterHeaderComponent,
        headerComponentParams: {
          selectedItems: selectedWorkStatuses,
          setSelectedItems: setSelectedWorkStatuses,
          options: workStatusOptions,
          label: "Work Status",
          displayName: "Work Status",
          color: "green",
          renderOption: (option: string) => option,
          getOptionValue: (option: string) => option,
          getOptionKey: (option: string) => option,
        },
      },
      {
        field: "enrolled_date",
        headerName: "Enrolled Date",
        width: 150,
        sortable: true,
        filter: "agDateColumnFilter",
        valueFormatter: ({ value }: ValueFormatterParams) => formatDate(value),
      },
      {
        field: "education",
        headerName: "Education",
        width: 200,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "workexperience",
        headerName: "Work Experience",
        width: 200,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "ssn",
        headerName: "SSN",
        width: 120,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "agreement",
        headerName: "Agreement",
        width: 100,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "secondaryemail",
        headerName: "Secondary Email",
        width: 200,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={`mailto:${params.value}`}
              className="text-blue-600 underline hover:text-purple-800"
              onClick={(event) => event.stopPropagation()}
            >
              {params.value}
            </a>
          );
        },
      },
      {
        field: "secondaryphone",
        headerName: "Secondary Phone",
        width: 150,
        sortable: true,
        filter: "agTextColumnFilter",
        valueFormatter: (params: ValueFormatterParams) => {
          if (!params.value) return "";
          return formatPhoneNumber(params.value);
        },
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          const formattedPhone = formatPhoneNumber(params.value);
          const cleanPhone = cleanPhoneNumber(params.value);
          return (
            <a href={`tel:+${cleanPhone}`} className="text-blue-600 underline hover:text-purple-800">
              {formattedPhone}
            </a>
          );
        },
        valueParser: (params) => cleanPhoneNumber(params.newValue),
      },
      {
        field: "address",
        headerName: "Address",
        width: 300,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "linkedin_id",
        headerName: "LinkedIn ID",
        width: 150,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          const url = params.value.trim();
          const href =
            url.startsWith("http://") || url.startsWith("https://")
              ? url
              : `https://linkedin.com/in/${url}`;
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-purple-800 text-sm sm:text-base font-medium"
            >
              {params.value}
            </a>
          );
        },
      },
      {
        field: "dob",
        headerName: "Date of Birth",
        width: 150,
        sortable: true,
        editable: true,
        filter: "agDateColumnFilter",
        valueFormatter: ({ value }: ValueFormatterParams) => formatDate(value),
        valueParser: (params) => {
          if (!params.newValue) return null;
          const date = new Date(params.newValue);
          return date.toISOString();
        },
        cellEditor: "agDateCellEditor",
        cellEditorParams: {
          min: "1900-01-01",
          max: new Date().toISOString().split("T")[0],
        },
      },
      {
        field: "emergcontactname",
        headerName: "Emergency Contact Name",
        width: 200,
        sortable: true,
        filter: "agTextColumnFilter",
        valueGetter: (params) => {
          const name = params.data?.emergcontactname;
          return name ? toPascalCase(name) : "";
        },
      },
      {
        field: "emergcontactemail",
        headerName: "Emergency Contact Email",
        width: 200,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={`mailto:${params.value}`}
              className="text-blue-600 underline hover:text-purple-800"
              onClick={(event) => event.stopPropagation()}
            >
              {params.value}
            </a>
          );
        },
      },
      {
        field: "emergcontactphone",
        headerName: "Emergency Contact Phone",
        width: 150,
        sortable: true,
        filter: "agTextColumnFilter",
        valueFormatter: (params: ValueFormatterParams) => {
          if (!params.value) return "";
          return formatPhoneNumber(params.value);
        },
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          const formattedPhone = formatPhoneNumber(params.value);
          const cleanPhone = cleanPhoneNumber(params.value);
          return (
            <a href={`tel:+${cleanPhone}`} className="text-blue-600 underline hover:text-purple-800">
              {formattedPhone}
            </a>
          );
        },
        valueParser: (params) => cleanPhoneNumber(params.newValue),
      },
      {
        field: "emergcontactaddrs",
        headerName: "Emergency Contact Address",
        width: 300,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "fee_paid",
        headerName: "Fee Paid",
        width: 120,
        sortable: true,
        filter: "agTextColumnFilter",
        cellClass: (params) => (params.value && params.value > 0 ? "text-green-500" : ""),
        valueFormatter: ({ value }: ValueFormatterParams) =>
          value != null ? `$${Number(value).toLocaleString()}` : "",
        cellStyle: { textAlign: "right" },
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
      {
        field: "candidate_folder",
        headerName: "Candidate Folder",
        width: 200,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={params.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
              onClick={(event) => event.stopPropagation()}
            >
              {params.value}
            </a>
          );
        },
      },
    ],
    [selectedStatuses, selectedWorkStatuses, selectedBatches, mlBatches]
  );

  const gridOptions = useMemo(
    () => ({
      defaultColDef: {
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
      },
      suppressRowClickSelection: true,
      rowSelection: "single",
      onSortChanged: () => {
        if (gridRef.current && gridRef.current.api) {
          const sortModel = gridRef.current.api.getSortModel();
          setSortModel(sortModel);
        }
      },
    }),
    []
  );

  useEffect(() => {
    const newCandidateParam = searchParams.get("newcandidate") === "true";
    setIsModalOpen(newCandidateParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchBatches = async () => {
      setBatchesLoading(true);
      try {
        const res = await api.get("/batch");
        const rawBatches = res.data?.data ?? res.data;
        const sortedAllBatches = [...(rawBatches || [])].sort(
          (a: Batch, b: Batch) => b.batchid - a.batchid
        );
        setAllBatches(sortedAllBatches);
        let mlBatchesOnly = sortedAllBatches.filter((batch) => {
          const subject = (batch.subject || "").toLowerCase();
          return (
            subject === "ml" ||
            subject === "machine learning" ||
            subject === "machinelearning" ||
            subject?.includes("ml")
          );
        });
        if (mlBatchesOnly.length === 0) {
          mlBatchesOnly = sortedAllBatches.filter((batch) => batch.courseid === 3);
        }
        if (mlBatchesOnly.length === 0) {
          mlBatchesOnly = sortedAllBatches;
        }
        setMlBatches(mlBatchesOnly);
        if (isModalOpen && mlBatchesOnly.length > 0 && mlBatchesOnly[0]?.batchid) {
          setValue("batchid", mlBatchesOnly[0].batchid);
        }
      } catch (error) {
        console.error("Failed to load batches:", error);
      } finally {
        setBatchesLoading(false);
      }
    };
    fetchBatches();
  }, [isModalOpen, setValue]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const autoSearchBy = detectSearchBy(searchTerm);
        fetchCandidates(searchTerm, autoSearchBy, sortModel, filterModel);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchBy, sortModel, filterModel]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchCandidates = useCallback(
    async (
      search?: string,
      searchBy: string = "all",
      sort: any[] = [{ colId: "enrolled_date", sort: "desc" }],
      filters: any = {}
    ) => {
      setLoading(true);
      try {
        let url = `${apiPath}?limit=0`;
        if (search && search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}&search_by=${searchBy}`;
        }
        const sortToApply =
          sort && sort.length > 0 ? sort : [{ colId: "enrolled_date", sort: "desc" }];
        const sortParam = sortToApply.map((s) => `${s.colId}:${s.sort}`).join(",");
        url += `&sort=${encodeURIComponent(sortParam)}`;
        if (Object.keys(filters).length > 0) {
          url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
        }
        const res = await api.get(url);
        const payload = res.data;
        const dataArray = payload?.data ?? payload;
        if (!Array.isArray(dataArray)) {
          setCandidates([]);
          console.warn("Unexpected candidates response", payload);
        } else {
          setCandidates(dataArray);
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || "Failed to load candidates";
        setError(message);
        toast.error(message);
        console.error("fetchCandidates error ->", err);
      } finally {
        setLoading(false);
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    },
    [apiPath]
  );

  const detectSearchBy = (search: string) => {
    if (/^\d+$/.test(search)) return "id";
    if (/^\S+@\S+\.\S+$/.test(search)) return "email";
    if (/^[\d\s\+\-()]+$/.test(search)) return "phone";
    return "full_name";
  };

  const onSubmit = async (data: FormData) => {
    if (!data.full_name.trim() || !data.email.trim() || !data.phone.trim() || !data.dob) {
      toast.error("Full Name, Email, Phone, and Date of Birth are required");
      return;
    }
    try {
      const payload = {
        ...data,
        full_name: toPascalCase(data.full_name),
        phone: cleanPhoneNumber(data.phone),
        secondaryphone: data.secondaryphone ? cleanPhoneNumber(data.secondaryphone) : "",
        emergcontactphone: data.emergcontactphone ? cleanPhoneNumber(data.emergcontactphone) : "",
        enrolled_date: data.enrolled_date || new Date().toISOString().split("T")[0],
        status: data.status || "active",
        workstatus: data.workstatus || "Waiting for Status",
        agreement: data.agreement || "N",
        fee_paid: data.fee_paid || 0,
      };
      const res = await api.post(apiPath, payload);
      const newId = res.data?.id ?? res.data;
      toast.success(`Candidate created successfully${newId ? ` (ID: ${newId})` : ""}`);
      handleCloseModal();
      fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || "Failed to create candidate";
      toast.error("Failed to create candidate: " + message);
      console.error("Error creating candidate:", error);
    }
  };

  const handleOpenModal = () => {
    router.push("/avatar/candidates?newcandidate=true", { scroll: false });
    setIsModalOpen(true);
    if (mlBatches.length > 0) {
      const latestBatch = mlBatches[0];
      setValue("batchid", latestBatch?.batchid);
    }
  };

  const handleCloseModal = () => {
    router.push("/avatar/candidates", { scroll: false });
    setIsModalOpen(false);
    reset();
  };

  const handleRowUpdated = useCallback(
    async (updatedRow: Candidate) => {
      setLoadingRowId(updatedRow.id);
      try {
        const updatedData = {
          ...updatedRow,
          full_name: updatedRow.full_name ? toPascalCase(updatedRow.full_name) : updatedRow.full_name,
          emergcontactname: updatedRow.emergcontactname
            ? toPascalCase(updatedRow.emergcontactname)
            : updatedRow.emergcontactname,
          phone: updatedRow.phone ? cleanPhoneNumber(updatedRow.phone) : updatedRow.phone,
          secondaryphone: updatedRow.secondaryphone
            ? cleanPhoneNumber(updatedRow.secondaryphone)
            : updatedRow.secondaryphone,
          emergcontactphone: updatedRow.emergcontactphone
            ? cleanPhoneNumber(updatedRow.emergcontactphone)
            : updatedRow.emergcontactphone,
          enrolled_date: updatedRow.enrolled_date || new Date().toISOString().split("T")[0],
        };
        if (!updatedData.status || updatedData.status === "") {
          updatedData.status = "active";
        }
        const { id, ...payload } = updatedData;
        await api.put(`${apiPath}/${updatedRow.id}`, payload);
        setCandidates((prevCandidates) =>
          prevCandidates.map((candidate) =>
            candidate.id === updatedRow.id ? updatedData : candidate
          )
        );
        if (gridRef.current) {
          const rowNode = gridRef.current.api.getRowNode(updatedRow.id.toString());
          if (rowNode) {
            rowNode.setData(updatedData);
            gridRef.current.api.redrawRows({ rowNodes: [rowNode] });
            gridRef.current.api.refreshCells({ rowNodes: [rowNode], force: true });
          } else {
            gridRef.current.api.refreshCells({ force: true });
          }
        }
        toast.success("Candidate updated successfully");
      } catch (error) {
        toast.error("Failed to update candidate");
        console.error("Error updating candidate:", error);
      } finally {
        setLoadingRowId(null);
      }
    },
    [apiPath]
  );

  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        await api.delete(`${apiPath}/${id}`);
        setCandidates((prevCandidates) =>
          prevCandidates.filter((candidate) => candidate.id !== id)
        );
        if (gridRef.current) {
          gridRef.current.api.applyTransaction({ remove: [{ id }] });
        }
        toast.success("Candidate deleted successfully");
      } catch (error) {
        toast.error("Failed to delete candidate");
        console.error("Error deleting candidate:", error);
      }
    },
    [apiPath]
  );

  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedWorkStatuses([]);
    setSelectedBatches([]);
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() => fetchCandidates(searchTerm, searchBy, sortModel, filterModel)}
          className="ml-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        .filter-dropdown {
          scrollbar-width: thin;
        }
        .filter-dropdown::-webkit-scrollbar {
          width: 8px;
        }
        .filter-dropdown::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .filter-dropdown::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .filter-dropdown::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>

      <Toaster position="top-center" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidates Management
          </h1>
          <div className="mt-2 sm:mt-0 sm:max-w-md">
            <Label
              htmlFor="search"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Search Candidates
            </Label>
            <div className="relative mt-1">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                ref={searchInputRef}
                placeholder="Search by ID, name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 text-sm sm:text-base"
              />
            </div>
            {(searchTerm || hasActiveFilters) && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {hasActiveFilters
                  ? `${displayCount} of ${totalCount} candidates shown (filtered)`
                  : `${displayCount} candidates found`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center">
       
        <AGGridTable
          key={`grid-${selectedStatuses.join(",")}-${selectedWorkStatuses.join(",")}-${selectedBatches.map((b) => b.batchid).join(",")}`}
          rowData={loading ? undefined : filteredCandidates}
          title={`Candidates (${displayCount}${hasActiveFilters ? ` of ${totalCount}` : ""})`}
          columnDefs={columnDefs}
          onRowAdded={async (newRow: any) => {
            try {
              const payload = {
                full_name: toPascalCase(newRow.full_name || newRow.fullname || newRow.name || ""),
                email: newRow.email || newRow.candidate_email || newRow.secondaryemail || "",
                phone: cleanPhoneNumber(newRow.phone || newRow.phone_number || newRow.contact || ""),
                dob: newRow.dob || newRow.date_of_birth || null,
                batchid: Number(newRow.batchid) || 0,
                status: newRow.status || "active",
                workstatus: newRow.workstatus || "Waiting for Status",
                enrolled_date: newRow.enrolled_date || new Date().toISOString().split("T")[0],
                education: newRow.education || "",
                workexperience: newRow.workexperience || "",
                ssn: newRow.ssn || "",
                agreement: newRow.agreement || "N",
                secondaryemail: newRow.secondaryemail || newRow.secondary_email || "",
                secondaryphone: cleanPhoneNumber(newRow.secondaryphone || newRow.secondary_phone || ""),
                address: newRow.address || "",
                linkedin_id: newRow.linkedin_id || newRow.linkedin || "",
                emergcontactname: toPascalCase(newRow.emergcontactname || ""),
                emergcontactemail: newRow.emergcontactemail || "",
                emergcontactphone: cleanPhoneNumber(newRow.emergcontactphone || ""),
                emergcontactaddrs: newRow.emergcontactaddrs || "",
                fee_paid: Number(newRow.fee_paid) || 0,
                github_link: newRow.github_link || newRow.github || "",
                candidate_folder: newRow.candidate_folder || "",
                notes: newRow.notes || "",
              };
              if (!payload.full_name || !payload.email || !payload.phone || !payload.dob || !payload.batchid) {
                toast.error("Full Name, Email, Phone, Date of Birth, and Batch are required");
                return;
              }
              await api.post(apiPath, payload);
              toast.success("Candidate created successfully");
              await fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
            } catch (err: any) {
              const message = err?.response?.data?.message || err?.message || "Failed to create candidate";
              toast.error(message);
              console.error("Error creating candidate via grid add:", err);
            }
          }}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          showFilters={true}
          getRowNodeId={(data) => data.id.toString()}
          showSearch={true}
          batches={allBatches}
          loading={loading}
          height="600px"
          gridOptions={gridOptions}
          overlayNoRowsTemplate={
            loading ? "" : '<span class="ag-overlay-no-rows-center">No candidates found</span>'
          }
        />
      </div>

      {/* Add New Candidate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-2 sm:p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 py-2 sm:px-4 sm:py-2 md:px-6">
              <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-sm font-semibold text-transparent sm:text-base md:text-lg">
                Add New Candidate
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
              >
                <X size={16} className="sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="bg-white p-3 sm:p-4 md:p-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                  {/* Full Name */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Full Name <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("full_name", {
                        required: "Full name is required",
                        maxLength: { value: 100, message: "Full name cannot exceed 100 characters" },
                      })}
                      placeholder="Enter full name"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Email <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address" },
                      })}
                      placeholder="Enter email"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Phone <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register("phone", {
                        required: "Phone is required",
                        validate: (value) => {
                          const cleaned = cleanPhoneNumber(value);
                          return cleaned.length >= 10 || "Phone number must be at least 10 digits";
                        },
                      })}
                      onInput={handlePhoneInput}
                      placeholder="(555) 123-4567"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Date of Birth <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="date"
                      {...register("dob", { required: "Date of birth is required" })}
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.dob && (
                      <p className="mt-1 text-xs text-red-600">{errors.dob.message}</p>
                    )}
                  </div>

                  {/* Batch */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Batch <span className="text-red-700">*</span>
                    </label>
                    {batchesLoading ? (
                      <p className="text-xs text-gray-500">Loading batches...</p>
                    ) : (
                      <select
                        {...register("batchid", {
                          required: "Batch is required",
                          validate: (value) => value !== 0 || "Please select a batch",
                        })}
                        className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      >
                        <option value="0">Select a batch</option>
                        {mlBatches.map((batch) => (
                          <option key={batch.batchid} value={batch.batchid}>
                            {batch.batchname}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.batchid && (
                      <p className="mt-1 text-xs text-red-600">{errors.batchid.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Status</label>
                    <select
                      {...register("status")}
                      className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Work Status */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Work Status</label>
                    <select
                      {...register("workstatus")}
                      className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    >
                      {workStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Education */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Education</label>
                    <input
                      type="text"
                      {...register("education")}
                      placeholder="Enter education"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* Work Experience */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Work Experience</label>
                    <input
                      type="text"
                      {...register("workexperience")}
                      placeholder="Enter work experience"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* SSN */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">SSN</label>
                    <input
                      type="password"
                      {...register("ssn")}
                      placeholder="Enter SSN"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* Agreement */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Agreement</label>
                    <select
                      {...register("agreement")}
                      className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </div>

                  {/* Secondary Email */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Secondary Email</label>
                    <input
                      type="email"
                      {...register("secondaryemail")}
                      placeholder="Enter secondary email"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* Secondary Phone */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Secondary Phone</label>
                    <input
                      type="tel"
                      {...register("secondaryphone")}
                      onInput={handlePhoneInput}
                      placeholder="(555) 123-4567"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* LinkedIn ID */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">LinkedIn ID</label>
                    <input
                      type="text"
                      {...register("linkedin_id")}
                      placeholder="Enter LinkedIn ID"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* Fee Paid */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Fee Paid ($)</label>
                    <input
                      type="number"
                      {...register("fee_paid", {
                        valueAsNumber: true,
                        min: { value: 0, message: "Fee paid cannot be negative" },
                      })}
                      placeholder="0"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.fee_paid && (
                      <p className="mt-1 text-xs text-red-600">{errors.fee_paid.message}</p>
                    )}
                  </div>

                  {/* Enrolled Date */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Enrolled Date</label>
                    <input
                      type="date"
                      {...register("enrolled_date")}
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* Emergency Contact Section */}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4 lg:col-span-4">
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        {...register("emergcontactname")}
                        placeholder="Enter emergency contact name"
                        className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                        Emergency Contact Email
                      </label>
                      <input
                        type="email"
                        {...register("emergcontactemail")}
                        placeholder="Enter emergency contact email"
                        className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        {...register("emergcontactphone", {
                          validate: (value) => {
                            if (!value) return true;
                            const cleaned = cleanPhoneNumber(value);
                            return cleaned.length >= 10 || "Phone number must be at least 10 digits";
                          },
                        })}
                        onInput={handlePhoneInput}
                        placeholder="(555) 123-4567"
                        className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      />
                      {errors.emergcontactphone && (
                        <p className="mt-1 text-xs text-red-600">{errors.emergcontactphone.message}</p>
                      )}
                    </div>
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs font-bold text-blue-700 sm:text-sm">Candidate Folder</label>
                      <input
                        type="text"
                        {...register("candidate_folder")}
                        placeholder="Google Drive/Dropbox link"
                        className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1 sm:space-y-1.5 lg:col-span-2">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Address</label>
                    <input
                      type="text"
                      {...register("address")}
                      placeholder="Enter address"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* Emergency Contact Address */}
                  <div className="space-y-1 sm:space-y-1.5 lg:col-span-2">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Emergency Contact Address
                    </label>
                    <input
                      type="text"
                      {...register("emergcontactaddrs")}
                      placeholder="Enter emergency contact address"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1 sm:space-y-1.5 lg:col-span-4">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">Notes</label>
                    <textarea
                      {...register("notes")}
                      placeholder="Enter notes..."
                      className="min-h-[60px] w-full resize-y rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="mt-3 flex justify-end gap-2 border-t border-blue-200 pt-2 sm:mt-4 sm:gap-3 sm:pt-3 md:mt-6 md:pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-md transition hover:from-cyan-600 hover:to-blue-600 sm:px-5 sm:py-2 sm:text-sm"
                  >
                    Save Candidate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}