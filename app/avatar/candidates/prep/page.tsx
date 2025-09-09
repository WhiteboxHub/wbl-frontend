
// // "use client";
// // import "@/styles/admin.css";
// // import "@/styles/App.css";
// // import { AGGridTable } from "@/components/AGGridTable";
// // import { Badge } from "@/components/admin_ui/badge";
// // import { Input } from "@/components/admin_ui/input";
// // import { Label } from "@/components/admin_ui/label";
// // import { SearchIcon } from "lucide-react";
// // import { ColDef } from "ag-grid-community";
// // import { useMemo, useState, useEffect, useCallback } from "react";
// // import axios from "axios";

// // const StatusRenderer = (params: any) => (
// //   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
// //     {params.value?.toUpperCase()}
// //   </Badge>
// // );

// // export default function CandidatesPrepPage() {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
// //   const [allCandidates, setAllCandidates] = useState<any[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");
// //   const [page] = useState(1);
// //   const [limit] = useState(100);

// //   const fetchCandidates = async () => {
// //     try {
// //       setLoading(true);
// //       const res = await axios.get(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=${page}&limit=${limit}`
// //       );
// //       const data = res.data;
// //       if (!Array.isArray(data)) throw new Error("Invalid data format");

// //       setAllCandidates(data);
// //       setFilteredCandidates(data);
// //     } catch {
// //       setError("Failed to load candidate preparations.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchCandidates();
// //   }, [page, limit]);

// //   const filterCandidates = useCallback(
// //     (searchTerm: string) => {
// //       if (searchTerm.trim() === "") return allCandidates;
// //       const searchLower = searchTerm.toLowerCase();
// //       return allCandidates.filter((candidate) =>
// //         Object.values(candidate).some((val) =>
// //           val?.toString().toLowerCase().includes(searchLower)
// //         )
// //       );
// //     },
// //     [allCandidates]
// //   );

// //   useEffect(() => {
// //     setFilteredCandidates(filterCandidates(searchTerm));
// //   }, [searchTerm, filterCandidates]);

// //   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
// //     return [
// //       { field: "id", headerName: "ID", pinned: "left", width: 80 },
// //       {
// //         field: "candidate.full_name",
// //         headerName: "Full Name",
// //         minWidth: 150,
// //         // valueGetter: (params) => params.data.candidate?.name || "N/A"
// //       },
// //       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
// //       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
// //       { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 110 },
  
// //         {
// //       headerName: "Instructor 1",
// //       minWidth: 150,
// //       valueGetter: (params) => params.data.instructor1?.name || "N/A",
// //     },
// //     {
// //       headerName: "Instructor 2",
// //       minWidth: 150,
// //       valueGetter: (params) => params.data.instructor2?.name || "N/A",
// //     },
// //     {
// //       headerName: "Instructor 3",
// //       minWidth: 150,
// //       valueGetter: (params) => params.data.instructor3?.name || "N/A",
// //     },
// //       { field: "rating", headerName: "Rating", minWidth: 100 },
// //       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
// //       { field: "communication", headerName: "Communication", minWidth: 120 },
// //       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
// //       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
// //       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
// //       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
// //       { field: "notes", headerName: "Notes", minWidth: 90 },
// //     ];
// //   }, []);

// //   const handleRowUpdated = async (updatedRow: any) => {
// //     try {
// //       await axios.put(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
// //         updatedRow
// //       );
// //       setFilteredCandidates((prev) =>
// //         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
// //       );
// //     } catch (err) {
// //       console.error("Failed to update:", err);
// //     }
// //   };

// //   const handleRowDeleted = async (id: number | string) => {
// //     try {
// //       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
// //       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
// //     } catch (err) {
// //       console.error("Failed to delete:", err);
// //     }
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
// //             Candidate Preparations
// //           </h1>
// //           <p className="text-gray-600 dark:text-gray-400">
// //             Tracking candidate preparation status
// //           </p>
// //         </div>
// //       </div>

// //       <div className="max-w-md">
// //         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
// //           Search Candidates
// //         </Label>
// //         <div className="relative mt-1">
// //           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //           <Input
// //             id="search"
// //             type="text"
// //             placeholder="Search..."
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //             className="pl-10"
// //           />
// //         </div>
// //         {searchTerm && (
// //           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
// //             {filteredCandidates.length} candidate(s) found
// //           </p>
// //         )}
// //       </div>

// //       {loading ? (
// //         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
// //       ) : error ? (
// //         <p className="text-center text-red-500">{error}</p>
// //       ) : (
// //         <div className="flex justify-center w-full">
// //           <div className="w-full max-w-7xl">
// //             <AGGridTable
// //               rowData={filteredCandidates}
// //               columnDefs={columnDefs}
// //               title={`Candidate Preparations (${filteredCandidates.length})`}
// //               height="calc(70vh)"
// //               showSearch={false}
// //               onRowUpdated={handleRowUpdated}
// //               onRowDeleted={handleRowDeleted}
// //             />
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }



// // "use client";
// // import "@/styles/admin.css";
// // import "@/styles/App.css";
// // import { AGGridTable } from "@/components/AGGridTable";
// // import { Badge } from "@/components/admin_ui/badge";
// // import { Input } from "@/components/admin_ui/input";
// // import { Label } from "@/components/admin_ui/label";
// // import { SearchIcon } from "lucide-react";
// // import { ColDef } from "ag-grid-community";
// // import { useMemo, useState, useEffect, useCallback } from "react";
// // import axios from "axios";

// // const StatusRenderer = (params: any) => (
// //   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
// //     {params.value?.toUpperCase()}
// //   </Badge>
// // );

// // export default function CandidatesPrepPage() {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
// //   const [allCandidates, setAllCandidates] = useState<any[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");
// //   const [page] = useState(1);
// //   const [limit] = useState(100);

// //   const fetchCandidates = async () => {
// //     try {
// //       setLoading(true);
// //       const res = await axios.get(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=${page}&limit=${limit}`
// //       );
// //       const data = res.data;
// //       if (!Array.isArray(data)) throw new Error("Invalid data format");

// //       setAllCandidates(data);
// //       setFilteredCandidates(data);
// //     } catch {
// //       setError("Failed to load candidate preparations.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchCandidates();
// //   }, [page, limit]);

// //   const filterCandidates = useCallback(
// //     (searchTerm: string) => {
// //       if (searchTerm.trim() === "") return allCandidates;
// //       const searchLower = searchTerm.toLowerCase();
// //       return allCandidates.filter((candidate) => {
// //         // Explicitly check nested candidate.full_name
// //         if (candidate.candidate?.full_name?.toLowerCase().includes(searchLower)) {
// //           return true;
// //         }
// //         // Fallback: check all other values
// //         return Object.values(candidate).some((val) =>
// //           val?.toString().toLowerCase().includes(searchLower)
// //         );
// //       });
// //     },
// //     [allCandidates]
// //   );

// //   useEffect(() => {
// //     setFilteredCandidates(filterCandidates(searchTerm));
// //   }, [searchTerm, filterCandidates]);

// //   // Helper: show summary of found candidates when searching
// //   const candidateSummaries = (() => {
// //     if (!searchTerm.trim()) return [];
// //     return filteredCandidates.map((c) => {
// //       const name = c.candidate?.full_name ?? "Unknown";
// //       const status = c.status ?? "N/A";
// //       return `${name} → Status: ${status}`;
// //     });
// //   })();

// //   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
// //     return [
// //       { field: "id", headerName: "ID", pinned: "left", width: 80 },
// //       {
// //         field: "candidate.full_name",
// //         headerName: "Full Name",
// //         minWidth: 150,
// //       },
// //       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
// //       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
// //       { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 110 },
// //       {
// //         headerName: "Instructor 1",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor1?.name || "N/A",
// //       },
// //       {
// //         headerName: "Instructor 2",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor2?.name || "N/A",
// //       },
// //       {
// //         headerName: "Instructor 3",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor3?.name || "N/A",
// //       },
// //       { field: "rating", headerName: "Rating", minWidth: 100 },
// //       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
// //       { field: "communication", headerName: "Communication", minWidth: 120 },
// //       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
// //       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
// //       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
// //       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
// //       { field: "notes", headerName: "Notes", minWidth: 90 },
// //     ];
// //   }, []);

// //   const handleRowUpdated = async (updatedRow: any) => {
// //     try {
// //       await axios.put(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
// //         updatedRow
// //       );
// //       setFilteredCandidates((prev) =>
// //         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
// //       );
// //     } catch (err) {
// //       console.error("Failed to update:", err);
// //     }
// //   };

// //   const handleRowDeleted = async (id: number | string) => {
// //     try {
// //       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
// //       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
// //     } catch (err) {
// //       console.error("Failed to delete:", err);
// //     }
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
// //             Candidate Preparations
// //           </h1>
// //           <p className="text-gray-600 dark:text-gray-400">
// //             Tracking candidate preparation status
// //           </p>
// //         </div>
// //       </div>

// //       <div className="max-w-md">
// //         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
// //           Search Candidates
// //         </Label>
// //         <div className="relative mt-1">
// //           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //           <Input
// //             id="search"
// //             type="text"
// //             placeholder="Search..."
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //             className="pl-10"
// //           />
// //         </div>
// //         {searchTerm && (
// //           <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
// //             <p>{filteredCandidates.length} candidate(s) found</p>
// //             {candidateSummaries.map((line, idx) => (
// //               <p key={idx}>{line}</p>
// //             ))}
// //           </div>
// //         )}
// //       </div>

// //       {loading ? (
// //         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
// //       ) : error ? (
// //         <p className="text-center text-red-500">{error}</p>
// //       ) : (
// //         <div className="flex justify-center w-full">
// //           <div className="w-full max-w-7xl">
// //             <AGGridTable
// //               rowData={filteredCandidates}
// //               columnDefs={columnDefs}
// //               title={`Candidate Preparations (${filteredCandidates.length})`}
// //               height="calc(70vh)"
// //               showSearch={false}
// //               onRowUpdated={handleRowUpdated}
// //               onRowDeleted={handleRowDeleted}
// //             />
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }




// // "use client";
// // import "@/styles/admin.css";
// // import "@/styles/App.css";
// // import { AGGridTable } from "@/components/AGGridTable";
// // import { Badge } from "@/components/admin_ui/badge";
// // import { Input } from "@/components/admin_ui/input";
// // import { Label } from "@/components/admin_ui/label";
// // import { SearchIcon } from "lucide-react";
// // import { ColDef } from "ag-grid-community";
// // import { useMemo, useState, useEffect, useCallback, useRef } from "react";
// // import axios from "axios";

// // const StatusRenderer = (params: any) => (
// //   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
// //     {params.value?.toUpperCase()}
// //   </Badge>
// // );

// // export default function CandidatesPrepPage() {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
// //   const [allCandidates, setAllCandidates] = useState<any[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");
// //   const [page] = useState(1);
// //   const [limit] = useState(100);

// //   const fetchCandidates = async () => {
// //     try {
// //       setLoading(true);
// //       const res = await axios.get(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=${page}&limit=${limit}`
// //       );
// //       const data = res.data;
// //       if (!Array.isArray(data)) throw new Error("Invalid data format");

// //       setAllCandidates(data);
// //       setFilteredCandidates(data);
// //     } catch {
// //       setError("Failed to load candidate preparations.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchCandidates();
// //   }, [page, limit]);

// //   const filterCandidates = useCallback(
// //     (searchTerm: string) => {
// //       if (searchTerm.trim() === "") return allCandidates;
// //       const searchLower = searchTerm.toLowerCase();
// //       return allCandidates.filter((candidate) => {
// //         if (candidate.candidate?.full_name?.toLowerCase().includes(searchLower)) {
// //           return true;
// //         }
// //         return Object.values(candidate).some((val) =>
// //           val?.toString().toLowerCase().includes(searchLower)
// //         );
// //       });
// //     },
// //     [allCandidates]
// //   );

// //   useEffect(() => {
// //     setFilteredCandidates(filterCandidates(searchTerm));
// //   }, [searchTerm, filterCandidates]);

// //   const candidateSummaries = (() => {
// //     if (!searchTerm.trim()) return [];
// //     return filteredCandidates.map((c) => {
// //       const name = c.candidate?.full_name ?? "Unknown";
// //       const status = c.status ?? "N/A";
// //       return `${name} → Status: ${status}`;
// //     });
// //   })();

// //   // Ref to detect outside click
// //   const filterRef = useRef<HTMLDivElement>(null);

// //   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
// //     return [
// //       { field: "id", headerName: "ID", pinned: "left", width: 80 },
// //       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
// //       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
// //       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
// //       {
// //         field: "status",
// //         headerName: "Status",
// //         cellRenderer: StatusRenderer,
// //         maxWidth: 150,
// //         headerComponentFramework: () => {
// //           const [filterVisible, setFilterVisible] = useState(false);
// //           const [filterValue, setFilterValue] = useState<string>("");

// //           const toggleFilter = () => setFilterVisible(!filterVisible);

// //           const handleFilterChange = (value: string) => {
// //             setFilterValue(value);
// //             setFilterVisible(false);
// //             if (!value) {
// //               setFilteredCandidates(allCandidates);
// //             } else {
// //               setFilteredCandidates(allCandidates.filter(c => c.status === value));
// //             }
// //           };

// //           // Close dropdown when clicking outside
// //           useEffect(() => {
// //             const handleClickOutside = (event: MouseEvent) => {
// //               if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
// //                 setFilterVisible(false);
// //               }
// //             };
// //             document.addEventListener("mousedown", handleClickOutside);
// //             return () => document.removeEventListener("mousedown", handleClickOutside);
// //           }, []);

// //           return (
// //             <div className="relative flex items-center" ref={filterRef}>
// //               <span>Status</span>
// //               <svg
// //                 onClick={toggleFilter}
// //                 xmlns="http://www.w3.org/2000/svg"
// //                 className="h-4 w-4 ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
// //                 fill="none"
// //                 viewBox="0 0 24 24"
// //                 stroke="currentColor"
// //               >
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
// //               </svg>

// //               {filterVisible && (
// //                 <div className="absolute top-full mt-1 left-0 z-50 bg-white border rounded shadow-lg p-1 flex flex-col space-y-1">
// //                   <button
// //                     onClick={() => handleFilterChange("Active")}
// //                     className="text-left px-2 py-1 hover:bg-gray-100"
// //                   >
// //                     Active
// //                   </button>
// //                   <button
// //                     onClick={() => handleFilterChange("Break")}
// //                     className="text-left px-2 py-1 hover:bg-gray-100"
// //                   >
// //                     Break
// //                   </button>
// //                   <button
// //                     onClick={() => handleFilterChange("Discontinued")}
// //                     className="text-left px-2 py-1 hover:bg-gray-100"
// //                   >
// //                     Discontinued
// //                   </button>
// //                 </div>
// //               )}
// //             </div>
// //           );
// //         },
// //       },
// //       {
// //         headerName: "Instructor 1",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor1?.name || "N/A",
// //       },
// //       {
// //         headerName: "Instructor 2",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor2?.name || "N/A",
// //       },
// //       {
// //         headerName: "Instructor 3",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor3?.name || "N/A",
// //       },
// //       { field: "rating", headerName: "Rating", minWidth: 100 },
// //       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
// //       { field: "communication", headerName: "Communication", minWidth: 120 },
// //       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
// //       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
// //       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
// //       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
// //       { field: "notes", headerName: "Notes", minWidth: 90 },
// //     ];
// //   }, [allCandidates]);

// //   const handleRowUpdated = async (updatedRow: any) => {
// //     try {
// //       await axios.put(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
// //         updatedRow
// //       );
// //       setFilteredCandidates((prev) =>
// //         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
// //       );
// //     } catch (err) {
// //       console.error("Failed to update:", err);
// //     }
// //   };

// //   const handleRowDeleted = async (id: number | string) => {
// //     try {
// //       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
// //       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
// //     } catch (err) {
// //       console.error("Failed to delete:", err);
// //     }
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
// //             Candidate Preparations
// //           </h1>
// //           <p className="text-gray-600 dark:text-gray-400">
// //             Tracking candidate preparation status
// //           </p>
// //         </div>
// //       </div>

// //       <div className="max-w-md">
// //         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
// //           Search Candidates
// //         </Label>
// //         <div className="relative mt-1">
// //           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //           <Input
// //             id="search"
// //             type="text"
// //             placeholder="Search..."
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //             className="pl-10"
// //           />
// //         </div>
// //         {searchTerm && (
// //           <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
// //             <p>{filteredCandidates.length} candidate(s) found</p>
// //             {candidateSummaries.map((line, idx) => (
// //               <p key={idx}>{line}</p>
// //             ))}
// //           </div>
// //         )}
// //       </div>

// //       {loading ? (
// //         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
// //       ) : error ? (
// //         <p className="text-center text-red-500">{error}</p>
// //       ) : (
// //         <div className="flex justify-center w-full">
// //           <div className="w-full max-w-7xl">
// //             <AGGridTable
// //               rowData={filteredCandidates}
// //               columnDefs={columnDefs}
// //               title={`Candidate Preparations (${filteredCandidates.length})`}
// //               height="calc(70vh)"
// //               showSearch={false}
// //               onRowUpdated={handleRowUpdated}
// //               onRowDeleted={handleRowDeleted}
// //             />
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }





// // "use client";
// // import "@/styles/admin.css";
// // import "@/styles/App.css";
// // import { AGGridTable } from "@/components/AGGridTable";
// // import { Badge } from "@/components/admin_ui/badge";
// // import { Input } from "@/components/admin_ui/input";
// // import { Label } from "@/components/admin_ui/label";
// // import { SearchIcon } from "lucide-react";
// // import { ColDef } from "ag-grid-community";
// // import { useMemo, useState, useEffect, useCallback, useRef } from "react";
// // import axios from "axios";

// // const StatusRenderer = (params: any) => (
// //   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
// //     {params.value?.toUpperCase()}
// //   </Badge>
// // );

// // const StatusHeaderComponent = (props: any) => {
// //   const [filterVisible, setFilterVisible] = useState(false);
// //   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
// //   const filterRef = useRef<HTMLDivElement>(null);

// //   const toggleFilter = () => {
// //     setFilterVisible(!filterVisible);
// //   };

// //   const handleStatusChange = (status: string) => {
// //     const newSelectedStatuses = selectedStatuses.includes(status)
// //       ? selectedStatuses.filter((s) => s !== status)
// //       : [...selectedStatuses, status];
// //     setSelectedStatuses(newSelectedStatuses);
// //     props.setFilteredCandidates(
// //       newSelectedStatuses.length === 0
// //         ? props.allCandidates
// //         : props.allCandidates.filter((c: any) => newSelectedStatuses.includes(c.status))
// //     );
// //   };

// //   useEffect(() => {
// //     const handleClickOutside = (event: MouseEvent) => {
// //       if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
// //         setFilterVisible(false);
// //       }
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   return (
// //     <div className="relative flex items-center w-full" ref={filterRef}>
// //       <span>Status</span>
// //       <svg
// //         onClick={toggleFilter}
// //         xmlns="http://www.w3.org/2000/svg"
// //         className="h-4 w-4 ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
// //         fill="none"
// //         viewBox="0 0 24 24"
// //         stroke="currentColor"
// //       >
// //         <path
// //           strokeLinecap="round"
// //           strokeLinejoin="round"
// //           strokeWidth={2}
// //           d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
// //         />
// //       </svg>
// //       {filterVisible && (
// //         <div className="absolute top-6 left-0 z-50 bg-white border rounded shadow-lg p-1 flex flex-col space-y-1 w-40">
// //           {["Active", "Break", "Discontinued"].map((status) => (
// //             <label
// //               key={status}
// //               className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
// //             >
// //               <input
// //                 type="checkbox"
// //                 checked={selectedStatuses.includes(status)}
// //                 onChange={() => handleStatusChange(status)}
// //                 className="mr-2"
// //               />
// //               {status}
// //             </label>
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default function CandidatesPrepPage() {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
// //   const [allCandidates, setAllCandidates] = useState<any[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");
// //   const [page] = useState(1);
// //   const [limit] = useState(100);

// //   const fetchCandidates = async () => {
// //     try {
// //       setLoading(true);
// //       const res = await axios.get(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=${page}&limit=${limit}`
// //       );
// //       const data = res.data;
// //       if (!Array.isArray(data)) throw new Error("Invalid data format");
// //       setAllCandidates(data);
// //       setFilteredCandidates(data);
// //     } catch {
// //       setError("Failed to load candidate preparations.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchCandidates();
// //   }, [page, limit]);

// //   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
// //     return [
// //       { field: "id", headerName: "ID", pinned: "left", width: 80 },
// //       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
// //       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
// //       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
// //       {
// //         field: "status",
// //         headerName: "Status",
// //         cellRenderer: StatusRenderer,
// //         maxWidth: 150,
// //         headerComponent: StatusHeaderComponent,
// //         headerComponentParams: {
// //           setFilteredCandidates: setFilteredCandidates,
// //           allCandidates: allCandidates,
// //         },
// //       },
// //       {
// //         headerName: "Instructor 1",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor1?.name || "N/A",
// //       },
// //       {
// //         headerName: "Instructor 2",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor2?.name || "N/A",
// //       },
// //       {
// //         headerName: "Instructor 3",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor3?.name || "N/A",
// //       },
// //       { field: "rating", headerName: "Rating", minWidth: 100 },
// //       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
// //       { field: "communication", headerName: "Communication", minWidth: 120 },
// //       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
// //       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
// //       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
// //       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
// //       { field: "notes", headerName: "Notes", minWidth: 90 },
// //     ];
// //   }, [allCandidates]);

// //   const handleRowUpdated = async (updatedRow: any) => {
// //     try {
// //       await axios.put(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
// //         updatedRow
// //       );
// //       setFilteredCandidates((prev) =>
// //         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
// //       );
// //     } catch (err) {
// //       console.error("Failed to update:", err);
// //     }
// //   };

// //   const handleRowDeleted = async (id: number | string) => {
// //     try {
// //       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
// //       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
// //     } catch (err) {
// //       console.error("Failed to delete:", err);
// //     }
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
// //             Candidate Preparations
// //           </h1>
// //           <p className="text-gray-600 dark:text-gray-400">
// //             Tracking candidate preparation status
// //           </p>
// //         </div>
// //       </div>
// //       <div className="max-w-md">
// //         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
// //           Search Candidates
// //         </Label>
// //         <div className="relative mt-1">
// //           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //           <Input
// //             id="search"
// //             type="text"
// //             placeholder="Search..."
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //             className="pl-10"
// //           />
// //         </div>
// //       </div>
// //       {loading ? (
// //         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
// //       ) : error ? (
// //         <p className="text-center text-red-500">{error}</p>
// //       ) : (
// //         <div className="flex justify-center w-full">
// //           <div className="w-full max-w-7xl">
// //             <AGGridTable
// //               rowData={filteredCandidates}
// //               columnDefs={columnDefs}
// //               title={`Candidate Preparations (${filteredCandidates.length})`}
// //               height="calc(70vh)"
// //               showSearch={false}
// //               onRowUpdated={handleRowUpdated}
// //               onRowDeleted={handleRowDeleted}
// //             />
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// /////////// dropdown visible but options not visible /////////////////


// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useRef } from "react";
// import axios from "axios";
// import React from "react";

// // Renderer for status column
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // Status Header Component with Dropdown
// const StatusHeaderComponent = ({ allCandidates, setFilteredCandidates }: { allCandidates: any[], setFilteredCandidates: (data: any[]) => void }) => {
//   const [filterVisible, setFilterVisible] = useState(false);
//   const [filterValue, setFilterValue] = useState<string>("");
//   const filterRef = useRef<HTMLDivElement>(null);

//   const toggleFilter = () => setFilterVisible(!filterVisible);

//   const handleFilterChange = (value: string) => {
//     setFilterValue(value);
//     setFilterVisible(false);
//     if (!value) {
//       setFilteredCandidates(allCandidates);
//     } else {
//       setFilteredCandidates(allCandidates.filter(c => c.status === value));
//     }
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
//         setFilterVisible(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div className="relative flex items-center" ref={filterRef}>
//       <span>Status</span>
//       <svg
//         onClick={toggleFilter}
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-4 w-4 ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
//       </svg>

//       {filterVisible && (
//         <div className="absolute top-full mt-1 left-0 z-50 bg-white border rounded shadow-lg p-1 flex flex-col space-y-1 min-w-[120px]">
//           <button
//             onClick={() => handleFilterChange("Active")}
//             className="text-left px-2 py-1 hover:bg-gray-100"
//           >
//             Active
//           </button>
//           <button
//             onClick={() => handleFilterChange("Break")}
//             className="text-left px-2 py-1 hover:bg-gray-100"
//           >
//             Break
//           </button>
//           <button
//             onClick={() => handleFilterChange("Discontinued")}
//             className="text-left px-2 py-1 hover:bg-gray-100"
//           >
//             Discontinued
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };



// // Global state for the filter
// let globalAllCandidates: any[] = [];
// let globalSetFilteredCandidates: ((data: any[]) => void) | null = null;
// let globalSetStatusFilter: ((status: string) => void) | null = null;
// let globalSetIsDropdownOpen: ((open: boolean) => void) | null = null;

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string>("");
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Update global state
//   globalAllCandidates = allCandidates;
//   globalSetFilteredCandidates = setFilteredCandidates;
//   globalSetStatusFilter = setStatusFilter;
//   globalSetIsDropdownOpen = setIsDropdownOpen;

//   // fetch candidates
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`
//         );
//         const data = res.data;
//         if (!Array.isArray(data)) throw new Error("Invalid data format");
//         setAllCandidates(data);
//         setFilteredCandidates(data);
//       } catch {
//         setError("Failed to load candidate preparations.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   // Apply search and status filters
//   useEffect(() => {
//     let filtered = allCandidates;

//     // Apply status filter
//     if (statusFilter) {
//       filtered = filtered.filter((candidate) => candidate.status === statusFilter);
//     }

//     // Apply search filter
//     if (searchTerm.trim() !== "") {
//       const searchLower = searchTerm.toLowerCase();
//       filtered = filtered.filter((candidate) => {
//         // Check candidate name first
//         if (candidate.candidate?.full_name?.toLowerCase().includes(searchLower)) {
//           return true;
//         }
//         // Check other fields
//         return Object.values(candidate).some((val) =>
//           val?.toString().toLowerCase().includes(searchLower)
//         );
//       });
//     }

//     setFilteredCandidates(filtered);
//   }, [allCandidates, searchTerm, statusFilter]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 150,
//         headerComponentFramework: () => {
//           return (
//             <div className="flex items-center w-full h-full">
//               <span className="text-sm font-medium">Status</span>
//               <button
//                 onClick={() => {
//                   // Create dropdown dynamically
//                   const existingDropdown = document.querySelector('.status-dropdown');
//                   if (existingDropdown) {
//                     existingDropdown.remove();
//                     return;
//                   }

//                   const dropdown = document.createElement('div');
//                   dropdown.className = 'status-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[120px]';
//                   dropdown.innerHTML = `
//                     <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-md" onclick="window.filterStatus('')">All Status</button>
//                     <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onclick="window.filterStatus('Active')">Active</button>
//                     <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onclick="window.filterStatus('Break')">Break</button>
//                     <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-md" onclick="window.filterStatus('Discontinued')">Discontinued</button>
//                   `;

//                   // Add global function
//                   (window as any).filterStatus = (status: string) => {
//                     globalSetStatusFilter?.(status);
//                     dropdown.remove();
//                   };

//                   // Position dropdown
//                   const header = document.querySelector('[col-id="status"] .ag-header-cell-label') as HTMLElement;
//                   if (header) {
//                     header.style.position = 'relative';
//                     header.appendChild(dropdown);
//                   }
//                 }}
//                 className="ml-2 p-1 hover:bg-gray-100 rounded"
//               >
//                 <svg
//                   className="w-4 h-4 text-gray-500"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
//                 </svg>
//               </button>
//             </div>
//           );
//         },
//       },
//       {
//         headerName: "Instructor 1",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor1?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 2",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor2?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 3",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor3?.name || "N/A",
//       },
//       { field: "rating", headerName: "Rating", minWidth: 100 },
//       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
//       { field: "communication", headerName: "Communication", minWidth: 120 },
//       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
//       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
//       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
//       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
//       { field: "notes", headerName: "Notes", minWidth: 90 },
//     ];
//   }, []);

//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
//         updatedRow
//       );
//       setFilteredCandidates((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidate Preparations
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Tracking candidate preparation status
//           </p>
//         </div>
//       </div>
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Search Candidates
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Candidate Preparations (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // /////////////////// data visisble but not clickning ////////////






// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { createPortal } from "react-dom";

// // Renderer for status column
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // Custom header with dropdown filter
// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom,
//         left: rect.left,
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleStatusChange = (status: string) => {
//     setSelectedStatuses((prev: string[]) =>
//       prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//     );
//   };

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         filterButtonRef.current &&
//         !filterButtonRef.current.contains(event.target as Node)
//       ) {
//         setFilterVisible(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div className="relative flex items-center w-full" ref={filterButtonRef}>
//       <span>Status</span>
//       <svg
//         onClick={toggleFilter}
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-4 w-4 ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
//         />
//       </svg>

//       {filterVisible &&
//         createPortal(
//           <div
//             className="z-[99999] bg-white border rounded shadow-lg p-1 flex flex-col space-y-1 w-40 pointer-events-auto"
//             style={{
//               top: dropdownPos.top,
//               left: dropdownPos.left,
//               position: "fixed", // ✅ makes it clickable
//             }}
//           >
//             {[
//               { value: "active", label: "Active" },
//               { value: "break", label: "Break" },
//               { value: "discontinued", label: "Discontinued" },
//             ].map(({ value, label }) => (
//               <label
//                 key={value}
//                 className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedStatuses.includes(value)}
//                   onChange={() => handleStatusChange(value)}
//                   className="mr-2"
//                 />
//                 {label}
//               </label>
//             ))}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // fetch candidates
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`
//         );
//         const data = res.data;
//         if (!Array.isArray(data)) throw new Error("Invalid data format");
//         setAllCandidates(data);
//       } catch {
//         setError("Failed to load candidate preparations.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   // combine filters: search + status
//   useEffect(() => {
//     let filtered = allCandidates;

//     if (selectedStatuses.length > 0) {
//       filtered = filtered.filter((c) =>
//         selectedStatuses.includes(c.status?.toLowerCase())
//       );
//     }

//     if (searchTerm.trim() !== "") {
//       const term = searchTerm.toLowerCase();
//       filtered = filtered.filter((c) =>
//         c.candidate?.full_name?.toLowerCase().includes(term)
//       );
//     }

//     setFilteredCandidates(filtered);
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 150,
//         headerComponent: StatusHeaderComponent,
//         headerComponentParams: {
//           selectedStatuses,
//           setSelectedStatuses,
//         },
//         // 👇 force re-render of header when selection changes
//         headerComponentFramework: (params: any) => (
//           <StatusHeaderComponent
//             {...params}
//             key={selectedStatuses.join(",")}
//             selectedStatuses={selectedStatuses}
//             setSelectedStatuses={setSelectedStatuses}
//           />
//         ),
//       },
//       {
//         headerName: "Instructor 1",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor1?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 2",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor2?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 3",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor3?.name || "N/A",
//       },
//       { field: "rating", headerName: "Rating", minWidth: 100 },
//       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
//       { field: "communication", headerName: "Communication", minWidth: 120 },
//       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
//       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
//       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
//       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
//       { field: "notes", headerName: "Notes", minWidth: 90 },
//     ];
//   }, [selectedStatuses]);

//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
//         updatedRow
//       );
//       setFilteredCandidates((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidate Preparations
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Tracking candidate preparation status
//           </p>
//         </div>
//       </div>
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Search Candidates
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Candidate Preparations (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /////////////////// data visisble but not clickning ////////////



// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { createPortal } from "react-dom";

// // Renderer for status column
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // Custom header with dropdown filter
// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom,
//         left: rect.left,
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleStatusChange = (status: string) => {
//     setSelectedStatuses((prev: string[]) =>
//       prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//     );
//   };

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
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div className="relative flex items-center w-full" ref={filterButtonRef}>
//       <span>Status</span>
//       <svg
//         onClick={toggleFilter}
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-4 w-4 ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
//         />
//       </svg>

//       {filterVisible &&
//         createPortal(
//           <div
//             ref={dropdownRef}
//             className="z-[99999] bg-white border rounded shadow-lg p-1 flex flex-col space-y-1 w-40 pointer-events-auto"
//             style={{
//               top: dropdownPos.top,
//               left: dropdownPos.left,
//               position: "fixed",
//             }}
//           >
//             {[
//               { value: "active", label: "Active" },
//               { value: "break", label: "Break" },
//               { value: "Inactive", label: "Inactive" },
//               { value: "discontinued", label: "Discontinued" },
//             ].map(({ value, label }) => (
//               <label
//                 key={value}
//                 className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedStatuses.includes(value)}
//                   onChange={() => handleStatusChange(value)}
//                   className="mr-2"
//                 />
//                 {label}
//               </label>
//             ))}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // fetch candidates
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`
//         );
//         const data = res.data;
//         if (!Array.isArray(data)) throw new Error("Invalid data format");
//         setAllCandidates(data);
//       } catch {
//         setError("Failed to load candidate preparations.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   // combine filters: search + status
//   useEffect(() => {
//     let filtered = allCandidates;

//     if (selectedStatuses.length > 0) {
//       filtered = filtered.filter((c) =>
//         selectedStatuses.includes(c.status?.toLowerCase())
//       );
//     }

//     if (searchTerm.trim() !== "") {
//       const term = searchTerm.toLowerCase();
//       filtered = filtered.filter((c) =>
//         c.candidate?.full_name?.toLowerCase().includes(term)
//       );
//     }

//     setFilteredCandidates(filtered);
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 150,
//         headerComponent: StatusHeaderComponent,
//         headerComponentParams: {
//           selectedStatuses,
//           setSelectedStatuses,
//         },
//       },
//       {
//         headerName: "Instructor 1",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor1?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 2",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor2?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 3",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor3?.name || "N/A",
//       },
//       { field: "rating", headerName: "Rating", minWidth: 100 },
//       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
//       { field: "communication", headerName: "Communication", minWidth: 120 },
//       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
//       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
//       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
//       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
//       { field: "notes", headerName: "Notes", minWidth: 90 },
//     ];
//   }, [selectedStatuses]);

//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
//         updatedRow
//       );
//       setFilteredCandidates((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   return (
//     <div className="space-y-10">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidate Preparations
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Tracking candidate preparation status
//           </p>
//         </div>
//       </div>
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Search Candidates
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Candidate Preparations (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { createPortal } from "react-dom";

// // Renderer for status column
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // Custom header with dropdown filter
// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom,
//         left: rect.left,
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleStatusChange = (status: string) => {
//     setSelectedStatuses((prev: string[]) =>
//       prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//     );
//   };

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
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div className="relative flex items-center w-full" ref={filterButtonRef}>
//       <span className="mr-12">Status</span>
//       <svg
//         onClick={toggleFilter}
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
//         />
//       </svg>

//       {filterVisible &&
//         createPortal(
//           <div
//             ref={dropdownRef}
//             className="z-[99999] bg-white border rounded shadow-lg p-3 flex flex-col space-y-2 w-48 pointer-events-auto"
//             style={{
//               top: dropdownPos.top,
//               left: dropdownPos.left,
//               position: "fixed",
//             }}
//           >
//             {[
//               { value: "active", label: "Active" },
//               { value: "break", label: "Break" },
//               { value: "inactive", label: "Inactive" },
//               { value: "discontinued", label: "Discontinued" },
//             ].map(({ value, label }) => (
//               <label
//                 key={value}
//                 className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedStatuses.includes(value)}
//                   onChange={() => handleStatusChange(value)}
//                   className="mr-3"
//                 />
//                 {label}
//               </label>
//             ))}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // fetch candidates
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`
//         );
//         const data = res.data;
//         if (!Array.isArray(data)) throw new Error("Invalid data format");
//         setAllCandidates(data);
//       } catch {
//         setError("Failed to load candidate preparations.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   // combine filters: search + status
//   useEffect(() => {
//     let filtered = allCandidates;

//     if (selectedStatuses.length > 0) {
//       filtered = filtered.filter((c) =>
//         selectedStatuses.includes(c.status?.toLowerCase())
//       );
//     }

//     if (searchTerm.trim() !== "") {
//       const term = searchTerm.toLowerCase();
//       filtered = filtered.filter((c) =>
//         c.candidate?.full_name?.toLowerCase().includes(term)
//       );
//     }

//     setFilteredCandidates(filtered);
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 150,
//         headerComponent: StatusHeaderComponent,
//         headerComponentParams: {
//           selectedStatuses,
//           setSelectedStatuses,
//         },
//       },
//       {
//         headerName: "Instructor 1",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor1?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 2",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor2?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 3",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor3?.name || "N/A",
//       },
//       { field: "rating", headerName: "Rating", minWidth: 100 },
//       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
//       { field: "communication", headerName: "Communication", minWidth: 120 },
//       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
//       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
//       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
//       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
//       { field: "notes", headerName: "Notes", minWidth: 90 },
//     ];
//   }, [selectedStatuses]);

//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
//         updatedRow
//       );
//       setFilteredCandidates((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidate Preparations
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">
//             Tracking candidate preparation status
//           </p>
//         </div>
//       </div>

//       <div className="max-w-md">
//         <Label
//           htmlFor="search"
//           className="text-sm font-medium text-gray-700 dark:text-gray-300"
//         >
//           Search Candidates
//         </Label>
//         <div className="relative mt-2">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 py-2"
//           />
//         </div>
//       </div>

//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Candidate Preparations (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { createPortal } from "react-dom";

// // Renderer for status column
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // Custom header with dropdown filter
// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom,
//         left: rect.left,
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleStatusChange = (status: string) => {
//     setSelectedStatuses((prev: string[]) =>
//       prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//     );
//   };

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

//     const handleScroll = () => {
//       setFilterVisible(false); // close dropdown on scroll
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     window.addEventListener("scroll", handleScroll, true); // capture scroll from all ancestors

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", handleScroll, true);
//     };
//   }, []);

//   return (
//     <div className="relative flex items-center w-full" ref={filterButtonRef}>
//       <span className="mr-12">Status</span> {/* Space between text and icon */}
//       <svg
//         onClick={toggleFilter}
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
//         />
//       </svg>

//       {filterVisible &&
//         createPortal(
//           <div
//             ref={dropdownRef}
//             className="z-[99999] bg-white border rounded shadow-lg p-3 flex flex-col space-y-2 w-48 pointer-events-auto"
//             style={{
//               top: dropdownPos.top,
//               left: dropdownPos.left,
//               position: "fixed",
//             }}
//           >
//             {[
//               { value: "active", label: "Active" },
//               { value: "break", label: "Break" },
//               { value: "inactive", label: "Inactive" },
//               { value: "discontinued", label: "Discontinued" },
//             ].map(({ value, label }) => (
//               <label
//                 key={value}
//                 className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedStatuses.includes(value)}
//                   onChange={() => handleStatusChange(value)}
//                   className="mr-3"
//                 />
//                 {label}
//               </label>
//             ))}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // fetch candidates
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`
//         );
//         const data = res.data;
//         if (!Array.isArray(data)) throw new Error("Invalid data format");
//         setAllCandidates(data);
//       } catch {
//         setError("Failed to load candidate preparations.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   // combine filters: search + status
//   useEffect(() => {
//     let filtered = allCandidates;

//     if (selectedStatuses.length > 0) {
//       filtered = filtered.filter((c) =>
//         selectedStatuses.includes(c.status?.toLowerCase())
//       );
//     }

//     if (searchTerm.trim() !== "") {
//       const term = searchTerm.toLowerCase();
//       filtered = filtered.filter((c) =>
//         c.candidate?.full_name?.toLowerCase().includes(term)
//       );
//     }

//     setFilteredCandidates(filtered);
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 150,
//         headerComponent: StatusHeaderComponent,
//         headerComponentParams: {
//           selectedStatuses,
//           setSelectedStatuses,
//         },
//       },
//       {
//         headerName: "Instructor 1",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor1?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 2",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor2?.name || "N/A",
//       },
//       {
//         headerName: "Instructor 3",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor3?.name || "N/A",
//       },
//       { field: "rating", headerName: "Rating", minWidth: 100 },
//       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
//       { field: "communication", headerName: "Communication", minWidth: 120 },
//       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
//       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
//       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
//       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
//       { field: "notes", headerName: "Notes", minWidth: 90 },
//     ];
//   }, [selectedStatuses]);

//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
//         updatedRow
//       );
//       setFilteredCandidates((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidate Preparations
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">
//             Tracking candidate preparation status
//           </p>
//         </div>
//       </div>

//       <div className="max-w-md">
//         <Label
//           htmlFor="search"
//           className="text-sm font-medium text-gray-700 dark:text-gray-300"
//         >
//           Search Candidates
//         </Label>
//         <div className="relative mt-2">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 py-2"
//           />
//         </div>
//       </div>

//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Candidate Preparations (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { createPortal } from "react-dom";

// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom,
//         left: rect.left,
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleStatusChange = (status: string) => {
//     setSelectedStatuses((prev: string[]) =>
//       prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//     );
//   };

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

//     document.addEventListener("mousedown", handleClickOutside);
//     window.addEventListener("scroll", handleScroll, true);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", handleScroll, true);
//     };
//   }, []);

//   return (
//     <div className="relative flex items-center w-full" ref={filterButtonRef}>
//       <span className="mr-12">Status</span>
//       <svg
//         onClick={toggleFilter}
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
//       </svg>

//       {filterVisible &&
//         createPortal(
//           <div
//             ref={dropdownRef}
//             className="z-[99999] bg-white border rounded shadow-lg p-3 flex flex-col space-y-2 w-48 pointer-events-auto"
//             style={{
//               top: dropdownPos.top,
//               left: dropdownPos.left,
//               position: "fixed",
//             }}
//           >
//             {[
//               { value: "active", label: "Active" },
//               { value: "break", label: "Break" },
//               { value: "inactive", label: "Inactive" },
//               { value: "discontinued", label: "Discontinued" },
//             ].map(({ value, label }) => (
//               <label key={value} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded">
//                 <input
//                   type="checkbox"
//                   checked={selectedStatuses.includes(value)}
//                   onChange={() => handleStatusChange(value)}
//                   className="mr-3"
//                 />
//                 {label}
//               </label>
//             ))}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`);
//         const data = res.data;
//         if (!Array.isArray(data)) throw new Error("Invalid data format");
//         setAllCandidates(data);
//       } catch {
//         setError("Failed to load candidate preparations.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCandidates();
//   }, []);

//   // Combine filters: search + status
//   useEffect(() => {
//     let filtered = allCandidates;

//     if (selectedStatuses.length > 0) {
//       filtered = filtered.filter((c) => selectedStatuses.includes(c.status?.toLowerCase()));
//     }

//     if (searchTerm.trim() !== "") {
//       const term = searchTerm.toLowerCase();
//       filtered = filtered.filter((c) => c.candidate?.full_name?.toLowerCase().includes(term));
//     }

//     setFilteredCandidates(filtered);
//     setCurrentPage(1); // reset page on filter/search
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
//   const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 150,
//         headerComponent: StatusHeaderComponent,
//         headerComponentParams: { selectedStatuses, setSelectedStatuses },
//       },
//       { headerName: "Instructor 1", minWidth: 150, valueGetter: (params) => params.data.instructor1?.name || "N/A" },
//       { headerName: "Instructor 2", minWidth: 150, valueGetter: (params) => params.data.instructor2?.name || "N/A" },
//       { headerName: "Instructor 3", minWidth: 150, valueGetter: (params) => params.data.instructor3?.name || "N/A" },
//       { field: "rating", headerName: "Rating", minWidth: 100 },
//       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
//       { field: "communication", headerName: "Communication", minWidth: 120 },
//       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
//       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
//       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
//       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
//       { field: "notes", headerName: "Notes", minWidth: 90 },
//     ];
//   }, [selectedStatuses]);

//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`, updatedRow);
//       setFilteredCandidates((prev) => prev.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Candidate Preparations</h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking candidate preparation status</p>
//         </div>
//       </div>

//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Candidates</Label>
//         <div className="relative mt-2">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 py-2"
//           />
//         </div>
//       </div>

//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <>
//           <div className="flex justify-center w-full">
//             <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
//               <AGGridTable
//                 rowData={paginatedCandidates}
//                 columnDefs={columnDefs}
//                 title={`Candidate Preparations (${filteredCandidates.length})`}
//                 height="calc(60vh)"
//                 showSearch={false}
//                 onRowUpdated={handleRowUpdated}
//                 onRowDeleted={handleRowDeleted}
//               />
//             </div>
//           </div>

//           {/* Pagination controls */}
//           <div className="flex justify-center gap-2 mt-4">
//             <button
//               disabled={currentPage === 1}
//               onClick={() => setCurrentPage((p) => p - 1)}
//               className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//             >
//               Prev
//             </button>
//             {Array.from({ length: totalPages }, (_, i) => (
//               <button
//                 key={i + 1}
//                 onClick={() => setCurrentPage(i + 1)}
//                 className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
//               >
//                 {i + 1}
//               </button>
//             ))}
//             <button
//               disabled={currentPage === totalPages}
//               onClick={() => setCurrentPage((p) => p + 1)}
//               className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//             >
//               Next
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }





// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { createPortal } from "react-dom";

// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom,
//         left: rect.left,
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleStatusChange = (status: string) => {
//     setSelectedStatuses((prev: string[]) =>
//       prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//     );
//   };

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
//     document.addEventListener("mousedown", handleClickOutside);
//     window.addEventListener("scroll", handleScroll, true);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", handleScroll, true);
//     };
//   }, []);

//   return (
//     <div className="relative flex items-center w-full" ref={filterButtonRef}>
//       <span className="mr-12">Status</span>
//       <svg
//         onClick={toggleFilter}
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
//         />
//       </svg>
//       {filterVisible &&
//         createPortal(
//           <div
//             ref={dropdownRef}
//             className="z-[99999] bg-white border rounded shadow-lg p-3 flex flex-col space-y-2 w-48 pointer-events-auto"
//             style={{
//               top: dropdownPos.top,
//               left: dropdownPos.left,
//               position: "fixed",
//             }}
//           >
//             {[
//               { value: "active", label: "Active" },
//               { value: "break", label: "Break" },
//               { value: "inactive", label: "Inactive" },
//               { value: "discontinued", label: "Discontinued" },
//             ].map(({ value, label }) => (
//               <label
//                 key={value}
//                 className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedStatuses.includes(value)}
//                   onChange={() => handleStatusChange(value)}
//                   className="mr-3"
//                 />
//                 {label}
//               </label>
//             ))}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`
//         );
//         const data = res.data;
//         if (!Array.isArray(data)) throw new Error("Invalid data format");
//         setAllCandidates(data);
//       } catch {
//         setError("Failed to load candidate preparations.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCandidates();
//   }, []);

//   useEffect(() => {
//     let filtered = allCandidates;
//     if (selectedStatuses.length > 0) {
//       filtered = filtered.filter((c) =>
//         selectedStatuses.includes(c.status?.toLowerCase())
//       );
//     }
//     if (searchTerm.trim() !== "") {
//       const term = searchTerm.toLowerCase();
//       filtered = filtered.filter((c) =>
//         c.candidate?.full_name?.toLowerCase().includes(term)
//       );
//     }
//     setFilteredCandidates(filtered);
//     setCurrentPage(1);
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
//   const paginatedCandidates = filteredCandidates.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 150,
//         headerComponent: StatusHeaderComponent,
//         headerComponentParams: { selectedStatuses, setSelectedStatuses },
//       },
//       { headerName: "Instructor 1", minWidth: 150, valueGetter: (params) => params.data.instructor1?.name || "N/A" },
//       { headerName: "Instructor 2", minWidth: 150, valueGetter: (params) => params.data.instructor2?.name || "N/A" },
//       { headerName: "Instructor 3", minWidth: 150, valueGetter: (params) => params.data.instructor3?.name || "N/A" },
//       { field: "rating", headerName: "Rating", minWidth: 100 },
//       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
//       { field: "communication", headerName: "Communication", minWidth: 120 },
//       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
//       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
//       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
//       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
//       { field: "notes", headerName: "Notes", minWidth: 90 },
//     ];
//   }, [selectedStatuses]);

//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
//         updatedRow
//       );
//       setFilteredCandidates((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`
//       );
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidate Preparations
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">
//             Tracking candidate preparation status
//           </p>
//         </div>
//       </div>
//       <div className="max-w-md">
//         <Label
//           htmlFor="search"
//           className="text-sm font-medium text-gray-700 dark:text-gray-300"
//         >
//           Search Candidates
//         </Label>
//         <div className="relative mt-2">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 py-2"
//           />
//         </div>
//       </div>
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">
//           Loading...
//         </p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <>
//           <div className="flex justify-center w-full">
//             <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
//               <AGGridTable
//                 rowData={paginatedCandidates}
//                 columnDefs={columnDefs}
//                 title={`Candidate Preparations (${filteredCandidates.length})`}
//                 height="calc(60vh)"
//                 showSearch={false}
//                 onRowUpdated={handleRowUpdated}
//                 onRowDeleted={handleRowDeleted}
//               />
//             </div>
//           </div>
//           {/* Updated Pagination Controls */}
//           <div className="flex items-center justify-between px-2 py-3 bg-white dark:bg-gray-800 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-700 dark:text-gray-300">
//                 Rows per page:
//               </span>
//               <select
//                 value={itemsPerPage}
//                 onChange={handleItemsPerPageChange}
//                 className="px-2 py-1 border rounded text-sm"
//               >
//                 <option value="10">10</option>
//                 <option value="20">20</option>
//                 <option value="50">50</option>
//               </select>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 disabled={currentPage === 1}
//                 onClick={() => setCurrentPage((p) => p - 1)}
//                 className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//               >
//                 Previous
//               </button>
//               <span className="text-sm text-gray-700 dark:text-gray-300">
//                 Page {currentPage} of {totalPages}
//               </span>
//               <button
//                 disabled={currentPage === totalPages}
//                 onClick={() => setCurrentPage((p) => p + 1)}
//                 className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }




// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { createPortal } from "react-dom";

// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom,
//         left: rect.left,
//       });
//     }
//     setFilterVisible((v) => !v);
//   };

//   const handleStatusChange = (status: string) => {
//     setSelectedStatuses((prev: string[]) =>
//       prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
//     );
//   };

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
//     document.addEventListener("mousedown", handleClickOutside);
//     window.addEventListener("scroll", handleScroll, true);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", handleScroll, true);
//     };
//   }, []);

//   return (
//     <div className="relative flex items-center w-full" ref={filterButtonRef}>
//       <span className="mr-12">Status</span>
//       <svg
//         onClick={toggleFilter}
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
//         />
//       </svg>
//       {filterVisible &&
//         createPortal(
//           <div
//             ref={dropdownRef}
//             className="z-[99999] bg-white border rounded shadow-lg p-3 flex flex-col space-y-2 w-48 pointer-events-auto"
//             style={{
//               top: dropdownPos.top,
//               left: dropdownPos.left,
//               position: "fixed",
//             }}
//           >
//             {[
//               { value: "active", label: "Active" },
//               { value: "break", label: "Break" },
//               { value: "inactive", label: "Inactive" },
//               { value: "discontinued", label: "Discontinued" },
//             ].map(({ value, label }) => (
//               <label
//                 key={value}
//                 className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedStatuses.includes(value)}
//                   onChange={() => handleStatusChange(value)}
//                   className="mr-3"
//                 />
//                 {label}
//               </label>
//             ))}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`
//         );
//         const data = res.data;
//         if (!Array.isArray(data)) throw new Error("Invalid data format");
//         setAllCandidates(data);
//       } catch {
//         setError("Failed to load candidate preparations.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCandidates();
//   }, []);

//   useEffect(() => {
//     let filtered = allCandidates;
//     if (selectedStatuses.length > 0) {
//       filtered = filtered.filter((c) =>
//         selectedStatuses.includes(c.status?.toLowerCase())
//       );
//     }
//     if (searchTerm.trim() !== "") {
//       const term = searchTerm.toLowerCase();
//       filtered = filtered.filter((c) =>
//         c.candidate?.full_name?.toLowerCase().includes(term)
//       );
//     }
//     setFilteredCandidates(filtered);
//     setCurrentPage(1);
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
//   const paginatedCandidates = filteredCandidates.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
//       { field: "batch", headerName: "Batch", sortable: true, maxWidth: 150 },
//       { field: "start_date", headerName: "Start Date", sortable: true, maxWidth: 130 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 150,
//         headerComponent: StatusHeaderComponent,
//         headerComponentParams: { selectedStatuses, setSelectedStatuses },
//       },
//       { headerName: "Instructor 1", minWidth: 150, valueGetter: (params) => params.data.instructor1?.name || "N/A" },
//       { headerName: "Instructor 2", minWidth: 150, valueGetter: (params) => params.data.instructor2?.name || "N/A" },
//       { headerName: "Instructor 3", minWidth: 150, valueGetter: (params) => params.data.instructor3?.name || "N/A" },
//       { field: "rating", headerName: "Rating", minWidth: 100 },
//       { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
//       { field: "communication", headerName: "Communication", minWidth: 120 },
//       { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
//       { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
//       { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
//       { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
//       { field: "notes", headerName: "Notes", minWidth: 90 },
//     ];
//   }, [selectedStatuses]);

//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       // Only send primitive fields and IDs
//       const payload = {
//         batch: updatedRow.batch,
//         start_date: updatedRow.start_date,
//         status: updatedRow.status,
//         instructor1_id: updatedRow.instructor1_id,
//         instructor2_id: updatedRow.instructor2_id,
//         instructor3_id: updatedRow.instructor3_id,
//         rating: updatedRow.rating,
//         tech_rating: updatedRow.tech_rating,
//         communication: updatedRow.communication,
//         years_of_experience: updatedRow.years_of_experience,
//         topics_finished: updatedRow.topics_finished,
//         current_topics: updatedRow.current_topics,
//         target_date_of_marketing: updatedRow.target_date_of_marketing,
//         notes: updatedRow.notes,
//       };

//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${updatedRow.id}`,
//         payload
//       );

//       // Update local state
//       setFilteredCandidates((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? { ...row, ...payload } : row))
//       );
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${id}`
//       );
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidate Preparations
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">
//             Tracking candidate preparation status
//           </p>
//         </div>
//       </div>
//       <div className="max-w-md">
//         <Label
//           htmlFor="search"
//           className="text-sm font-medium text-gray-700 dark:text-gray-300"
//         >
//           Search Candidates
//         </Label>
//         <div className="relative mt-2">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 py-2"
//           />
//         </div>
//       </div>
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">
//           Loading...
//         </p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <>
//           <div className="flex justify-center w-full">
//             <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
//               <AGGridTable
//                 rowData={paginatedCandidates}
//                 columnDefs={columnDefs}
//                 title={`Candidate Preparations (${filteredCandidates.length})`}
//                 height="calc(60vh)"
//                 showSearch={false}
//                 onRowUpdated={handleRowUpdated}
//                 onRowDeleted={handleRowDeleted}
//               />
//             </div>
//           </div>
//           <div className="flex items-center justify-between px-2 py-3 bg-white dark:bg-gray-800 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-700 dark:text-gray-300">
//                 Rows per page:
//               </span>
//               <select
//                 value={itemsPerPage}
//                 onChange={handleItemsPerPageChange}
//                 className="px-2 py-1 border rounded text-sm"
//               >
//                 <option value="10">10</option>
//                 <option value="20">20</option>
//                 <option value="50">50</option>
//               </select>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 disabled={currentPage === 1}
//                 onClick={() => setCurrentPage((p) => p - 1)}
//                 className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//               >
//                 Previous
//               </button>
//               <span className="text-sm text-gray-700 dark:text-gray-300">
//                 Page {currentPage} of {totalPages}
//               </span>
//               <button
//                 disabled={currentPage === totalPages}
//                 onClick={() => setCurrentPage((p) => p + 1)}
//                 className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }





"use client";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import { createPortal } from "react-dom";

// ---------------- Status Renderer ----------------
const StatusRenderer = (params: any) => (
  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
    {params.value?.toUpperCase()}
  </Badge>
);

// ---------------- Status Filter Header ----------------
const StatusHeaderComponent = (props: any) => {
  const { selectedStatuses, setSelectedStatuses } = props;
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
      });
    }
    setFilterVisible((v) => !v);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev: string[]) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

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
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <div className="relative flex items-center w-full" ref={filterButtonRef}>
      <span className="mr-12">Status</span>
      <svg
        onClick={toggleFilter}
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
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
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[99999] bg-white border rounded shadow-lg p-3 flex flex-col space-y-2 w-48 pointer-events-auto"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              position: "fixed",
            }}
          >
            {[
              { value: "active", label: "Active" },
              { value: "break", label: "Break" },
              { value: "inactive", label: "Inactive" },
              { value: "discontinued", label: "Discontinued" },
            ].map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(value)}
                  onChange={() => handleStatusChange(value)}
                  className="mr-3"
                />
                {label}
              </label>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

// ---------------- Main Page ----------------
export default function CandidatesPrepPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- Add Candidate Form State ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCandidate, setNewCandidate] = useState<any>({
    candidate_id: "",
    batch: "",
    start_date: "",
    status: "active",
    instructor1_id: "",
    instructor2_id: "",
    instructor3_id: "",
    rating: "",
    tech_rating: "",
    communication: "",
    years_of_experience: "",
    topics_finished: "",
    current_topics: "",
    target_date_of_marketing: "",
    notes: "",
  });

  // ---------------- Fetch Data ----------------
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=1&limit=100`
        );
        const data = res.data;
        if (!Array.isArray(data)) throw new Error("Invalid data format");
        setAllCandidates(data);
      } catch {
        setError("Failed to load candidate preparations.");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  // ---------------- Filtering ----------------
  useEffect(() => {
    let filtered = allCandidates;
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((c) =>
        selectedStatuses.includes(c.status?.toLowerCase())
      );
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) =>
        c.candidate?.full_name?.toLowerCase().includes(term)
      );
    }
    setFilteredCandidates(filtered);
    setCurrentPage(1);
  }, [allCandidates, searchTerm, selectedStatuses]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ---------------- Column Defs ----------------
  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
      { field: "batch", headerName: "Batch", sortable: true, maxWidth: 150 },
      { field: "start_date", headerName: "Start Date", sortable: true, maxWidth: 130 },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        maxWidth: 150,
        headerComponent: StatusHeaderComponent,
        headerComponentParams: { selectedStatuses, setSelectedStatuses },
      },
      { headerName: "Instructor 1", minWidth: 150, valueGetter: (params) => params.data.instructor1?.name || "N/A" },
      { headerName: "Instructor 2", minWidth: 150, valueGetter: (params) => params.data.instructor2?.name || "N/A" },
      { headerName: "Instructor 3", minWidth: 150, valueGetter: (params) => params.data.instructor3?.name || "N/A" },
      { field: "rating", headerName: "Rating", minWidth: 100 },
      { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
      { field: "communication", headerName: "Communication", minWidth: 120 },
      { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
      { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
      { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
      { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
      { field: "notes", headerName: "Notes", minWidth: 90 },
    ];
  }, [selectedStatuses]);

  // ---------------- CRUD Handlers ----------------
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = {
        batch: updatedRow.batch,
        start_date: updatedRow.start_date,
        status: updatedRow.status,
        instructor1_id: updatedRow.instructor1_id,
        instructor2_id: updatedRow.instructor2_id,
        instructor3_id: updatedRow.instructor3_id,
        rating: updatedRow.rating,
        tech_rating: updatedRow.tech_rating,
        communication: updatedRow.communication,
        years_of_experience: updatedRow.years_of_experience,
        topics_finished: updatedRow.topics_finished,
        current_topics: updatedRow.current_topics,
        target_date_of_marketing: updatedRow.target_date_of_marketing,
        notes: updatedRow.notes,
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${updatedRow.id}`,
        payload
      );

      setFilteredCandidates((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? { ...row, ...payload } : row))
      );
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${id}`
      );
      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // ---------------- Add Candidate ----------------
  const handleAddCandidate = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation`,
        newCandidate
      );
      setAllCandidates((prev) => [...prev, res.data]);
      setShowAddForm(false);
      setNewCandidate({
        candidate_id: "",
        batch: "",
        start_date: "",
        status: "active",
        instructor1_id: "",
        instructor2_id: "",
        instructor3_id: "",
        rating: "",
        tech_rating: "",
        communication: "",
        years_of_experience: "",
        topics_finished: "",
        current_topics: "",
        target_date_of_marketing: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to add candidate preparation:", err);
    }
  };

  // ---------------- Render ----------------
  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidate Preparations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tracking candidate preparation status
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add 
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Candidates
        </Label>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-2"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          <div className="flex justify-center w-full">
            <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
              <AGGridTable
                rowData={paginatedCandidates}
                columnDefs={columnDefs}
                title={`Candidate Preparations (${filteredCandidates.length})`}
                height="calc(60vh)"
                showSearch={false}
                onRowUpdated={handleRowUpdated}
                onRowDeleted={handleRowDeleted}
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-2 py-3 bg-white dark:bg-gray-800 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Rows per page:
              </span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Candidate Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Candidate Preparation</h2>
            <div className="space-y-3">
              {Object.keys(newCandidate).map((field) => (
                <Input
                  key={field}
                  placeholder={field.replace(/_/g, " ").toUpperCase()}
                  value={newCandidate[field]}
                  onChange={(e) =>
                    setNewCandidate({ ...newCandidate, [field]: e.target.value })
                  }
                />
              ))}
              <select
                value={newCandidate.status}
                onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="active">Active</option>
                <option value="break">Break</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCandidate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
