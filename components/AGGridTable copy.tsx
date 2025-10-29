// // -----------------hkd------------------------

// "use client";
// import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import {
//   ColDef,
//   GridReadyEvent,
//   ColumnMovedEvent,
//   CellValueChangedEvent,
//   GridApi,
// } from "ag-grid-community";
// import { AgGridReact } from "ag-grid-react";
// import { useMemo, useCallback, useRef, useState, useEffect } from "react";
// import { Button } from "@/components/admin_ui/button";
// import { Plus } from "lucide-react";
// import {
//   EyeIcon,
//   EditIcon,
//   TrashIcon,
//   DownloadIcon,
//   SettingsIcon,
// } from "lucide-react";
// import { ViewModal } from "./ViewModal";
// import { EditModal } from "@/components/EditModal";
// import { ConfirmDialog } from "@/components/ConfirmDialog";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";
// import "@/styles/admin.css";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { apiFetch } from "@/lib/api";
// import { toast, Toaster } from "sonner";
// import { LeadsHelper, db, Lead as DexieLead } from "@/lib/dexieDB";
// import { SearchIcon, PlusCircle, RefreshCw, X } from "lucide-react";





// type Lead = DexieLead;

// type FormData = {
//   full_name: string;
//   email: string;
//   phone: string;
//   workstatus: string;
//   address: string;
//   secondary_email: string | null;
//   secondary_phone: string | null;
//   status: string;
//   moved_to_candidate: boolean;
//   notes: string;
//   entry_date?: string;
//   massemail_unsubscribe: boolean;
//   massemail_email_sent: boolean;
// };

// const initialFormData: FormData = {
//   full_name: "",
//   email: "",
//   phone: "",
//   workstatus: "Waiting for Status",
//   address: "",
//   status: "Open",
//   moved_to_candidate: false,
//   notes: "",
//   massemail_unsubscribe: false,
//   massemail_email_sent: false,
//   secondary_email: "",
//   secondary_phone: "",
// };



// const statusOptions = ["Open", "Closed", "Future"];
// const workStatusOptions = [
//   "Waiting for Status",
//   "H1B",
//   "H4 EAD",
//   "Permanent Resident",
//   "Citizen",
//   "OPT",
//   "CPT",
// ];
// const ColumnVisibilityModal = ({
//   isOpen,
//   onClose,
//   children,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
// }) => {
//   if (!isOpen) return null;
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
//       onClick={onClose}
//     >
//       <div
//         className="w-full max-w-[425px] rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {children}
//       </div>
//     </div>
//   );
// };

// interface AGGridTableProps {
//   rowData: any[];
//   columnDefs: ColDef[];
//   loading?: boolean;
//   defaultColDef?: ColDef;
//   onRowClicked?: (data: any) => void;
//   onRowUpdated?: (data: any) => void;
//   onRowDeleted?: (id: string | number) => void;
//   title?: string;
//   showSearch?: boolean;
//   showFilters?: boolean;
//   height?: string;
//   overlayNoRowsTemplate?: string;
//   batches?: any[];
//   gridOptions?: any;
//   getRowNodeId?: (data: any) => string;
// }

// interface RowData {
//   id?: string | number;
//   sessionid?: string | number;
//   leadid?: string | number;
//   candidateid?: string | number;
//   batchid?: string | number;
//   fullName?: string;
//   company?: string;
//   [key: string]: any;
// }

// export function AGGridTable({
//   rowData,
//   columnDefs: initialColumnDefs,
//   loading = false,
//   onRowClicked,
//   onRowUpdated,
//   onRowDeleted,
//   overlayNoRowsTemplate = "No rows to show",
//   title,
//   showSearch = true,
//   showFilters = true,
//   height = "400px",
//   batches = [],
// }: AGGridTableProps) {
//   // Refs and State
//   const gridRef = useRef<AgGridReact>(null);
//   const gridApiRef = useRef<GridApi | null>(null);
//   const [selectedRowData, setSelectedRowData] = useState<RowData[] | null>(
//     null
//   );
//   const [viewData, setViewData] = useState<RowData | null>(null);
//   const [currentViewIndex, setCurrentViewIndex] = useState<number>(0);
//   const [editData, setEditData] = useState<RowData | null>(null);
//   const [deleteConfirmData, setDeleteConfirmData] = useState<RowData | null>(
//     null
//   );
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
//   const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
// const [loadingg, setLoading] = useState(false);
// const [leads, setLeads] = useState<Lead[]>([]);
//   const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [totalLeads, setTotalLeads] = useState(0);
 
//   const [error, setError] = useState<string | null>(null);
// //  const router = useRouter();
//   // Detect dark mode
//   useEffect(() => {
//     const checkDarkMode = () => {
//       setIsDarkMode(document.documentElement.classList.contains("dark"));
//     };
//     checkDarkMode();
//     const observer = new MutationObserver(checkDarkMode);
//     observer.observe(document.documentElement, {
//       attributes: true,
//       attributeFilter: ["class"],
//     });
//     return () => observer.disconnect();
//   }, []);

//   // Load saved column visibility
//   useEffect(() => {
//     if (title) {
//       const saved = localStorage.getItem(`hiddenColumns-${title}`);
//       if (saved) {
//         try {
//           setHiddenColumns(JSON.parse(saved));
//         } catch (e) {
//           console.error("Failed to parse hidden columns", e);
//         }
//       }
//     }
//   }, [title]);

//   // Save column visibility
//   useEffect(() => {
//     if (title) {
//       localStorage.setItem(
//         `hiddenColumns-${title}`,
//         JSON.stringify(hiddenColumns)
//       );
//     }
//   }, [hiddenColumns, title]);

//   const visibleColumnDefs = useMemo(() => {
//     return initialColumnDefs.filter((col) => {
//       if (!col.field) return true;
//       return !hiddenColumns.includes(col.field);
//     });
//   }, [initialColumnDefs, hiddenColumns]);

//   const onGridReady = useCallback((params: GridReadyEvent) => {
//     gridApiRef.current = params.api;
//   }, []);

//   const onRowClickedHandler = useCallback(
//     (event: any) => {
//       if (onRowClicked) {
//         onRowClicked(event.data);
//       }
//     },
//     [onRowClicked]
//   );

//   const handleRowSelection = useCallback(() => {
//     if (gridApiRef.current) {
//       const selectedRows = gridApiRef.current.getSelectedRows() as RowData[];
//       setSelectedRowData(selectedRows.length > 0 ? selectedRows : null);
//     }
//   }, []);

//   const onColumnMoved = useCallback((event: ColumnMovedEvent) => {}, []);

//   // Returns the currently displayed (filtered and sorted) rows
//   const getDisplayedRows = useCallback((): RowData[] => {
//     const api = gridApiRef.current;
//     if (!api) return rowData;
//     const result: RowData[] = [];
//     const count = api.getDisplayedRowCount();
//     for (let i = 0; i < count; i++) {
//       const node = api.getDisplayedRowAtIndex(i);
//       if (node && node.data) result.push(node.data);
//     }
//     return result;
//   }, [rowData]);

//   const handleView = useCallback(() => {
//     if (selectedRowData && selectedRowData.length > 0) {
//       setEditData(null);
//       const selectedRow = selectedRowData[0];
//       const displayedRows = getDisplayedRows();
//       // Find the index of the selected row within the CURRENTLY DISPLAYED rows (after filters/sorts)
//       const index = displayedRows.findIndex((row) => {
//         // Try to match by various ID fields
//         if (selectedRow.id && row.id) return selectedRow.id === row.id;
//         if (selectedRow.sessionid && row.sessionid)
//           return selectedRow.sessionid === row.sessionid;
//         if (selectedRow.leadid && row.leadid)
//           return selectedRow.leadid === row.leadid;
//         if (selectedRow.candidateid && row.candidateid)
//           return selectedRow.candidateid === row.candidateid;
//         if (selectedRow.batchid && row.batchid)
//           return selectedRow.batchid === row.batchid;
//         // Fallback to comparing all properties
//         return JSON.stringify(selectedRow) === JSON.stringify(row);
//       });
//       setCurrentViewIndex(index >= 0 ? index : 0);
//       setViewData(selectedRow);
//     }
//   }, [selectedRowData, getDisplayedRows]);

//   const handleViewNavigation = useCallback(
//     (newIndex: number) => {
//       const displayedRows = getDisplayedRows();
//       if (displayedRows && newIndex >= 0 && newIndex < displayedRows.length) {
//         setCurrentViewIndex(newIndex);
//       }
//     },
//     [getDisplayedRows]
//   );

//   const handleEdit = useCallback(() => {
//     if (selectedRowData && selectedRowData.length > 0) {
//       setEditData(selectedRowData[0]);
//     }
//   }, [selectedRowData]);

//   const handleDelete = useCallback(() => {
//     if (selectedRowData && selectedRowData.length > 0) {
//       setDeleteConfirmData(selectedRowData[0]);
//     }
//   }, [selectedRowData]);

//   const confirmDelete = useCallback(() => {
//     if (deleteConfirmData && onRowDeleted) {
//       if (deleteConfirmData.leadid) onRowDeleted(deleteConfirmData.leadid);
//       else if (deleteConfirmData.candidateid)
//         onRowDeleted(deleteConfirmData.candidateid);
//       else if (deleteConfirmData.id) onRowDeleted(deleteConfirmData.id);
//       else if (deleteConfirmData.batchid)
//         onRowDeleted(deleteConfirmData.batchid);
//       else if (deleteConfirmData.sessionid)
//         onRowDeleted(deleteConfirmData.sessionid);

//       setSelectedRowData(null);
//       setDeleteConfirmData(null);
//     }
//   }, [deleteConfirmData, onRowDeleted]);

//   const handleSave = useCallback(
//     (updatedData: RowData) => {
//       if (gridRef.current) {
//         gridRef.current.api.applyTransaction({ update: [updatedData] });
//       }

//       if (onRowUpdated) onRowUpdated(updatedData);

//       setEditData(null);
//       setSelectedRowData(null);
//     },
//     [onRowUpdated]
//   );

//   const onCellValueChanged = useCallback(
//     (event: CellValueChangedEvent) => {
//       if (gridRef.current) {
//         gridRef.current.api.applyTransaction({ update: [event.data] });
//       }

//       if (onRowUpdated) onRowUpdated(event.data);
//     },
//     [onRowUpdated]
//   );
//   const handleDownload = useCallback(() => {
//     if (gridApiRef.current) {
//       gridApiRef.current.exportDataAsCsv({
//         fileName: `${title || "grid-data"}.csv`,
//       });
//     }
//   }, [title]);

//   const toggleColumnVisibility = useCallback(
//     (field: string, isVisible: boolean) => {
//       setHiddenColumns((prev) =>
//         isVisible ? prev.filter((col) => col !== field) : [...prev, field]
//       );
//     },
//     []
//   );

//   const resetColumns = useCallback(() => {
//     setHiddenColumns([]);
//   }, []);

//   const paginationNumberFormatter = useCallback((params: any) => {
//     return `${params.value.toLocaleString()}`;
//   }, []);

//   // const AGGridTable = () => {
//   // const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//    const searchParams = useSearchParams();
//   const isNewLead = searchParams.get("newlead") === "true";
//   const [isModalOpen, setIsModalOpen] = useState(isNewLead);
//    const router = useRouter();
  
//   // const [isModalOpen, setIsModalOpen] = useState(isNewLead);


// const {
//   register,
//   handleSubmit,
//   reset,
//   formState: { errors, isSubmitting },
//   setValue,
//   watch,
// } = useForm<FormData>({
//   defaultValues: initialFormData,
// });

//   const loadLeadsFromIndexedDB = useCallback(async (search?: string) => {
//     setLoading(true);
//     try {
//       let localLeads = await db.leads.toArray();
      
      
//       if (search && search.trim()) {
//         const term = search.trim().toLowerCase();
//         localLeads = localLeads.filter((lead) => {
//           const nameMatch = lead.full_name?.toLowerCase().includes(term);
//           const emailMatch = lead.email?.toLowerCase().includes(term);
//           const phoneMatch = lead.phone?.toLowerCase().includes(term);
//           const idMatch = lead.id?.toString().includes(term);
//           return nameMatch || emailMatch || phoneMatch || idMatch;
//         });
//       }
// const sortLeadsByEntryDate = (leads: Lead[]): Lead[] => {
//   return [...leads].sort((a, b) => {
//     const dateA = new Date(a.entry_date || 0).getTime();
//     const dateB = new Date(b.entry_date || 0).getTime();
//     return dateB - dateA; 
//   });
// };
//       const sortedLeads = sortLeadsByEntryDate(localLeads);
//       setLeads(sortedLeads);
//       setFilteredLeads(sortedLeads);
      
      
      
//     } catch (err) {
//       console.error('Error loading from IndexedDB:', err);
//       setError('Failed to load local data');
//     } finally {
//       setLoading(false);
//     }
//   }, []);



//   const [formSaveLoading, setFormSaveLoading] = useState(false);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});





// const onSubmit = async (data: FormData) => {
//   if (!data.full_name.trim() || !data.email.trim() || !data.phone.trim()) {
//     toast.error("Full Name, Email, and Phone are required");
//     return;
//   }

//   setFormSaveLoading(true);
//   setFormErrors({});

//   try {
//     const updatedData = { 
//       ...data,
//       status: data.status || "Open",
//       workstatus: data.workstatus || "Waiting for Status",
//       moved_to_candidate: Boolean(data.moved_to_candidate),
//       massemail_email_sent: Boolean(data.massemail_email_sent),
//       massemail_unsubscribe: Boolean(data.massemail_unsubscribe),
//       entry_date: data.entry_date || new Date().toISOString(),
//     };

//     const savedLead = await apiFetch("leads", {
//       method: "POST",
//       body: updatedData,
//       timeout: 10000,
//     });

//     await db.leads.add({ 
//       ...savedLead, 
//       synced: true,
//       lastSync: new Date().toISOString()
//     });

//     await loadLeadsFromIndexedDB(searchTerm);

//     toast.success("Lead created successfully!");
//     handleCloseModal();
//   } catch (error: any) {
//     console.error("Error creating lead:", error);
//     // Error handling...
//   } finally {
//     setFormSaveLoading(false);
//   }
// };
//   // Handle opening modal

// const handleOpenModal = () => {
//   // router.push("/avatar/leads?newlead=true");
//   setIsModalOpen(true);
// };

// // Handle closing modal  
// const handleCloseModal = () => {
//   // router.push("/avatar/leads");
//   setIsModalOpen(false);
//   reset();
// };
  
  
  
  

   
  
  
  
  
//    const handleAdd = () => {
//     // router.push("/avatar/leads?newlead=true");
//     setIsModalOpen(true);
   
//   };

//   return (
//     <div className="mx-auto w-full max-w-7xl flex-row-reverse space-y-4">
//       <div className="flex items-center justify-end justify-between">
//         {title && (
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
//             {title}
//           </h3>
//         )}
//         <div className="ml-auto flex items-center  space-x-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleAdd}
//             className="flex h-8 w-8 items-center justify-center p-0 font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
//             title="Add New"
//           >
//             +
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setIsColumnModalOpen(true)}
//             className="h-8 w-8 p-0 "
//             title="Toggle Columns"
//           >
//             <SettingsIcon className="h-4 w-4" />
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleView}
//             disabled={!selectedRowData || selectedRowData.length === 0}
//             className="h-8 w-8 p-0"
//             title="View"
//           >
//             <EyeIcon className="h-4 w-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleEdit}
//             disabled={!selectedRowData || selectedRowData.length === 0}
//             className="h-8 w-8 p-0"
//             title="Edit"
//           >
//             <EditIcon className="h-4 w-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleDelete}
//             disabled={!selectedRowData || selectedRowData.length === 0}
//             className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
//             title="Delete"
//           >
//             <TrashIcon className="h-4 w-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleDownload}
//             className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400"
//             title="Download CSV"
//           >
//             <DownloadIcon className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       <div className="flex justify-center">
//         <div
//           className={`ag-theme-alpine ${
//             isDarkMode ? "ag-grid-dark-mode" : ""
//           } w-full rounded-lg border border-gray-200 shadow-sm dark:border-gray-700`}
//           style={{ height: "calc(100vh - 260px)", minHeight: "400px" }}
//         >
//           <AgGridReact
//             ref={gridRef}
//             rowData={rowData}
//             columnDefs={visibleColumnDefs}
//             onGridReady={onGridReady}
//             onRowClicked={onRowClickedHandler}
//             onSelectionChanged={handleRowSelection}
//             onColumnMoved={onColumnMoved}
//             onCellValueChanged={onCellValueChanged}
//             animateRows={true}
//             loading={loading}
//             suppressSetFilterByDefault={true}
//             overlayNoRowsTemplate={overlayNoRowsTemplate}
//             defaultColDef={{
//               resizable: true,
//               sortable: true,

//               filter: true,
//               cellClass: "custom-cell-style",
//               editable: true,
//             }}
//             rowSelection="multiple"
//             theme={"legacy"}
//             suppressRowClickSelection={false}
//             pagination={true}
//             paginationPageSize={50}
//             paginationPageSizeSelector={[10, 25, 50, 100]}
//             paginationNumberFormatter={paginationNumberFormatter}
//             maintainColumnOrder={true}
//           />
//         </div>
//       </div>

//       <ColumnVisibilityModal
//         isOpen={isColumnModalOpen}
//         onClose={() => setIsColumnModalOpen(false)}
//       >
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-semibold">Column Visibility</h3>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={resetColumns}
//               className="text-xs"
//             >
//               Reset All
//             </Button>
//           </div>
//           <div className="grid max-h-[400px] grid-cols-2 gap-2 overflow-y-auto pr-2">
//             {initialColumnDefs.map(
//               (col) =>
//                 col.field && (
//                   <div key={col.field} className="flex items-center space-x-2">
//                     <input
//                       type="checkbox"
//                       id={`col-${col.field}`}
//                       checked={!hiddenColumns.includes(col.field)}
//                       onChange={(e) =>
//                         toggleColumnVisibility(col.field, e.target.checked)
//                       }
//                       className="h-4 w-4"
//                     />
//                     <label
//                       htmlFor={`col-${col.field}`}
//                       className="text-sm font-medium"
//                     >
//                       {col.headerName || col.field}
//                     </label>
//                   </div>
//                 )
//             )}
//           </div>
//           <div className="flex justify-end pt-4">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setIsColumnModalOpen(false)}
//             >
//               Close
//             </Button>
//           </div>
//         </div>
//       </ColumnVisibilityModal>
//   {/* Enhanced Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-2 sm:p-4">
//           <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl md:max-w-2xl">
//             <div className="sticky top-0 flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 py-2 sm:px-4 sm:py-2 md:px-6">
//               <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-sm font-semibold text-transparent sm:text-base md:text-lg">
//                 Add New Lead
//               </h2>
//               <button
//                 onClick={handleCloseModal}
//                 className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
//               >
//                 <X size={16} className="sm:h-5 sm:w-5" />
//               </button>
//             </div>
//             <div className="bg-white p-3 sm:p-4 md:p-5">
//               <form onSubmit={handleSubmit(onSubmit)}>
//                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4">
//                   <div className="space-y-1">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Full Name <span className="text-red-700">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       {...register("full_name", {
//                         required: "Full name is required",
//                         maxLength: {
//                           value: 100,
//                           message: "Full name cannot exceed 100 characters",
//                         },
//                       })}
//                       placeholder="Enter full name"
//                       className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                     />
//                     {errors.full_name && (
//                       <p className="mt-1 text-xs text-red-600">
//                         {errors.full_name.message}
//                       </p>
//                     )}
//                   </div>
//                   <div className="space-y-1">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Email <span className="text-red-700">*</span>
//                     </label>
//                     <input
//                       type="email"
//                       {...register("email", {
//                         required: "Email is required",
//                         pattern: {
//                           value: /^\S+@\S+\.\S+$/,
//                           message: "Invalid email address",
//                         },
//                       })}
//                       placeholder="Enter email"
//                       className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                     />
//                     {errors.email && (
//                       <p className="mt-1 text-xs text-red-600">
//                         {errors.email.message}
//                       </p>
//                     )}
//                   </div>
//                   <div className="space-y-1">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Phone <span className="text-red-700">*</span>
//                     </label>
//                     <input
//                       type="tel"
//                       {...register("phone", {
//                         required: "Phone is required",
//                         pattern: {
//                           value: /^\d+$/,
//                           message: "Phone must contain only numbers",
//                         },
//                       })}
//                       placeholder="Enter phone number"
//                       className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                       onInput={(e) => {
//                         e.currentTarget.value = e.currentTarget.value.replace(
//                           /\D/g,
//                           ""
//                         );
//                       }}
//                     />
//                     {/* {errors.phone && (
//                       <p className="mt-1 text-xs text-red-600">
//                         {errors.phone.message}
//                       </p>
//                     )} */}
//                   </div>
//                   <div className="space-y-1">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Status
//                     </label>
//                     <select
//                       {...register("status")}
//                       className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                     >
//                       {statusOptions.map((option) => (
//                         <option key={option} value={option}>
//                           {option}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="space-y-1">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Work Status
//                     </label>
//                     <select
//                       {...register("workstatus")}
//                       className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                     >
//                       {workStatusOptions.map((option) => (
//                         <option key={option} value={option}>
//                           {option}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="space-y-1">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Secondary Email
//                     </label>
//                     <input
//                       type="email"
//                       {...register("secondary_email")}
//                       placeholder="Enter secondary email"
//                       className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Secondary Phone
//                     </label>
//                     <input
//                       type="tel"
//                       {...register("secondary_phone")}
//                       placeholder="Enter secondary phone"
//                       className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                       onInput={(e) => {
//                         e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
//                       }}
//                     />
//                   </div>
//                   <div className="space-y-1 sm:col-span-2">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Address
//                     </label>
//                     <input
//                       type="text"
//                       {...register("address")}
//                       placeholder="Enter address"
//                       className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                     />
//                   </div>
//                   <div className="space-y-1 sm:col-span-2">
//                     <label className="block text-xs font-bold text-blue-700 sm:text-sm">
//                       Notes
//                     </label>
//                     <div className="relative">
//                       <textarea
//                         {...register("notes")}
//                         placeholder="Enter notes..."
//                         className="w-full resize-none rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
//                         style={{ minHeight: "60px" }}
//                       />
//                     </div>
//                   </div>
//                   <div className="grid grid-cols-1 gap-2 pt-1 sm:col-span-2 sm:grid-cols-3">
//                     <label className="flex items-center space-x-2">
//                       <input
//                         type="checkbox"
//                         {...register("moved_to_candidate")}
//                         className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="text-xs text-gray-700 sm:text-sm">
//                         Moved to Candidate
//                       </span>
//                     </label>
//                     <label className="flex items-center space-x-2">
//                       <input
//                         type="checkbox"
//                         {...register("massemail_unsubscribe")}
//                         className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="text-xs text-gray-700 sm:text-sm">
//                         Mass Email Unsubscribe
//                       </span>
//                     </label>
//                     <label className="flex items-center space-x-2">
//                       <input
//                         type="checkbox"
//                         {...register("massemail_email_sent")}
//                         className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="text-xs text-gray-700 sm:text-sm">
//                         Mass Email Sent
//                       </span>
//                     </label>
//                   </div>
//                 </div>
//                 <div className="mt-3 flex justify-end gap-2 border-t border-blue-200 pt-2 sm:mt-3 sm:gap-3 sm:pt-2 md:mt-4 md:pt-3">
//                   <button
//                     type="button"
//                     onClick={handleCloseModal}
//                     className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 sm:px-4 sm:py-2 sm:text-sm"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={isSubmitting}
//                     className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-md transition hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 sm:px-5 sm:py-2 sm:text-sm"
//                   >
//                     {isSubmitting ? "Saving..." : "Save Lead"}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//       {viewData && (
//         <ViewModal
//           isOpen={true}
//           onClose={() => setViewData(null)}
//           data={getDisplayedRows()}
//           currentIndex={currentViewIndex}
//           onNavigate={handleViewNavigation}
//           title={title || "Record"}
//         />
//       )}
//       {editData && (
//         <EditModal
//           isOpen={true}
//           onClose={() => setEditData(null)}
//           onSave={handleSave}
//           data={editData}
//           title={title || "Record"}
//           batches={batches}
//         />
//       )}
//       {deleteConfirmData && (
//         <ConfirmDialog
//           isOpen={true}
//           onClose={() => setDeleteConfirmData(null)}
//           onConfirm={confirmDelete}
//           title="Delete Record"
//           message={`Are you sure you want to delete this record?${
//             deleteConfirmData.fullName || deleteConfirmData.company
//               ? `\n\nRecord: ${
//                   deleteConfirmData.fullName || deleteConfirmData.company
//                 }`
//               : ""
//           }`}
//           confirmText="Delete"
//           cancelText="Cancel"
//         />
//       )}
      
//     </div>
//   );
// }

// export default AGGridTable;
