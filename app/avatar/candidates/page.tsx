
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

type Batch = {
  batchid: number;
  batchname: string;
};

export default function CandidatesPage() {
  const gridRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewCandidate = searchParams.get("newcandidate") === "true";
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState("all");
  const [sortModel, setSortModel] = useState([{ colId: 'enrolled_date', sort: 'desc' as 'desc' }]);
  const [filterModel, setFilterModel] = useState({});
  const [newCandidateForm, setNewCandidateForm] = useState(isNewCandidate);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/candidates`,
    []
  );
  const batchesEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/batches`,
    []
  );

  // Sync form visibility with URL
  useEffect(() => {
    const newCandidateParam = searchParams.get("newcandidate") === "true";
    setNewCandidateForm(newCandidateParam);
  }, [searchParams]);

  // Fetch all candidates (non-paginated)
  const fetchCandidates = useCallback(
    async (
      search?: string,
      searchBy: string = "all",
      sort: any[] = [{ colId: 'enrolled_date', sort: 'desc' }],
      filters: any = {}
    ) => {
      setLoading(true);
      try {
        let url = `${apiEndpoint}?limit=0`; // Fetch all records
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
    setFilterModel(filterModelFromGrid);
    fetchCandidates(searchTerm, searchBy, sortModel, filterModelFromGrid);
  }, [searchTerm, searchBy, sortModel, fetchCandidates]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const autoSearchBy = detectSearchBy(searchTerm);
        fetchCandidates(searchTerm, autoSearchBy, sortModel, filterModel);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

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

  const handleRowUpdated = useCallback(
    async (updatedRow: Candidate) => {
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
    },
    [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchCandidates]
  );

  const handleRowDeleted = useCallback(
    async (id: number) => {
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
    },
    [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchCandidates]
  );

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
      'permanent resident': "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      ead: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
      'waiting for status': "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
      <Badge className={`${variantMap[workstatus] || variantMap.default} capitalize`}>
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

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        width: 150,
        sortable: true,
        cellRenderer: WorkStatusRenderer,
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
    ],
    [batches]
  );

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
            All Candidates - Sorted by latest first
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
            {candidates.length} candidates found
          </p>
        )}
      </div>
      <div className="flex w-full justify-center">
        <AGGridTable
          rowData={candidates}
          columnDefs={columnDefs}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          // title="Candidates"
          showFilters={true}
          showSearch={false}
          height="600px"
          // pagination={false}
        />
      </div>
      {newCandidateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
              New Candidate Form
            </h2>
            <form
              onSubmit={handleNewCandidateFormSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div>
                <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="discontinued">Discontinued</option>
                  <option value="break">Break</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label htmlFor="workstatus" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Status
                </label>
                <select
                  id="workstatus"
                  name="workstatus"
                  value={formData.workstatus}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Work Status</option>
                  <option value="Citizen">Citizen</option>
                  <option value="Visa">Visa</option>
                  <option value="Permanent resident">Permanent Resident</option>
                  <option value="EAD">EAD</option>
                  <option value="Waiting for Status">Waiting for Status</option>
                </select>
              </div>
              <div>
                <label htmlFor="education" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Education
                </label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="workexperience" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Experience
                </label>
                <input
                  type="text"
                  id="workexperience"
                  name="workexperience"
                  value={formData.workexperience}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="ssn" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SSN
                </label>
                <input
                  type="text"
                  id="ssn"
                  name="ssn"
                  value={formData.ssn}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="agreement" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agreement
                </label>
                <select
                  id="agreement"
                  name="agreement"
                  value={formData.agreement}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="N">N</option>
                  <option value="Y">Y</option>
                </select>
              </div>
              <div>
                <label htmlFor="secondaryemail" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Secondary Email
                </label>
                <input
                  type="email"
                  id="secondaryemail"
                  name="secondaryemail"
                  value={formData.secondaryemail}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="secondaryphone" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  id="secondaryphone"
                  name="secondaryphone"
                  value={formData.secondaryphone}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleNewCandidateFormChange}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="linkedin_id" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  LinkedIn ID
                </label>
                <input
                  type="text"
                  id="linkedin_id"
                  name="linkedin_id"
                  value={formData.linkedin_id}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="dob" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="emergcontactname" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  id="emergcontactname"
                  name="emergcontactname"
                  value={formData.emergcontactname}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="emergcontactemail" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Emergency Contact Email
                </label>
                <input
                  type="email"
                  id="emergcontactemail"
                  name="emergcontactemail"
                  value={formData.emergcontactemail}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="emergcontactphone" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  id="emergcontactphone"
                  name="emergcontactphone"
                  value={formData.emergcontactphone}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="emergcontactaddrs" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Emergency Contact Address
                </label>
                <textarea
                  id="emergcontactaddrs"
                  name="emergcontactaddrs"
                  value={formData.emergcontactaddrs}
                  onChange={handleNewCandidateFormChange}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="fee_paid" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fee Paid
                </label>
                <input
                  type="number"
                  id="fee_paid"
                  name="fee_paid"
                  value={formData.fee_paid}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleNewCandidateFormChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="batchid" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Batch
                </label>
                <select
                  id="batchid"
                  name="batchid"
                  value={formData.batchid}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0} disabled>Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.batchid} value={batch.batchid}>
                      {batch.batchname}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="candidate_folder" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Candidate Folder
                </label>
                <input
                  type="text"
                  id="candidate_folder"
                  name="candidate_folder"
                  value={formData.candidate_folder}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="enrolled_date" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enrolled Date
                </label>
                <input
                  type="date"
                  id="enrolled_date"
                  name="enrolled_date"
                  value={formData.enrolled_date}
                  onChange={handleNewCandidateFormChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
