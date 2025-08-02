

"use client";
import { useMemo, useState, useCallback, useEffect, Ref } from "react";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import {
  SearchIcon,
  PlusCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { provideGlobalGridOptions } from 'ag-grid-community';
import { useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { method } from "lodash";


const AGGridTable = dynamic(() => import("@/components/AGGridTable"), {
  ssr: false,
});


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
  last_modified?: string | Date | null;
  moved_to_candidate?: boolean;
  notes?: string | null;
};

type PaginatedLeadsResponse = {
  page: number;
  limit: number;
  total: number;
  data: Lead[];
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
provideGlobalGridOptions({
  theme: "legacy",
});


export default function LeadsPage() {
  const gridRef = useRef<AgGridReact>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewLead = searchParams.get("newlead") === "true";
  const selectedRowData = gridRef.current?.api?.getSelectedRows()?.[0];


  // State management
  const [state, setState] = useState({
    searchTerm: "",
    leads: [],
    filteredLeads: [],
    isLoading: true,
    error: null as string | null,
    page: 1,
    limit: 100,
    total: 0,
    newLeadForm: isNewLead,
    formData: initialFormData,
    formSaveLoading: false,
    loadingRowId: null,
  });

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/lead`,
    []
  );





  const fetchLeads = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch(
        `${apiEndpoint}?page=${state.page}&limit=${state.limit}`
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data: PaginatedLeadsResponse = await res.json();

      if (!data.data) throw new Error("No data property in response");

      setState((prev) => ({
        ...prev,
        leads: data.data,
        filteredLeads: data.data,
        total: data.total,
        page: data.page,
        limit: data.limit,
        isLoading: false,
        loadingRowId: null as number | null,

      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to load leads";
      setState((prev) => ({ ...prev, error, isLoading: false }));
      toast.error(error);
    }
  }, [apiEndpoint, state.page, state.limit]);


  const rowSelection = useMemo(() => {
    return "multiple";
  }, []);


  const filterLeads = useCallback((searchTerm: string, leads: Lead[]) => {
    if (!searchTerm.trim()) return leads;

    const searchLower = searchTerm.toLowerCase();
    return leads.filter((lead) => {
      return (
        lead.full_name?.toLowerCase()?.includes(searchLower) ||
        lead.email?.toLowerCase()?.includes(searchLower) ||
        lead.phone?.includes(searchTerm) ||
        lead.workstatus?.toLowerCase()?.includes(searchLower) ||
        lead.status?.toLowerCase()?.includes(searchLower) ||
        lead.address?.toLowerCase()?.includes(searchLower) ||
        lead.secondary_email?.toLowerCase()?.includes(searchLower) ||
        lead.city?.toLowerCase()?.includes(searchLower) ||
        lead.state?.toLowerCase()?.includes(searchLower) ||
        lead.moved_to_candidate?.toString().toLowerCase() === searchLower
      );
    });
  }, []);


  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (state.searchTerm !== undefined && Array.isArray(state.leads)) {
        setState((prev) => ({
          ...prev,
          filteredLeads: filterLeads(prev.searchTerm, prev.leads),
        }));
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [state.searchTerm, state.leads, filterLeads]);


  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);


  const handleNewLeadFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handleNewLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, formSaveLoading: true }));

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.formData),
      });

      if (!response.ok) throw new Error("Failed to create lead");

      toast.success("Lead created successfully!");
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          newLeadForm: false,
          formData: initialFormData,
        }));
        fetchLeads();
      }, 1000);
    } catch (error) {
      toast.error("Failed to create lead");
      console.error("Error creating lead:", error);
    } finally {
      setState((prev) => ({ ...prev, formSaveLoading: false }));
    }
  };

  const handleOpenNewLeadForm = () => {
    router.push("/avatar/leads?newlead=true");
    setState((prev) => ({ ...prev, newLeadForm: true }));
  };

  const handleCloseNewLeadForm = () => {
    router.push("/avatar/leads");
    setState((prev) => ({ ...prev, newLeadForm: false }));
  };



  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete lead");

        setState((prev) => ({
          ...prev,
          leads: prev.leads.filter((lead) => lead.id !== id),
          filteredLeads: prev.filteredLeads.filter((lead) => lead.id !== id),
        }));

        toast.success("Lead deleted successfully");
      } catch (error) {
        toast.error("Failed to delete lead");
        console.error("Error deleting lead:", error);
      }
    },
    [apiEndpoint]
  );






  const handleRowUpdated = useCallback(
    async (updatedRow: Lead) => {
      setState((prev) => ({ ...prev, loadingRowId: updatedRow.id }));

      try {
        const response = await fetch(`${apiEndpoint}/${updatedRow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRow),
        });

        if (!response.ok) throw new Error("Failed to update lead");

        setState((prev) => ({
          ...prev,
          leads: prev.leads.map((lead) =>
            lead.id === updatedRow.id ? updatedRow : lead
          ),
          filteredLeads: prev.filteredLeads.map((lead) =>
            lead.id === updatedRow.id ? updatedRow : lead
          ),
          loadingRowId: null,
        }));

        toast.success("Lead updated successfully");
      } catch (error) {
        setState((prev) => ({ ...prev, loadingRowId: null }));
        toast.error("Failed to update lead");
        console.error("Error updating lead:", error);
      }
    },
    [apiEndpoint]
  );


  const handleMoveToCandidate = useCallback(
    async (leadId: { id: number }, Moved) => {
      console.log("this is moved",Moved)
      setState((prev) => ({ ...prev, loadingRowId: leadId.id }));

      try {
        var method;
        if(Moved){
          method = "DELETE"
        }else{
          method = "POST"
        }
        const response = await fetch(`${apiEndpoint}/movetocandidate/${leadId.id}`, {
          method: method,
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to move lead to candidate");
        }

        const data = await response.json();

        // Update lead state (set moved_to_candidate = true)
        setState((prev) => ({
          ...prev,
          leads: prev.leads.map((lead) =>
            lead.id === leadId.id ? { ...lead, moved_to_candidate: !Moved } : lead
          ),
          filteredLeads: prev.filteredLeads.map((lead) =>
            lead.id === leadId.id ? { ...lead, moved_to_candidate: !Moved } : lead
          ),
          loadingRowId: null,
        }));

        if(Moved){
          toast.success(`Lead Has been removed from candidate list (Candidate ID in Candidate list: ${data.candidate_id})`);
        }else{
          toast.success(`Lead moved to candidate (Candidate ID: ${data.candidate_id})`);
        }
      } catch (error: any) {
        console.error("Error moving lead to candidate:", error);
        toast.error(error.message || "Failed to move lead to candidate");
        setState((prev) => ({ ...prev, loadingRowId: null }));
      }
    },
    []
  );

  // Pagination handlers
  const handlePreviousPage = () => {
    if (state.page > 1) {
      setState((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (state.page * state.limit < state.total) {
      setState((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setState((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Renderers and column definitions
  const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
      open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      closed:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };

    return (
      <Badge
        className={`${variantMap[status] || variantMap.default} capitalize`}
      >
        {value || "N/A"}
      </Badge>
    );
  };

  const dateFormatter = ({ value }: { value?: string | Date | null }) => {
    return value ? new Date(value).toLocaleDateString() : "-";
  };



  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        pinned: "left",
      },
      { field: "full_name", headerName: "Full Name", width: 180, filter: true },
      { field: "email", headerName: "Email", width: 220, filter: true },
      { field: "phone", headerName: "Phone", width: 150, filter: true },
      {
        field: "workstatus",
        headerName: "Work Status",
        width: 150,
        filter: true,
      },

      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: StatusRenderer,
        filter: true,
      },

      {
        field: "entry_date",
        headerName: "Entry Date",
        width: 150,
        valueFormatter: dateFormatter,
        filter: "agDateColumnFilter",
      },
      
      {
        field: "closed_date",
        headerName: "Closed Date",
        width: 150,
        valueFormatter: dateFormatter,
        filter: "agDateColumnFilter",
      },

      { field: "address", headerName: "Address", width: 120, filter: true },

      {
        field: "last_modified",
        headerName: "Last Modified",
        width: 180,
        valueFormatter: dateFormatter,
        filter: 'agDateColumnFilter'
      },
      

      {
        headerName: "Actions",
        field: "actions",
        width: 200,
        cellRenderer: ({ data }: any) => {
          const isMoved = data.moved_to_candidate;
          const isLoading = state.loadingRowId === data.id;

          return (
            <button
              onClick={async () => {
                if (isLoading) return;
                await handleMoveToCandidate(data, isMoved);
              }}
              disabled={isLoading}
              className={`px-3 py-1 rounded text-sm font-semibold flex items-center justify-center gap-1 ${isMoved
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-600 text-white hover:bg-green-700"
                } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Updating...
                </>
              ) : (
                <>{isMoved ? "Undo Move" : "Move to Candidate"}</>
              )}
            </button>
          );
        },
      }
    ],
    [handleRowUpdated, state.loadingRowId] // include loadingRowId in deps
  );


  // Default column definitions
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  // Loading and error states
  if (state.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{state.error}</div>
        <Button variant="outline" onClick={fetchLeads} className="ml-4">
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
            Manage and track your potential clients
          </p>
        </div>

        <Button
          onClick={handleOpenNewLeadForm}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </div>

      {/* New Lead Form Modal */}
      {state.newLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-6 text-center text-2xl font-bold">
              New Lead Form
            </h2>

            <form
              onSubmit={handleNewLeadFormSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              {/* Form fields */}
              {Object.entries({
                full_name: { label: "Full Name", type: "text", required: true },
                email: { label: "Email", type: "email", required: true },
                phone: { label: "Phone", type: "tel", required: true },
                workstatus: { label: "Work Status", type: "text" },
                address: { label: "City", type: "text" },
                status: {
                  label: "Status",
                  type: "select",
                  options: ["Open", "In Progress", "Closed"],
                  required: true,
                },
                notes: { label: "Notes (optional)", type: "textarea" },
                moved_to_candidate: {
                  label: "Moved to Candidate",
                  type: "checkbox",
                },
              }).map(([name, config]) => (
                <div
                  key={name}
                  className={config.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <label
                    htmlFor={name}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    {config.label}
                  </label>

                  {config.type === "select" ? (
                    <select
                      id={name}
                      name={name}
                      value={state.formData[name as keyof FormData] as string}
                      onChange={handleNewLeadFormChange}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={config.required}
                    >
                      <option value="" disabled>
                        Select Status
                      </option>
                      {config.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : config.type === "textarea" ? (
                    <textarea
                      id={name}
                      name={name}
                      value={state.formData[name as keyof FormData] as string}
                      onChange={handleNewLeadFormChange}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : config.type === "checkbox" ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={
                          state.formData[name as keyof FormData] as boolean
                        }
                        onChange={handleNewLeadFormChange}
                        className="h-4 w-4"
                      />
                      <label htmlFor={name} className="text-sm">
                        {config.label}
                      </label>
                    </div>
                  ) : (
                    <input
                      type={config.type}
                      id={name}
                      name={name}
                      value={state.formData[name as keyof FormData] as string}
                      onChange={handleNewLeadFormChange}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={config.required}
                    />
                  )}
                </div>
              ))}

              {/* Submit Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={state.formSaveLoading}
                  className={`w-full rounded-md py-2 transition duration-200 ${state.formSaveLoading
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                >
                  {state.formSaveLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>

            <button
              onClick={handleCloseNewLeadForm}
              className="absolute right-3 top-3 text-2xl leading-none text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="max-w-md flex-1">
          <Label
            htmlFor="search"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Search Leads
          </Label>
          <div className="relative mt-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name, email, status..."
              value={state.searchTerm}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className="pl-10"
            />
          </div>
        </div>

      </div>

      {/* Search Results Info */}
      {state.searchTerm && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {state.filteredLeads.length} leads matching {state.searchTerm}
        </p>
      )}

      {/* AG Grid Table */}
      <div className="flex w-full justify-center">

        <AGGridTable

          rowData={state.filteredLeads}
          columnDefs={columnDefs}
          onRowClicked={(event) => console.log("Row clicked:", event.data)}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          title="Leads"
          showSearch={true}
          showFilters={true}
          height="600px"


        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {(state.page - 1) * state.limit + 1} to{" "}
          {Math.min(state.page * state.limit, state.total)} of {state.total}{" "}
          leads
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={state.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium dark:bg-gray-800">
            Page {state.page}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={state.page * state.limit >= state.total}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
