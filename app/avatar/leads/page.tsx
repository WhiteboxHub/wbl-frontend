
"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { AGGridTable } from "@/components/AGGridTable";
import { createPortal } from "react-dom";
import { AgGridReact } from "ag-grid-react";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { apiFetch, smartUpdate } from "@/lib/api";



type Lead = {
  id: number;
  full_name?: string | null;
  email: string;
  phone?: string | null;
  workstatus?: string | null;
  status?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  entry_date?: string | Date | null;
  closed_date?: string | Date | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  moved_to_candidate?: boolean;
  notes?: string | null;
  massemail_unsubscribe?: boolean;
  massemail_email_sent?: boolean;
};

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
  secondary_phone: ""
};


const statusOptions = ["Open", "Closed", "Future"];
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


const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "in progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    future: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <Badge className={`${variantMap[status] || variantMap.default} capitalize`}>
      {value || ""}
    </Badge>
  );
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
        left: Math.max(0, rect.left + window.scrollX - 100), // Adjust to prevent going off screen
      });
    }
    setFilterVisible((v) => !v);
  };

  const handleStatusChange = (status: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedStatuses((prev: string[]) => {
      const isSelected = prev.includes(status);
      if (isSelected) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedStatuses([...statusOptions]);
    } else {
      setSelectedStatuses([]);
    }
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
            className="filter-dropdown fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600"
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
              <label className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded text-sm">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={handleSelectAll}
                  className="mr-3"

                  onClick={(e) => e.stopPropagation()}
                />
                Select All
              </label>
            </div>
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  onChange={(e) => handleStatusChange(status, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3"
                />

                <StatusRenderer value={status} />
              </label>
            ))}
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
    setSelectedWorkStatuses((prev: string[]) => {
      if (prev.includes(workStatus)) {
        return prev.filter(s => s !== workStatus);
      } else {
        return [...prev, workStatus];
      }
    });
  };


  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedWorkStatuses([...workStatusOptions]);
    } else {
      setSelectedWorkStatuses([]);
    }
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
            className="filter-dropdown fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600 text-sm"
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

                <WorkStatusRenderer value={workStatus} />
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
  const [sortModel, setSortModel] = useState([{ colId: 'entry_date', sort: 'desc' }]);
  const [newLeadForm, setNewLeadForm] = useState(isNewLead);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  const gridRef = useRef<InstanceType<typeof AgGridReact> | null>(null);

  const apiEndpoint = useMemo(() => "/leads", []);
  const fetchLeads = useCallback(
    async (
      search?: string,
      searchBy: string = "all",
      sort: any[] = [{ colId: "entry_date", sort: "desc" }],
      forceRefresh: boolean = false
    ) => {
      setLoading(true);
      try {
        let url = apiEndpoint;
        const params = new URLSearchParams();
        if (search && search.trim()) {
          params.append("search", search.trim());
          params.append("search_by", searchBy);
        }
        const sortToApply = sort && sort.length > 0 ? sort : [{ colId: "entry_date", sort: "desc" }];
        const sortParam = sortToApply.map((s) => `${s.colId}:${s.sort}`).join(",");
        params.append("sort", sortParam);
        if (params.toString()) url += `?${params.toString()}`;
        const data = forceRefresh ? await apiFetch(url) : await cachedApiFetch(url);
        const leadsData = Array.isArray(data) ? data : (data?.data || []);
        console.log('[Leads] Fetched data:', leadsData.length, 'leads');
        setLeads(leadsData);
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to load leads";
        setError(error);
        toast.error(error);
      } finally {
        setLoading(false);
        searchInputRef.current?.focus();
      }
    },
    [apiEndpoint]
  );


  useEffect(() => {
    console.log('[Filter] useEffect triggered. Leads count:', leads.length);
    let filtered = [...leads];

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(lead =>
        selectedStatuses.some(
          status => status.toLowerCase() === (lead.status || "").toLowerCase()
        )
      );
    }

    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter(lead =>
        selectedWorkStatuses.some(
          ws => ws.toLowerCase() === (lead.workstatus || "").toLowerCase()
        )
      );
    }


    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.full_name?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.phone?.toLowerCase().includes(term) ||
        lead.id.toString().includes(term)
      );
    }

    console.log('[Filter] Filtered count:', filtered.length);
    setFilteredLeads(filtered);
    setTotalLeads(filtered.length);
  }, [leads, selectedStatuses, selectedWorkStatuses, searchTerm]);


  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);





  const detectSearchBy = (search: string) => {
    if (/^\d+$/.test(search)) return "id";
    if (/^\S+@\S+\.\S+$/.test(search)) return "email";
    if (/^[\d\s\+\-()]+$/.test(search)) return "phone";
    return "full_name";
  };

  const handleNewLeadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNewLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaveLoading(true);
    try {
      const updatedData = { ...formData };
      if (!updatedData.status || updatedData.status === '') {
        updatedData.status = 'waiting for status';
      }
      if (!updatedData.workstatus || updatedData.workstatus === '') {
        updatedData.workstatus = 'waiting';
      }
      if (updatedData.moved_to_candidate) {
        updatedData.status = "Closed";
      }
      if (!updatedData.status || updatedData.status === '') {
        updatedData.status = updatedData.moved_to_candidate ? "Closed" : "Open";
      }
      if (!updatedData.workstatus || updatedData.workstatus === '') {
        updatedData.workstatus = 'Waiting for Status';
      }
      const booleanFields = ['moved_to_candidate', 'massemail_email_sent', 'massemail_unsubscribe'];
      booleanFields.forEach(field => {
        if (updatedData[field] === undefined || updatedData[field] === null || updatedData[field] === '') {
          updatedData[field] = false;
        }
      });
      const payload = {
        ...updatedData,
        entry_date: new Date().toISOString(),
        closed_date: updatedData.status === "Closed" ? new Date().toISOString().split('T')[0] : null,
      };


      await apiFetch(apiEndpoint, { method: "POST", body: payload });
      await invalidateCache(`${apiEndpoint}?sort=entry_date:desc`);

      // Refetch to ensure UI updates
      await fetchLeads(searchTerm, searchBy, sortModel, true);

      toast.success("Lead created successfully!");
      setNewLeadForm(false);
      setFormData(initialFormData);
    } catch (error) {
      toast.error("Failed to create lead");
      console.error("Error creating lead:", error);
    } finally {
      setFormSaveLoading(false);
    }
  };

  const handleRowUpdated = useCallback(
    async (updatedRow: Lead) => {
      setLoadingRowId(updatedRow.id);
      try {
        const { id, entry_date, ...payload } = updatedRow;

        // Normalize boolean fields
        ['moved_to_candidate', 'massemail_email_sent', 'massemail_unsubscribe'].forEach(
          field => (payload[field] = Boolean(payload[field]))
        );

        // Adjust status and closed_date
        if (payload.moved_to_candidate && payload.status !== "Closed") {
          payload.status = "Closed";
          payload.closed_date = new Date().toISOString().split("T")[0];
        } else if (!payload.moved_to_candidate && payload.status === "Closed") {
          payload.status = "Open";
          payload.closed_date = null;
        }

        // Send update to backend
        await smartUpdate('leads', id, payload);

        // Update local state instead of full refetch
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === id ? { ...lead, ...payload } : lead
          )
        );

        toast.success(
          payload.moved_to_candidate
            ? "Lead moved to candidate and marked Closed"
            : "Lead updated successfully"
        );
      } catch (error) {
        toast.error("Failed to update lead");
        console.error(error);
      } finally {
        setLoadingRowId(null);
      }
    },
    []
  );



  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        await apiFetch(`${apiEndpoint}/${id}`, { method: "DELETE" });
        setLeads(prev => prev.filter(lead => lead.id !== id));

        toast.success("Lead deleted successfully");
      } catch (error) {
        toast.error("Failed to delete lead");
        console.error(error);
      }
    },
    []
  );







  const handleMoveToCandidate = useCallback(
    async (lead: Lead, Moved: boolean) => {
      setLoadingRowId(lead.id);
      try {
        const method = Moved ? "DELETE" : "POST";
        const url = `${apiEndpoint}/${lead.id}/move-to-candidate`;
        const payload: Partial<Lead> = {
          moved_to_candidate: !Moved,
          status: !Moved ? "Closed" : "Open",
          closed_date: !Moved ? new Date().toISOString().split("T")[0] : null,
        };
        const data = await apiFetch(url, { method, body: payload });
        await invalidateCache(`${apiEndpoint}?sort=entry_date:desc`);

        // Update local state
        setLeads(prevLeads =>
          prevLeads.map(l =>
            l.id === lead.id
              ? { ...l, moved_to_candidate: !Moved, status: !Moved ? "Closed" : "Open" }
              : l
          )
        );
        if (Moved) {
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
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
    return `+1 ${phoneNumberString}`;
  };


  const columnDefs: ColDef<any, any>[] = useMemo(
    () => [
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
        headerComponentParams: { selectedWorkStatuses, setSelectedWorkStatuses },
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
        sortable: true
      },
      {
        field: "secondary_phone",
        headerName: "Secondary Phone",
        width: 150,
        sortable: true
      },
      {
        field: "address",
        headerName: "Address",
        width: 250,
        sortable: true
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
        valueFormatter: ({ value }: ValueFormatterParams) => value || "-",
      },
      {
        field: "massemail_unsubscribe",
        headerName: "Mass Email Unsubscribe",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) => params.data.massemail_unsubscribe !== undefined ? params.data.massemail_unsubscribe : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
      {
        field: "massemail_email_sent",
        headerName: "Mass Email Sent",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) => params.data.massemail_email_sent !== undefined ? params.data.massemail_email_sent : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
      {
        field: "moved_to_candidate",
        headerName: "Moved to Candidate",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) => params.data.moved_to_candidate !== undefined ? params.data.moved_to_candidate : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
    ],
    [selectedStatuses, selectedWorkStatuses]
  );

  // Handle errors
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() => fetchLeads(searchTerm, searchBy, sortModel)}
          className="ml-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Main UI
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leads Management
          </h1>
          <div key="search-container" className="max-w-md">

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
                className="pl-10 w-96"
              />
            </div>
          </div>

        </div>
      </div>
      <div className="flex w-full justify-center">
        <AGGridTable
          key={`${filteredLeads.length}-${selectedStatuses.join(',')}-${selectedWorkStatuses.join(',')}`}
          title={`Leads (${filteredLeads.length})`}
          rowData={filteredLeads}
          columnDefs={columnDefs}
          onRowAdded={async (newRow: any) => {
            try {
              const payload: FormData = {
                full_name: newRow.full_name || "",
                email: newRow.email || "",
                phone: newRow.phone || "",
                workstatus: newRow.workstatus || "Waiting for Status",
                address: newRow.address || "",
                secondary_email: newRow.secondary_email || "",
                secondary_phone: newRow.secondary_phone || "",
                status: newRow.status || "Open",
                moved_to_candidate: Boolean(newRow.moved_to_candidate),
                notes: newRow.notes || "",
                entry_date: new Date().toISOString(),
                massemail_unsubscribe: Boolean(newRow.massemail_unsubscribe),
                massemail_email_sent: Boolean(newRow.massemail_email_sent),
              };

              const createdLead = await apiFetch(apiEndpoint, { method: "POST", body: payload });

              // Update local state instead of refetch
              setLeads(prev => [createdLead, ...prev]);

              toast.success("Lead created successfully");
            } catch (err: any) {
              console.error(err);
              toast.error(err.message || "Failed to create lead");
            }
          }}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          loading={loading}
          showFilters={true}
          showSearch={false}
          height="600px"
        />
      </div>
    </div>
  );
}
