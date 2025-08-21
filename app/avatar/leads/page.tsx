// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useCallback } from "react";

// export default function LeadsPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredLeads, setFilteredLeads] = useState([]);

//   const leads = [
//     {
//       id: 1,
//       fullName: "John Smith",
//       email: "john.smith@example.com",
//       contact: "+1 (555) 123-4567",
//       visaStatus: "H1B",
//       education: "Master's in Computer Science",
//       status: "active",
//       enrolledDate: "2024-01-15",
//       amountPaid: 5000,
//       address: "123 Main St, Apt 4B, New York, NY 10001",
//       referredBy: "Jane Doe",
//       pincode: "10001",
//       primaryEmergencyContact: "+1 (555) 987-6543",
//       secondaryEmergencyContact: "+1 (555) 456-7890",
//     },
//     {
//       id: 2,
//       fullName: "Sarah Johnson",
//       email: "sarah.johnson@example.com",
//       contact: "+1 (555) 234-5678",
//       visaStatus: "Green Card",
//       education: "Bachelor's in Information Technology",
//       status: "active",
//       enrolledDate: "2024-01-14",
//       amountPaid: 7500,
//       address: "456 Oak Ave, San Francisco, CA 94102",
//       referredBy: "Mike Wilson",
//       pincode: "94102",
//       primaryEmergencyContact: "+1 (555) 876-5432",
//       secondaryEmergencyContact: "+1 (555) 654-3210",
//     },
//   ];

//   // Auto-search functionality
//   const filterLeads = useCallback((searchTerm: string) => {
//     if (searchTerm.trim() === "") {
//       return leads;
//     } else {
//       return leads.filter((lead) => {
//         const searchLower = searchTerm.toLowerCase();
//         return (
//           lead.fullName.toLowerCase().includes(searchLower) ||
//           lead.email.toLowerCase().includes(searchLower) ||
//           lead.contact.includes(searchTerm) ||
//           lead.visaStatus.toLowerCase().includes(searchLower) ||
//           lead.education.toLowerCase().includes(searchLower) ||
//           lead.status.toLowerCase().includes(searchLower) ||
//           lead.address.toLowerCase().includes(searchLower) ||
//           lead.referredBy.toLowerCase().includes(searchLower) ||
//           lead.pincode.includes(searchTerm)
//         );
//       });
//     }
//   }, []);

//   useEffect(() => {
//     const filtered = filterLeads(searchTerm);
//     setFilteredLeads(filtered);
//   }, [searchTerm, filterLeads]);

//   const StatusRenderer = (params: any) => {
//     const { value } = params;
//     const getStatusColor = (status: string) => {
//       switch (status.toLowerCase()) {
//         case "active":
//           return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
//         case "inactive":
//           return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
//         default:
//           return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//       }
//     };
//     return (
//       <Badge className={getStatusColor(value)}>{value.toUpperCase()}</Badge>
//     );
//   };

//   const VisaStatusRenderer = (params: any) => {
//     const { value } = params;
//     const getVisaColor = (visa: string) => {
//       switch (visa) {
//         case "H1B":
//           return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//         case "Green Card":
//           return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
//         case "F1 Student":
//           return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
//         case "L1":
//           return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
//         case "OPT":
//           return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
//         case "H4 EAD":
//           return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
//         default:
//           return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//       }
//     };
//     return <Badge className={getVisaColor(value)}>{value}</Badge>;
//   };

//   const AmountRenderer = (params: any) => {
//     return `$${params.value.toLocaleString()}`;
//   };

//   const columnDefs: ColDef[] = useMemo(
//     () => [
//       { field: "id", headerName: "ID", width: 80, pinned: "left", checkboxSelection: true },
//       { field: "fullName", headerName: "Full Name", width: 180, minWidth: 150 },
//       { field: "email", headerName: "Email", width: 220, minWidth: 180 },
//       { field: "contact", headerName: "Contact", width: 150, minWidth: 120 },
//       {
//         field: "visaStatus",
//         headerName: "Visa Status",
//         cellRenderer: VisaStatusRenderer,
//         width: 130,
//         minWidth: 120,
//       },
//       {
//         field: "education",
//         headerName: "Education",
//         width: 250,
//         minWidth: 200,
//       },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         width: 120,
//         minWidth: 100,
//       },
//       {
//         field: "enrolledDate",
//         headerName: "Enrolled Date",
//         width: 130,
//         minWidth: 120,
//       },
//       {
//         field: "amountPaid",
//         headerName: "Amount Paid",
//         cellRenderer: AmountRenderer,
//         width: 130,
//         minWidth: 120,
//         type: "numericColumn",
//       },
//       { field: "address", headerName: "Address", width: 300, minWidth: 250 },
//       {
//         field: "referredBy",
//         headerName: "Referred By",
//         width: 150,
//         minWidth: 120,
//       },
//       { field: "pincode", headerName: "Pincode", width: 100, minWidth: 80 },
//       {
//         field: "primaryEmergencyContact",
//         headerName: "Primary Emergency",
//         width: 180,
//         minWidth: 150,
//       },
//       {
//         field: "secondaryEmergencyContact",
//         headerName: "Secondary Emergency",
//         width: 180,
//         minWidth: 150,
//       },
//     ],
//     []
//   );

//   const handleRowUpdated = (updatedRow) => {
//     setFilteredLeads((prev) =>
//       prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//     );
//   };

//   const handleRowDeleted = (id) => {
//     setFilteredLeads((prev) => prev.filter((row) => row.id !== id));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Leads Management
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Manage and track your potential clients with comprehensive
//             information
//           </p>
//         </div>
//       </div>

//       {/* Search Input */}
//       <div className="max-w-md">
//         <Label
//           htmlFor="search"
//           className="text-sm font-medium text-gray-700 dark:text-gray-300"
//         >
//           Search Leads
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search by name, email, visa status, education..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         {searchTerm && (
//           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {filteredLeads.length} lead(s) found
//           </p>
//         )}
//       </div>

//       <div className="flex justify-center w-full">
//         <div className="w-full max-w-7xl">
//           <AGGridTable
//             rowData={filteredLeads}
//             columnDefs={columnDefs}
//             title={`All Leads (${filteredLeads.length})`}
//             height="calc(60vh)"
//             showSearch={false}
//             onRowClicked={(event) => {
//               console.log("Row clicked:", event.data);
//             }}
//             onRowUpdated={handleRowUpdated}
//             onRowDeleted={handleRowDeleted}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }



// "use client";

// import React, { useEffect, useState } from "react";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// //import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { toast } from "react-hot-toast";
// import axios from "axios";
// import dynamic from "next/dynamic";

// // Dynamically import AGGridTable only on client
// const AGGridTable = dynamic(() => import('@/components/AGGridTable'), {
//   ssr: false,
// });


// const StatusRenderer = (params: any) => {
//   const status = params?.value?.toString().toLowerCase() ?? "";

//   const colorMap: Record<string, string> = {
//     future: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
//     completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//     // delete: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
//     open: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//     closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
//     delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
//     rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
//     converted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//   };

//   const badgeClass =
//     colorMap[status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";

//   return <Badge className={badgeClass}>{params.value?.toString().toUpperCase()}</Badge>;
// };

// const VisaStatusRenderer = (params: any) => {
//   const visa = (params?.value || "").toString().trim();

//   const colorMap: Record<string, string> = {
//     H1B: "bg-blue-100 text-blue-800",
//     GC: "bg-emerald-100 text-emerald-800",
//     "F1 Student": "bg-purple-100 text-purple-800",
//     F1: "bg-purple-100 text-purple-800",
//     "GC EAD": "bg-teal-100 text-teal-800",
//     L1: "bg-orange-100 text-orange-800",
//     L2: "bg-orange-100 text-orange-800",
//     Citizen: "bg-indigo-100 text-indigo-800",
//     OPT: "bg-indigo-100 text-indigo-800",
//     H4: "bg-pink-100 text-pink-800",
//     None: "bg-gray-200 text-gray-700",
//     Select: "bg-gray-200 text-gray-700",
//   };

//   const cls = colorMap[visa] || "bg-gray-100 text-gray-800";
//   return <Badge className={cls}>{visa}</Badge>;
// };


// const DateFormatter = (params: any) =>
//   params.value ? new Date(params.value).toLocaleDateString() : "";

// export default function LeadsPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [leads, setLeads] = useState<any[]>([]);
//   const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searching, setSearching] = useState(false);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(100);

//   // Fetch leads with pagination
//   const fetchLeads = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/leads?page=${page}&limit=${pageSize}`
//       );
//       setLeads(response.data);
//       setFilteredLeads(response.data);
//     } catch (e) {
//       setError(e.response?.data?.message || "Failed to load leads");
//       toast.error(`Failed to load leads: ${e.response?.data?.message || e.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Search leads with debounce and validation
//   const searchLeads = async (query: string) => {
//     try {
//       setSearching(true);
//       const trimmedQuery = query.trim();
      
//       if (!trimmedQuery) {
//         setFilteredLeads(leads);
//         return;
//       }

//       if (trimmedQuery.length < 3) {
//         setFilteredLeads([]);
//         return;
//       }

//       const response = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/leads/search?name=${encodeURIComponent(trimmedQuery)}`
//       );
//       setFilteredLeads(response.data);
//     } catch (e) {
//       setFilteredLeads([]);
//       toast.error(`Search error: ${e.response?.data?.message || e.message}`);
//     } finally {
//       setSearching(false);
//     }
//   };

//   // Handle row updates
//   const handleRowUpdated = async (updatedData: any) => {
//     try {
//       const response = await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/leads/${updatedData.leadid}`,
//         updatedData
//       );
//       toast.success("Lead updated successfully");
//       fetchLeads(); // Refresh the data
//     } catch (e) {
//       toast.error(`Update failed: ${e.response?.data?.message || e.message}`);
//     }
//   };

//   // Handle row deletion
//   const handleRowDeleted = async (leadId: string | number) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}`);
//       toast.success("Lead deleted successfully");
//       fetchLeads(); // Refresh the data
//     } catch (e) {
//       toast.error(`Delete failed: ${e.response?.data?.message || e.message}`);
//     }
//   };

//   useEffect(() => {
//     fetchLeads();
//   }, [page, pageSize]);

//   useEffect(() => {
//     if (leads.length > 0) {
//       const dynamicColumns: ColDef[] = Object.keys(leads[0]).map((key) => {
//         const headerName = key
//           .replace(/([a-z])([A-Z])/g, "$1 $2")
//           .replace(/\b\w/g, (c) => c.toUpperCase());

//         const column: ColDef = {
//           field: key,
//           headerName,
//           width: 150,
//           editable: true,
//         };

//         if (key.toLowerCase().includes("date") && key.toLowerCase() !== "leadid") {
//           column.valueFormatter = DateFormatter;
//         } else if (key.toLowerCase() === "status") {
//           column.cellRenderer = StatusRenderer;
//         }
//          else if (key.toLowerCase() === "workstatus") {
//           column.cellRenderer = VisaStatusRenderer;
//         }

//         if (key === "leadid") {
//           column.pinned = "left";
//           column.checkboxSelection = true;
//           column.width = 100;
//         }

//         return column;
//       });

//       setColumnDefs(dynamicColumns);
//     }
//   }, [leads]);

//   // Debounced search
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       searchLeads(searchTerm);
//     }, 500);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [searchTerm]);

//   if (loading && page === 1) return <p className="text-center mt-8">Loading leads...</p>;
//   if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Leads Management
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Browse, search, and manage all leads in the pipeline.
//           </p>
//         </div>
//       </div>

//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Search Leads
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search by name (min 3 characters)..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         {searching && (
//           <p className="mt-2 text-sm text-blue-500 dark:text-blue-400">Searching...</p>
//         )}
//         {searchTerm && !searching && (
//           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {filteredLeads.length} lead(s) found
//           </p>
//         )}
//       </div>

//       <div className="flex justify-center w-full">
//         <div className="w-full max-w-7xl">
//           <AGGridTable
//             rowData={filteredLeads}
//             columnDefs={columnDefs}
//             title={`All Leads (${filteredLeads.length})`}
//             height="calc(70vh)"
//             showSearch={false}
//             // onRowClicked={(event) => console.log("Row clicked:", event.data)}
//             onRowUpdated={handleRowUpdated}
//             onRowDeleted={handleRowDeleted}
//           />
//         </div>
//       </div>

//       <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
//         <div className="flex items-center space-x-2">
//           <span className="text-sm">Rows per page:</span>
//           <select
//             value={pageSize}
//             onChange={(e) => {
//               setPageSize(Number(e.target.value));
//               setPage(1);
//             }}
//             className="border rounded px-2 py-1 text-sm"
//           >
//             {[10, 20, 50, 100].map((size) => (
//               <option key={size} value={size}>
//                 {size}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex items-center space-x-2">
//           <button
//             onClick={() => setPage((p) => Math.max(p - 1, 1))}
//             disabled={page === 1}
//             className="px-2 py-1 border rounded text-sm disabled:opacity-50"
//           >
//             Previous
//           </button>
//           <span className="text-sm">Page {page}</span>
//           <button
//             onClick={() => setPage((p) => p + 1)}
//             disabled={filteredLeads.length < pageSize}
//             className="px-2 py-1 border rounded text-sm disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }




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
    () => `${process.env.NEXT_PUBLIC_API_URL}/leads`,
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
        lead.notes?.toString().toLowerCase() === searchLower ||
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

      // {
      //   field: "moved_to_candidate",
      //   headerName: "Moved to Candidate",
      //   width: 180,
      //   filter: "agSetColumnFilter",
      //   valueFormatter: ({ value }) => (value ? "Yes" : "No"),
      // }


       
      {
          field: "moved_to_candidate",
          headerName: "Moved to Candidate",
          width: 180,
          filter: "agSetColumnFilter",
          valueFormatter: ({ value }) => (value ? "true" : "false"), // display as text
        }



      

      // {
      //   headerName: "moved_to_candidate",
      //   field: "moved_to_candidate",
      //   width: 200,
      //   cellRenderer: ({ data }: any) => {
      //     const isMoved = data.moved_to_candidate;
      //     const isLoading = state.loadingRowId === data.id;

      //     return (
      //       <button
      //         onClick={async () => {
      //           if (isLoading) return;
      //           await handleMoveToCandidate(data, isMoved);
      //         }}
      //         disabled={isLoading}
      //         className={`px-3 py-1 rounded text-sm font-semibold flex items-center justify-center gap-1 ${isMoved
      //           ? "bg-red-500 text-white hover:bg-red-600"
      //           : "bg-green-600 text-white hover:bg-green-700"
      //           } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
      //       >
      //         {isLoading ? (
      //           <>
      //             <svg
      //               className="animate-spin h-4 w-4 text-white"
      //               viewBox="0 0 24 24"
      //             >
      //               <circle
      //                 className="opacity-25"
      //                 cx="12"
      //                 cy="12"
      //                 r="10"
      //                 stroke="currentColor"
      //                 strokeWidth="4"
      //                 fill="none"
      //               />
      //               <path
      //                 className="opacity-75"
      //                 fill="currentColor"
      //                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      //               />
      //             </svg>
      //             Updating...
      //           </>
      //         ) : (
      //           <>{isMoved ? "Undo Move" : "Move to Candidate"}</>
      //         )}
      //       </button>
      //     );
      //   },
      // }
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
                // notes: { label: "Notes (optional)", type: "textarea" },
                // moved_to_candidate: {
                //   label: "Moved to Candidate",
                //   type: "bool",
                // },
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