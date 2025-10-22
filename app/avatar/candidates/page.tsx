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
import axios from "axios";
import Link from "next/link";
import { useForm } from "react-hook-form";

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

const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    active:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    inactive:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    discontinued:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
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
    citizen:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    visa: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "permanent resident":
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    ead: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    "waiting for status":
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <Badge
      className={`${variantMap[workstatus] || variantMap.default} capitalize`}
    >
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
      className="text-black-600 cursor-pointer font-medium hover:text-blue-800"
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
  renderOption = (option: any) => option,
  getOptionValue = (option: any) => option,
  getOptionKey = (option: any) => option,
}: {
  selectedItems: any[];
  setSelectedItems: React.Dispatch<React.SetStateAction<any[]>>;
  options: any[];
  label: string;
  color?: string;
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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
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

  const isAllSelected =
    selectedItems.length === options.length && options.length > 0;
  const isIndeterminate =
    selectedItems.length > 0 && selectedItems.length < options.length;

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
      window.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true,
      });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">{label}</span>
      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedItems.length > 0 && (
          <span
            className={`${colorMap[color]} min-w-[20px] rounded-full px-2 py-0.5 text-center text-xs text-white`}
          >
            {selectedItems.length}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-500 hover:text-gray-700"
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
                className="font-medium,text-sm flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              const isSelected = selectedItems.some(
                (i) => getOptionValue(i) === value
              );
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
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState("all");
  const [sortModel, setSortModel] = useState([
    { colId: "enrolled_date", sort: "desc" as "desc" },
  ]);
  const [filterModel, setFilterModel] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(isNewCandidate);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [mlBatches, setMlBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Batch[]>([]);
  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/candidates`,
    []
  );

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

  const gridOptions = useMemo(
    () => ({
      defaultColDef: {
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
      },
      suppressRowClickSelection: true,
      rowSelection: "single",
    }),
    []
  );

  const courseId = "3";

  useEffect(() => {
    const newCandidateParam = searchParams.get("newcandidate") === "true";
    setIsModalOpen(newCandidateParam);
  }, [searchParams]);

  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    return `+1 ${phoneNumberString}`;
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
        cellRenderer: CandidateNameRenderer,
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        editable: true,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          const formattedPhone = formatPhoneNumber(params.value);
          return (
            <a
              href={`tel:${params.value}`}
              className="text-blue-600 underline hover:text-blue-800"
            >
              {formattedPhone}
            </a>
          );
        },
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
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => {
          const batch = params.data?.batch;
          return batch ? batch.batchname : "N/A";
        },
        headerComponent: (props: any) => (
          <FilterHeaderComponent
            {...props}
            selectedItems={selectedBatches}
            setSelectedItems={setSelectedBatches}
            options={mlBatches}
            label="Batch"
            color="purple"
            renderOption={(option: Batch) => option.batchname}
            getOptionValue={(option: Batch) => option}
            getOptionKey={(option: Batch) => option.batchid}
          />
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: StatusRenderer,
        headerComponent: (props: any) => (
          <FilterHeaderComponent
            {...props}
            selectedItems={selectedStatuses}
            setSelectedItems={setSelectedStatuses}
            options={statusOptions}
            label="Status"
            color="blue"
            renderOption={(option) => <StatusRenderer value={option} />}
            getOptionValue={(option) => option}
            getOptionKey={(option) => option}
          />
        ),
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        width: 150,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: WorkStatusRenderer,
        headerComponent: (props: any) => (
          <FilterHeaderComponent
            {...props}
            selectedItems={selectedWorkStatuses}
            setSelectedItems={setSelectedWorkStatuses}
            options={workStatusOptions}
            label="Work Status"
            color="green"
            renderOption={(option) => option}
            getOptionValue={(option) => option}
            getOptionKey={(option) => option}
          />
        ),
      },
      {
        field: "enrolled_date",
        headerName: "Enrolled Date",
        width: 150,
        sortable: true,
        filter: "agTextColumnFilter",
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
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          const formattedPhone = formatPhoneNumber(params.value);
          return (
            <a
              href={`tel:${params.value}`}
              className="text-blue-600 underline hover:text-purple-800"
            >
              {formattedPhone}
            </a>
          );
        },
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
          return (
            <a
              href={`https://linkedin.com/in/${params.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-purple-800"
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
        filter: "agTextColumnFilter",
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
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          const formattedPhone = formatPhoneNumber(params.value);
          return (
            <a
              href={`tel:${params.value}`}
              className="text-blue-600 underline hover:text-purple-800"
            >
              {formattedPhone}
            </a>
          );
        },
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
        cellClass: (params) =>
          params.value && params.value > 0 ? "text-green-500 " : "",
        valueFormatter: ({ value }: ValueFormatterParams) =>
          value != null ? `$${Number(value).toLocaleString()}` : "",
        cellStyle: { textAlign: "right" },
      },
      {
        field: "move_to_prep",
        headerName: "Move to Prep",
        width: 150,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => (
          <span>{params.value ? "Yes" : "No"}</span>
        ),
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
    [allBatches, selectedStatuses, selectedWorkStatuses, selectedBatches]
  );

  const fetchCandidates = useCallback(
    async (
      search?: string,
      searchBy: string = "all",
      sort: any[] = [{ colId: "enrolled_date", sort: "desc" }],
      filters: any = {}
    ) => {
      setLoading(true);
      try {
        let url = `${apiEndpoint}?limit=0`;
        if (search && search.trim()) {
          url += `&search=${encodeURIComponent(
            search.trim()
          )}&search_by=${searchBy}`;
        }
        const sortToApply =
          sort && sort.length > 0
            ? sort
            : [{ colId: "enrolled_date", sort: "desc" }];
        const sortParam = sortToApply
          .map((s) => `${s.colId}:${s.sort}`)
          .join(",");
        url += `&sort=${encodeURIComponent(sortParam)}`;
        if (Object.keys(filters).length > 0) {
          url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
        }
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCandidates(data.data);
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Failed to load candidates";
        setError(error);
        toast.error(error);
      } finally {
        setLoading(false);
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    },
    [apiEndpoint]
  );

  const getWorkStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "waiting for status":
        return { backgroundColor: "#FFEDD5", color: "#C2410C" };
      case "citizen":
        return { backgroundColor: "#D1FAE5", color: "#065F46" };
      case "visa":
        return { backgroundColor: "#DBEAFE", color: "#1D4ED8" };
      case "others":
        return { backgroundColor: "#F3E8FF", color: "#7C3AED" };
      case "ead":
        return { backgroundColor: "#FEF3C7", color: "#92400E" };
      default:
        return { backgroundColor: "white", color: "black" };
    }
  };

  useEffect(() => {
    const fetchBatches = async () => {
      setBatchesLoading(true);
      try {
        const token = localStorage.getItem("accesstoken");
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/batch`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const sortedAllBatches = [...res.data].sort(
          (a: Batch, b: Batch) => b.batchid - a.batchid
        );
        setAllBatches(sortedAllBatches);
        const uniqueSubjects = [
          ...new Set(sortedAllBatches.map((batch) => batch.subject)),
        ];
        const uniqueCourseIds = [
          ...new Set(sortedAllBatches.map((batch) => batch.courseid)),
        ];
        console.log(" Available subjects:", uniqueSubjects);
        console.log(" Available course IDs:", uniqueCourseIds);
        console.log(" Total batches:", sortedAllBatches.length);
        let mlBatchesOnly = sortedAllBatches.filter((batch) => {
          const subject = batch.subject?.toLowerCase();
          return (
            subject === "ml" ||
            subject === "machine learning" ||
            subject === "machinelearning" ||
            subject?.includes("ml")
          );
        });
        if (mlBatchesOnly.length === 0) {
          console.log("No ML batches found by subject, trying courseid = 3");
          mlBatchesOnly = sortedAllBatches.filter(
            (batch) => batch.courseid === 3
          );
        }
        if (mlBatchesOnly.length === 0) {
          console.warn(
            "No ML batches found! Showing all batches in form as fallback"
          );
          mlBatchesOnly = sortedAllBatches;
        }
        console.log(" Filtered ML batches for form:", mlBatchesOnly.length);
        setMlBatches(mlBatchesOnly);
        if (
          isModalOpen &&
          mlBatchesOnly.length > 0 &&
          mlBatchesOnly[0]?.batchid
        ) {
          setValue('batchid', mlBatchesOnly[0].batchid);
        }
      } catch (error) {
        console.error("Failed to load batches:", error);
      } finally {
        setBatchesLoading(false);
      }
    };
    fetchBatches();
  }, [courseId, isModalOpen, setValue]);

  useEffect(() => {
    let filtered = [...candidates];
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((candidate) =>
        selectedStatuses.some(
          (status) =>
            status.toLowerCase() === (candidate.status || "").toLowerCase()
        )
      );
    }
    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((candidate) =>
        selectedWorkStatuses.some(
          (ws) =>
            ws.toLowerCase() === (candidate.workstatus || "").toLowerCase()
        )
      );
    }
    if (selectedBatches.length > 0) {
      filtered = filtered.filter((candidate) =>
        selectedBatches.some((batch) => batch.batchid === candidate.batchid)
      );
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.full_name?.toLowerCase().includes(term) ||
          candidate.email?.toLowerCase().includes(term) ||
          candidate.phone?.toLowerCase().includes(term) ||
          (candidate.id?.toString() || "").includes(term)
      );
    }
    setFilteredCandidates(filtered);
  }, [
    candidates,
    selectedStatuses,
    selectedWorkStatuses,
    selectedBatches,
    searchTerm,
  ]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const autoSearchBy = detectSearchBy(searchTerm);
        fetchCandidates(searchTerm, autoSearchBy, sortModel, filterModel);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchBy, sortModel, filterModel, fetchCandidates]);

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
        enrolled_date: data.enrolled_date || new Date().toISOString().split("T")[0],
        status: data.status || "active",
        workstatus: data.workstatus || "Waiting for Status",
        agreement: data.agreement || "N",
        fee_paid: data.fee_paid || 0,
      };
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create candidate");
      }
      const newCandidate = await response.json();
      const updated = [...candidates, newCandidate].sort((a, b) =>
        new Date(b.enrolled_date || 0).getTime() - new Date(a.enrolled_date || 0).getTime()
      );
      setCandidates(updated);
      setFilteredCandidates(updated);
      toast.success(`Candidate created successfully with ID: ${newCandidate.id}`, { position: "top-center" });
      setIsModalOpen(false);
      reset();
      router.push("/avatar/candidates");
    } catch (error) {
      toast.error("Failed to create candidate: " + (error as Error).message, { position: "top-center" });
      console.error("Error creating candidate:", error);
    }
  };

  const handleOpenModal = () => {
    router.push("/avatar/candidates?newcandidate=true", { scroll: false });
    setIsModalOpen(true);
    if (mlBatches.length > 0) {
      const latestBatch = mlBatches[0];
      setValue('batchid', latestBatch?.batchid);
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
        const { id, ...payload } = updatedRow;
        const response = await fetch(`${apiEndpoint}/${updatedRow.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update candidate");
        setCandidates((prevCandidates) =>
          prevCandidates.map((candidate) =>
            candidate.id === updatedRow.id ? { ...candidate, ...payload } : candidate
          )
        );
        if (gridRef.current) {
          const rowNode = gridRef.current.api.getRowNode(id.toString());
          if (rowNode) {
            rowNode.setData({ ...updatedRow, ...payload });
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
    [apiEndpoint]
  );

  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete candidate");
        setCandidates((prevCandidates) => prevCandidates.filter((candidate) => candidate.id !== id));
        if (gridRef.current) {
          gridRef.current.api.applyTransaction({ remove: [{ id }] });
        }
        toast.success("Candidate deleted successfully");
      } catch (error) {
        toast.error("Failed to delete candidate");
        console.error("Error deleting candidate:", error);
      }
    },
    [apiEndpoint]
  );

  const handleFilterChanged = useCallback(
    (filterModelFromGrid: any) => {
      setFilterModel(filterModelFromGrid);
      fetchCandidates(searchTerm, searchBy, sortModel, filterModelFromGrid);
    },
    [searchTerm, searchBy, sortModel, fetchCandidates]
  );

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() =>
            fetchCandidates(searchTerm, searchBy, sortModel, filterModel)
          }
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
          {/* <p className="text-gray-600 dark:text-gray-400">
            All Candidates ({candidates.length})
            {selectedStatuses.length > 0 ||
              selectedWorkStatuses.length > 0 ||
              selectedBatches.length > 0 ? (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                - Filtered ({filteredCandidates.length} shown)
              </span>
            ) : (
              " - Sorted by latest first"
            )}
          </p> */}
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
            {searchTerm && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filteredCandidates.length} candidates found
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-row items-center gap-2 sm:mt-0">
          <Button
            onClick={handleOpenModal}
            className="whitespace-nowrap bg-green-600 text-white hover:bg-green-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Candidate
          </Button>
        </div>
      </div>
      <div className="flex w-full justify-center">
        <AGGridTable
          key={`${filteredCandidates.length}-${selectedStatuses.join(
            ","
          )}-${selectedWorkStatuses.join(",")}-${selectedBatches
            .map((b) => b.batchid)
            .join(",")}`}
          rowData={loading ? undefined : filteredCandidates}
          title={`Candidates (${filteredCandidates.length})`}
          columnDefs={columnDefs}
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
            loading
              ? ""
              : '<span class="ag-overlay-no-rows-center">No candidates found</span>'
          }
        />
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2 sm:py-2 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add New Candidate
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 md:p-6 bg-white">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Full Name <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("full_name", {
                        required: "Full name is required",
                        maxLength: {
                          value: 100,
                          message: "Full name cannot exceed 100 characters"
                        }
                      })}
                      placeholder="Enter full name"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                    {errors.full_name && (
                      <p className="text-red-600 text-xs mt-1">{errors.full_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Email <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Invalid email address"
                        }
                      })}
                      placeholder="Enter email"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Phone <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register("phone", {
                        required: "Phone is required",
                        pattern: {
                          value: /^\d+$/,
                          message: "Phone must contain only numbers"
                        }
                      })}
                      placeholder="Enter phone number"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Date of Birth <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="date"
                      {...register("dob", {
                        required: "Date of birth is required"
                      })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                    {errors.dob && (
                      <p className="text-red-600 text-xs mt-1">{errors.dob.message}</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Batch <span className="text-red-700">*</span>
                    </label>
                    {batchesLoading ? (
                      <p className="text-gray-500 text-xs">Loading batches...</p>
                    ) : (
                      <select
                        {...register("batchid", {
                          required: "Batch is required",
                          validate: value => value !== 0 || "Please select a batch"
                        })}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
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
                      <p className="text-red-600 text-xs mt-1">{errors.batchid.message}</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Status
                    </label>
                    <select
                      {...register("status")}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Work Status
                    </label>
                    <select
                      {...register("workstatus")}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                    >
                      {workStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Education
                    </label>
                    <input
                      type="text"
                      {...register("education")}
                      placeholder="Enter education"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Work Experience
                    </label>
                    <input
                      type="text"
                      {...register("workexperience")}
                      placeholder="Enter work experience"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      SSN
                    </label>
                    <input
                      type="password"
                      {...register("ssn")}
                      placeholder="Enter SSN"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Agreement
                    </label>
                    <select
                      {...register("agreement")}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Secondary Email
                    </label>
                    <input
                      type="email"
                      {...register("secondaryemail")}
                      placeholder="Enter secondary email"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Secondary Phone
                    </label>
                    <input
                      type="tel"
                      {...register("secondaryphone")}
                      placeholder="Enter secondary phone"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      LinkedIn ID
                    </label>
                    <input
                      type="text"
                      {...register("linkedin_id")}
                      placeholder="Enter LinkedIn ID"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Fee Paid ($)
                    </label>
                    <input
                      type="number"
                      {...register("fee_paid", {
                        valueAsNumber: true,
                        min: {
                          value: 0,
                          message: "Fee paid cannot be negative"
                        }
                      })}
                      placeholder="0"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                    {errors.fee_paid && (
                      <p className="text-red-600 text-xs mt-1">{errors.fee_paid.message}</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Enrolled Date
                    </label>
                    <input
                      type="date"
                      {...register("enrolled_date")}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      {...register("emergcontactname")}
                      placeholder="Enter emergency contact name"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Emergency Contact Email
                    </label>
                    <input
                      type="email"
                      {...register("emergcontactemail")}
                      placeholder="Enter emergency contact email"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      {...register("emergcontactphone")}
                      placeholder="Enter emergency contact phone"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Address
                    </label>
                    <input
                      type="text"
                      {...register("address")}
                      placeholder="Enter address"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Emergency Contact Address
                    </label>
                    <input
                      type="text"
                      {...register("emergcontactaddrs")}
                      placeholder="Enter emergency contact address"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Candidate Folder
                    </label>
                    <input
                      type="text"
                      {...register("candidate_folder")}
                      placeholder="Google Drive/Dropbox link"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Notes
                    </label>
                    <textarea
                      {...register("notes")}
                      placeholder="Enter notes..."
                      rows={1}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
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