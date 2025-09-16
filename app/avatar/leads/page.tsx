
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
import { ModuleRegistry } from "ag-grid-community";

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
};


export default function LeadsPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewLead = searchParams.get("newlead") === "true";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState("full_name");
  const [sortModel, setSortModel] = useState([{ colId: 'entry_date', sort: 'desc' as 'desc' }]);
  const [filterModel, setFilterModel] = useState({});
  const [newLeadForm, setNewLeadForm] = useState(isNewLead);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/leads`,
    []
  );

  // Modified fetchLeads function - removed pagination parameters
  const fetchLeads = useCallback(
    async (
      search?: string,
      searchBy: string = "all",
      sort: any[] = [{ colId: 'entry_date', sort: 'desc' }],
      filters: any = {}
    ) => {
      setLoading(true);
      try {
        let url = `${apiEndpoint}`;
        const params = new URLSearchParams();

        if (search && search.trim()) {
          params.append('search', search.trim());
          params.append('search_by', searchBy);
        }

        const sortToApply = sort && sort.length > 0 ? sort : [{ colId: 'entry_date', sort: 'desc' }];
        const sortParam = sortToApply.map(s => `${s.colId}:${s.sort}`).join(',');
        params.append('sort', sortParam);

        if (Object.keys(filters).length > 0) {
          params.append('filters', JSON.stringify(filters));
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        // Handle both paginated and non-paginated responses
        if (data.data && Array.isArray(data.data)) {
          setLeads(data.data);
          setTotalLeads(data.total || data.data.length);
        } else if (Array.isArray(data)) {
          setLeads(data);
          setTotalLeads(data.length);
        } else {
          throw new Error('Invalid response format');
        }
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

  const workVisaStatusOptions = [
    "Waiting for Status",
    "H1B",
    "H4 EAD",
    "Green Card",
    "US Citizen",
    "OPT",
    "CPT"
  ];

  const formFields = {
    workstatus: {
      label: "Work Status",
      type: "select",
      options: workVisaStatusOptions,
      required: true,
    },
  };
  const detectSearchBy = (search: string) => {
    if (/^\d+$/.test(search)) return "id";
    if (/^\S+@\S+\.\S+$/.test(search)) return "email";
    if (/^[\d\s\+\-()]+$/.test(search)) return "phone";
    return "full_name";
  };

  const handleFilterChanged = useCallback((filterModelFromGrid: any) => {
    setFilterModel(filterModelFromGrid);
    fetchLeads(searchTerm, searchBy, sortModel, filterModelFromGrid);
  }, [searchTerm, searchBy, sortModel, fetchLeads]);

  useEffect(() => {
    fetchLeads('', searchBy, sortModel, filterModel);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const autoSearchBy = detectSearchBy(searchTerm);
        fetchLeads(searchTerm, autoSearchBy, sortModel, filterModel);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

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
      // Set default workstatus to "waiting" if empty
      if (!updatedData.workstatus || updatedData.workstatus === '') {
        updatedData.workstatus = 'waiting';
      }
      // Set default boolean values to false if empty or undefined
      const booleanFields = ['moved_to_candidate', 'massemail_email_sent', 'massemail_unsubscribe'];
      booleanFields.forEach(field => {
        if (updatedData[field] === undefined || updatedData[field] === null || updatedData[field] === '') {
          updatedData[field] = false;
        }
      });
      const payload = {
        ...updatedData,
        entry_date: new Date().toISOString(),
        closed_date: updatedData.status === "Closed" ? new Date().toISOString() : null,
      };
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create lead");
      toast.success("Lead created successfully!");
      setNewLeadForm(false);
      setFormData(initialFormData);
      fetchLeads(searchTerm, searchBy, sortModel, filterModel);
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
    setFormData(initialFormData);
  };

  const handleRowUpdated = useCallback(
    async (updatedRow: Lead) => {
      setLoadingRowId(updatedRow.id);
      try {
        const { id, entry_date, ...payload } = updatedRow;

        payload.moved_to_candidate = Boolean(payload.moved_to_candidate);
        payload.massemail_unsubscribe = Boolean(payload.massemail_unsubscribe);
        payload.massemail_email_sent = Boolean(payload.massemail_email_sent);

        if (payload.status === "Closed") {
          payload.closed_date = new Date().toISOString().split('T')[0];
        } else {
          payload.closed_date = null;
        }

        const response = await fetch(`${apiEndpoint}/${updatedRow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update lead");
        }
        fetchLeads(searchTerm, searchBy, sortModel, filterModel);
        toast.success("Lead updated successfully");
      } catch (error) {
        toast.error("Failed to update lead");
        console.error("Error updating lead:", error);
      } finally {
        setLoadingRowId(null);
      }
    },
    [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchLeads]
  );

  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete lead");
        toast.success("Lead deleted successfully");
        fetchLeads(searchTerm, searchBy, sortModel, filterModel);
      } catch (error) {
        toast.error("Failed to delete lead");
        console.error("Error deleting lead:", error);
      }
    },
    [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchLeads]
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
        fetchLeads(searchTerm, searchBy, sortModel, filterModel);
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
    [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchLeads]
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
    []
  );

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() => fetchLeads(searchTerm, searchBy, sortModel, filterModel)}
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
            Leads Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All Leads ({totalLeads}) - Sorted by latest first
          </p>
        </div>
        <Button
          onClick={handleOpenNewLeadForm}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Lead
        </Button>
      </div>
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
      <div className="flex w-full justify-center">
        <AGGridTable
          rowData={leads}
          columnDefs={columnDefs}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          // title="Leads"
          showFilters={true}
          showSearch={false}
          height="600px"
        />
      </div>

      {newLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
              New Lead Form
            </h2>
            <form
              onSubmit={handleNewLeadFormSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              {Object.entries({
                full_name: { label: "Full Name", type: "text", required: true },
                email: { label: "Email", type: "email", required: true },
                phone: { label: "Phone", type: "tel", required: true },
                secondary_email: { label: "Secondary Email", type: "email" },
                secondary_phone: { label: "Secondary Phone", type: "tel" },
                workstatus: formFields.workstatus,
                address: { label: "Address", type: "text" },
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
                massemail_unsubscribe: {
                  label: "Mass Email Unsubscribe",
                  type: "checkbox",
                },
                massemail_email_sent: {
                  label: "Mass Email Sent",
                  type: "checkbox",
                },
              }).map(([name, config]) => (
                <div
                  key={name}
                  className={config.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <label
                    htmlFor={name}
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {config.label}
                  </label>
                  {config.type === "select" ? (
                    <select
                      id={name}
                      name={name}
                      value={formData[name as keyof FormData] as string}
                      onChange={handleNewLeadFormChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={formData[name as keyof FormData] as string}
                      onChange={handleNewLeadFormChange}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : config.type === "checkbox" ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={formData[name as keyof FormData] as boolean}
                        onChange={handleNewLeadFormChange}
                        className="h-4 w-4"
                      />
                      <label htmlFor={name} className="text-sm text-gray-700 dark:text-gray-300">
                        {config.label}
                      </label>
                    </div>
                  ) : (
                    <input
                      type={config.type}
                      id={name}
                      name={name}
                      value={formData[name as keyof FormData] as string}
                      onChange={handleNewLeadFormChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={config.required}
                    />
                  )}
                </div>
              ))}
              <div className="md:col-span-2">
                <label
                  htmlFor="entry_date"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Entry Date
                </label>
                <input
                  type="text"
                  id="entry_date"
                  name="entry_date"
                  value={new Date().toLocaleDateString()}
                  readOnly
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-600 focus:outline-none"
                />
              </div>
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
              onClick={handleCloseNewLeadForm}
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

