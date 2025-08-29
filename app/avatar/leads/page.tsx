
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
import AGGridTable from "@/components/AGGridTable";
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

export default function LeadsPage() {
  const gridRef = useRef<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewLead = searchParams.get("newlead") === "true";
  const [searchTerm, setSearchTerm] = useState("");
  const [totalLeads, setTotalLeads] = useState(0);

  const [state, setState] = useState({
    leads: [] as Lead[],
    filteredLeads: [] as Lead[],
    isLoading: true,
    error: null as string | null,
    page: 1,
    limit: 10,
    total: 0,
    newLeadForm: isNewLead,
    formData: initialFormData,
    formSaveLoading: false,
    loadingRowId: null as number | null,
  });
  

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/leads`,
    []
  );

  // Stable fetchLeads reference

  const fetchLeads = useCallback(
    async (page: number = 1, limit: number = 10, searchTerm?: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        let url = `${apiEndpoint}?page=${page}&limit=${limit}`;
        if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: PaginatedLeadsResponse = await res.json();
        setState((prev) => ({
          ...prev,
          leads: data.data,
          filteredLeads: data.data,
          total: data.total,
          page: data.page,
          limit: data.limit,
          isLoading: false,
        }));
        // Update totalLeads only if no search term
        if (!searchTerm) {
          setTotalLeads(data.total);
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to load leads";
        setState((prev) => ({ ...prev, error, isLoading: false }));
        toast.error(error);
      }
    },
    [apiEndpoint]
  );

  const fetchLeadsRef = useRef(fetchLeads);
  fetchLeadsRef.current = fetchLeads;


  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchLeadsRef.current(1, state.limit, searchTerm);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, state.limit]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const totalPages = Math.ceil(state.total / state.limit);

  const handleNewLeadFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
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
        fetchLeads(1, state.limit, searchTerm);
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
          total: prev.total - 1,
        }));
        toast.success("Lead deleted successfully");
        // Refetch total leads if no search term
        if (!searchTerm) {
          const res = await fetch(`${apiEndpoint}?page=1&limit=1`);
          const data: PaginatedLeadsResponse = await res.json();
          setTotalLeads(data.total);
        }
      } catch (error) {
        toast.error("Failed to delete lead");
        console.error("Error deleting lead:", error);
      }
    },
    [apiEndpoint, searchTerm]
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
    async (leadId: { id: number }, Moved: boolean) => {
      setState((prev) => ({ ...prev, loadingRowId: leadId.id }));
      try {
        const method = Moved ? "DELETE" : "POST";
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
        if (Moved) {
          toast.success(`Lead Has been removed from candidate list (Candidate ID in Candidate list: ${data.candidate_id})`);
        } else {
          toast.success(`Lead moved to candidate (Candidate ID: ${data.candidate_id})`);
        }
      } catch (error: any) {
        console.error("Error moving lead to candidate:", error);
        toast.error(error.message || "Failed to move lead to candidate");
        setState((prev) => ({ ...prev, loadingRowId: null }));
      }
    },
    [apiEndpoint]
  );

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

  const columnDefs: ColDef<any, any>[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80, pinned: "left" },
      { field: "full_name", headerName: "Full Name", width: 180 },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        editable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={`tel:${params.value}`}
              className="text-blue-600 underline hover:text-blue-800"
            >
              {params.value}
            </a>
          );
        },
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
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
      {
        field: "entry_date",
        headerName: "Entry Date",
        width: 150,
        valueFormatter: ({ value }: ValueFormatterParams) =>
          value
            ? new Date(value).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
              })
            : "-",
      },
      { field: "workstatus", headerName: "Work Status", width: 150 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: StatusRenderer,
      },
      { field: "secondary_email", headerName: "Secondary Email", width: 220 },
      { field: "secondary_phone", headerName: "Secondary Phone", width: 150 },
      { field: "address", headerName: "Address", width: 250 },
      {
        field: "closed_date",
        headerName: "Closed Date",
        width: 150,
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
        valueFormatter: ({ value }: ValueFormatterParams) => value || "-",
      },
      {
        field: "massemail_unsubscribe",
        headerName: "Mass Email Unsubscribe",
        width: 180,
        valueGetter: (params) => !!params.data.massemail_unsubscribe,
        valueFormatter: ({ value }: ValueFormatterParams) => (value ? "True" : "False"),
      },
      {
        field: "mass_email_sent",
        headerName: "Mass Email Sent",
        width: 180,
        valueGetter: (params) => !!params.data.massemail_email_sent,
        valueFormatter: ({ value }: ValueFormatterParams) => (value ? "True" : "False"),
      },
      {
        field: "moved_to_candidate",
        headerName: "Moved to Candidate",
        width: 180,
        valueGetter: (params) => !!params.data.moved_to_candidate,
        valueFormatter: ({ value }: ValueFormatterParams) => (value ? "True" : "False"),
      },
    ],
    [handleRowUpdated]
  );

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
        <Button
          variant="outline"
          onClick={() => fetchLeads(1, state.limit, searchTerm)}
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
            All Leads ({totalLeads})
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
              className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {state.total} leads matching "{searchTerm}"
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
          showFilters={false}
          showSearch={false}
          height="600px"
        />
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select
            value={state.limit}
            onChange={(e) => {
              const newLimit = Number(e.target.value);
              fetchLeads(1, newLimit, searchTerm);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchLeads(state.page - 1, state.limit, searchTerm)}
            disabled={state.page === 1}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {state.page} of {totalPages || 1}
          </span>
          <button
            onClick={() => fetchLeads(state.page + 1, state.limit, searchTerm)}
            disabled={state.page === totalPages}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
