

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
import { createPortal } from "react-dom";
import axios from "axios";
import Link from "next/link";

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
  notes?: string | null;
  batchid: number;
  candidate_folder?: string | null;
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
  notes: string;
  batchid: number;
  candidate_folder: string;
};

type Batch = {
  batchid: number;
  batchname: string;
};


const statusOptions = ["active", "discontinued", "break", "closed"];
const workStatusOptions = [
  "Waiting for Status",
  "Citizen",
  "Visa",
  "others",
  "Permanent resident",
  "EAD"
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
  notes: "",
  batchid: 0,
  candidate_folder: "",
};

// Status Renderer
const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
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
      className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
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
  getOptionKey = (option: any) => option
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
      const isSelected = prev.some(i => getOptionValue(i) === value);
      return isSelected
        ? prev.filter(i => getOptionValue(i) !== value)
        : [...prev, item];
    });
  }
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
    <div className="relative flex items-center w-full">
      <span className="mr-2 flex-grow">{label}</span>
      <div
        ref={filterButtonRef}
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
        onClick={toggleFilter}
      >
        {selectedItems.length > 0 && (
          <span className={`${colorMap[color]} text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center`}>
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
            className="fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600 filter-dropdown"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: "300px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b pb-2 mb-2">
              <label
                className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded font-medium"
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
              const isSelected = selectedItems.some(i => getOptionValue(i) === value);

              return (
                <label
                  key={key}
                  className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
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
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItems([]);
                  }}
                  className="w-full text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 py-1"
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

// Main Component
export default function CandidatesPage() {
  const gridRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewCandidate = searchParams.get("newcandidate") === "true";

  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState("all");
  const [sortModel, setSortModel] = useState([{ colId: 'enrolled_date', sort: 'desc' as 'desc' }]);
  const [filterModel, setFilterModel] = useState({});
  const [newCandidateForm, setNewCandidateForm] = useState(isNewCandidate);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Batch[]>([]);

  // API Endpoints
  const apiEndpoint = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL}/candidates`, []);
  const courseId = "3";

  // Sync form visibility with URL
  useEffect(() => {
    const newCandidateParam = searchParams.get("newcandidate") === "true";
    setNewCandidateForm(newCandidateParam);
  }, [searchParams]);

  // Fetch candidates
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
        url += `&search=${encodeURIComponent(search.trim())}&search_by=${searchBy}`;
      }

      const sortToApply =
        sort && sort.length > 0 ? sort : [{ colId: "enrolled_date", sort: "desc" }];
      const sortParam = sortToApply.map((s) => `${s.colId}:${s.sort}`).join(",");
      url += `&sort=${encodeURIComponent(sortParam)}`;

      if (Object.keys(filters).length > 0) {
        url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
      }

      // 🔑 Get token from localStorage (or cookies/session depending on your auth setup)
      const token = localStorage.getItem("token");

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,  // pass token here
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


  // Fetch batches
useEffect(() => {
  const fetchBatches = async () => {
    setBatchesLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No access token found");
        setBatchesLoading(false);
        return;
      }

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/batch?course=${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sortedBatches = [...res.data].sort((a: Batch, b: Batch) => b.batchid - a.batchid);
      setBatches(sortedBatches);

      if (isNewCandidate && sortedBatches.length > 0) {
        setFormData(prev => ({
          ...prev,
          batchid: sortedBatches[0].batchid
        }));
      }
    } catch (error) {
      console.error("Failed to load batches", error);
    } finally {
      setBatchesLoading(false);
    }
  };

  fetchBatches();
}, [courseId, isNewCandidate]);


  useEffect(() => {
    let filtered = [...candidates];
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(candidate =>
        selectedStatuses.some(status => status.toLowerCase() === (candidate.status || "").toLowerCase())
      );
    }
    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter(candidate =>
        selectedWorkStatuses.some(ws => ws.toLowerCase() === (candidate.workstatus || "").toLowerCase())
      );
    }
    if (selectedBatches.length > 0) {
      filtered = filtered.filter(candidate =>
        selectedBatches.some(batch => batch.batchid === candidate.batchid)
      );
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(candidate =>
        candidate.full_name?.toLowerCase().includes(term) ||
        candidate.email?.toLowerCase().includes(term) ||
        candidate.phone?.toLowerCase().includes(term) ||
        candidate.id.toString().includes(term)
      );
    }
    setFilteredCandidates(filtered);
  }, [candidates, selectedStatuses, selectedWorkStatuses, selectedBatches, searchTerm]);

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

  const handleOpenNewCandidateForm = () => {
    router.push("/avatar/candidates?newcandidate=true", { scroll: false });
    setNewCandidateForm(true);

    if (batches.length > 0) {
      const latestBatch = batches[0];
      setFormData(prev => ({
        ...prev,
        batchid: latestBatch.batchid
      }));
    }
  };

  const handleCloseNewCandidateForm = () => {
    router.push("/avatar/candidates", { scroll: false });
    setNewCandidateForm(false);
    setFormData(initialFormData);
  };

  const handleNewCandidateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked ? 'Y' : 'N' }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNewCandidateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setFormSaveLoading(true);
    try {
      const payload = {
        ...formData,
        enrolled_date: formData.enrolled_date || new Date().toISOString().split('T')[0],
        status: formData.status || "active",
        workstatus: formData.workstatus || "Waiting for Status",
        agreement: formData.agreement || "N",
        fee_paid: formData.fee_paid || 0
      };
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create candidate");
      }
      const newId = await response.json();
      toast.success(`Candidate created successfully with ID: ${newId}`);
      setNewCandidateForm(false);
      setFormData(initialFormData);
      fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
    } catch (error) {
      toast.error("Failed to create candidate: " + (error as Error).message);
      console.error("Error creating candidate:", error);
    } finally {
      setFormSaveLoading(false);
    }
  };

  const handleRowUpdated = useCallback(async (updatedRow: Candidate) => {
    setLoadingRowId(updatedRow.id);
    try {
      const updatedData = { ...updatedRow };
      if (!updatedData.status || updatedData.status === '') {
        updatedData.status = 'active';
      }
      const { id, ...payload } = updatedData;
      const response = await fetch(`${apiEndpoint}/${updatedRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update candidate");
      fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
      toast.success("Candidate updated successfully");
    } catch (error) {
      toast.error("Failed to update candidate");
      console.error("Error updating candidate:", error);
    } finally {
      setLoadingRowId(null);
    }
  }, [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchCandidates]);

  const handleRowDeleted = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete candidate");
      toast.success("Candidate deleted successfully");
      fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
    } catch (error) {
      toast.error("Failed to delete candidate");
      console.error("Error deleting candidate:", error);
    }
  }, [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchCandidates]);

  const handleFilterChanged = useCallback((filterModelFromGrid: any) => {
    setFilterModel(filterModelFromGrid);
    fetchCandidates(searchTerm, searchBy, sortModel, filterModelFromGrid);
  }, [searchTerm, searchBy, sortModel, fetchCandidates]);

  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
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
      timeZone:"UTC"
    });
  };

  // Column Definitions
  const columnDefs: ColDef<any, any>[] = useMemo(() => [
    {
      field: "id",
      headerName: "ID",
      width: 80,
      pinned: "left",
      sortable: true
    },
    {
      field: "full_name",
      headerName: "Full Name",
      width: 180,
      sortable: true,
      cellRenderer: CandidateNameRenderer,
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      editable: true,
      sortable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return "";
        const formattedPhone = formatPhoneNumber(params.value);
        return (
          <a href={`tel:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
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
      field: "batchid",
      headerName: "Batch",
      width: 140,
      sortable: true,
      cellRenderer: (params: any) => {
        if (!params.value || !batches.length) return params.value || "";
        const batch = batches.find(b => b.batchid === params.value);
        return batch ? (
          <span title={`Batch ID: ${params.value}`}>
            {batch.batchname}
          </span>
        ) : params.value;
      },
      headerComponent: (props: any) => (
        <FilterHeaderComponent
          {...props}
          selectedItems={selectedBatches}
          setSelectedItems={setSelectedBatches}
          options={batches}
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
      valueFormatter: ({ value }: ValueFormatterParams) => formatDate(value),
    },
    {
      field: "education",
      headerName: "Education",
      width: 200,
      sortable: true,
    },
    {
      field: "workexperience",
      headerName: "Work Experience",
      width: 200,
      sortable: true,
    },
    {
      field: "ssn",
      headerName: "SSN",
      width: 120,
      sortable: true,
    },
    {
      field: "agreement",
      headerName: "Agreement",
      width: 100,
      sortable: true,
    },
    {
      field: "secondaryemail",
      headerName: "Secondary Email",
      width: 200,
      sortable: true,
    },
    {
      field: "secondaryphone",
      headerName: "Secondary Phone",
      width: 150,
      sortable: true,
    },
    {
      field: "address",
      headerName: "Address",
      width: 300,
      sortable: true,
    },
    {
      field: "linkedin_id",
      headerName: "LinkedIn ID",
      width: 150,
      sortable: true,
    },
{
  field: "dob",
  headerName: "Date of Birth",
  width: 150,
  sortable: true,
  editable: true,
  valueFormatter: ({ value }: ValueFormatterParams) => formatDate(value),
  valueParser: (params) => {
    if (!params.newValue) return null;
   
    const date = new Date(params.newValue);
    return date.toISOString();
  },
  cellEditor: 'agDateCellEditor', // Use AG Grid's built-in date editor
  cellEditorParams: {
    // Optional: Configure the date picker format
    min: '1900-01-01', // Example: Set min date
    max: new Date().toISOString().split('T')[0] // Example: Set max date to today
  }
},
    {
      field: "emergcontactname",
      headerName: "Emergency Contact Name",
      width: 200,
      sortable: true,
    },
    {
      field: "emergcontactemail",
      headerName: "Emergency Contact Email",
      width: 200,
      sortable: true,
    },
    {
      field: "emergcontactphone",
      headerName: "Emergency Contact Phone",
      width: 150,
      sortable: true,
    },
    {
      field: "emergcontactaddrs",
      headerName: "Emergency Contact Address",
      width: 300,
      sortable: true,
    },
    {
      field: "fee_paid",
      headerName: "Fee Paid",
      width: 120,
      sortable: true,
      valueFormatter: ({ value }: ValueFormatterParams) => value != null ? `$${Number(value).toLocaleString()}` : "",
    },
    {
      field: "notes",
      headerName: "Notes",
      width: 300,
      sortable: true,
    },

    {
      field: "candidate_folder",
      headerName: "Candidate Folder",
      width: 200,
      sortable: true,
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
  ], [batches, selectedStatuses, selectedWorkStatuses, selectedBatches]);

  // Error handling
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
      {/* Add CSS for scrollable dropdowns */}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidates Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All Candidates ({candidates.length})
            {selectedStatuses.length > 0 || selectedWorkStatuses.length > 0 || selectedBatches.length > 0 ? (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                - Filtered ({filteredCandidates.length} shown)
              </span>
            ) : (
              " - Sorted by latest first"
            )}
          </p>
        </div>
        <Button
          onClick={handleOpenNewCandidateForm}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Candidate
        </Button>
      </div>

      {/* Search */}
      <div key="search-container" className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Candidates
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            key="search-input"
            id="search"
            type="text"
            ref={searchInputRef}
            placeholder="Search by ID, name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredCandidates.length} candidates found
          </p>
        )}
      </div>

      {/* AG Grid Table */}
      <div className="flex w-full justify-center">
        <AGGridTable
          key={`${filteredCandidates.length}-${selectedStatuses.join(',')}-${selectedWorkStatuses.join(',')}-${selectedBatches.map(b => b.batchid).join(',')}`}
          rowData={loading ? undefined : filteredCandidates}
          columnDefs={columnDefs}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          showFilters={true}
          showSearch={false}
          batches={batches}
          loading={loading}
          height="600px"
          overlayNoRowsTemplate={loading ? "" : '<span class="ag-overlay-no-rows-center">No candidates found</span>'}
        />
      </div>

      {/* New Candidate Form */}
      {newCandidateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-4xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
              New Candidate Form
            </h2>
            <form onSubmit={handleNewCandidateFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Row 1 */}
                <div className="space-y-1">
                  <Label htmlFor="full_name" className="block text-sm font-medium">Full Name *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleNewCandidateFormChange}
                    required
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="block text-sm font-medium">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleNewCandidateFormChange}
                    required
                    className="w-full h-10"
                  />
                </div>
                {/* Row 2 */}
                <div className="space-y-1">
                  <Label htmlFor="phone" className="block text-sm font-medium">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleNewCandidateFormChange}
                    required
                    placeholder="+1 (123) 456-7890"
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status" className="block text-sm font-medium">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10 p-2 border rounded-md"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Row 3 */}
                <div className="space-y-1">
                  <Label htmlFor="workstatus" className="block text-sm font-medium">Work Status</Label>
                  <select
                    id="workstatus"
                    name="workstatus"
                    value={formData.workstatus}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10 p-2 border rounded-md"
                  >
                    <option value="">Select Work Status</option>
                    {workStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="education" className="block text-sm font-medium">Education</Label>
                  <Input
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                {/* Row 4 */}
                <div className="space-y-1">
                  <Label htmlFor="workexperience" className="block text-sm font-medium">Work Experience</Label>
                  <Input
                    id="workexperience"
                    name="workexperience"
                    value={formData.workexperience}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="agreement" className="block text-sm font-medium">Agreement</Label>
                  <select
                    id="agreement"
                    name="agreement"
                    value={formData.agreement}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10 p-2 border rounded-md"
                  >
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </select>
                </div>
                {/* Row 5 */}
                <div className="space-y-1">
                  <Label htmlFor="ssn" className="block text-sm font-medium">SSN</Label>
                  <Input
                    id="ssn"
                    name="ssn"
                    type="password"
                    value={formData.ssn}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="secondaryemail" className="block text-sm font-medium">Secondary Email</Label>
                  <Input
                    id="secondaryemail"
                    name="secondaryemail"
                    type="email"
                    value={formData.secondaryemail}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                {/* Row 6 */}
                <div className="space-y-1">
                  <Label htmlFor="secondaryphone" className="block text-sm font-medium">Secondary Phone</Label>
                  <Input
                    id="secondaryphone"
                    name="secondaryphone"
                    type="tel"
                    value={formData.secondaryphone}
                    onChange={handleNewCandidateFormChange}
                    placeholder="+1 (123) 456-7890"
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="linkedin_id" className="block text-sm font-medium">LinkedIn ID</Label>
                  <Input
                    id="linkedin_id"
                    name="linkedin_id"
                    value={formData.linkedin_id}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                {/* Row 7 */}
                <div className="space-y-1">
                  <Label htmlFor="dob" className="block text-sm font-medium">Date of Birth *</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleNewCandidateFormChange}
                    required
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emergcontactname" className="block text-sm font-medium">Emergency Contact Name</Label>
                  <Input
                    id="emergcontactname"
                    name="emergcontactname"
                    value={formData.emergcontactname}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                {/* Row 8 */}
                <div className="space-y-1">
                  <Label htmlFor="emergcontactemail" className="block text-sm font-medium">Emergency Contact Email</Label>
                  <Input
                    id="emergcontactemail"
                    name="emergcontactemail"
                    type="email"
                    value={formData.emergcontactemail}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emergcontactphone" className="block text-sm font-medium">Emergency Contact Phone</Label>
                  <Input
                    id="emergcontactphone"
                    name="emergcontactphone"
                    type="tel"
                    value={formData.emergcontactphone}
                    onChange={handleNewCandidateFormChange}
                    placeholder="+1 (123) 456-7890"
                    className="w-full h-10"
                  />
                </div>
                {/* Row 9 - Full width fields */}
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="emergcontactaddrs" className="block text-sm font-medium">Emergency Contact Address</Label>
                  <Input
                    id="emergcontactaddrs"
                    name="emergcontactaddrs"
                    value={formData.emergcontactaddrs}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                {/* Row 10 */}
                <div className="space-y-1">
                  <Label htmlFor="fee_paid" className="block text-sm font-medium">Fee Paid ($)</Label>
                  <Input
                    id="fee_paid"
                    name="fee_paid"
                    type="number"
                    value={formData.fee_paid}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="batchid" className="block text-sm font-medium">Batch *</Label>
                  <select
                    id="batchid"
                    name="batchid"
                    value={formData.batchid}
                    onChange={handleNewCandidateFormChange}
                    required
                    className="w-full h-10 p-2 border rounded-md"
                    disabled={batchesLoading}
                  >
                    {batchesLoading ? (
                      <option value="0">Loading batches...</option>
                    ) : (
                      <>
                        <option value="0">Select a batch </option>
                        {batches.map((batch) => (
                          <option key={batch.batchid} value={batch.batchid}>
                            {batch.batchname}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                {/* Row 11 - Full width fields */}
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="notes" className="block text-sm font-medium">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleNewCandidateFormChange}
                    className="w-full p-2 border rounded-md min-h-[100px]"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="candidate_folder" className="block text-sm font-medium">Candidate Folder</Label>
                  <Input
                    id="candidate_folder"
                    name="candidate_folder"
                    value={formData.candidate_folder}
                    onChange={handleNewCandidateFormChange}
                    placeholder="Google Drive/Dropbox link"
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="enrolled_date" className="block text-sm font-medium">Enrolled Date</Label>
                  <Input
                    id="enrolled_date"
                    name="enrolled_date"
                    type="date"
                    value={formData.enrolled_date}
                    onChange={handleNewCandidateFormChange}
                    className="w-full h-10"
                  />
                </div>
              </div>
              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={formSaveLoading}
                  className={`w-full rounded-md py-2.5 text-sm font-medium transition duration-200 ${formSaveLoading
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                >
                  {formSaveLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
            <button
              onClick={handleCloseNewCandidateForm}
              className="absolute right-3 top-3 text-2xl leading-none text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
