// // whiteboxLearning-wbl\app\avatar\leads\page.tsx
// "use client";
// import { useMemo, useState, useCallback, useEffect, useRef } from "react";
// import { ColDef, ValueFormatterParams } from "ag-grid-community";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, X } from "lucide-react";
// import { Button } from "@/components/admin_ui/button";
// import { toast, Toaster } from "sonner";
// import { useRouter, useSearchParams } from "next/navigation";
// import { AGGridTable } from "@/components/AGGridTable";
// import { createPortal } from "react-dom";
// import type { AgGridReact as AgGridReactType } from "ag-grid-react";
// import type { GridApi } from "ag-grid-community";
// import {  db, Lead as DexieLead } from "@/lib/dexieDB";
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


// const getMachineId = (): string => {
//   if (typeof window === 'undefined') return 'server';
//   let machineId = localStorage.getItem('leadsMachineId');
//   if (!machineId) {
//     machineId = `machine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     localStorage.setItem('leadsMachineId', machineId);
//   }
//   return machineId;
// };

// const sortLeadsByEntryDate = (leads: Lead[]): Lead[] => {
//   return [...leads].sort((a, b) => {
//     const dateA = new Date(a.entry_date || 0).getTime();
//     const dateB = new Date(b.entry_date || 0).getTime();
//     return dateB - dateA; 
//   });
// };

// const useEnhancedCache = () => {
//   const cacheRef = useRef<{
//     data: Lead[];
//     timestamp: number;
//     searchTerm: string;
//     searchBy: string;
//     lastSync: number;
//     lastModified: string;
//   } | null>(null);

//   const isCacheValid = async (
//     searchTerm: string,
//     searchBy: string = "all",
//     maxAge: number = 300000
//   ): Promise<boolean> => {
//     const localLeads = await db!.leads.toArray();
    
//     if (localLeads.length === 0) {
//       return false;
//     }

//     // Get the most recent modification time from local database
//     const latestLocalTimestamp = localLeads.reduce((latest, lead) => {
//       const leadTime = new Date(lead.lastModified || lead.entry_date || 0).getTime();
//       const currentLatest = new Date(latest || 0).getTime();
//       return leadTime > currentLatest ? (lead.lastModified || lead.entry_date || '') : latest;
//     }, '1970-01-01T00:00:00.000Z');

//     if (cacheRef.current) {
//       const cacheAge = Date.now() - cacheRef.current.timestamp;
      
//       if (cacheRef.current.searchTerm === searchTerm && 
//           cacheRef.current.searchBy === searchBy && 
//           cacheAge < maxAge) {
        
//         if (cacheRef.current.lastModified === latestLocalTimestamp) {
//           return true;
//         }
//       }
//     }

//     return false;
//   };

//   const setCache = (data: Lead[], searchTerm: string, searchBy: string = "all") => {
//     const latestTimestamp = data.reduce((latest, lead) => {
//       const leadTime = new Date(lead.lastModified || lead.entry_date || 0).getTime();
//       const currentLatest = new Date(latest || 0).getTime();
//       return leadTime > currentLatest ? (lead.lastModified || lead.entry_date || '') : latest;
//     }, '1970-01-01T00:00:00.000Z');

//     cacheRef.current = {
//       data,
//       timestamp: Date.now(),
//       searchTerm,
//       searchBy,
//       lastSync: Date.now(),
//       lastModified: latestTimestamp,
//     };
//   };

//   const getCache = () => cacheRef.current?.data || null;
//   const invalidateCache = () => {
//     cacheRef.current = null;
//   };
//   const getLastSync = () => cacheRef.current?.lastSync || null;
//   const getLastModified = () => cacheRef.current?.lastModified || null;

//   return { isCacheValid, setCache, getCache, invalidateCache, getLastSync, getLastModified };
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
//   const cache = useEnhancedCache();
//   const isInitialMountRef = useRef(true);
//   const fetchInProgressRef = useRef(false);
//   const machineId = useRef<string>(getMachineId()).current;

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

 
//   const pushLocalChangesToServer = useCallback(async () => {
//     try {
//       if (!db) return;
//       const unsyncedLeads = await db.leads.where('synced').equals(0 as any).toArray();
      
//       for (const lead of unsyncedLeads) {
//         try {
//           if (lead._action === 'add' || !lead.id) {
          
//             const { id, lastSync, lastModified, synced, _action, machineId: mid, ...payload } = lead as any;
//             const savedLead = await apiFetch('leads', {
//               method: 'POST',
//               body: payload,
//               timeout: 5000
//             });
            
//             if (savedLead.id) {
//               await db.leads.update(lead.id!, {
//                 ...savedLead,
//                 lastSync: new Date().toISOString(),
//                 lastModified: new Date().toISOString(),
//                 synced: true,
//                 _action: null,
//                 machineId: machineId
//               } as any);
//             }
//           } else if (lead._action === 'update') {
            
//             const { id, lastSync, lastModified, synced, _action, machineId: leadMachineId, ...payload } = lead as any;
//             await apiFetch(`leads/${lead.id}`, {
//               method: 'PUT',
//               body: payload,
//               timeout: 5000
//             });
            
//             await db.leads.update(lead.id!, {
//               lastSync: new Date().toISOString(),
//               lastModified: new Date().toISOString(),
//               synced: true,
//               _action: null
//             } as any);
//           } else if (lead._action === 'delete' && lead.id) {
            
//             try {
//               await apiFetch(`leads/${lead.id}`, { method: 'DELETE', timeout: 5000 });
//               await db.leads.delete(lead.id);
//             } catch (e) {
             
//             }
//           }
//         } catch (error) {
//           console.error(`Failed to sync lead ${lead.id}:`, error);
//         }
//       }
//     } catch (error) {
//       console.error('Error pushing local changes:', error);
//     }
//   }, [machineId]);

//   const loadLeadsFromIndexedDB = useCallback(async (search?: string) => {
//     setLoading(true);
//     try {
//       if (!db) return;
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
//       setTotalLeads(sortedLeads.length);
      
//     } catch (err) {
//       console.error('Error loading from IndexedDB:', err);
//       setError('Failed to load local data');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const syncFromAPI = useCallback(async (forceRefresh: boolean = false) => {
//     if (fetchInProgressRef.current) return;
    
//     fetchInProgressRef.current = true;
//     setLoading(true);

//     try {
//       if (!db) return;
//       // Compute latest lastSync
//       const localLeads = await db.leads.toArray();
//       const lastSyncTime = localLeads.length > 0 
//         ? new Date(Math.max(...localLeads.map(lead => new Date(lead.lastSync || 0).getTime()))).toISOString()
//         : '1970-01-01T00:00:00.000Z';

//       let url = `leads`;
//       const params = new URLSearchParams();
//       const sortParam = sortModel.map((s) => `${s.colId}:${s.sort}`).join(",");
//       params.append("sort", sortParam);
//       if (!forceRefresh) {
//         params.append('modified_after', lastSyncTime);
//       }
      
//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const data = await apiFetch(url, { timeout: 10000 });
      
//       let leadsData: Lead[] = [];
//       if ((data as any).data && Array.isArray((data as any).data)) {
//         leadsData = (data as any).data;
//       } else if (Array.isArray(data)) {
//         leadsData = data as any;
//       } else {
//         console.warn('Unexpected API response format:', data);
//         leadsData = [];
//       }

//       const now = new Date().toISOString();
      
//       for (const serverLead of leadsData) {
//         if (!serverLead.id) continue;
//         const existingLead = await db.leads.get(serverLead.id);
        
//         if (existingLead) {
//           const serverTime = new Date(serverLead.lastModified || serverLead.entry_date || 0).getTime();
//           const localTime = new Date(existingLead.lastModified || existingLead.entry_date || 0).getTime();
          
//           if (serverTime > localTime || existingLead.synced) {
//             await db.leads.update(serverLead.id, {
//               ...(serverLead as any),
//               lastSync: now,
//               synced: true,
//               lastModified: serverTime > localTime ? (serverLead.lastModified || serverLead.entry_date) : existingLead.lastModified,
//               machineId: machineId
//             } as any);
//           }
//         } else {
//           await db.leads.add({
//             ...(serverLead as any),
//             lastSync: now,
//             synced: true,
//             lastModified: serverLead.lastModified || serverLead.entry_date || now,
//             machineId: machineId
//           } as any);
//         }
//       }

//       // Push local unsynced changes
//       await pushLocalChangesToServer();

//       await loadLeadsFromIndexedDB(searchTerm);
      
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
//   }, [sortModel, loadLeadsFromIndexedDB, pushLocalChangesToServer, machineId]);

//   useEffect(() => {
//     const loadInitialData = async () => {
//       if (!isInitialMountRef.current) return;
//       isInitialMountRef.current = false;

//       if (!db) return;
//       const localLeads = await db.leads.toArray();

//       // Always load local first
//       await loadLeadsFromIndexedDB();

//       // Throttled navigation-triggered refresh: only once per session or after 5 minutes
//       const gateKey = 'leadsSectionLastSyncedAt';
//       const lastSynced = sessionStorage.getItem(gateKey);
//       const now = Date.now();
//       const FiveMinutes = 5 * 60 * 1000;
//       const shouldSync = !lastSynced || now - Number(lastSynced) > FiveMinutes || localLeads.length === 0;

//       if (isOnline && shouldSync) {
//         await syncFromAPI(true);
//         sessionStorage.setItem(gateKey, String(now));
//       }
//     };

//     loadInitialData();
//   }, [loadLeadsFromIndexedDB, syncFromAPI, isOnline]);

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

//   useEffect(() => {
//     const handleOnline = () => {
//       setIsOnline(true);
//       toast.info("Back online");
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
//   }, []);

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

//       // Add to local DB as synced
//       if (db) {
//         await db.leads.add({ 
//           ...(savedLead as any), 
//           synced: true,
//           lastSync: new Date().toISOString(),
//           lastModified: new Date().toISOString(),
//           machineId: machineId
//         } as any);
//       }

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

//   const handleOpenModal = () => {
//     router.push("/avatar/leads?newlead=true");
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     router.push("/avatar/leads");
//     setIsModalOpen(false);
//     reset();
//   };

//   const handleRowUpdated = useCallback(
//     async (updatedRow: Lead) => {
//       if (!updatedRow.id) return;      
//       setLoadingRowId(updatedRow.id);

//       try {
//         const { id, entry_date, lastSync, lastModified, synced, machineId: leadMachineId, ...payload } = updatedRow as any;
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

//         if (db) {
//           await db.leads.update(updatedRow.id, { 
//             ...(updatedLead as any),
//             lastSync: new Date().toISOString(),
//             lastModified: new Date().toISOString(),
//             synced: true,
//             _action: null,
//             machineId: machineId
//           } as any);
//         }

//         await loadLeadsFromIndexedDB(searchTerm);

//         toast.success("Lead updated successfully");
//       } catch (err: any) {
//         console.error("Error updating lead:", err);
//         if (db) {
//           await db.leads.update(updatedRow.id, {
//             _action: 'update',
//             synced: false,
//             lastModified: new Date().toISOString()
//           } as any);
//         }
        
//         if (err.name === 'TimeoutError') {
//           toast.error("Server timeout - update failed (saved locally)");
//         } else if (err.name === 'NetworkError') {
//           toast.error("Network error - update saved locally will sync later");
//         } else if (err.status === 401) {
//           toast.error("Session expired - please login again");
//         } else {
//           toast.error(err.message || "Failed to update lead (saved locally)");
//         }
//       } finally {
//         setLoadingRowId(null);
//       }
//     },
//     [searchTerm, loadLeadsFromIndexedDB, isOnline, syncFromAPI, machineId]
//   );

//   const handleRowDeleted = useCallback(
//     async (id: number) => {
//       try {
//         await apiFetch(`leads/${id}`, {
//           method: "DELETE",
//           timeout: 10000,
//         });

//         if (db) {
//           await db.leads.delete(id);
//         }

//         await loadLeadsFromIndexedDB(searchTerm);

//         toast.success("Lead deleted successfully");
//       } catch (error: any) {
//         console.error("Error deleting lead:", error);
//         if (db) {
//           await db.leads.update(id, {
//             _action: 'delete',
//             synced: false,
//             lastModified: new Date().toISOString()
//           } as any);
//         }
        
//         if (error.name === 'TimeoutError') {
//           toast.error("Server timeout - delete failed (marked for deletion)");
//         } else if (error.name === 'NetworkError') {
//           toast.error("Network error - delete will sync when online");
//         } else if (error.status === 401) {
//           toast.error("Session expired - please login again");
//         } else {
//           toast.error(error.message || "Failed to delete lead (marked for deletion)");
//         }
//       }
//     },
//     [searchTerm, loadLeadsFromIndexedDB, isOnline, syncFromAPI]
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
//         <div className="mt-2 flex flex-row items-center gap-2 sm:mt-0">
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

//               if (db) {
//                 await db.leads.add({
//                   ...(savedLead as any),
//                   synced: true,
//                   lastSync: new Date().toISOString(),
//                   lastModified: new Date().toISOString(),
//                   machineId: machineId
//                 } as any);
//               }

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
//                     {errors.phone && (
//                       <p className="mt-1 text-xs text-red-600">
//                         {errors.phone.message}
//                       </p>
//                     )}
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
//     </div>
//   );
// }













// "use client";

// import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { Button } from "@/components/admin_ui/button";
// import { Badge } from "@/components/admin_ui/badge";
// import { SearchIcon, RefreshCw, AlertTriangle, X } from "lucide-react";
// import { toast, Toaster } from "sonner";
// import { appDB, Lead } from "@/lib/dexieDB";
// import api from "@/lib/api";
// import { ColDef, ValueFormatterParams } from "ag-grid-community";
// import { useRouter, useSearchParams } from "next/navigation";
// import { createPortal } from "react-dom";
// import { useForm } from "react-hook-form";

// // Status and Work Status Options
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

// // Form Data Type
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
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
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
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
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
//   const isIndeterminate = selectedWorkStatuses.length > 0 && selectedWorkStatuses.length < workStatusOptions.length;

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


// const sortLeadsByEntryDate = (leads: Lead[]): Lead[] => {
//   return [...leads].sort((a, b) => {
//     const dateA = new Date(a.entry_date || 0).getTime();
//     const dateB = new Date(b.entry_date || 0).getTime();
//     return dateB - dateA;
//   });
// };

// export default function LeadsPage() {
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [online, setOnline] = useState(true);
//   const [search, setSearch] = useState("");
//   const [totalLeads, setTotalLeads] = useState(0);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const isNewLead = searchParams.get("newlead") === "true";
//   const [isModalOpen, setIsModalOpen] = useState(isNewLead);
//   const [formSaveLoading, setFormSaveLoading] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<FormData>({
//     defaultValues: initialFormData,
//   });

//   // ---- Load cached leads first ----
//   const loadCachedLeads = useCallback(async (searchTerm?: string) => {
//     try {
//       const cached = await appDB.loadLeads();
//       let filteredCached = cached;
      
//       if (searchTerm && searchTerm.trim()) {
//         const term = searchTerm.trim().toLowerCase();
//         filteredCached = cached.filter(
//           (lead) =>
//             lead.full_name?.toLowerCase().includes(term) ||
//             lead.email?.toLowerCase().includes(term) ||
//             lead.phone?.toLowerCase().includes(term) ||
//             lead.id?.toString().includes(term)
//         );
//       }

//       const sortedLeads = sortLeadsByEntryDate(filteredCached);
//       setLeads(sortedLeads);
//       setFilteredLeads(sortedLeads);
//       setTotalLeads(sortedLeads.length);
      
//       if (cached?.length) {
//         console.log("[LeadsPage] Loaded cached leads:", cached.length);
//       } else {
//         console.warn("[LeadsPage] No cached leads found");
//       }
//     } catch (err) {
//       console.error("[LeadsPage] Failed to load cached data:", err);
//       toast.error("Failed to load local data");
//     }
//   }, []);

//   // ---- Sync from backend ----
//   const syncFromServer = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await api.get("/leads");
//       const { data } = response;
//       const leadsData = data?.data || data;

//       if (Array.isArray(leadsData)) {
//         console.log("[LeadsPage] Syncing leads:", leadsData.length);
//         await appDB.leads.clear();
//         await appDB.leads.bulkAdd(leadsData);
//         await loadCachedLeads(search);
//         // toast.success(`Synced ${leadsData.length} leads`);
//       } else {
//         toast.error("Invalid response format from server");
//       }
//     } catch (err) {
//       console.error("[LeadsPage] Sync failed:", err);
//       toast.error("Failed to sync leads from server");
//     } finally {
//       setLoading(false);
//     }
//   }, [search, loadCachedLeads]);

//   // ---- Initial load ----
//   useEffect(() => {
//     const init = async () => {
//       await loadCachedLeads();
//       if (navigator.onLine) {
//         await syncFromServer();
//       } else {
//         toast.info("You are offline. Showing cached leads.");
//         setOnline(false);
//         setLoading(false);
//       }
//     };

//     init();

//     const handleOnline = async () => {
//       setOnline(true);
//       toast.success("Back online! Syncing leads...");
//       await syncFromServer();
//     };

//     const handleOffline = () => {
//       setOnline(false);
//       toast.warning("You are offline. Using cached leads.");
//     };

//     window.addEventListener("online", handleOnline);
//     window.addEventListener("offline", handleOffline);
//     return () => {
//       window.removeEventListener("online", handleOnline);
//       window.removeEventListener("offline", handleOffline);
//     };
//   }, [loadCachedLeads, syncFromServer]);

//   // ---- Search effect ----
//   useEffect(() => {
//     const timeoutId = setTimeout(async () => {
//       await loadCachedLeads(search);
//     }, 400);

//     return () => clearTimeout(timeoutId);
//   }, [search, loadCachedLeads]);

//   // ---- Filter leads by status and work status ----
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

//   // ---- Refresh manually ----
//   // const handleManualSync = async () => {
//   //   if (!navigator.onLine) {
//   //     toast.warning("You are offline. Cannot sync now.");
//   //     return;
//   //   }
//   //   await syncFromServer();
//   // };

//   // ---- Create Lead ----
//   const onSubmit = async (data: FormData) => {
//     if (!data.full_name.trim() || !data.email.trim() || !data.phone.trim()) {
//       toast.error("Full Name, Email, and Phone are required");
//       return;
//     }

//     setFormSaveLoading(true);

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

//       const response = await api.post("/leads", updatedData);
//       const savedLead = response.data;

//       // Add to local DB
//       await appDB.leads.add(savedLead);
//       await loadCachedLeads(search);

//       toast.success("Lead created successfully!");
//       handleCloseModal();
//     } catch (error: any) {
//       console.error("Error creating lead:", error);
//       toast.error(error.message || "Failed to create lead");
//     } finally {
//       setFormSaveLoading(false);
//     }
//   };

//   // ---- Update Lead ----
//   const handleRowUpdated = useCallback(
//     async (updatedRow: Lead) => {
//       if (!updatedRow.id) return;

//       try {
//         const payload = { ...updatedRow };
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

//         await api.put(`/leads/${updatedRow.id}`, payload);
        
//         // Update local DB
//         await appDB.leads.update(updatedRow.id, payload);
//         await loadCachedLeads(search);

//         toast.success("Lead updated successfully");
//       } catch (err: any) {
//         console.error("Error updating lead:", err);
//         toast.error(err.message || "Failed to update lead");
//       }
//     },
//     [search, loadCachedLeads]
//   );

//   // ---- Delete Lead ----
//   const handleRowDeleted = useCallback(
//     async (id: number) => {
//       try {
//         await api.delete(`/leads/${id}`);
//         await appDB.leads.delete(id);
//         await loadCachedLeads(search);
//         toast.success("Lead deleted successfully");
//       } catch (error: any) {
//         console.error("Error deleting lead:", error);
//         toast.error(error.message || "Failed to delete lead");
//       }
//     },
//     [search, loadCachedLeads]
//   );

//   // ---- Modal handlers ----
//   // const handleOpenModal = () => {
//   //   router.push("/avatar/leads?newlead=true");
//   //   setIsModalOpen(true);
//   // };

//   const handleCloseModal = () => {
//     router.push("/avatar/leads");
//     setIsModalOpen(false);
//     reset();
//   };

//   // ---- AG Grid Columns ----
//   // Format phone number
//   const formatPhoneNumber = (phoneNumberString: string) => {
//     const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
//     const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
//     if (match) {
//       return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
//     }
//     return `+1 ${phoneNumberString}`;
//   };

//   // Column definitions
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
//             <a href={`tel:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
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
//             <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: params.value }} />
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
//           params.data.massemail_unsubscribe !== undefined ? params.data.massemail_unsubscribe : false,
//         valueFormatter: ({ value }) => (value ? "True" : "False"),
//       },
//       {
//         field: "massemail_email_sent",
//         headerName: "Mass Email Sent",
//         width: 180,
//         editable: true,
//         sortable: true,
//         valueGetter: (params) =>
//           params.data.massemail_email_sent !== undefined ? params.data.massemail_email_sent : false,
//         valueFormatter: ({ value }) => (value ? "True" : "False"),
//       },
//       {
//         field: "moved_to_candidate",
//         headerName: "Moved to Candidate",
//         width: 180,
//         editable: true,
//         sortable: true,
//         valueGetter: (params) =>
//           params.data.moved_to_candidate !== undefined ? params.data.moved_to_candidate : false,
//         valueFormatter: ({ value }) => (value ? "True" : "False"),
//       },
//     ],
//     [selectedStatuses, selectedWorkStatuses]
//   );

//   return (
//     <div className="space-y-6 p-4">
//       <Toaster position="top-right" richColors />
      
//       {/* Header Section */}
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
//                 placeholder="Search by ID, name, email, phone..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full pl-10 text-sm sm:text-base"
//               />
//             </div>
//             {search && (
//               <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//                 {filteredLeads.length} leads found
//               </p>
//             )}
//           </div>
//         </div>
        
//         <div className="mt-2 flex flex-row items-center gap-2 sm:mt-0">
//           {!online && (
//             <div className="flex items-center text-yellow-600 text-sm">
//               <AlertTriangle className="h-4 w-4 mr-1" />
//               Offline
//             </div>
//           )}
//         </div>
//       </div>

//       {/* AG Grid Table */}
//         <AGGridTable
//           key={`${filteredLeads.length}-${selectedStatuses.join(",")}-${selectedWorkStatuses.join(",")}`}
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

//               const response = await api.post("/leads", payload);
//               const savedLead = response.data;

//               await appDB.leads.add(savedLead);
//               await loadCachedLeads(search);
//               toast.success("Lead created successfully");
//             } catch (err: any) {
//               console.error("Error creating lead via grid add:", err);
//               toast.error(err.message || "Failed to create lead");
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

//       {/* Add Lead Modal */}
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
//                         e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
//                       }}
//                     />
//                     {errors.phone && (
//                       <p className="mt-1 text-xs text-red-600">
//                         {errors.phone.message}
//                       </p>
//                     )}
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
//     </div>
//   );
// }













// ====================woprking without websocket---


"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { SearchIcon, RefreshCw, AlertTriangle, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { appDB, Lead } from "@/lib/dexieDB";
import api from "@/lib/api";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";

// Status and Work Status Options
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

// Form Data Type
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
  secondary_phone: "",
};

// Get machine ID for multi-system identification
const getMachineId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let machineId = localStorage.getItem('leadsMachineId');
  if (!machineId) {
    machineId = `machine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('leadsMachineId', machineId);
  }
  return machineId;
};

// Enhanced Lead type with sync fields
type EnhancedLead = Lead & {
  lastSync?: string;
  lastModified?: string;
  synced?: boolean;
  machineId?: string;
  _action?: 'add' | 'update' | 'delete' | null;
};

// Renderer Components
const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    future: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
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
    "waiting for status": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    h1b: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "h4 ead": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    "permanent resident": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    citizen: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    opt: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    cpt: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <Badge className={`${variantMap[workstatus] || variantMap.default} capitalize`}>
      {value || "N/A"}
    </Badge>
  );
};

// Filter Header Components (same as before)
const StatusFilterHeaderComponent = (props: any) => {
  const { selectedStatuses, setSelectedStatuses } = props;
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
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

  const handleStatusChange = (status: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedStatuses((prev: string[]) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedStatuses(e.target.checked ? [...statusOptions] : []);
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
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">Status</span>
      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedStatuses.length > 0 && (
          <span className="min-w-[20px] rounded-full bg-blue-500 px-2 py-0.5 text-center text-xs text-white">
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
        </svg>
      </div>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            style={{ top: dropdownPos.top + 5, left: dropdownPos.left, zIndex: 99999, maxHeight: "300px", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 border-b pb-2">
              <label className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  className="mr-2"
                  onChange={handleSelectAll}
                />
                All
              </label>
            </div>
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  className="mr-2"
                  onChange={(e) => handleStatusChange(status, e)}
                />
                {status}
              </label>
            ))}
            {selectedStatuses.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatuses([]);
                  }}
                  className="w-full py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
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
    setSelectedWorkStatuses((prev: string[]) =>
      prev.includes(workStatus) ? prev.filter((s) => s !== workStatus) : [...prev, workStatus]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedWorkStatuses(e.target.checked ? [...workStatusOptions] : []);
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
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">Work Status</span>
      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedWorkStatuses.length > 0 && (
          <span className="min-w-[20px] rounded-full bg-green-500 px-2 py-0.5 text-center text-xs text-white">
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
        </svg>
      </div>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
            style={{ top: dropdownPos.top + 5, left: dropdownPos.left, zIndex: 99999, maxHeight: "300px", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 border-b pb-2">
              <label className="flex cursor-pointer items-center rounded px-2 py-1 font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  className="mr-3"
                  onChange={handleSelectAll}
                />
                Select All
              </label>
            </div>
            {workStatusOptions.map((workStatus) => (
              <label
                key={workStatus}
                className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedWorkStatuses.includes(workStatus)}
                  onChange={(e) => handleWorkStatusChange(workStatus, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3"
                />
                <WorkStatusRenderer value={workStatus} />
              </label>
            ))}
            {selectedWorkStatuses.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkStatuses([]);
                  }}
                  className="w-full py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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

// Sort function
const sortLeadsByEntryDate = (leads: EnhancedLead[]): EnhancedLead[] => {
  return [...leads].sort((a, b) => {
    const dateA = new Date(a.entry_date || 0).getTime();
    const dateB = new Date(b.entry_date || 0).getTime();
    return dateB - dateA;
  });
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<EnhancedLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<EnhancedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [search, setSearch] = useState("");
  const [totalLeads, setTotalLeads] = useState(0);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  
  // Modal state
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewLead = searchParams.get("newlead") === "true";
  const [isModalOpen, setIsModalOpen] = useState(isNewLead);
  const [formSaveLoading, setFormSaveLoading] = useState(false);

  const machineId = useRef<string>(getMachineId()).current;
  const fetchInProgressRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: initialFormData,
  });

  // ---- Load cached leads ----
  const loadCachedLeads = useCallback(async (searchTerm?: string) => {
    try {
      const cached = await appDB.loadLeads();
      let filteredCached = cached as EnhancedLead[];
      
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        filteredCached = cached.filter(
          (lead) =>
            lead.full_name?.toLowerCase().includes(term) ||
            lead.email?.toLowerCase().includes(term) ||
            lead.phone?.toLowerCase().includes(term) ||
            lead.id?.toString().includes(term)
        ) as EnhancedLead[];
      }

      const sortedLeads = sortLeadsByEntryDate(filteredCached);
      setLeads(sortedLeads);
      setFilteredLeads(sortedLeads);
      setTotalLeads(sortedLeads.length);
      
      if (cached?.length) {
        console.log("[LeadsPage] Loaded cached leads:", cached.length);
      } else {
        console.warn("[LeadsPage] No cached leads found");
      }
    } catch (err) {
      console.error("[LeadsPage] Failed to load cached data:", err);
      toast.error("Failed to load local data");
    }
  }, []);

  // ---- Push local changes to server ----
  const pushLocalChangesToServer = useCallback(async () => {
    try {
      const allLeads = await appDB.loadLeads();
      const unsyncedLeads = allLeads.filter(lead => 
        !(lead as EnhancedLead).synced || (lead as EnhancedLead)._action
      ) as EnhancedLead[];
      
      for (const lead of unsyncedLeads) {
        try {
          if (lead._action === 'add' || !lead.id) {
            // New lead - create on server
            const { id, lastSync, lastModified, synced, _action, machineId: mid, ...payload } = lead;
            const response = await api.post("/leads", payload);
            const savedLead = response.data;
            
            // Update local record with server ID and mark as synced
            await appDB.leads.update(lead.id!, {
              ...savedLead,
              lastSync: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              synced: true,
              _action: null,
              machineId: machineId
            } as any);
          } else if (lead._action === 'update') {
            // Updated lead - update on server
            const { id, lastSync, lastModified, synced, _action, machineId: leadMachineId, ...payload } = lead;
            await api.put(`/leads/${lead.id}`, payload);
            
            // Mark as synced
            await appDB.leads.update(lead.id!, {
              lastSync: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              synced: true,
              _action: null
            } as any);
          } else if (lead._action === 'delete' && lead.id) {
            // Deleted lead - delete from server
            try {
              await api.delete(`/leads/${lead.id}`);
              await appDB.leads.delete(lead.id);
            } catch (e) {
              // If delete fails on server, keep local record but remove delete marker
              await appDB.leads.update(lead.id, {
                _action: null,
                synced: true
              } as any);
            }
          }
        } catch (error) {
          console.error(`Failed to sync lead ${lead.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error pushing local changes:', error);
    }
  }, [machineId]);

  // ---- Sync from backend with conflict resolution ----
  const syncFromServer = useCallback(async (forceRefresh: boolean = false) => {
    if (fetchInProgressRef.current) return;
    
    fetchInProgressRef.current = true;
    setLoading(true);

    try {
      // Get local leads to determine last sync time
      const localLeads = await appDB.loadLeads() as EnhancedLead[];
      const lastSyncTime = localLeads.length > 0 
        ? new Date(Math.max(...localLeads.map(lead => new Date(lead.lastSync || 0).getTime()))).toISOString()
        : '1970-01-01T00:00:00.000Z';

      let url = "/leads";
      const params = new URLSearchParams();
      
      // Only get leads modified after our last sync (unless force refresh)
      if (!forceRefresh) {
        params.append('modified_after', lastSyncTime);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      const { data } = response;
      const leadsData = data?.data || data;

      if (Array.isArray(leadsData)) {
        console.log("[LeadsPage] Syncing leads:", leadsData.length);
        
        const now = new Date().toISOString();
        
        for (const serverLead of leadsData) {
          if (!serverLead.id) continue;
          
          const existingLead = await appDB.leads.get(serverLead.id) as EnhancedLead;
          
          if (existingLead) {
            // Conflict resolution: Use the most recently modified version
            const serverTime = new Date(serverLead.lastModified || serverLead.entry_date || 0).getTime();
            const localTime = new Date(existingLead.lastModified || existingLead.entry_date || 0).getTime();
            
            if (serverTime > localTime || existingLead.synced) {
              // Server version is newer or local version is already synced
              await appDB.leads.update(serverLead.id, {
                ...(serverLead as any),
                lastSync: now,
                synced: true,
                lastModified: serverTime > localTime ? (serverLead.lastModified || serverLead.entry_date) : existingLead.lastModified,
                machineId: machineId
              } as any);
            }
            // If local version is newer and not synced, keep local version (it will be pushed later)
          } else {
            // New lead from server
            await appDB.leads.add({
              ...(serverLead as any),
              lastSync: now,
              synced: true,
              lastModified: serverLead.lastModified || serverLead.entry_date || now,
              machineId: machineId
            } as any);
          }
        }

        // Push any local unsynced changes to server
        await pushLocalChangesToServer();

        await loadCachedLeads(search);
      } else {
        toast.error("Invalid response format from server");
      }
    } catch (err) {
      console.error("[LeadsPage] Sync failed:", err);
      toast.error("Failed to sync leads from server");
      // Still load local data even if sync fails
      await loadCachedLeads(search);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [search, loadCachedLeads, pushLocalChangesToServer, machineId]);


useEffect(() => {
  const init = async () => {
    await loadCachedLeads();
    
    // Add sessionStorage gate for throttled sync
    const gateKey = 'leadsSectionLastSyncedAt';
    const lastSynced = sessionStorage.getItem(gateKey);
    const now = Date.now();
    const FiveMinutes = 5 * 60 * 1000;
    const shouldSync = !lastSynced || now - Number(lastSynced) > FiveMinutes;

    if (navigator.onLine && shouldSync) {
      await syncFromServer(true); // Force refresh only if gate allows
      sessionStorage.setItem(gateKey, String(now));
    } else {
      setLoading(false);
    }
  };

  init();

  const handleOnline = () => {
    setOnline(true);
    toast.success("Back online!");
    // REMOVED: await syncFromServer(); - No auto-sync on online event
  };

  const handleOffline = () => {
    setOnline(false);
    toast.warning("You are offline. Using cached leads.");
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, [loadCachedLeads]);

  // ---- Search effect ----
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      await loadCachedLeads(search);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [search, loadCachedLeads]);

  // ---- Filter leads by status and work status ----
  useEffect(() => {
    let filtered = [...leads];
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((lead) =>
        selectedStatuses.some(
          (status) => status.toLowerCase() === (lead.status || "").toLowerCase()
        )
      );
    }

    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((lead) =>
        selectedWorkStatuses.some(
          (ws) => ws.toLowerCase() === (lead.workstatus || "").toLowerCase()
        )
      );
    }

    setFilteredLeads(filtered);
    setTotalLeads(filtered.length);
  }, [leads, selectedStatuses, selectedWorkStatuses]);

  // ---- Refresh manually ----
  // const handleManualSync = async () => {
  //   if (!navigator.onLine) {
  //     toast.warning("You are offline. Cannot sync now.");
  //     return;
  //   }
  //   await syncFromServer(true); // Force refresh on manual sync
  // };

  // ---- Create Lead ----
  const onSubmit = async (data: FormData) => {
    if (!data.full_name.trim() || !data.email.trim() || !data.phone.trim()) {
      toast.error("Full Name, Email, and Phone are required");
      return;
    }

    setFormSaveLoading(true);

    try {
      const updatedData = { 
        ...data,
        status: data.status || "Open",
        workstatus: data.workstatus || "Waiting for Status",
        moved_to_candidate: Boolean(data.moved_to_candidate),
        massemail_email_sent: Boolean(data.massemail_email_sent),
        massemail_unsubscribe: Boolean(data.massemail_unsubscribe),
        entry_date: data.entry_date || new Date().toISOString(),
      };

      if (online) {
        // Online: Create on server first
        const response = await api.post("/leads", updatedData);
        const savedLead = response.data;

        // Add to local DB as synced
        await appDB.leads.add({
          ...savedLead,
          lastSync: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          synced: true,
          machineId: machineId
        } as any);
      } else {
        // Offline: Add to local DB with sync marker
        await appDB.leads.add({
          ...updatedData,
          lastSync: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          synced: false,
          _action: 'add',
          machineId: machineId
        } as any);
        toast.info("Lead saved locally. Will sync when online.");
      }

      await loadCachedLeads(search);
      toast.success("Lead created successfully!");
      handleCloseModal();
    } catch (error: any) {
      console.error("Error creating lead:", error);
      toast.error(error.message || "Failed to create lead");
    } finally {
      setFormSaveLoading(false);
    }
  };

  // ---- Update Lead ----
  const handleRowUpdated = useCallback(
    async (updatedRow: EnhancedLead) => {
      if (!updatedRow.id) return;

      try {
        const payload = { ...updatedRow };
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

        if (online) {
          // Online: Update on server
          await api.put(`/leads/${updatedRow.id}`, payload);
          
          // Update local DB as synced
          await appDB.leads.update(updatedRow.id, {
            ...payload,
            lastSync: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            synced: true,
            _action: null
          } as any);
        } else {
          // Offline: Update local DB with sync marker
          await appDB.leads.update(updatedRow.id, {
            ...payload,
            lastModified: new Date().toISOString(),
            synced: false,
            _action: 'update'
          } as any);
          toast.info("Update saved locally. Will sync when online.");
        }

        await loadCachedLeads(search);
        toast.success("Lead updated successfully");
      } catch (err: any) {
        console.error("Error updating lead:", err);
        toast.error(err.message || "Failed to update lead");
      }
    },
    [search, loadCachedLeads, online]
  );

  // ---- Delete Lead ----
  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        if (online) {
          // Online: Delete from server
          await api.delete(`/leads/${id}`);
          await appDB.leads.delete(id);
        } else {
          // Offline: Mark for deletion
          await appDB.leads.update(id, {
            _action: 'delete',
            synced: false,
            lastModified: new Date().toISOString()
          } as any);
          toast.info("Delete marked locally. Will sync when online.");
        }

        await loadCachedLeads(search);
        toast.success("Lead deleted successfully");
      } catch (error: any) {
        console.error("Error deleting lead:", error);
        toast.error(error.message || "Failed to delete lead");
      }
    },
    [search, loadCachedLeads, online]
  );

  // ---- Modal handlers ----
  // const handleOpenModal = () => {
  //   router.push("/avatar/leads?newlead=true");
  //   setIsModalOpen(true);
  // };

  const handleCloseModal = () => {
    router.push("/avatar/leads");
    setIsModalOpen(false);
    reset();
  };

  // ---- AG Grid Columns ----
  // Format phone number
  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
    return `+1 ${phoneNumberString}`;
  };

  // Column definitions (same as before)
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
            <a href={`tel:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
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
        filter: "agDateColumnFilter",
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
        cellRenderer: WorkStatusRenderer,
        headerComponent: WorkStatusFilterHeaderComponent,
        headerComponentParams: {
          selectedWorkStatuses,
          setSelectedWorkStatuses,
        },
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
        sortable: true,
      },
      {
        field: "secondary_phone",
        headerName: "Secondary Phone",
        width: 150,
        sortable: true,
      },
      {
        field: "address",
        headerName: "Address",
        width: 250,
        sortable: true,
      },
      {
        field: "closed_date",
        headerName: "Closed Date",
        width: 150,
        sortable: true,
        filter: "agDateColumnFilter",
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
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: params.value }} />
          );
        },
      },
      {
        field: "massemail_unsubscribe",
        headerName: "Mass Email Unsubscribe",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.massemail_unsubscribe !== undefined ? params.data.massemail_unsubscribe : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
      {
        field: "massemail_email_sent",
        headerName: "Mass Email Sent",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.massemail_email_sent !== undefined ? params.data.massemail_email_sent : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
      {
        field: "moved_to_candidate",
        headerName: "Moved to Candidate",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.moved_to_candidate !== undefined ? params.data.moved_to_candidate : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
    ],
    [selectedStatuses, selectedWorkStatuses]
  );

  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-right" richColors />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leads Management {!online && "(Offline)"}
          </h1>
          <div className="mt-2 sm:mt-0 sm:max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by ID, name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 text-sm sm:text-base"
              />
            </div>
            {search && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filteredLeads.length} leads found
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-2 flex flex-row items-center gap-2 sm:mt-0">
          {!online && (
            <div className="flex items-center text-yellow-600 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Offline
            </div>
          )}
        </div>
      </div>

      {/* AG Grid Table */}
     
        <AGGridTable
          key={`${filteredLeads.length}-${selectedStatuses.join(",")}-${selectedWorkStatuses.join(",")}`}
          rowData={filteredLeads}
          columnDefs={columnDefs}
          onRowAdded={async (newRow: any) => {
            try {
              const payload = {
                full_name: newRow.full_name || newRow.fullname || newRow.name || "",
                email: newRow.email || newRow.candidate_email || newRow.secondary_email || "",
                phone: newRow.phone || newRow.phone_number || newRow.contact || "",
                workstatus: newRow.workstatus || "Waiting for Status",
                address: newRow.address || "",
                secondary_email: newRow.secondary_email || "",
                secondary_phone: newRow.secondary_phone || "",
                status: newRow.status || "Open",
                moved_to_candidate: Boolean(newRow.moved_to_candidate),
                notes: newRow.notes || "",
                entry_date: newRow.entry_date || new Date().toISOString(),
                massemail_unsubscribe: Boolean(newRow.massemail_unsubscribe),
                massemail_email_sent: Boolean(newRow.massemail_email_sent),
              };

              if (online) {
                const response = await api.post("/leads", payload);
                const savedLead = response.data;

                await appDB.leads.add({
                  ...savedLead,
                  lastSync: new Date().toISOString(),
                  lastModified: new Date().toISOString(),
                  synced: true,
                  machineId: machineId
                } as any);
              } else {
                await appDB.leads.add({
                  ...payload,
                  lastSync: new Date().toISOString(),
                  lastModified: new Date().toISOString(),
                  synced: false,
                  _action: 'add',
                  machineId: machineId
                } as any);
                toast.info("Lead saved locally. Will sync when online.");
              }

              await loadCachedLeads(search);
              toast.success("Lead created successfully");
            } catch (err: any) {
              console.error("Error creating lead via grid add:", err);
              toast.error(err.message || "Failed to create lead");
            }
          }}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          loading={loading}
          showFilters={true}
          showSearch={false}
          height="600px"
          title={`Leads (${filteredLeads.length})`}
        />

      {/* Add Lead Modal (same as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-2 sm:p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl md:max-w-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 py-2 sm:px-4 sm:py-2 md:px-6">
              <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-sm font-semibold text-transparent sm:text-base md:text-lg">
                Add New Lead
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
              >
                <X size={16} className="sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="bg-white p-3 sm:p-4 md:p-5">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4">
                  {/* Form fields remain the same as previous version */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Full Name <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("full_name", {
                        required: "Full name is required",
                        maxLength: {
                          value: 100,
                          message: "Full name cannot exceed 100 characters",
                        },
                      })}
                      placeholder="Enter full name"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.full_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Email <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Invalid email address",
                        },
                      })}
                      placeholder="Enter email"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Phone <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register("phone", {
                        required: "Phone is required",
                        pattern: {
                          value: /^\d+$/,
                          message: "Phone must contain only numbers",
                        },
                      })}
                      placeholder="Enter phone number"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                      }}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Status
                    </label>
                    <select
                      {...register("status")}
                      className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Work Status
                    </label>
                    <select
                      {...register("workstatus")}
                      className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    >
                      {workStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Secondary Email
                    </label>
                    <input
                      type="email"
                      {...register("secondary_email")}
                      placeholder="Enter secondary email"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Secondary Phone
                    </label>
                    <input
                      type="tel"
                      {...register("secondary_phone")}
                      placeholder="Enter secondary phone"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                      }}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Address
                    </label>
                    <input
                      type="text"
                      {...register("address")}
                      placeholder="Enter address"
                      className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                      Notes
                    </label>
                    <div className="relative">
                      <textarea
                        {...register("notes")}
                        placeholder="Enter notes..."
                        className="w-full resize-none rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                        style={{ minHeight: "60px" }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1 sm:col-span-2 sm:grid-cols-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register("moved_to_candidate")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 sm:text-sm">
                        Moved to Candidate
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register("massemail_unsubscribe")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 sm:text-sm">
                        Mass Email Unsubscribe
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register("massemail_email_sent")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 sm:text-sm">
                        Mass Email Sent
                      </span>
                    </label>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2 border-t border-blue-200 pt-2 sm:mt-3 sm:gap-3 sm:pt-2 md:mt-4 md:pt-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-md transition hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 sm:px-5 sm:py-2 sm:text-sm"
                  >
                    {isSubmitting ? "Saving..." : "Save Lead"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
