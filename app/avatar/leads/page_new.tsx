// whiteboxLearning-wbl\app\avatar\leads\page.tsx
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
import { useFormModal } from "@/hooks/useFormModal";
import { FormModal } from "@/components/FormModal";
import { EditModal } from "@/components/EditModal";
import { apiFetch } from "@/lib/api";
type Lead = DexieLead;

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

const sortLeadsByEntryDate = (leads: Lead[]): Lead[] => {
  return [...leads].sort((a, b) => {
    const dateA = new Date(a.entry_date || 0).getTime();
    const dateB = new Date(b.entry_date || 0).getTime();
    return dateB - dateA; 
  });
};

const useSimpleCache = () => {
  const cacheRef = useRef<{
    data: Lead[];
    timestamp: number;
    searchTerm: string;
    searchBy: string;
    lastSync: number;
  } | null>(null);

  const isCacheValid = async (
    searchTerm: string,
    searchBy: string = "all",
    maxAge: number = 300000
  ) => {
    const localLeads = await db.leads.toArray();
    
    if (localLeads.length === 0) {
      return false;
    }

    if (cacheRef.current) {
      if (cacheRef.current.searchTerm === searchTerm && cacheRef.current.searchBy === searchBy) {
        const age = Date.now() - cacheRef.current.timestamp;
        if (age < maxAge) {
          return true;
        }
      }
    }

    const localDataAge = localLeads[0]?.lastSync ? 
      Date.now() - new Date(localLeads[0].lastSync).getTime() : Infinity;
    
    return localDataAge < maxAge;
  };

  const setCache = (data: Lead[], searchTerm: string, searchBy: string) => {
    cacheRef.current = {
      data: [...data],
      timestamp: Date.now(),
      searchTerm,
      searchBy,
      lastSync: Date.now(),
    };
  };

  const getCache = () => cacheRef.current?.data || [];

  return { isCacheValid, setCache, getCache };
};

const StatusFilterHeaderComponent = ({ 
  selectedStatuses, 
  setSelectedStatuses 
}: { 
  selectedStatuses: string[]; 
  setSelectedStatuses: (statuses: string[]) => void; 
}) => {
  const handleStatusChange = (status: string) => {
    setSelectedStatuses(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses, status]
    );
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Status Filter:</span>
        <button
          onClick={() => setSelectedStatuses([])}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              selectedStatuses.includes(status)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
};

const WorkStatusFilterHeaderComponent = ({ 
  selectedWorkStatuses, 
  setSelectedWorkStatuses 
}: { 
  selectedWorkStatuses: string[]; 
  setSelectedWorkStatuses: (statuses: string[]) => void; 
}) => {
  const handleWorkStatusChange = (status: string) => {
    setSelectedWorkStatuses(
      selectedWorkStatuses.includes(status)
        ? selectedWorkStatuses.filter(s => s !== status)
        : [...selectedWorkStatuses, status]
    );
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Work Status Filter:</span>
        <button
          onClick={() => setSelectedWorkStatuses([])}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {workStatusOptions.map((status) => (
          <button
            key={status}
            onClick={() => handleWorkStatusChange(status)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              selectedWorkStatuses.includes(status)
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
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
  const [sortModel, setSortModel] = useState([
    { colId: "entry_date", sort: "desc" as "desc" },
  ]);
  
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  
  const gridRef = useRef<AgGridReactType<Lead> | null>(null);
  const apiEndpoint = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL}/leads`, []);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const cache = useSimpleCache();
  const isInitialMountRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  // Use the new FormModal hook
  const { 
    isModalOpen, 
    openAddModal, 
    openEditModal, 
    closeModal, 
    handleSave, 
    modalData, 
    modalTitle, 
    modalMode, 
    entityType, 
    batches 
  } = useFormModal({
    entityType: 'lead',
    apiEndpoint: '/leads',
    onSuccess: () => {
      loadLeadsFromIndexedDB(searchTerm);
    }
  });

  const loadLeadsFromIndexedDB = useCallback(async (searchTerm: string = "") => {
    try {
      setLoading(true);
      const localLeads = await db.leads.toArray();
      const sortedLeads = sortLeadsByEntryDate(localLeads);
      
      if (searchTerm.trim()) {
        const filtered = sortedLeads.filter((lead) =>
          lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.id?.toString().includes(searchTerm)
        );
        setFilteredLeads(filtered);
      } else {
        setFilteredLeads(sortedLeads);
      }
      
      setLeads(sortedLeads);
      setTotalLeads(sortedLeads.length);
    } catch (error) {
      console.error("Error loading leads from IndexedDB:", error);
      setError("Failed to load leads from local storage");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncFromAPI = useCallback(async (forceRefresh: boolean = false) => {
    if (fetchInProgressRef.current) return;
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      const isCacheValidResult = await cache.isCacheValid(searchTerm, searchBy);
      
      if (!forceRefresh && isCacheValidResult) {
        const cachedData = cache.getCache();
        if (cachedData.length > 0) {
          setLeads(cachedData);
          setFilteredLeads(cachedData);
          setTotalLeads(cachedData.length);
          setLoading(false);
          return;
        }
      }

      const response = await apiFetch("/leads");
      const apiLeads = Array.isArray(response) ? response : response?.data || [];
      
      const sortedApiLeads = sortLeadsByEntryDate(apiLeads);
      
      await db.leads.clear();
      const leadsWithSync = sortedApiLeads.map(lead => ({
        ...lead,
        synced: true,
        lastSync: new Date().toISOString()
      }));
      await db.leads.bulkAdd(leadsWithSync);
      
      cache.setCache(sortedApiLeads, searchTerm, searchBy);
      
      setLeads(sortedApiLeads);
      setFilteredLeads(sortedApiLeads);
      setTotalLeads(sortedApiLeads.length);
      
    } catch (error: any) {
      console.error("Error syncing from API:", error);
      setError(error.message || "Failed to sync from server");
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [searchTerm, searchBy, cache]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      loadLeadsFromIndexedDB(searchTerm);
      syncFromAPI();
    }
  }, [loadLeadsFromIndexedDB, syncFromAPI, searchTerm]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncFromAPI(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncFromAPI]);

  const handleRowUpdated = useCallback(
    async (updatedRow: Lead) => {
      setLoadingRowId(updatedRow.id);

      try {
        const { id, entry_date, ...payload } = updatedRow;

        if (payload.moved_to_candidate && payload.status !== "Closed") {
          payload.status = "Closed";
          payload.closed_date = new Date().toISOString().split("T")[0];
        } else if (!payload.moved_to_candidate && payload.status === "Closed") {
          payload.status = "Open";
          payload.closed_date = null;
        }

        payload.moved_to_candidate = Boolean(payload.moved_to_candidate);
        payload.massemail_unsubscribe = Boolean(payload.massemail_unsubscribe);
        payload.massemail_email_sent = Boolean(payload.massemail_email_sent);

        const updatedLead = await apiFetch(`leads/${updatedRow.id}`, {
          method: "PUT",
          body: payload,
          timeout: 10000,
        });

        await db.leads.update(updatedRow.id, { 
          ...updatedLead,
          lastSync: new Date().toISOString(),
          synced: true
        });

        await loadLeadsFromIndexedDB(searchTerm);

        toast.success("Lead updated successfully");
      } catch (err: any) {
        console.error("Error updating lead:", err);
        
        if (err.name === 'TimeoutError') {
          toast.error("Server timeout - update failed");
        } else if (err.name === 'NetworkError') {
          toast.error("Network error - cannot connect to server");
        } else if (err.status === 401) {
          toast.error("Session expired - please login again");
        } else {
          toast.error(err.message || "Failed to update lead");
        }
      } finally {
        setLoadingRowId(null);
      }
    },
    [searchTerm, loadLeadsFromIndexedDB]
  );

  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        await apiFetch(`leads/${id}`, {
          method: "DELETE",
          timeout: 10000,
        });
        await db.leads.delete(id);

        await loadLeadsFromIndexedDB(searchTerm);

        toast.success("Lead deleted successfully");
      } catch (error: any) {
        console.error("Error deleting lead:", error);
        
        if (error.name === 'TimeoutError') {
          toast.error("Server timeout - delete failed");
        } else if (error.name === 'NetworkError') {
          toast.error("Network error - cannot connect to server");
        } else if (error.status === 401) {
          toast.error("Session expired - please login again");
        } else {
          toast.error(error.message || "Failed to delete lead");
        }
      }
    },
    [searchTerm, loadLeadsFromIndexedDB]
  );

  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
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
            >
              {params.value}
            </a>
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        editable: true,
        sortable: true,
        cellRenderer: (params: any) => {
          const status = params.value || "Open";
          const colorMap: Record<string, string> = {
            Open: "bg-green-100 text-green-800",
            Closed: "bg-red-100 text-red-800",
            Future: "bg-yellow-100 text-yellow-800",
          };
          return (
            <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>
              {status}
            </Badge>
          );
        },
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: statusOptions,
        },
        headerComponent: StatusFilterHeaderComponent,
        headerComponentParams: {
          selectedStatuses,
          setSelectedStatuses,
        },
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        width: 150,
        editable: true,
        sortable: true,
        cellRenderer: (params: any) => {
          const workStatus = params.value || "Waiting for Status";
          return (
            <Badge className="bg-blue-100 text-blue-800">
              {workStatus}
            </Badge>
          );
        },
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: workStatusOptions,
        },
        headerComponent: WorkStatusFilterHeaderComponent,
        headerComponentParams: {
          selectedWorkStatuses,
          setSelectedWorkStatuses,
        },
      },
      {
        field: "entry_date",
        headerName: "Entry Date",
        width: 120,
        sortable: true,
        valueFormatter: (params: ValueFormatterParams) => {
          if (!params.value) return "";
          return new Date(params.value).toLocaleDateString();
        },
      },
      {
        field: "moved_to_candidate",
        headerName: "Moved to Candidate",
        width: 150,
        editable: true,
        sortable: true,
        cellRenderer: (params: any) => {
          return params.value ? (
            <Badge className="bg-green-100 text-green-800">Yes</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">No</Badge>
          );
        },
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["true", "false"],
        },
      },
      {
        field: "massemail_email_sent",
        headerName: "Mass Email Sent",
        width: 150,
        editable: true,
        sortable: true,
        cellRenderer: (params: any) => {
          return params.value ? (
            <Badge className="bg-green-100 text-green-800">Yes</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">No</Badge>
          );
        },
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["true", "false"],
        },
      },
      {
        field: "massemail_unsubscribe",
        headerName: "Mass Email Unsubscribe",
        width: 180,
        editable: true,
        sortable: true,
        cellRenderer: (params: any) => {
          return params.value ? (
            <Badge className="bg-red-100 text-red-800">Yes</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">No</Badge>
          );
        },
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["true", "false"],
        },
      },
      {
        field: "notes",
        headerName: "Notes",
        width: 200,
        editable: true,
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return params.value.length > 50 
            ? params.value.substring(0, 50) + "..." 
            : params.value;
        },
      },
    ],
    [selectedStatuses, setSelectedStatuses, selectedWorkStatuses, setSelectedWorkStatuses]
  );

  useEffect(() => {
    let filtered = leads;
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((lead) => 
        selectedStatuses.includes(lead.status?.toLowerCase() || "open")
      );
    }
    
    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((lead) => 
        selectedWorkStatuses.includes(lead.workstatus?.toLowerCase() || "waiting for status")
      );
    }
    
    if (searchTerm.trim()) {
      filtered = filtered.filter((lead) =>
        lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.id?.toString().includes(searchTerm)
      );
    }
    
    setFilteredLeads(filtered);
  }, [leads, searchTerm, selectedStatuses, selectedWorkStatuses]);

  if (error && !isOnline) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Offline Mode
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You're currently offline. Showing cached data.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadLeadsFromIndexedDB()}
          className="flex items-center"
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
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leads Management
          </h1>
          <div className="mt-2 sm:mt-0 sm:max-w-md">
            <div className="relative">
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
                {filteredLeads.length} leads found
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-row items-center gap-2 sm:mt-0">
          <Button
            onClick={openAddModal}
            className="whitespace-nowrap bg-green-600 text-white hover:bg-green-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Lead
          </Button>
          <Button 
            onClick={() => syncFromAPI(true)} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? "Syncing..." : "Sync from Server"}
          </Button>
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
          title={`Leads (${filteredLeads.length})`}
        />
      </div>

      {/* Use the new FormModal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        data={modalData}
        title={modalTitle}
        onSave={handleSave}
        batches={batches}
        mode={modalMode}
        entityType={entityType}
      />
    </div>
  );
}
