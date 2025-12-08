

// "use client";

// import { useState, useEffect } from "react";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { 
//   SearchIcon, 
//   DollarSign, 
//   CheckCircle, 
//   XCircle, 
//   Building,
//   Plus,
//   Eye
// } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { toast, Toaster } from "sonner";
// import api from "@/lib/api";

// interface PlacementFee {
//   id?: number;
//   placement_id: number;
//   installment_id: number;
//   deposit_date: string;
//   deposit_amount: number;
//   amount_collected: "yes" | "no";
//   lastmod_user_id: number;
//   notes?: string;
//   last_mod_datetime?: string;
  
//   // Joined fields
//   company?: string;
//   position?: string;
//   candidate_name?: string;
// }

// interface FeeStats {
//   total_count: number;
//   collected_count: number;
//   pending_count: number;
//   total_collected: number;
//   total_pending: number;
//   total_amount: number;
//   collection_rate: number;
// }

// const statusOptions = ["yes", "no"];

// export default function PlacementFeesPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [allFees, setAllFees] = useState<PlacementFee[]>([]);
//   const [filteredFees, setFilteredFees] = useState<PlacementFee[]>([]);
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [stats, setStats] = useState<FeeStats | null>(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [formData, setFormData] = useState({
//     placement_id: "",
//     installment_id: "",
//     deposit_date: new Date().toISOString().split('T')[0],
//     deposit_amount: "",
//     amount_collected: "no" as "yes" | "no",
//     lastmod_user_id: "1",
//     notes: ""
//   });

//   // Status Renderer
//   const StatusRenderer = (params: any) => {
//     const status = (params.value || "").toString().toLowerCase();
    
//     if (status === "yes") {
//       return (
//         <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
//           <CheckCircle className="h-3 w-3" />
//           Collected
//         </Badge>
//       );
//     } else {
//       return (
//         <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
//           <XCircle className="h-3 w-3" />
//           Pending
//         </Badge>
//       );
//     }
//   };

//   // Date Renderer
//   const DateRenderer = (params: any) => {
//     if (!params.value) return <span className="text-gray-500">N/A</span>;
//     try {
//       const date = new Date(params.value);
//       return date.toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       });
//     } catch (e) {
//       return <span className="text-gray-500">Invalid Date</span>;
//     }
//   };

//   // Amount Renderer
//   const AmountRenderer = (params: any) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(params.value || 0);
//   };

//   // Placement Renderer (Simple text, no Link)
//   const PlacementRenderer = (params: any) => {
//     const placementId = params.data?.placement_id;
//     const candidateName = params.data?.candidate_name || "N/A";
//     const company = params.data?.company || "Unknown Company";
    
//     if (!placementId) return <span className="text-gray-500">N/A</span>;
    
//     return (
//       <div className="space-y-1">
//         <span className="text-blue-600 font-medium block">
//           #{placementId}
//         </span>
//         <div className="text-sm text-gray-600">
//           <div className="truncate">{candidateName}</div>
//           <div className="truncate">{company}</div>
//         </div>
//       </div>
//     );
//   };

//   // Fetch fees
//   const fetchFees = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       console.log("Fetching fee collections...");
//       const res = await api.get("/candidate/placement_fees?page=1&limit=1000");
//       console.log("API Response:", res);
      
//       const data = res?.data || {};
      
//       let fees: PlacementFee[] = [];
//       if (Array.isArray(data)) {
//         fees = data;
//       } else if (Array.isArray(data.data)) {
//         fees = data.data;
//       } else if (data.data) {
//         fees = data.data;
//       } else {
//         fees = [];
//       }
      
//       console.log("Fetched fees:", fees);
      
//       setAllFees(fees);
//       setFilteredFees(fees);
      
//       // Setup columns - always set them, even if empty
//       const cols: ColDef[] = [
//         { 
//           field: "id", 
//           headerName: "ID", 
//           width: 80, 
//           pinned: "left",
//           filter: "agNumberColumnFilter"
//         },
        
//         {
//           field: "placement_id",
//           headerName: "Placement",
//           minWidth: 180,
//           cellRenderer: PlacementRenderer,
//           valueGetter: (p) => p.data?.placement_id || "N/A",
//           filter: "agNumberColumnFilter"
//         },
        
//         {
//           field: "installment_id",
//           headerName: "Installment #",
//           width: 120,
//           editable: true,
//           filter: "agNumberColumnFilter"
//         },
        
//         {
//           field: "deposit_date",
//           headerName: "Deposit Date",
//           minWidth: 140,
//           editable: true,
//           cellRenderer: DateRenderer,
//           filter: "agDateColumnFilter",
//         },
        
//         {
//           field: "deposit_amount",
//           headerName: "Amount",
//           minWidth: 140,
//           editable: true,
//           cellRenderer: AmountRenderer,
//           filter: "agNumberColumnFilter",
//           valueFormatter: (params) => `₹${params.value?.toLocaleString() || '0'}`
//         },
        
//         {
//           field: "amount_collected",
//           headerName: "Status",
//           minWidth: 120,
//           editable: true,
//           cellRenderer: StatusRenderer,
//           cellEditor: "agSelectCellEditor",
//           cellEditorParams: { values: statusOptions },
//           filter: "agSetColumnFilter",
//         },
        
//         {
//           field: "company",
//           headerName: "Company",
//           minWidth: 150,
//           filter: "agTextColumnFilter",
//           valueGetter: (p) => p.data?.company || "N/A"
//         },
        
//         {
//           field: "position",
//           headerName: "Position",
//           minWidth: 150,
//           filter: "agTextColumnFilter",
//           valueGetter: (p) => p.data?.position || "N/A"
//         },
        
//         {
//           field: "candidate_name",
//           headerName: "Candidate",
//           minWidth: 160,
//           filter: "agTextColumnFilter",
//           valueGetter: (p) => p.data?.candidate_name || "N/A"
//         },
        
//         {
//           field: "lastmod_user_id",
//           headerName: "User ID",
//           width: 100,
//           editable: true,
//           filter: "agNumberColumnFilter"
//         },
        
//         { 
//           field: "notes", 
//           headerName: "Notes", 
//           minWidth: 200, 
//           editable: true,
//           filter: "agTextColumnFilter",
//           cellEditor: "agLargeTextCellEditor",
//           cellEditorPopup: true,
//           valueGetter: (p) => p.data?.notes || ""
//         }
//       ];
      
//       setColumnDefs(cols);
      
//     } catch (err: any) {
//       console.error("Error fetching fees:", err);
//       const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch fee collections";
//       setError(errorMsg);
//       toast.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch stats
//   const fetchStats = async () => {
//     try {
//       console.log("Fetching stats...");
//       const res = await api.get("/candidate/placement_fees/metrics");
//       console.log("Stats response:", res.data);
//       setStats(res.data);
//     } catch (err: any) {
//       console.error("Failed to fetch stats:", err);
//       const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch statistics";
//       console.error(errorMsg);
//     }
//   };

//   // Initial load
//   useEffect(() => {
//     fetchFees();
//     fetchStats();
//   }, []);

//   // Search filter
//   useEffect(() => {
//     const lower = searchTerm.toLowerCase();
//     const filtered = allFees.filter((fee) => {
//       return (
//         fee.id?.toString().includes(lower) ||
//         fee.placement_id?.toString().includes(lower) ||
//         fee.installment_id?.toString().includes(lower) ||
//         fee.deposit_amount?.toString().includes(lower) ||
//         fee.candidate_name?.toLowerCase().includes(lower) ||
//         fee.company?.toLowerCase().includes(lower) ||
//         fee.position?.toLowerCase().includes(lower) ||
//         fee.notes?.toLowerCase().includes(lower) ||
//         fee.amount_collected?.toLowerCase().includes(lower)
//       );
//     });
    
//     setFilteredFees(filtered.sort((a, b) => (b.id || 0) - (a.id || 0)));
//   }, [searchTerm, allFees]);

//   // Handle form input change
//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   // Create new fee collection
//   const handleCreateFee = async () => {
//     try {
//       const feeData = {
//         ...formData,
//         placement_id: parseInt(formData.placement_id),
//         installment_id: parseInt(formData.installment_id),
//         deposit_amount: parseFloat(formData.deposit_amount),
//         lastmod_user_id: parseInt(formData.lastmod_user_id)
//       };

//       console.log("Creating fee:", feeData);
      
//       const res = await api.post("/candidate/placement_fees", feeData);
//       console.log("Create response:", res);
      
//       toast.success("Fee collection created successfully!");
      
//       // Reset form
//       setFormData({
//         placement_id: "",
//         installment_id: "",
//         deposit_date: new Date().toISOString().split('T')[0],
//         deposit_amount: "",
//         amount_collected: "no",
//         lastmod_user_id: "1",
//         notes: ""
//       });
      
//       setShowAddModal(false);
      
//       // Refresh data
//       fetchFees();
//       fetchStats();
      
//     } catch (err: any) {
//       console.error("Error creating fee:", err);
//       const errorMsg = err.response?.data?.detail || err.message || "Failed to create fee collection";
//       toast.error(errorMsg);
//     }
//   };

//   // Update row
//   const handleRowUpdated = async (updatedRow: PlacementFee) => {
//     try {
//       if (!updatedRow.id) {
//         toast.error("Missing fee collection ID");
//         return;
//       }

//       // Prepare update data
//       const updateData = {
//         placement_id: updatedRow.placement_id,
//         installment_id: updatedRow.installment_id,
//         deposit_date: updatedRow.deposit_date,
//         deposit_amount: updatedRow.deposit_amount,
//         amount_collected: updatedRow.amount_collected,
//         lastmod_user_id: updatedRow.lastmod_user_id,
//         notes: updatedRow.notes || ""
//       };

//       console.log("Updating fee:", updatedRow.id, updateData);
      
//       await api.put(`/candidate/placement_fees/${updatedRow.id}`, updateData);

//       // Update local state
//       setAllFees(prev =>
//         prev.map(fee => (fee.id === updatedRow.id ? updatedRow : fee))
//       );
      
//       // Refresh stats
//       fetchStats();
      
//       toast.success("Fee collection updated successfully!");
//     } catch (err: any) {
//       console.error(err);
//       const errorMsg = err.response?.data?.detail || err.message || "Failed to update fee collection";
//       toast.error(errorMsg);
//     }
//   };

//   // Delete row
//   const handleRowDeleted = async (id: number) => {
//     try {
//       if (!confirm("Are you sure you want to delete this fee collection?")) {
//         return;
//       }

//       console.log("Deleting fee:", id);
//       await api.delete(`/candidate/placement_fees/${id}`);
      
//       // Update local state
//       setAllFees(prev => prev.filter(fee => fee.id !== id));
      
//       // Refresh stats
//       fetchStats();
      
//       toast.success("Fee collection deleted successfully");
//     } catch (err: any) {
//       console.error(err);
//       const errorMsg = err.response?.data?.detail || err.message || "Failed to delete fee collection";
//       toast.error(errorMsg);
//     }
//   };

//   // Test API endpoint
//   const testApi = async () => {
//     try {
//       console.log("Testing API endpoint...");
//       const res = await api.get("/candidate/placement_fees/check-table");
//       console.log("API test result:", res.data);
//       toast.success("API connection successful!");
//     } catch (err) {
//       console.error("API test failed:", err);
//       toast.error("API connection failed!");
//     }
//   };

//   return (
//     <div className="space-y-6 p-4 md:p-6">
//       <Toaster richColors position="top-center" />

//       {/* Header */}
//       <div className="flex justify-between items-start">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Placement Fee Collections
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Manage and track placement fee payments
//           </p>
//         </div>
//         <button
//           onClick={testApi}
//           className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
//         >
//           Test API
//         </button>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white p-4 rounded-lg border shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500">Total Collected</p>
//               <p className="text-xl font-bold text-green-600">
//                 ₹{stats?.total_collected?.toLocaleString() || 0}
//               </p>
//               <p className="text-xs text-gray-500">
//                 {stats?.collected_count || 0} collections
//               </p>
//             </div>
//             <div className="p-2 bg-green-50 rounded-full">
//               <CheckCircle className="h-6 w-6 text-green-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-lg border shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500">Pending</p>
//               <p className="text-xl font-bold text-yellow-600">
//                 ₹{stats?.total_pending?.toLocaleString() || 0}
//               </p>
//               <p className="text-xs text-gray-500">
//                 {stats?.pending_count || 0} pending
//               </p>
//             </div>
//             <div className="p-2 bg-yellow-50 rounded-full">
//               <XCircle className="h-6 w-6 text-yellow-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-lg border shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500">Total Amount</p>
//               <p className="text-xl font-bold text-blue-600">
//                 ₹{stats?.total_amount?.toLocaleString() || 0}
//               </p>
//               <p className="text-xs text-gray-500">
//                 {stats?.total_count || 0} total
//               </p>
//             </div>
//             <div className="p-2 bg-blue-50 rounded-full">
//               <DollarSign className="h-6 w-6 text-blue-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-lg border shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500">Collection Rate</p>
//               <p className="text-xl font-bold text-purple-600">
//                 {stats?.collection_rate?.toFixed(1) || 0}%
//               </p>
//               <p className="text-xs text-gray-500">Success rate</p>
//             </div>
//             <div className="p-2 bg-purple-50 rounded-full">
//               <Building className="h-6 w-6 text-purple-600" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Search Bar and Actions */}
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="flex-1">
//           <Label htmlFor="search">Search Fee Collections</Label>
//           <div className="relative mt-1">
//             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <Input
//               id="search"
//               type="text"
//               placeholder="Search by ID, amount, candidate, company..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>
        
//         <div className="flex items-end gap-2">
//           <button
//             onClick={() => fetchFees()}
//             className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
//           >
//             <Eye className="h-4 w-4" />
//             Refresh
//           </button>
          
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
//           >
//             <Plus className="h-4 w-4" />
//             Add New
//           </button>
//         </div>
//       </div>

//       {/* Error Display */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
//           <div className="flex items-center">
//             <XCircle className="h-5 w-5 mr-2" />
//             <div>
//               <p className="font-medium">Error loading data</p>
//               <p className="text-sm">{error}</p>
//               <button
//                 onClick={() => {
//                   setError(null);
//                   fetchFees();
//                   fetchStats();
//                 }}
//                 className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* AG Grid Table */}
//       {loading ? (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           <p className="ml-3 text-gray-600">Loading fee collections...</p>
//         </div>
//       ) : (
//         <div className="w-full">
//           <AGGridTable
//             rowData={filteredFees}
//             columnDefs={columnDefs}
//             title={`Fee Collections (${filteredFees.length})`}
//             height="calc(70vh)"
//             showSearch={false}
//             onRowUpdated={handleRowUpdated}
//             onRowDeleted={handleRowDeleted}
//           />
//         </div>
//       )}

//       {/* Add Fee Modal */}
//       {showAddModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Add New Fee Collection</h2>
//                 <button
//                   onClick={() => setShowAddModal(false)}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <Label htmlFor="placement_id">Placement ID *</Label>
//                   <Input
//                     id="placement_id"
//                     name="placement_id"
//                     type="number"
//                     value={formData.placement_id}
//                     onChange={handleInputChange}
//                     className="mt-1"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="installment_id">Installment # *</Label>
//                   <Input
//                     id="installment_id"
//                     name="installment_id"
//                     type="number"
//                     value={formData.installment_id}
//                     onChange={handleInputChange}
//                     className="mt-1"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="deposit_date">Deposit Date *</Label>
//                   <Input
//                     id="deposit_date"
//                     name="deposit_date"
//                     type="date"
//                     value={formData.deposit_date}
//                     onChange={handleInputChange}
//                     className="mt-1"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="deposit_amount">Amount (₹) *</Label>
//                   <Input
//                     id="deposit_amount"
//                     name="deposit_amount"
//                     type="number"
//                     step="0.01"
//                     value={formData.deposit_amount}
//                     onChange={handleInputChange}
//                     className="mt-1"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="amount_collected">Status</Label>
//                   <select
//                     id="amount_collected"
//                     name="amount_collected"
//                     value={formData.amount_collected}
//                     onChange={handleInputChange}
//                     className="w-full mt-1 px-3 py-2 border rounded"
//                   >
//                     <option value="no">Pending</option>
//                     <option value="yes">Collected</option>
//                   </select>
//                 </div>

//                 <div>
//                   <Label htmlFor="lastmod_user_id">User ID *</Label>
//                   <Input
//                     id="lastmod_user_id"
//                     name="lastmod_user_id"
//                     type="number"
//                     value={formData.lastmod_user_id}
//                     onChange={handleInputChange}
//                     className="mt-1"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="notes">Notes</Label>
//                   <textarea
//                     id="notes"
//                     name="notes"
//                     value={formData.notes}
//                     onChange={handleInputChange}
//                     rows={3}
//                     className="w-full mt-1 px-3 py-2 border rounded"
//                   />
//                 </div>

//                 <div className="flex justify-end gap-3 pt-4">
//                   <button
//                     type="button"
//                     onClick={() => setShowAddModal(false)}
//                     className="px-4 py-2 border rounded hover:bg-gray-50"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleCreateFee}
//                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                   >
//                     Create
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Debug Info */}
//       <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
//         <div>Total Records: {allFees.length}</div>
//         <div>Filtered Records: {filteredFees.length}</div>
//         <div>Columns Defined: {columnDefs.length}</div>
//         <div className="mt-2">
//           <button
//             onClick={() => console.log("All fees:", allFees)}
//             className="px-2 py-1 bg-gray-200 rounded text-xs"
//           >
//             Log Data
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }










"use client";

import { useState, useEffect } from "react";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { 
  SearchIcon, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Plus,
  RefreshCw
} from "lucide-react";
import { ColDef } from "ag-grid-community";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";

interface PlacementFee {
  id?: number;
  placement_id: number;
  installment_id: number;
  deposit_date: string;
  deposit_amount: number;
  amount_collected: "yes" | "no";
  lastmod_user_id: number;
  notes?: string;
}

interface FeeStats {
  total_count: number;
  collected_count: number;
  pending_count: number;
  total_collected: number;
  total_pending: number;
  total_amount: number;
  collection_rate: number;
}

const statusOptions = ["yes", "no"];

export default function PlacementFeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allFees, setAllFees] = useState<PlacementFee[]>([]);
  const [filteredFees, setFilteredFees] = useState<PlacementFee[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    placement_id: "",
    installment_id: "",
    deposit_date: new Date().toISOString().split('T')[0],
    deposit_amount: "",
    amount_collected: "no" as "yes" | "no",
    lastmod_user_id: "1",
    notes: ""
  });

  // Status Renderer
  const StatusRenderer = (params: any) => {
    const status = (params.value || "").toString().toLowerCase();
    
    if (status === "yes") {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Collected
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
  };

  // Date Renderer
  const DateRenderer = (params: any) => {
    if (!params.value) return <span className="text-gray-500">N/A</span>;
    try {
      const date = new Date(params.value);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return <span className="text-gray-500">Invalid Date</span>;
    }
  };

  // Amount Renderer
  const AmountRenderer = (params: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(params.value || 0);
  };

  // Fetch fees
  const fetchFees = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching fee collections...");
      const res = await api.get("/candidate/placement_fees?page=1&limit=1000");
      console.log("API Response:", res);
      
      const data = res?.data || {};
      
      let fees: PlacementFee[] = [];
      if (Array.isArray(data)) {
        fees = data;
      } else if (Array.isArray(data.data)) {
        fees = data.data;
      } else {
        fees = [];
      }
      
      console.log("Fetched fees:", fees);
      
      setAllFees(fees);
      setFilteredFees(fees);
      
      // Setup columns with exact names as specified
      const cols: ColDef[] = [
        { 
          field: "id", 
          headerName: "ID", 
          width: 80, 
          pinned: "left",
          filter: "agNumberColumnFilter"
        },
        
        {
          field: "placement_id",
          headerName: "Placement ID",
          width: 130,
          editable: true,
          filter: "agNumberColumnFilter"
        },
        
        {
          field: "installment_id",
          headerName: "Installment ID",
          width: 130,
          editable: true,
          filter: "agNumberColumnFilter"
        },
        
        {
          field: "deposit_date",
          headerName: "Deposit Date",
          minWidth: 140,
          editable: true,
          cellRenderer: DateRenderer,
          filter: "agDateColumnFilter",
        },
        
        {
          field: "deposit_amount",
          headerName: "Deposit Amount",
          minWidth: 150,
          editable: true,
          cellRenderer: AmountRenderer,
          filter: "agNumberColumnFilter",
          valueFormatter: (params) => `₹${params.value?.toLocaleString() || '0'}`
        },
        
        {
          field: "amount_collected",
          headerName: "Amount Collected",
          minWidth: 150,
          editable: true,
          cellRenderer: StatusRenderer,
          cellEditor: "agSelectCellEditor",
          cellEditorParams: { values: statusOptions },
          filter: "agSetColumnFilter",
        },
        
        {
          field: "lastmod_user_id",
          headerName: "Last Modified User ID",
          width: 180,
          editable: true,
          filter: "agNumberColumnFilter"
        },
        
        { 
          field: "notes", 
          headerName: "Notes", 
          minWidth: 200, 
          editable: true,
          filter: "agTextColumnFilter",
          cellEditor: "agLargeTextCellEditor",
          cellEditorPopup: true,
          valueGetter: (p) => p.data?.notes || ""
        }
      ];
      
      setColumnDefs(cols);
      
    } catch (err: any) {
      console.error("Error fetching fees:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch fee collections";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      console.log("Fetching stats...");
      const res = await api.get("/candidate/placement_fees/metrics");
      console.log("Stats response:", res.data);
      setStats(res.data);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFees();
    fetchStats();
  }, []);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = allFees.filter((fee) => {
      return (
        fee.id?.toString().includes(lower) ||
        fee.placement_id?.toString().includes(lower) ||
        fee.installment_id?.toString().includes(lower) ||
        fee.deposit_amount?.toString().includes(lower) ||
        fee.notes?.toLowerCase().includes(lower) ||
        fee.amount_collected?.toLowerCase().includes(lower)
      );
    });
    
    setFilteredFees(filtered.sort((a, b) => (b.id || 0) - (a.id || 0)));
  }, [searchTerm, allFees]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new fee collection
  const handleCreateFee = async () => {
    try {
      const feeData = {
        ...formData,
        placement_id: parseInt(formData.placement_id),
        installment_id: parseInt(formData.installment_id),
        deposit_amount: parseFloat(formData.deposit_amount),
        lastmod_user_id: parseInt(formData.lastmod_user_id)
      };

      console.log("Creating fee:", feeData);
      
      const res = await api.post("/candidate/placement_fees", feeData);
      console.log("Create response:", res);
      
      toast.success("Fee collection created successfully!");
      
      // Reset form
      setFormData({
        placement_id: "",
        installment_id: "",
        deposit_date: new Date().toISOString().split('T')[0],
        deposit_amount: "",
        amount_collected: "no",
        lastmod_user_id: "1",
        notes: ""
      });
      
      setShowAddModal(false);
      
      // Refresh data
      fetchFees();
      fetchStats();
      
    } catch (err: any) {
      console.error("Error creating fee:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to create fee collection";
      toast.error(errorMsg);
    }
  };

  // Update row
  const handleRowUpdated = async (updatedRow: PlacementFee) => {
    try {
      if (!updatedRow.id) {
        toast.error("Missing fee collection ID");
        return;
      }

      const updateData = {
        placement_id: updatedRow.placement_id,
        installment_id: updatedRow.installment_id,
        deposit_date: updatedRow.deposit_date,
        deposit_amount: updatedRow.deposit_amount,
        amount_collected: updatedRow.amount_collected,
        lastmod_user_id: updatedRow.lastmod_user_id,
        notes: updatedRow.notes || ""
      };

      console.log("Updating fee:", updatedRow.id, updateData);
      
      await api.put(`/candidate/placement_fees/${updatedRow.id}`, updateData);

      setAllFees(prev =>
        prev.map(fee => (fee.id === updatedRow.id ? updatedRow : fee))
      );
      
      fetchStats();
      
      toast.success("Fee collection updated successfully!");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to update fee collection";
      toast.error(errorMsg);
    }
  };

  // Delete row
  const handleRowDeleted = async (id: number) => {
    try {
      if (!confirm("Are you sure you want to delete this fee collection?")) {
        return;
      }

      console.log("Deleting fee:", id);
      await api.delete(`/candidate/placement_fees/${id}`);
      
      setAllFees(prev => prev.filter(fee => fee.id !== id));
      
      fetchStats();
      
      toast.success("Fee collection deleted successfully");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to delete fee collection";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Placement Fee Collections
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track placement fee payments
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-xl font-bold text-green-600">
                ₹{stats?.total_collected?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.collected_count || 0} collections
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">
                ₹{stats?.total_pending?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.pending_count || 0} pending
              </p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-full">
              <XCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-bold text-blue-600">
                ₹{stats?.total_amount?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.total_count || 0} total
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Collection Rate</p>
              <p className="text-xl font-bold text-purple-600">
                {stats?.collection_rate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500">Success rate</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar and Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Fee Collections</Label>
          <div className="relative mt-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search by ID, amount, placement ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-end gap-2">
          <button
            onClick={() => {
              fetchFees();
              fetchStats();
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Error loading data</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchFees();
                  fetchStats();
                }}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AG Grid Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading fee collections...</p>
        </div>
      ) : (
        <div className="w-full">
          <AGGridTable
            rowData={filteredFees}
            columnDefs={columnDefs}
            title={`Fee Collections (${filteredFees.length})`}
            height="calc(70vh)"
            showSearch={false}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      )}

      {/* Add Fee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Fee Collection</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="placement_id">Placement ID *</Label>
                  <Input
                    id="placement_id"
                    name="placement_id"
                    type="number"
                    value={formData.placement_id}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="installment_id">Installment ID *</Label>
                  <Input
                    id="installment_id"
                    name="installment_id"
                    type="number"
                    value={formData.installment_id}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="deposit_date">Deposit Date *</Label>
                  <Input
                    id="deposit_date"
                    name="deposit_date"
                    type="date"
                    value={formData.deposit_date}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="deposit_amount">Deposit Amount (₹) *</Label>
                  <Input
                    id="deposit_amount"
                    name="deposit_amount"
                    type="number"
                    step="0.01"
                    value={formData.deposit_amount}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount_collected">Amount Collected</Label>
                  <select
                    id="amount_collected"
                    name="amount_collected"
                    value={formData.amount_collected}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  >
                    <option value="no">No (Pending)</option>
                    <option value="yes">Yes (Collected)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="lastmod_user_id">Last Modified User ID *</Label>
                  <Input
                    id="lastmod_user_id"
                    name="lastmod_user_id"
                    type="number"
                    value={formData.lastmod_user_id}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFee}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}