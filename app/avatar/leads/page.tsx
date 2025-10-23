
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
import type { AgGridReact as AgGridReactType } from "ag-grid-react";
import type { GridApi } from "ag-grid-community";
import { LeadsHelper, db, Lead as DexieLead } from "@/lib/dexieDB";
import { useForm } from "react-hook-form";
type Lead = DexieLead;

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  workstatus: string;
  address: string;
  secondary_email: string | null;
  secondary_phone: string | null;
  status: string;
  moved_to_candidate: boolean;
  notes: string;
  entry_date?: string;
  massemail_unsubscribe: boolean;
  massemail_email_sent: boolean;
};

const initialFormData: FormData = {
  full_name: "",
  email: "",
  phone: "",
  workstatus: "Waiting for Status",
  address: "",
  status: "Open",
  moved_to_candidate: false,
  notes: "",
  massemail_unsubscribe: false,
  massemail_email_sent: false,
  secondary_email: "",
  secondary_phone: "",
};

const statusOptions = ["Open", "Closed", "Future"];
const workStatusOptions = [
  "Waiting for Status",
  "H1B",
  "H4 EAD",
  "Permanent Resident",
  "Citizen",
  "OPT",
  "CPT",
];

// Simple cache implementation
const useSimpleCache = () => {
  const cacheRef = useRef<{
    data: Lead[];
    timestamp: number;
    searchTerm: string;
    searchBy: string;
  } | null>(null);

  const isCacheValid = async (
    searchTerm: string,
    searchBy: string = "all",
    maxAge: number = 60000
  ) => {
    if (cacheRef.current) {
      if (cacheRef.current.searchTerm === searchTerm && cacheRef.current.searchBy === searchBy) {
        const age = Date.now() - cacheRef.current.timestamp;
        if (age < maxAge) return true;
      }
    }

    const localLeads = await db.leads.toArray();
    if (localLeads.length > 0) {
      return true;
    }

    return false;
  };

  const setCache = (data: Lead[], searchTerm: string, searchBy: string = "all") => {
    cacheRef.current = {
      data,
      timestamp: Date.now(),
      searchTerm,
      searchBy,
    };
  };

  const getCache = () => cacheRef.current?.data || null;
  const invalidateCache = () => {
    cacheRef.current = null;
  };

  return { isCacheValid, setCache, getCache, invalidateCache };
};

// Rate limiter to prevent too many API calls
const useRateLimiter = () => {
  const lastCallRef = useRef<number>(0);
  
  const canMakeCall = (minInterval: number = 3000) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall < minInterval) {
      return false;
    }
    
    lastCallRef.current = now;
    return true;
  };
  
  return { canMakeCall };
};

const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    future: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
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
    "waiting for status": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    h1b: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "h4 ead": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    "permanent resident": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    citizen: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    opt: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    cpt: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <Badge className={`${variantMap[workstatus] || variantMap.default} capitalize`}>
      {value || "N/A"}
    </Badge>
  );
};

const StatusFilterHeaderComponent = (props: any) => {
  const { selectedStatuses, setSelectedStatuses } = props;
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

  const handleStatusChange = (status: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedStatuses((prev: string[]) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
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
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">Status</span>
      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedStatuses.length > 0 && (
          <span className="min-w-[20px] rounded-full bg-blue-500 px-2 py-0.5 text-center text-xs text-white">
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
        </svg>
      </div>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            style={{ top: dropdownPos.top + 5, left: dropdownPos.left, zIndex: 99999, maxHeight: "300px", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 border-b pb-2">
              <label className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  className="mr-2"
                  onChange={handleSelectAll}
                />
                All
              </label>
            </div>
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  className="mr-2"
                  onChange={(e) => handleStatusChange(status, e)}
                />
                {status}
              </label>
            ))}
            {selectedStatuses.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatuses([]);
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

const WorkStatusFilterHeaderComponent = (props: any) => {
  const { selectedWorkStatuses, setSelectedWorkStatuses } = props;
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

  const handleWorkStatusChange = (workStatus: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedWorkStatuses((prev: string[]) =>
      prev.includes(workStatus) ? prev.filter((s) => s !== workStatus) : [...prev, workStatus]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedWorkStatuses(e.target.checked ? [...workStatusOptions] : []);
  };

  const isAllSelected = selectedWorkStatuses.length === workStatusOptions.length;
  const isIndeterminate =
    selectedWorkStatuses.length > 0 && selectedWorkStatuses.length < workStatusOptions.length;

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
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">Work Status</span>
      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedWorkStatuses.length > 0 && (
          <span className="min-w-[20px] rounded-full bg-green-500 px-2 py-0.5 text-center text-xs text-white">
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
            className="pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
            style={{ top: dropdownPos.top + 5, left: dropdownPos.left, zIndex: 99999, maxHeight: "300px", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 border-b pb-2">
              <label className="flex cursor-pointer items-center rounded px-2 py-1 font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  className="mr-3"
                  onChange={handleSelectAll}
                />
                Select All
              </label>
            </div>
            {workStatusOptions.map((workStatus) => (
              <label
                key={workStatus}
                className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedWorkStatuses.includes(workStatus)}
                  onChange={(e) => handleWorkStatusChange(workStatus, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3"
                />
                <WorkStatusRenderer value={workStatus} />
              </label>
            ))}
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

export default function LeadsPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewLead = searchParams.get("newlead") === "true";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState("full_name");  
  const [newLeadForm, setNewLeadForm] = useState(isNewLead);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [sortModel, setSortModel] = useState([
    { colId: "entry_date", sort: "desc" as "desc" },
  ]);
  

  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const gridRef = useRef<AgGridReactType<Lead> | null>(null);
  const apiEndpoint = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL}/leads`, []);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true); 
  const cache = useSimpleCache();
  const rateLimiter = useRateLimiter();
  const callCountRef = useRef(0);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: initialFormData,
  });

  // Enhanced fetchLeads with offline support
  const fetchLeads = useCallback(async (
    search?: string,
    searchBy: string = "all",
    sort: any[] = [{ colId: "entry_date", sort: "desc" }],
    forceRefresh = false
  ) => {
    callCountRef.current++;
    console.log('   fetchLeads CALLED - investigating multiple calls');
    console.log('   Call count:', callCountRef.current);
    console.log('   search:', search);
    console.log('   searchBy:', searchBy);
    console.log('   forceRefresh:', forceRefresh);
    console.log('   loading state:', loading);
    console.log('   cache valid?', cache.isCacheValid(search || "", searchBy));
    console.log('   stack trace:', new Error().stack);

    // NUCLEAR OPTION - Completely block multiple calls
    if (callCountRef.current > 1) {
      console.log(' BLOCKING DUPLICATE CALL - Only allowing first call');
      return;
    }

    const searchKey = search || "";
    
    // STRICT CACHE CHECK - Only proceed if absolutely necessary
    if (!forceRefresh && cache.isCacheValid(searchKey, searchBy)) {
      console.log(' STRICT CACHE HIT - Blocking API call');
      const cachedData = cache.getCache();
      if (cachedData) {
        setLeads(cachedData);
        setFilteredLeads(cachedData);
        return;
      }
    }

    // RATE LIMITING - Strict enforcement
    if (!rateLimiter.canMakeCall(5000)) { // 5 seconds between calls
      console.log(' STRICT RATE LIMIT - Blocking API call');
      return;
    }

    setLoading(true);
    try {
      // Load from IndexedDB first
      const localLeads = await db.leads.toArray();
      console.log(` IndexedDB has ${localLeads.length} leads`);
      
      // Only proceed with API call if necessary
      if (isOnline && (forceRefresh || !cache.isCacheValid(searchKey, searchBy))) {
        let url = `${apiEndpoint}`;
        const params = new URLSearchParams();
        if (search && search.trim()) {
          params.append("search", search.trim());
          params.append("search_by", searchBy);
        }
        const sortParam = sort.map((s) => `${s.colId}:${s.sort}`).join(",");
        params.append("sort", sortParam);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
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
        let leadsData: Lead[] = [];
        if (data.data && Array.isArray(data.data)) {
          leadsData = data.data;
        } else if (Array.isArray(data)) {
          leadsData = data;
        }

        console.log(` API returned ${leadsData.length} leads - UPDATING CACHE`);
        
        setLeads(leadsData);
        setFilteredLeads(leadsData);
        cache.setCache(leadsData, searchKey, searchBy);
        
        await db.leads.clear();
        await db.leads.bulkPut(leadsData);
      } else {
        console.log(' Using IndexedDB data - NO API CALL');
        setLeads(localLeads);
        setFilteredLeads(localLeads);
      }
    } catch (err) {
      console.error(' API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, cache, isOnline, rateLimiter]);

  // Local search in IndexedDB
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const term = searchTerm.trim().toLowerCase();

      if (!term) {
        const allLeads = await db.leads.toArray();
        setFilteredLeads(allLeads);
        setTotalLeads(allLeads.length);
        return;
      }

      const allLeads = await db.leads.toArray();
      const filtered = allLeads.filter((lead) => {
        const nameMatch = lead.full_name?.toLowerCase().includes(term);
        const emailMatch = lead.email?.toLowerCase().includes(term);
        const phoneMatch = lead.phone?.toLowerCase().includes(term);
        const idMatch = lead.id?.toString().includes(term);
        return nameMatch || emailMatch || phoneMatch || idMatch;
      });

      setFilteredLeads(filtered);
      setTotalLeads(filtered.length);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      callCountRef.current = 0;
      
      const localLeads = await db.leads.toArray();
  
      
      if (localLeads.length > 0) {
        setLeads(localLeads);
        setFilteredLeads(localLeads);
        
        if (!cache.isCacheValid("", "all")) {
          setTimeout(() => {
            fetchLeads("", "all", sortModel, false);
          }, 3000);
        }
      } else {
        fetchLeads("", "all", sortModel, true);
      }
    };

    loadInitialData();
  }, []);

  // Client-side filtering
  useEffect(() => {
    let filtered = [...leads];  
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((lead) =>
        selectedStatuses.some(
          (status) => status.toLowerCase() === (lead.status || "").toLowerCase()
        )
      );
    }

    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((lead) =>
        selectedWorkStatuses.some(
          (ws) => ws.toLowerCase() === (lead.workstatus || "").toLowerCase()
        )
      );
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.full_name?.toLowerCase().includes(term) ||
          lead.email?.toLowerCase().includes(term) ||
          lead.phone?.toLowerCase().includes(term) ||
          lead.id.toString().includes(term)
      );
    }
    
    setFilteredLeads(filtered);
    setTotalLeads(filtered.length);
  }, [leads, selectedStatuses, selectedWorkStatuses, searchTerm]);

  // Online/offline handling
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Online - syncing changes if any');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Offline - using local data only');
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const detectSearchBy = (search: string) => {
    if (/^\d+$/.test(search)) return "id";
    if (/^\S+@\S+\.\S+$/.test(search)) return "email";
    if (/^[\d\s\+\-()]+$/.test(search)) return "phone";
    return "full_name";
  };



  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Form validation
  const validateForm = (data: FormData): boolean => {
    const errors: Record<string, string> = {};
    
    if (!data.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    
    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!data.phone.trim()) {
      errors.phone = "Phone is required";
    } else if (data.phone.replace(/\D/g, '').length < 10) {
      errors.phone = "Please enter a valid phone number";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewLeadFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "phone" || name === "secondary_phone") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === "address") {
      const sanitizedValue = value.replace(/[^a-zA-Z0-9, ]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    } else if (name === "full_name") {
      const sanitizedValue = value.replace(/[^a-zA-Z. ]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

  // Form submission with react-hook-form

  const onSubmit = async (data: FormData) => {
    if (!data.full_name.trim() || !data.email.trim() || !data.phone.trim()) {
      toast.error("Full Name, Email, and Phone are required");
      return;

    }


  const handleNewLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaveLoading(true);
    setFormErrors({});

    if (!validateForm(formData)) {
      setFormSaveLoading(false);
      return;
    }
    try {
      const updatedData = { 
        ...data,
        status: data.status || "Open",
        workstatus: data.workstatus || "Waiting for Status",
        moved_to_candidate: Boolean(data.moved_to_candidate),
        massemail_email_sent: Boolean(data.massemail_email_sent),
        massemail_unsubscribe: Boolean(data.massemail_unsubscribe),
        entry_date: data.entry_date || new Date().toISOString(),
        closed_date: data.status === "Closed" ? new Date().toISOString().split("T")[0] : null,
      };

      // Add to local DB first
      const tempLead: Lead = {
        ...updatedData,
        id: Date.now(),
        synced: !isOnline,
        _action: "add" as const,
      } as Lead;

      await db.leads.add(tempLead);
      setLeads(prev => [tempLead, ...prev]);
      setFilteredLeads(prev => [tempLead, ...prev]);
      
      cache.invalidateCache();

      // Sync with API if online
      if (isOnline) {
        const token = localStorage.getItem("token");
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        });
        
        if (!response.ok) throw new Error("Failed to create lead");
        
        const savedLead = await response.json();
        
        await db.leads.delete(tempLead.id);
        await db.leads.add({ ...savedLead, synced: true, _action: null });
        
        setLeads(prev => prev.map(l => l.id === tempLead.id ? savedLead : l));
        setFilteredLeads(prev => prev.map(l => l.id === tempLead.id ? savedLead : l));
      }

      toast.success("Lead created successfully!");
      handleCloseModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create lead";
      toast.error(errorMessage);

    try {
      const updatedData = { ...data };
      if (!updatedData.status || updatedData.status === "") {
        updatedData.status = "Open";
      }
      if (!updatedData.workstatus || updatedData.workstatus === "") {
        updatedData.workstatus = "Waiting for Status";
      }
      if (updatedData.moved_to_candidate) {
        updatedData.status = "Closed";
      }
      const booleanFields = [
        "moved_to_candidate",
        "massemail_email_sent",
        "massemail_unsubscribe",
      ];
      booleanFields.forEach((field) => {
        if (
          updatedData[field as keyof FormData] === undefined ||
          updatedData[field as keyof FormData] === null ||
          updatedData[field as keyof FormData] === ""
        ) {
          (updatedData[field as keyof FormData] as boolean) = false;
        }
      });
      const payload = {
        ...updatedData,
        entry_date: new Date().toISOString(),
        closed_date:
          updatedData.status === "Closed"
            ? new Date().toISOString().split("T")[0]
            : null,
      };
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create lead");
      const newLead = await response.json();
      const updated = [...leads, newLead].sort(
        (a, b) =>
          new Date(b.entry_date || 0).getTime() -
          new Date(a.entry_date || 0).getTime()
      );
      setLeads(updated);
      setFilteredLeads(updated);
      toast.success("Lead created successfully!", { position: "top-center" });
      setIsModalOpen(false);
      reset();
      router.push("/avatar/leads");
    } catch (error) {
      toast.error("Failed to create lead", { position: "top-center" });

      console.error("Error creating lead:", error);
    }
  };

  const handleOpenModal = () => {
    router.push("/avatar/leads?newlead=true");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    router.push("/avatar/leads");
    setIsModalOpen(false);
    reset();
  };

  const handleRowUpdated = useCallback(
    async (updatedRow: Lead) => {
      setLoadingRowId(updatedRow.id);
      try {
        const { id, entry_date, ...payload } = updatedRow;
        if (payload.moved_to_candidate && payload.status !== "Closed") {
          payload.status = "Closed";
          payload.closed_date = new Date().toISOString().split('T')[0];
        } else if (!payload.moved_to_candidate && payload.status === "Closed") {
          payload.status = "Open";
          payload.closed_date = null;
        }
        payload.moved_to_candidate = Boolean(payload.moved_to_candidate);
        payload.massemail_unsubscribe = Boolean(payload.massemail_unsubscribe);
        payload.massemail_email_sent = Boolean(payload.massemail_email_sent);
        const response = await fetch(`${apiEndpoint}/${updatedRow.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update lead");
        const updatedLead = await response.json();
        setLeads(prevLeads =>
          prevLeads.map(lead => (lead.id === updatedLead.id ? updatedLead : lead))
        );
        toast.success("Lead updated successfully");
      } catch (error) {
        toast.error("Failed to update lead");
        console.error("Error updating lead:", error);
      })
      .finally(() => {
        setLoadingRowId(null);
      });
    } else {
      setLoadingRowId(null);
    }
  }, [apiEndpoint, isOnline, leads, cache]);

  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to delete lead");
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
        toast.success("Lead deleted successfully");
      } catch (error) {
        toast.error("Failed to delete lead");
        console.error("Error deleting lead:", error);
      }
    },
    [apiEndpoint]
  );

  const handleMoveToCandidate = useCallback(
    async (lead: Lead, moved: boolean) => {
      setLoadingRowId(lead.id);
      try {
        const method = moved ? "DELETE" : "POST";
        const url = `${apiEndpoint}/${lead.id}/move-to-candidate`;
        const payload: Partial<Lead> = {
          moved_to_candidate: !moved,
          status: !moved ? "Closed" : "Open",
          closed_date: !moved ? new Date().toISOString().split("T")[0] : null,
        };
        
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to move lead to candidate");
        }
        
        const data = await response.json();
        fetchLeads(searchTerm, searchBy, sortModel);
        
        if (moved) {
          toast.success(`Lead removed from candidate list (Candidate ID: ${data.candidate_id})`);
        } else {
          toast.success(`Lead moved to candidate (Candidate ID: ${data.candidate_id}) and status set to Closed`);
        }
      } catch (error: any) {
        console.error("Error moving lead to candidate:", error);
        toast.error(error.message || "Failed to move lead to candidate");
      } finally {
        setLoadingRowId(null);
      }
    },
    [apiEndpoint, searchTerm, searchBy, sortModel, fetchLeads]
  );

  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
    return `+1 ${phoneNumberString}`;
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const columnDefs: ColDef<any, any>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        pinned: "left",
        sortable: true,
      },
      {
        field: "full_name",
        headerName: "Full Name",
        width: 180,
        sortable: true,
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
        field: "entry_date",
        headerName: "Entry Date",
        width: 180,
        sortable: true,
        valueFormatter: ({ value }: ValueFormatterParams) =>
          value
            ? new Date(value).toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : "-",
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        width: 200,
        sortable: true,
        cellRenderer: WorkStatusRenderer,
        headerComponent: WorkStatusFilterHeaderComponent,
        headerComponentParams: {
          selectedWorkStatuses,
          setSelectedWorkStatuses,
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        sortable: true,
        cellRenderer: StatusRenderer,
        headerComponent: StatusFilterHeaderComponent,
        headerComponentParams: { selectedStatuses, setSelectedStatuses },
      },
      {
        field: "secondary_email",
        headerName: "Secondary Email",
        width: 220,
        sortable: true,
      },
      {
        field: "secondary_phone",
        headerName: "Secondary Phone",
        width: 150,
        sortable: true,
      },
      {
        field: "address",
        headerName: "Address",
        width: 250,
        sortable: true,
      },
      {
        field: "closed_date",
        headerName: "Closed Date",
        width: 150,
        sortable: true,
        valueFormatter: ({ value }: ValueFormatterParams) =>
          value
            ? new Date(value).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
              })
            : "-",
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
      {
        field: "massemail_unsubscribe",
        headerName: "Mass Email Unsubscribe",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.massemail_unsubscribe !== undefined
            ? params.data.massemail_unsubscribe
            : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
      {
        field: "massemail_email_sent",
        headerName: "Mass Email Sent",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.massemail_email_sent !== undefined
            ? params.data.massemail_email_sent
            : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
      {
        field: "moved_to_candidate",
        headerName: "Moved to Candidate",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.moved_to_candidate !== undefined
            ? params.data.moved_to_candidate
            : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
    ],
    [selectedStatuses, selectedWorkStatuses]
  );

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() => fetchLeads(searchTerm, searchBy, sortModel, true)}
          className="ml-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-center" />
      
      {/* Online/Offline indicator */}
      {!isOnline && (
        <div className="rounded-md bg-yellow-100 p-3 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          You are currently offline. Changes will be synced when you reconnect.
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leads Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All Leads ({totalLeads})
            {selectedStatuses.length > 0 || selectedWorkStatuses.length > 0 ? (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                - Filtered ({filteredLeads.length} shown)
              </span>
            ) : (
              " - Sorted by latest first"
            )}
            {!isOnline && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                (Offline Mode)
              </span>
            )}
          </p>
          <div className="mt-2 sm:mt-0 sm:max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                ref={searchInputRef}
                placeholder="Search by ID, name, email, phone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 text-sm sm:text-base"
              />
            </div>
            {searchTerm && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filteredLeads.length} leads found
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
            Add New Lead
          </Button>
          {/* <Button 
            onClick={() => fetchLeads(searchTerm, searchBy, sortModel, true)} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? "Refreshing..." : "Refresh"}
          </Button> */}
        </div>
      </div>
      <div className="flex w-full justify-center">
        <AGGridTable
          key={`${filteredLeads.length}-${selectedStatuses.join(
            ","
          )}-${selectedWorkStatuses.join(",")}`}
          rowData={filteredLeads}
          columnDefs={columnDefs}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          loading={loading}
          showFilters={true}
          showSearch={false}
          height="600px"
        />
      </div>
      {/* Enhanced Modal from second version */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-2 sm:p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl md:max-w-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 py-2 sm:px-4 sm:py-2 md:px-6">
              <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-sm font-semibold text-transparent sm:text-base md:text-lg">
                Add New Lead
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
              >
                <X size={16} className="sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="bg-white p-3 sm:p-4 md:p-5">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Full Name <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("full_name", {
                        required: "Full name is required",
                        maxLength: {
                          value: 100,
                          message: "Full name cannot exceed 100 characters",
                        },
                      })}
                      placeholder="Enter full name"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.full_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Email <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Invalid email address",
                        },
                      })}
                      placeholder="Enter email"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Phone <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register("phone", {
                        required: "Phone is required",
                        pattern: {
                          value: /^\d+$/,
                          message: "Phone must contain only numbers",
                        },
                      })}
                      placeholder="Enter phone number"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(
                          /\D/g,
                          ""
                        );

                      }}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Status
                    </label>
                    <select
                      {...register("status")}
                      className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Work Status
                    </label>
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
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Secondary Email
                    </label>
                    <input
                      type="email"
                      {...register("secondary_email")}
                      placeholder="Enter secondary email"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Secondary Phone
                    </label>
                    <input
                      type="tel"
                      {...register("secondary_phone")}
                      placeholder="Enter secondary phone"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                      }}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Address
                    </label>
                    <input
                      type="text"
                      {...register("address")}
                      placeholder="Enter address"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Notes
                    </label>
                    <textarea
                      {...register("notes")}
                      placeholder="Enter notes..."
                      className="w-full resize-none rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1 sm:col-span-2 sm:grid-cols-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register("moved_to_candidate")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 sm:text-sm">
                        Moved to Candidate
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register("massemail_unsubscribe")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 sm:text-sm">
                        Mass Email Unsubscribe
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register("massemail_email_sent")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 sm:text-sm">
                        Mass Email Sent
                      </span>
                    </label>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2 border-t border-blue-200 pt-2 sm:mt-3 sm:gap-3 sm:pt-2 md:mt-4 md:pt-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-md transition hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 sm:px-5 sm:py-2 sm:text-sm"
                  >
                    {isSubmitting ? "Saving..." : "Save Lead"}
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
