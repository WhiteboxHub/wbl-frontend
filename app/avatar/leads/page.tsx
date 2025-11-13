// "use client";
// import { useMemo, useState, useCallback, useEffect, useRef } from "react";
// import { ColDef, ValueFormatterParams } from "ag-grid-community";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, RefreshCw, X } from "lucide-react";
// import { Button } from "@/components/admin_ui/button";
// import { toast, Toaster } from "sonner";
// import { useRouter, useSearchParams } from "next/navigation";
// import { AGGridTable } from "@/components/AGGridTable";
// import { createPortal } from "react-dom";
// import type { AgGridReact as AgGridReactType } from "ag-grid-react";
// import type { GridApi } from "ag-grid-community";
// import { LeadsHelper, db, Lead as DexieLead } from "@/lib/dexieDB";
// import { useForm } from "react-hook-form";
// import { apiFetch } from "@/lib/api";
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

// const sortLeadsByEntryDate = (leads: Lead[]): Lead[] => {
//   return [...leads].sort((a, b) => {
//     const dateA = new Date(a.entry_date || 0).getTime();
//     const dateB = new Date(b.entry_date || 0).getTime();
//     return dateB - dateA; 
//   });
// };

// const useSimpleCache = () => {
//   const cacheRef = useRef<{
//     data: Lead[];
//     timestamp: number;
//     searchTerm: string;
//     searchBy: string;
//     lastSync: number;
//   } | null>(null);

//   const isCacheValid = async (
//     searchTerm: string,
//     searchBy: string = "all",
//     maxAge: number = 300000
//   ) => {
//     const localLeads = await db.leads.toArray();
    
//     if (localLeads.length === 0) {
//       return false;
//     }

//     if (cacheRef.current) {
//       if (cacheRef.current.searchTerm === searchTerm && cacheRef.current.searchBy === searchBy) {
//         const age = Date.now() - cacheRef.current.timestamp;
//         if (age < maxAge) {
//           return true;
//         }
//       }
//     }

//     const localDataAge = localLeads[0]?.lastSync ? 
//       Date.now() - new Date(localLeads[0].lastSync).getTime() : Infinity;
    
//     return localDataAge < 60000;
//   };

//   const setCache = (data: Lead[], searchTerm: string, searchBy: string = "all") => {
//     cacheRef.current = {
//       data,
//       timestamp: Date.now(),
//       searchTerm,
//       searchBy,
//       lastSync: Date.now(),
//     };
//   };

//   const getCache = () => cacheRef.current?.data || null;
//   const invalidateCache = () => {
//     cacheRef.current = null;
//   };

//   const getLastSync = () => cacheRef.current?.lastSync || null;

//   return { isCacheValid, setCache, getCache, invalidateCache, getLastSync };
// };

// const StatusRenderer = ({ value }: { value?: string }) => {
//   const status = value?.toLowerCase() || "";
//   const variantMap: Record<string, string> = {
//     open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//     closed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
//     future: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//     default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
//   };
//   return (
//     <Badge className={`${variantMap[status] || variantMap.default} capitalize`}>
//       {value || "N/A"}
//     </Badge>
//   );
// };

// const WorkStatusRenderer = ({ value }: { value?: string }) => {
//   const workstatus = value?.toLowerCase() || "";
//   const variantMap: Record<string, string> = {
//     "waiting for status": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//     h1b: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//     "h4 ead": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
//     "permanent resident": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
//     citizen: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//     opt: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
//     cpt: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
//     default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
//   };
//   return (
//     <Badge className={`${variantMap[workstatus] || variantMap.default} capitalize`}>
//       {value || "N/A"}
//     </Badge>
//   );
// };

// const StatusFilterHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
//     {
//       top: 0,
//       left: 0,
//     }
//   );
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom + window.scrollY,
//         left: Math.max(0, rect.left + window.scrollX - 100),
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleStatusChange = (status: string, e: React.ChangeEvent<HTMLInputElement>) => {
//     e.stopPropagation();
//     setSelectedStatuses((prev: string[]) =>
//       prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//     );
//   };

//   const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
//     e.stopPropagation();
//     setSelectedStatuses(e.target.checked ? [...statusOptions] : []);
//   };

//   const isAllSelected = selectedStatuses.length === statusOptions.length;
//   const isIndeterminate = selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length;

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         filterButtonRef.current &&
//         !filterButtonRef.current.contains(event.target as Node) &&
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setFilterVisible(false);
//       }
//     };
//     const handleScroll = () => setFilterVisible(false);
//     if (filterVisible) {
//       document.addEventListener("mousedown", handleClickOutside);
//       window.addEventListener("scroll", handleScroll, true);
//     }
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", handleScroll, true);
//     };
//   }, [filterVisible]);

//   return (
//     <div className="relative flex w-full items-center">
//       <span className="mr-2 flex-grow">Status</span>
//       <div
//         ref={filterButtonRef}
//         className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
//         onClick={toggleFilter}
//       >
//         {selectedStatuses.length > 0 && (
//           <span className="min-w-[20px] rounded-full bg-blue-500 px-2 py-0.5 text-center text-xs text-white">
//             {selectedStatuses.length}
//           </span>
//         )}
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className="h-4 w-4 text-gray-500 hover:text-gray-700"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
//         </svg>
//       </div>
//       {filterVisible &&
//         createPortal(
//           <div
//             ref={dropdownRef}
//             className="pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 shadow-xl dark:border-gray-600 dark:bg-gray-800"
//             style={{ top: dropdownPos.top + 5, left: dropdownPos.left, zIndex: 99999, maxHeight: "300px", overflowY: "auto" }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="mb-2 border-b pb-2">
//               <label className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
//                 <input
//                   type="checkbox"
//                   checked={isAllSelected}
//                   ref={(el) => {
//                     if (el) el.indeterminate = isIndeterminate;
//                   }}
//                   className="mr-2"
//                   onChange={handleSelectAll}
//                 />
//                 All
//               </label>
//             </div>
//             {statusOptions.map((status) => (
//               <label
//                 key={status}
//                 className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedStatuses.includes(status)}
//                   className="mr-2"
//                   onChange={(e) => handleStatusChange(status, e)}
//                 />
//                 {status}
//               </label>
//             ))}
//             {selectedStatuses.length > 0 && (
//               <div className="mt-2 border-t pt-2">
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     setSelectedStatuses([]);
//                   }}
//                   className="w-full py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
//                 >
//                   Clear All
//                 </button>
//               </div>
//             )}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// const WorkStatusFilterHeaderComponent = (props: any) => {
//   const { selectedWorkStatuses, setSelectedWorkStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
//     {
//       top: 0,
//       left: 0,
//     }
//   );
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom + window.scrollY,
//         left: Math.max(0, rect.left + window.scrollX - 100),
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleWorkStatusChange = (workStatus: string, e: React.ChangeEvent<HTMLInputElement>) => {
//     e.stopPropagation();
//     setSelectedWorkStatuses((prev: string[]) =>
//       prev.includes(workStatus) ? prev.filter((s) => s !== workStatus) : [...prev, workStatus]
//     );
//   };

//   const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
//     e.stopPropagation();
//     setSelectedWorkStatuses(e.target.checked ? [...workStatusOptions] : []);
//   };

//   const isAllSelected = selectedWorkStatuses.length === workStatusOptions.length;
//   const isIndeterminate =
//     selectedWorkStatuses.length > 0 && selectedWorkStatuses.length < workStatusOptions.length;

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         filterButtonRef.current &&
//         !filterButtonRef.current.contains(event.target as Node) &&
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setFilterVisible(false);
//       }
//     };
//     const handleScroll = () => setFilterVisible(false);
//     if (filterVisible) {
//       document.addEventListener("mousedown", handleClickOutside);
//       window.addEventListener("scroll", handleScroll, true);
//     }
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", handleScroll, true);
//     };
//   }, [filterVisible]);
  
//   return (
//     <div className="relative flex w-full items-center">
//       <span className="mr-2 flex-grow">Work Status</span>
//       <div
//         ref={filterButtonRef}
//         className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
//         onClick={toggleFilter}
//       >
//         {selectedWorkStatuses.length > 0 && (
//           <span className="min-w-[20px] rounded-full bg-green-500 px-2 py-0.5 text-center text-xs text-white">
//             {selectedWorkStatuses.length}
//           </span>
//         )}
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className="h-4 w-4 text-gray-500 hover:text-gray-700"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
//         </svg>
//       </div>
//       {filterVisible &&
//         createPortal(
//           <div
//             ref={dropdownRef}
//             className="pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
//             style={{ top: dropdownPos.top + 5, left: dropdownPos.left, zIndex: 99999, maxHeight: "300px", overflowY: "auto" }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="mb-2 border-b pb-2">
//               <label className="flex cursor-pointer items-center rounded px-2 py-1 font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
//                 <input
//                   type="checkbox"
//                   checked={isAllSelected}
//                   ref={(el) => {
//                     if (el) el.indeterminate = isIndeterminate;
//                   }}
//                   className="mr-3"
//                   onChange={handleSelectAll}
//                 />
//                 Select All
//               </label>
//             </div>
//             {workStatusOptions.map((workStatus) => (
//               <label
//                 key={workStatus}
//                 className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedWorkStatuses.includes(workStatus)}
//                   onChange={(e) => handleWorkStatusChange(workStatus, e)}
//                   onClick={(e) => e.stopPropagation()}
//                   className="mr-3"
//                 />
//                 <WorkStatusRenderer value={workStatus} />
//               </label>
//             ))}
//             {selectedWorkStatuses.length > 0 && (
//               <div className="mt-2 border-t pt-2">
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     setSelectedWorkStatuses([]);
//                   }}
//                   className="w-full py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
//                 >
//                   Clear All
//                 </button>
//               </div>
//             )}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default function LeadsPage() {
//   const searchInputRef = useRef<HTMLInputElement>(null);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const isNewLead = searchParams.get("newlead") === "true";
//   const [isModalOpen, setIsModalOpen] = useState(isNewLead);
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [totalLeads, setTotalLeads] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [searchBy, setSearchBy] = useState("full_name");
//   const [formData, setFormData] = useState<FormData>(initialFormData);
//   const [formSaveLoading, setFormSaveLoading] = useState(false);
//   const [sortModel, setSortModel] = useState([
//     { colId: "entry_date", sort: "desc" as "desc" },
//   ]);
  
//   const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
//   const gridRef = useRef<AgGridReactType<Lead> | null>(null);
//   const apiEndpoint = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL}/leads`, []);
//   const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
//   const cache = useSimpleCache();
//   const isInitialMountRef = useRef(true);
//   const fetchInProgressRef = useRef(false);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isSubmitting },
//     setValue,
//     watch,
//   } = useForm<FormData>({
//     defaultValues: initialFormData,
//   });

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


//   const syncFromAPI = useCallback(async (forceRefresh = false) => {
//     if (fetchInProgressRef.current) return;
    
//     fetchInProgressRef.current = true;
//     setLoading(true);

//     try {
      
//       let url = `leads`;
//       const params = new URLSearchParams();
//       const sortParam = sortModel.map((s) => `${s.colId}:${s.sort}`).join(",");
//       params.append("sort", sortParam);
      
//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const data = await apiFetch(url, { timeout: 10000 });
      
//       let leadsData: Lead[] = [];
//       if (data.data && Array.isArray(data.data)) {
//         leadsData = data.data;
//       } else if (Array.isArray(data)) {
//         leadsData = data;
//       } else {
//         console.warn('Unexpected API response format:', data);
//         leadsData = [];
//       }

//       const leadsWithSync = leadsData.map(lead => ({
//         ...lead,
//         lastSync: new Date().toISOString(),
//         synced: true
//       }));
      
//       await db.leads.clear();
//       await db.leads.bulkPut(leadsWithSync);

    
//       const sortedLeadsData = sortLeadsByEntryDate(leadsData);
//       setLeads(sortedLeadsData);
//       setFilteredLeads(sortedLeadsData);
      
//     } catch (err: any) {
//       console.error('API sync failed:', err);
      
//       await loadLeadsFromIndexedDB();
      
//       if (err.name === 'TimeoutError') {
//         toast.warning("Server sync timeout - using local data");
//       } else if (err.name === 'NetworkError') {
//         toast.warning("Cannot connect to server - using local data");
//       } else if (err.status === 401) {
//         toast.error("Session expired - please login again");
//       } else {
//         toast.warning("Sync failed - using local data");
//       }
//     } finally {
//       setLoading(false);
//       fetchInProgressRef.current = false;
//     }
//   }, [sortModel]);

 
//   useEffect(() => {
//     const loadInitialData = async () => {
//       if (!isInitialMountRef.current) return;
//       isInitialMountRef.current = false;

      
//       const localLeads = await db.leads.toArray();
      
//       if (localLeads.length === 0) {
        
//         await syncFromAPI(true);
//       } else {
        
//         await loadLeadsFromIndexedDB();
//         syncFromAPI(true).catch(() => {  
//         });
//       }
//     };

//     loadInitialData();
//   }, [loadLeadsFromIndexedDB, syncFromAPI]);

  
//   useEffect(() => {
//     const timeoutId = setTimeout(async () => {
//       await loadLeadsFromIndexedDB(searchTerm);
//     }, 400);

//     return () => clearTimeout(timeoutId);
//   }, [searchTerm, loadLeadsFromIndexedDB]);

 
//   useEffect(() => {
//     let filtered = [...leads];  
    
//     if (selectedStatuses.length > 0) {
//       filtered = filtered.filter((lead) =>
//         selectedStatuses.some(
//           (status) => status.toLowerCase() === (lead.status || "").toLowerCase()
//         )
//       );
//     }

//     if (selectedWorkStatuses.length > 0) {
//       filtered = filtered.filter((lead) =>
//         selectedWorkStatuses.some(
//           (ws) => ws.toLowerCase() === (lead.workstatus || "").toLowerCase()
//         )
//       );
//     }

//     setFilteredLeads(filtered);
//     setTotalLeads(filtered.length);
//   }, [leads, selectedStatuses, selectedWorkStatuses]);

//    useEffect(() => {
//     const handleOnline = () => {
//       setIsOnline(true);
//       syncFromAPI(true).catch(() => {
//       });
//     };
    
//     const handleOffline = () => {
//       setIsOnline(false);
//       toast.warning("You are now offline. Using local data.");
//     };

//     window.addEventListener("online", handleOnline);
//     window.addEventListener("offline", handleOffline);

//     return () => {
//       window.removeEventListener("online", handleOnline);
//       window.removeEventListener("offline", handleOffline);
//     };
//   }, [syncFromAPI]);

//   const onSubmit = async (data: FormData) => {
//     if (!data.full_name.trim() || !data.email.trim() || !data.phone.trim()) {
//       toast.error("Full Name, Email, and Phone are required");
//       return;
//     }

//     setFormSaveLoading(true);
//     setFormErrors({});

//     try {
//       const updatedData = { 
//         ...data,
//         status: data.status || "Open",
//         workstatus: data.workstatus || "Waiting for Status",
//         moved_to_candidate: Boolean(data.moved_to_candidate),
//         massemail_email_sent: Boolean(data.massemail_email_sent),
//         massemail_unsubscribe: Boolean(data.massemail_unsubscribe),
//         entry_date: data.entry_date || new Date().toISOString(),
//       };

//       const savedLead = await apiFetch("leads", {
//         method: "POST",
//         body: updatedData,
//         timeout: 10000,
//       });

   
//       await db.leads.add({ 
//         ...savedLead, 
//         synced: true,
//         lastSync: new Date().toISOString()
//       });

      
//       await loadLeadsFromIndexedDB(searchTerm);

//       toast.success("Lead created successfully!");
//       handleCloseModal();
//     } catch (error: any) {
//       console.error("Error creating lead:", error);
      
//       if (error.name === 'TimeoutError') {
//         toast.error("Server timeout - lead creation failed");
//       } else if (error.name === 'NetworkError') {
//         toast.error("Network error - cannot connect to server");
//       } else if (error.status === 401) {
//         toast.error("Session expired - please login again");
//       } else {
//         toast.error(error.message || "Failed to create lead");
//       }
//     } finally {
//       setFormSaveLoading(false);
//     }
//   };

//   const handleCloseModal = () => {
//     router.push("/avatar/leads");
//     setIsModalOpen(false);
//     reset();
//   };

//   const handleRowUpdated = useCallback(
//     async (updatedRow: Lead) => {
//       setLoadingRowId(updatedRow.id);

//       try {
//         const { id, entry_date, ...payload } = updatedRow;

       
//         if (payload.moved_to_candidate && payload.status !== "Closed") {
//           payload.status = "Closed";
//           payload.closed_date = new Date().toISOString().split("T")[0];
//         } else if (!payload.moved_to_candidate && payload.status === "Closed") {
//           payload.status = "Open";
//           payload.closed_date = null;
//         }

//         payload.moved_to_candidate = Boolean(payload.moved_to_candidate);
//         payload.massemail_unsubscribe = Boolean(payload.massemail_unsubscribe);
//         payload.massemail_email_sent = Boolean(payload.massemail_email_sent);

      
//         const updatedLead = await apiFetch(`leads/${updatedRow.id}`, {
//           method: "PUT",
//           body: payload,
//           timeout: 10000,
//         });

      
//         await db.leads.update(updatedRow.id, { 
//           ...updatedLead,
//           lastSync: new Date().toISOString(),
//           synced: true
//         });

       
//         await loadLeadsFromIndexedDB(searchTerm);

//         toast.success("Lead updated successfully");
//       } catch (err: any) {
//         console.error("Error updating lead:", err);
        
//         if (err.name === 'TimeoutError') {
//           toast.error("Server timeout - update failed");
//         } else if (err.name === 'NetworkError') {
//           toast.error("Network error - cannot connect to server");
//         } else if (err.status === 401) {
//           toast.error("Session expired - please login again");
//         } else {
//           toast.error(err.message || "Failed to update lead");
//         }
//       } finally {
//         setLoadingRowId(null);
//       }
//     },
//     [searchTerm, loadLeadsFromIndexedDB]
//   );


//   const handleRowDeleted = useCallback(
//     async (id: number) => {
//       try {
//         await apiFetch(`leads/${id}`, {
//           method: "DELETE",
//           timeout: 10000,
//         });
//         await db.leads.delete(id);

  
//         await loadLeadsFromIndexedDB(searchTerm);

//         toast.success("Lead deleted successfully");
//       } catch (error: any) {
//         console.error("Error deleting lead:", error);
        
//         if (error.name === 'TimeoutError') {
//           toast.error("Server timeout - delete failed");
//         } else if (error.name === 'NetworkError') {
//           toast.error("Network error - cannot connect to server");
//         } else if (error.status === 401) {
//           toast.error("Session expired - please login again");
//         } else {
//           toast.error(error.message || "Failed to delete lead");
//         }
//       }
//     },
//     [searchTerm, loadLeadsFromIndexedDB]
//   );

//   const formatPhoneNumber = (phoneNumberString: string) => {
//     const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
//     const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
//     if (match) {
//       return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
//     }
//     return `+1 ${phoneNumberString}`;
//   };

//   const columnDefs: ColDef<any, any>[] = useMemo(
//     () => [
//       {
//         field: "id",
//         headerName: "ID",
//         width: 80,
//         pinned: "left",
//         sortable: true,
//       },
//       {
//         field: "full_name",
//         headerName: "Full Name",
//         width: 180,
//         sortable: true,
//       },
//       {
//         field: "phone",
//         headerName: "Phone",
//         width: 150,
//         editable: true,
//         sortable: true,
//         cellRenderer: (params: any) => {
//           if (!params.value) return "";
//           const formattedPhone = formatPhoneNumber(params.value);
//           return (
//             <a
//               href={`tel:${params.value}`}
//               className="text-blue-600 underline hover:text-blue-800"
//             >
//               {formattedPhone}
//             </a>
//           );
//         },
//       },
//       {
//         field: "email",
//         headerName: "Email",
//         width: 200,
//         editable: true,
//         sortable: true,
//         cellRenderer: (params: any) => {
//           if (!params.value) return "";
//           return (
//             <a
//               href={`mailto:${params.value}`}
//               className="text-blue-600 underline hover:text-blue-800"
//               onClick={(event) => event.stopPropagation()}
//             >
//               {params.value}
//             </a>
//           );
//         },
//       },
//       {
//         field: "entry_date",
//         headerName: "Entry Date",
//         width: 180,
//         sortable: true,

//         filter: "agDateColumnFilter",

//         valueFormatter: ({ value }: ValueFormatterParams) =>
//           value
//             ? new Date(value).toLocaleString("en-US", {
//                 year: "numeric",
//                 month: "2-digit",
//                 day: "2-digit",
//               })
//             : "-",
//       },
//       {
//         field: "workstatus",
//         headerName: "Work Status",
//         width: 200,
//         sortable: true,
//         cellRenderer: WorkStatusRenderer,
//         headerComponent: WorkStatusFilterHeaderComponent,
//         headerComponentParams: {
//           selectedWorkStatuses,
//           setSelectedWorkStatuses,
//         },
//       },
//       {
//         field: "status",
//         headerName: "Status",
//         width: 150,
//         sortable: true,
//         cellRenderer: StatusRenderer,
//         headerComponent: StatusFilterHeaderComponent,
//         headerComponentParams: { selectedStatuses, setSelectedStatuses },
//       },
//       {
//         field: "secondary_email",
//         headerName: "Secondary Email",
//         width: 220,
//         sortable: true,
//       },
//       {
//         field: "secondary_phone",
//         headerName: "Secondary Phone",
//         width: 150,
//         sortable: true,
//       },
//       {
//         field: "address",
//         headerName: "Address",
//         width: 250,
//         sortable: true,
//       },
//       {
//         field: "closed_date",
//         headerName: "Closed Date",
//         width: 150,
//         sortable: true,
//         filter: "agDateColumnFilter",


//         valueFormatter: ({ value }: ValueFormatterParams) =>
//           value
//             ? new Date(value).toLocaleDateString("en-IN", {
//                 timeZone: "Asia/Kolkata",
//               })
//             : "-",
//       },
//       {
//         field: "notes",
//         headerName: "Notes",
//         width: 300,
//         sortable: true,
//         cellRenderer: (params: any) => {
//           if (!params.value) return "";
//           return (
//             <div
//               className="prose prose-sm dark:prose-invert max-w-none"
//               dangerouslySetInnerHTML={{ __html: params.value }}
//             />
//           );
//         },
//       },
//       {
//         field: "massemail_unsubscribe",
//         headerName: "Mass Email Unsubscribe",
//         width: 180,
//         editable: true,
//         sortable: true,
//         valueGetter: (params) =>
//           params.data.massemail_unsubscribe !== undefined
//             ? params.data.massemail_unsubscribe
//             : false,
//         valueFormatter: ({ value }) => (value ? "True" : "False"),
//       },
//       {
//         field: "massemail_email_sent",
//         headerName: "Mass Email Sent",
//         width: 180,
//         editable: true,
//         sortable: true,
//         valueGetter: (params) =>
//           params.data.massemail_email_sent !== undefined
//             ? params.data.massemail_email_sent
//             : false,
//         valueFormatter: ({ value }) => (value ? "True" : "False"),
//       },
//       {
//         field: "moved_to_candidate",
//         headerName: "Moved to Candidate",
//         width: 180,
//         editable: true,
//         sortable: true,
//         valueGetter: (params) =>
//           params.data.moved_to_candidate !== undefined
//             ? params.data.moved_to_candidate
//             : false,
//         valueFormatter: ({ value }) => (value ? "True" : "False"),
//       },
//     ],
//     [selectedStatuses, selectedWorkStatuses]
//   );

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center h-64 p-4">
//         <div className="text-red-500 text-center mb-4">
//           <div className="text-lg font-semibold mb-2">Error</div>
//           <div>{error}</div>
//         </div>
//         <Button
//           variant="outline"
//           onClick={() => loadLeadsFromIndexedDB()}
//           className="flex items-center"
//         >
//           <RefreshCw className="mr-2 h-4 w-4" />
//           Retry
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 p-4">
//       <Toaster position="top-center" />
      

//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div className="flex-1">
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Leads Management
//           </h1>
//           <div className="mt-2 sm:mt-0 sm:max-w-md">
//             <div className="relative">
//               <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
//               <Input
//                 id="search"
//                 type="text"
//                 ref={searchInputRef}
//                 placeholder="Search by ID, name, email, phone..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 text-sm sm:text-base"
//               />
//             </div>
//             {searchTerm && (
//               <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//                 {filteredLeads.length} leads found
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//       <div className="flex w-full justify-center">
//         <AGGridTable
//           key={`${filteredLeads.length}-${selectedStatuses.join(
//             ","
//           )}-${selectedWorkStatuses.join(",")}`}
//           rowData={filteredLeads}
//           columnDefs={columnDefs}
//           onRowAdded={async (newRow: any) => {
//             try {
//               const payload = {
//                 full_name: newRow.full_name || newRow.fullname || newRow.name || "",
//                 email: newRow.email || newRow.candidate_email || newRow.secondary_email || "",
//                 phone: newRow.phone || newRow.phone_number || newRow.contact || "",
//                 workstatus: newRow.workstatus || "Waiting for Status",
//                 address: newRow.address || "",
//                 secondary_email: newRow.secondary_email || "",
//                 secondary_phone: newRow.secondary_phone || "",
//                 status: newRow.status || "Open",
//                 moved_to_candidate: Boolean(newRow.moved_to_candidate),
//                 notes: newRow.notes || "",
//                 entry_date: newRow.entry_date || new Date().toISOString(),
//                 massemail_unsubscribe: Boolean(newRow.massemail_unsubscribe),
//                 massemail_email_sent: Boolean(newRow.massemail_email_sent),
//               };

//               const savedLead = await apiFetch("leads", {
//                 method: "POST",
//                 body: payload,
//                 timeout: 10000,
//               });

//               await db.leads.add({
//                 ...savedLead,
//                 synced: true,
//                 lastSync: new Date().toISOString(),
//               });

//               await loadLeadsFromIndexedDB(searchTerm);
//               toast.success("Lead created successfully");
//             } catch (err: any) {
//               console.error("Error creating lead via grid add:", err);
//               if (err.name === 'TimeoutError') toast.error("Server timeout - lead creation failed");
//               else if (err.name === 'NetworkError') toast.error("Network error - cannot connect to server");
//               else if (err.status === 401) toast.error("Session expired - please login again");
//               else toast.error(err.message || "Failed to create lead");
//             }
//           }}
//           onRowUpdated={handleRowUpdated}
//           onRowDeleted={handleRowDeleted}
//           loading={loading}
//           showFilters={true}
//           showSearch={false}
          
//           height="600px"
//           title={`Leads (${filteredLeads.length})`}
          
//         />
//       </div>
//     </div>
//   );
// }




// ----------------------------------------------------------------------old working---





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
import { createPortal } from "react-dom";
import { AgGridReact } from "ag-grid-react";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { apiFetch, smartUpdate } from "@/lib/api";
import "@/lib/cacheDebug"; // Initialize debug tools 



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
  "Waiting for Status",
  "H1B",
  "H4 EAD",
  "Permanent Resident",
  "Citizen",
  "OPT",
  "CPT"
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
      {value || "N/A"}
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

    const handleScroll = () => setFilterVisible(false);

    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
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
            className="fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600"
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

    const handleScroll = () => setFilterVisible(false);

    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
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
            className="fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600 text-sm"
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

                {workStatus}
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

        // Use apiFetch directly if forceRefresh, otherwise use cache
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

      // Remove from local state
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
