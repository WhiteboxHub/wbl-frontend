

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

// Define types
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

// Status and WorkStatus options
const statusOptions = ["active", "discontinued", "break", "closed"];
const workStatusOptions = [
  "Waiting for Status",
  "Citizen",
  "Visa",
  "Permanent resident",
  "EAD"
];

// Initial form data
const initialFormData: FormData = {
  full_name: "",
  email: "",
  phone: "",
  status: "active",
  workstatus: "",
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

// ---------------- Status Renderer ----------------
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

// ---------------- WorkStatus Renderer ----------------
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

// ---------------- Status Filter Header Component ----------------
const StatusFilterHeaderComponent = (props: any) => {
  const { selectedStatuses, setSelectedStatuses } = props;
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

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev: string[]) => {
      const isSelected = prev.includes(status);
      return isSelected ? prev.filter((s) => s !== status) : [...prev, status];
    });
  };


  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedStatuses(e.target.checked ? [...statusOptions] : []);
  };

  const isAllSelected = selectedStatuses.length === statusOptions.length;
  const isIndeterminate = selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length;

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
    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);
  return (
    <div className="relative flex items-center w-full">
      <span className="mr-2 flex-grow">Status</span>
      <div
        ref={filterButtonRef}
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
        onClick={toggleFilter}
      >
        {selectedStatuses.length > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {selectedStatuses.length}
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
            className="fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: "300px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()} // ✅ prevent closing on inner clicks
          >
            {/* Select All */}
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

            {/* Individual options */}
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  onChange={() => handleStatusChange(status)}
                  className="mr-3"
                />
                <StatusRenderer value={status} />
              </label>
            ))}

            {/* Clear All */}
            {selectedStatuses.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatuses([]);
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

// ---------------- WorkStatus Filter Header Component ----------------
const WorkStatusFilterHeaderComponent = (props: any) => {
  const { selectedWorkStatuses, setSelectedWorkStatuses } = props;
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

  const handleWorkStatusChange = (workStatus: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedWorkStatuses((prev: string[]) => {
      return prev.includes(workStatus)
        ? prev.filter((s) => s !== workStatus)
        : [...prev, workStatus];
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedWorkStatuses(e.target.checked ? [...workStatusOptions] : []);
  };

  const isAllSelected = selectedWorkStatuses.length === workStatusOptions.length;
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
    const handleScroll = () => setFilterVisible(false);
    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex items-center w-full">
      <span className="mr-2 flex-grow">Work Status</span>
      <div
        ref={filterButtonRef}
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
        onClick={toggleFilter}
      >
        {selectedWorkStatuses.length > 0 && (
          <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {selectedWorkStatuses.length}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-500 hover:text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
        </svg>
      </div>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b pb-2 mb-2">
              <label className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded font-medium">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={handleSelectAll}
                  className="mr-3"
                />
                Select All
              </label>
            </div>
            {workStatusOptions.map((workStatus) => (
              <label
                key={workStatus}
                className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedWorkStatuses.includes(workStatus)}
                  onChange={(e) => handleWorkStatusChange(workStatus, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3"
                />
                {workStatus}
              </label>
            ))}
            {selectedWorkStatuses.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkStatuses([]);
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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);

  // API Endpoints
  const apiEndpoint = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL}/candidates`, []);
  const batchesEndpoint = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL}/batches`, []);

  // Sync form visibility with URL
  useEffect(() => {
    const newCandidateParam = searchParams.get("newcandidate") === "true";
    setNewCandidateForm(newCandidateParam);
  }, [searchParams]);

  // Fetch candidates
  const fetchCandidates = useCallback(async (
    search?: string,
    searchBy: string = "all",
    sort: any[] = [{ colId: 'enrolled_date', sort: 'desc' }],
    filters: any = {}
  ) => {
    setLoading(true);
    try {
      let url = `${apiEndpoint}?limit=0`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}&search_by=${searchBy}`;
      }
      const sortToApply = sort && sort.length > 0 ? sort : [{ colId: 'enrolled_date', sort: 'desc' }];
      const sortParam = sortToApply.map(s => `${s.colId}:${s.sort}`).join(',');
      url += `&sort=${encodeURIComponent(sortParam)}`;
      if (Object.keys(filters).length > 0) {
        url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setCandidates(data.data);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to load candidates";
      setError(error);
      toast.error(error);
    } finally {
      setLoading(false);
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  }, [apiEndpoint]);

  // Filter candidates locally
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
  }, [candidates, selectedStatuses, selectedWorkStatuses, searchTerm]);

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch(batchesEndpoint);
        if (!res.ok) throw new Error("Failed to fetch batches");
        const data = await res.json();
        setBatches(data.data || []);
      } catch (err) {
        // toast.error("Failed to load batches");
      }
    };
    fetchBatches();
  }, [batchesEndpoint]);

  // Initial data load
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Search debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const autoSearchBy = detectSearchBy(searchTerm);
        fetchCandidates(searchTerm, autoSearchBy, sortModel, filterModel);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchBy, sortModel, filterModel, fetchCandidates]);

  // Detect search field
  const detectSearchBy = (search: string) => {
    if (/^\d+$/.test(search)) return "id";
    if (/^\S+@\S+\.\S+$/.test(search)) return "email";
    if (/^[\d\s\+\-()]+$/.test(search)) return "phone";
    return "full_name";
  };

  // Handlers (unchanged from your original code)
  const handleOpenNewCandidateForm = () => {
    router.push("/avatar/candidates?newcandidate=true");
    setNewCandidateForm(true);
  };

  const handleCloseNewCandidateForm = () => {
    router.push("/avatar/candidates");
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
    setFormSaveLoading(true);
    try {
      const updatedData = { ...formData };
      if (!updatedData.status || updatedData.status === '') {
        updatedData.status = 'active';
      }
      if (!updatedData.enrolled_date) {
        updatedData.enrolled_date = new Date().toISOString().split('T')[0];
      }
      if (!updatedData.workstatus) {
        updatedData.workstatus = 'Waiting for Status';
      }
      if (!updatedData.agreement) {
        updatedData.agreement = 'N';
      }
      if (!updatedData.fee_paid) {
        updatedData.fee_paid = 0;
      }
      const payload = { ...updatedData };
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      const newId = await response.json();
      toast.success(`Candidate created successfully with ID: ${newId}`);
      setNewCandidateForm(false);
      setFormData(initialFormData);
      fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
    } catch (error) {
      toast.error("Failed to create candidate: " + error.message);
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
      sortable: true
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
      field: "enrolled_date",
      headerName: "Enrolled Date",
      width: 150,
      sortable: true,
      valueFormatter: ({ value }: ValueFormatterParams) => formatDate(value),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      sortable: true,
      cellRenderer: StatusRenderer,
      headerComponent: (props: any) => (
        <StatusFilterHeaderComponent
          {...props}
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
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
        <WorkStatusFilterHeaderComponent
          {...props}
          selectedWorkStatuses={selectedWorkStatuses}
          setSelectedWorkStatuses={setSelectedWorkStatuses}
        />
      ),
    },
    // ... (rest of your column definitions remain unchanged)
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
      valueFormatter: ({ value }: ValueFormatterParams) => formatDate(value),
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
      field: "batchid",
      headerName: "Batch",
      width: 140,
      sortable: true,
      cellRenderer: (params: any) => {
        if (!params.value || !batches.length) return params.value || "";
        const batch = batches.find(b => b.batchid === params.value);
        return batch ? batch.batchname : params.value;
      },
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
  ], [batches, selectedStatuses, selectedWorkStatuses]);

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
      <Toaster position="top-center" />
      <div className="flex items-center justify-between">
<div>
  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
    Candidates Management
  </h1>
  <p className="text-gray-600 dark:text-gray-400">
    All Candidates ({candidates.length})
    {selectedStatuses.length > 0 || selectedWorkStatuses.length > 0 ? (
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
          key={`${filteredCandidates.length}-${selectedStatuses.join(',')}-${selectedWorkStatuses.join(',')}`}
          rowData={loading ? undefined : filteredCandidates}
          columnDefs={columnDefs}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          showFilters={true}
          showSearch={false}
          loading={loading}
          height="600px"
          overlayNoRowsTemplate={loading ? "" : '<span class="ag-overlay-no-rows-center">No candidates found</span>'}

        />
      </div>

      {/* New Candidate Form (unchanged) */}
      {newCandidateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
              New Candidate Form
            </h2>
            <form onSubmit={handleNewCandidateFormSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* ... (your existing form fields) */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={formSaveLoading}
                  className={`w-full rounded-md py-2 transition duration-200 ${formSaveLoading
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
