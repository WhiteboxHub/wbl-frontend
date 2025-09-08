

"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ColDef, ValueFormatterParams, SortChangedEvent } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { AGGridTable } from "@/components/AGGridTable";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

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

type PaginatedLeadsResponse = {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
};

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  workstatus: string;
  address: string;
  status: string;
  moved_to_candidate: boolean;
  notes: string;
  entry_date?: string;
};

const initialFormData: FormData = {
  full_name: "",
  email: "",
  phone: "",
  workstatus: "",
  address: "",
  status: "Open",
  moved_to_candidate: false,
  notes: "",
};

export default function LeadsPage() {
  const gridRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewLead = searchParams.get("newlead") === "true";

  // State for leads data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchBy, setSearchBy] = useState("full_name");
  // FIXED: Initialize with proper default sort
  const [sortModel, setSortModel] = useState([{ colId: 'entry_date', sort: 'desc' as 'desc' }]);
  const [filterModel, setFilterModel] = useState({});

  // State for new lead form
  const [newLeadForm, setNewLeadForm] = useState(isNewLead);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/leads`,
    []
  );

  // FIXED: Fetch leads with proper server-side sorting
  const fetchLeads = useCallback(
    async (
      page: number = 1,
      limit: number = 20,
      search?: string,
      searchBy: string = "all",
      sort: any[] = [{ colId: 'entry_date', sort: 'desc' }],
      filters: any = {}
    ) => {
      setLoading(true);
      try {
        let url = `${apiEndpoint}?page=${page}&limit=${limit}`;

        // Add search parameters
        if (search && search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}&search_by=${searchBy}`;
        }

        // FIXED: Ensure sorting is always applied (default to entry_date desc)
        const sortToApply = sort && sort.length > 0 ? sort : [{ colId: 'entry_date', sort: 'desc' }];
        const sortParam = sortToApply.map(s => `${s.colId}:${s.sort}`).join(',');
        url += `&sort=${encodeURIComponent(sortParam)}`;

        // Add filter parameters
        if (Object.keys(filters).length > 0) {
          url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
        }

        console.log('Fetching URL:', url); // Debug log

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data: PaginatedLeadsResponse = await res.json();
        setLeads(data.data);
        setTotalLeads(data.total);
        setTotalPages(Math.ceil(data.total / limit));
        setCurrentPage(page);

        console.log('Fetched leads:', data.data.length, 'Total:', data.total); // Debug log
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to load leads";
        setError(error);
        toast.error(error);
      } finally {
        setLoading(false);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    },
    [apiEndpoint]
  );
  const detectSearchBy = (search: string) => {
    if (/^\d+$/.test(search)) return "id"; 
    if (/^\S+@\S+\.\S+$/.test(search)) return "email"; 
    if (/^[\d\s\+\-()]+$/.test(search)) return "phone"; 
    return "full_name";
  };
  

  const handleFilterChanged = useCallback((filterModelFromGrid: any) => {
    console.log('Filter changed:', filterModelFromGrid); // Debug log
    setFilterModel(filterModelFromGrid);
    fetchLeads(1, pageSize, searchTerm, searchBy, sortModel, filterModelFromGrid);
  }, [pageSize, searchTerm, searchBy, sortModel, fetchLeads]);

  useEffect(() => {
    fetchLeads(currentPage, pageSize, searchTerm, searchBy, sortModel, filterModel);
  }, []); 

 

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const autoSearchBy = detectSearchBy(searchTerm);
        fetchLeads(1, pageSize, searchTerm, autoSearchBy, sortModel, filterModel);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);
  
  // Handle page size changes
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
    fetchLeads(1, newSize, searchTerm, searchBy, sortModel, filterModel);
  }, [searchTerm, searchBy, sortModel, filterModel, fetchLeads]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    fetchLeads(newPage, pageSize, searchTerm, searchBy, sortModel, filterModel);
  }, [pageSize, searchTerm, searchBy, sortModel, filterModel, fetchLeads]);

  const handleNewLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaveLoading(true);
    try {
      const formDataWithEntryDate = {
        ...formData,
        entry_date: new Date().toISOString(),
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataWithEntryDate),
      });

      if (!response.ok) throw new Error("Failed to create lead");

      toast.success("Lead created successfully!");
      setNewLeadForm(false);
      setFormData(initialFormData);
      // Refresh to show the new lead (should appear at top with default sort)
      fetchLeads(1, pageSize, searchTerm, searchBy, sortModel, filterModel);
    } catch (error) {
      toast.error("Failed to create lead");
      console.error("Error creating lead:", error);
    } finally {
      setFormSaveLoading(false);
    }
  };

  const handleOpenNewLeadForm = () => {
    router.push("/avatar/leads?newlead=true");
    setNewLeadForm(true);
  };

  const handleCloseNewLeadForm = () => {
    router.push("/avatar/leads");
    setNewLeadForm(false);
  };

  // Row operation handlers
  const handleRowUpdated = useCallback(
    async (updatedRow: Lead) => {
      setLoadingRowId(updatedRow.id);
      try {
        const response = await fetch(`${apiEndpoint}/${updatedRow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRow),
        });

        if (!response.ok) throw new Error("Failed to update lead");

        // Refresh data to maintain server-side sort order
        fetchLeads(currentPage, pageSize, searchTerm, searchBy, sortModel, filterModel);
        toast.success("Lead updated successfully");
      } catch (error) {
        toast.error("Failed to update lead");
        console.error("Error updating lead:", error);
      } finally {
        setLoadingRowId(null);
      }
    },
    [apiEndpoint, currentPage, pageSize, searchTerm, searchBy, sortModel, filterModel, fetchLeads]
  );

  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete lead");

        toast.success("Lead deleted successfully");

        // Refetch to maintain proper pagination and sorting
        const newTotalLeads = totalLeads - 1;
        const newTotalPages = Math.ceil(newTotalLeads / pageSize);

        // If we're on the last page and it becomes empty, go to previous page
        const targetPage = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;

        fetchLeads(targetPage, pageSize, searchTerm, searchBy, sortModel, filterModel);
      } catch (error) {
        toast.error("Failed to delete lead");
        console.error("Error deleting lead:", error);
      }
    },
    [apiEndpoint, currentPage, pageSize, searchTerm, searchBy, sortModel, filterModel, totalLeads, fetchLeads]
  );

  const handleMoveToCandidate = useCallback(
    async (leadId: { id: number }, Moved: boolean) => {
      setLoadingRowId(leadId.id);
      try {
        const method = Moved ? "DELETE" : "POST";
        const url = `${apiEndpoint}/${leadId.id}/move-to-candidate`;

        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to move lead to candidate");
        }

        const data = await response.json();

        // Refresh data to maintain server-side consistency
        fetchLeads(currentPage, pageSize, searchTerm, searchBy, sortModel, filterModel);

        if (Moved) {
          toast.success(`Lead removed from candidate list (Candidate ID: ${data.candidate_id})`);
        } else {
          toast.success(`Lead moved to candidate (Candidate ID: ${data.candidate_id})`);
        }
      } catch (error: any) {
        console.error("Error moving lead to candidate:", error);
        toast.error(error.message || "Failed to move lead to candidate");
      } finally {
        setLoadingRowId(null);
      }
    },
    [apiEndpoint, currentPage, pageSize, searchTerm, searchBy, sortModel, filterModel, fetchLeads]
  );

  // Status renderer for AG Grid
  const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
      open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      closed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
      <Badge className={`${variantMap[status] || variantMap.default} capitalize`}>
        {value || "N/A"}
      </Badge>
    );
  };


  const formatPhoneNumber = (phoneNumberString) => {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
    return `+1 ${phoneNumberString}`;
  };

  // FIXED: Column definitions with proper server-side sorting
  const columnDefs: ColDef<any, any>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        pinned: "left",
        sortable: true // Enable server-side sorting
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
        width: 150,
        sortable: true
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        sortable: true,
        cellRenderer: StatusRenderer,
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
        sortable: true,
        valueGetter: (params) => !!params.data.massemail_unsubscribe,
        valueFormatter: ({ value }: ValueFormatterParams) => (value ? "True" : "False"),
      },
      {
        field: "massemail_email_sent",
        headerName: "Mass Email Sent",
        width: 180,
        sortable: true,
        valueGetter: (params) => !!params.data.massemail_email_sent,
        valueFormatter: ({ value }: ValueFormatterParams) => (value ? "True" : "False"),
      },
      {
        field: "moved_to_candidate",
        headerName: "Moved to Candidate",
        width: 180,
        sortable: true,
        valueGetter: (params) => !!params.data.moved_to_candidate,
        valueFormatter: ({ value }: ValueFormatterParams) => (value ? "True" : "False"),
      },
    ],
    []
  );

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() => fetchLeads(currentPage, pageSize, searchTerm, searchBy, sortModel, filterModel)}
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
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leads Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All Leads ({totalLeads}) - Sorted by latest first
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div key="search-container" className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Leads
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
            {totalLeads} leads found
          </p>
        )}
      </div>

      {/* AG Grid Table */}
      <div className="flex w-full justify-center">
        <AGGridTable
          rowData={leads}
          columnDefs={columnDefs}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          // onSortChanged={handleSortChanged} // FIXED: Enable server-side sorting
          title="Leads"
          showFilters={true}
          showSearch={false}
          height="600px"
        />
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}