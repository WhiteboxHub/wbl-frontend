
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

// // ---------------- Status Renderer ----------------
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // ---------------- Status Filter Header ----------------
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

// // ---------------- Main Page ----------------
// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   // --- Add Candidate Form State ---
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newCandidate, setNewCandidate] = useState<any>({
//     candidate_id: "",
//     batch: "",
//     start_date: "",
//     status: "",
//     instructor1_id: "",
//     instructor2_id: "",
//     instructor3_id: "",
//     rating: "",
//     tech_rating: "",
//     communication: "",
//     years_of_experience: "",
//     topics_finished: "",
//     current_topics: "",
//     target_date_of_marketing: "",
//     notes: "",
//   });

//   // ---------------- Fetch Data ----------------
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

//   // ---------------- Filtering ----------------
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

//   // ---------------- Column Defs ----------------
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

//   // ---------------- CRUD Handlers ----------------
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
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

//   // ---------------- Add Candidate ----------------
//   const handleAddCandidate = async () => {
//     try {
//       const res = await axios.post(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation`,
//         newCandidate
//       );
//       setAllCandidates((prev) => [...prev, res.data]);
//       setShowAddForm(false);
//       setNewCandidate({
//         candidate_id: "",
//         batch: "",
//         start_date: "",
//         status: "",
//         instructor1_id: "",
//         instructor2_id: "",
//         instructor3_id: "",
//         rating: "",
//         tech_rating: "",
//         communication: "",
//         years_of_experience: "",
//         topics_finished: "",
//         current_topics: "",
//         target_date_of_marketing: "",
//         notes: "",
//       });
//     } catch (err) {
//       console.error("Failed to add candidate preparation:", err);
//     }
//   };

//   // ---------------- Render ----------------
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
//         <button
//           onClick={() => setShowAddForm(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           + Add Preparation
//         </button>
//       </div>

//       {/* Search */}
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

//       {/* Data Table */}
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

//       {/* Add Candidate Modal */}
//       {showAddForm && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Add Candidate Preparation</h2>
//             <div className="space-y-3">
//               {Object.keys(newCandidate).map((field) => {
//                 // Calendar inputs for date fields
//                 if (field === "start_date" || field === "target_date_of_marketing") {
//                   return (
//                     <Input
//                       key={field}
//                       type="date"
//                       placeholder={field.replace(/_/g, " ").toUpperCase()}
//                       value={newCandidate[field]}
//                       onChange={(e) =>
//                         setNewCandidate({ ...newCandidate, [field]: e.target.value })
//                       }
//                     />
//                   );
//                 }
//                 if (field === "status") return null;
//                 return (
//                   <Input
//                     key={field}
//                     placeholder={field.replace(/_/g, " ").toUpperCase()}
//                     value={newCandidate[field]}
//                     onChange={(e) =>
//                       setNewCandidate({ ...newCandidate, [field]: e.target.value })
//                     }
//                   />
//                 );
//               })}
//               {/* Status dropdown */}
//               <select
//                 value={newCandidate.status}
//                 onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="Status">Status</option>
//                 <option value="active">Active</option>
//                 <option value="break">Break</option>
//                 <option value="inactive">Inactive</option>
//                 <option value="discontinued">Discontinued</option>
//               </select>
//             </div>
//             <div className="flex justify-end mt-6 space-x-3">
//               <button
//                 onClick={() => setShowAddForm(false)}
//                 className="px-4 py-2 bg-gray-300 rounded"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddCandidate}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Save
//               </button>
//             </div>
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

// // ---------------- Status Renderer ----------------
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // ---------------- Status Filter Header ----------------
// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({ top: rect.bottom, left: rect.left });
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
//             style={{ top: dropdownPos.top, left: dropdownPos.left, position: "fixed" }}
//           >
//             {[{ value: "active", label: "Active" }, { value: "break", label: "Break" }, { value: "inactive", label: "Inactive" }, { value: "discontinued", label: "Discontinued" }].map(
//               ({ value, label }) => (
//                 <label key={value} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded">
//                   <input
//                     type="checkbox"
//                     checked={selectedStatuses.includes(value)}
//                     onChange={() => handleStatusChange(value)}
//                     className="mr-3"
//                   />
//                   {label}
//                 </label>
//               )
//             )}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// // ---------------- Main Page ----------------
// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // --- Add Candidate Form State ---
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newCandidate, setNewCandidate] = useState<any>({
//     candidate_Name: "",
//     batch: "",
//     start_date: "",
//     status: "",
//     instructor1_Name: "",
//     instructor2_Name: "",
//     instructor3_Name: "",
//     rating: "",
//     tech_rating: "",
//     communication: "",
//     years_of_experience: "",
//     topics_finished: "",
//     current_topics: "",
//     target_date_of_marketing: "",
//     notes: "",
//   });

//   // ---------------- Fetch Data ----------------
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations`);
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

//   // ---------------- Filtering ----------------
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
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   // ---------------- Column Defs ----------------
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

//   // ---------------- CRUD Handlers ----------------
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       const payload = { ...updatedRow };
//       await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${updatedRow.id}`, payload);
//       setFilteredCandidates((prev) => prev.map((row) => (row.id === updatedRow.id ? { ...row, ...payload } : row)));
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   // ---------------- Add Candidate ----------------
//   const handleAddCandidate = async () => {
//     try {
//       const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation`, newCandidate);
//       setAllCandidates((prev) => [...prev, res.data]);
//       setShowAddForm(false);
//       setNewCandidate({
//         candidate_id: "",
//         batch: "",
//         start_date: "",
//         status: "",
//         instructor1_id: "",
//         instructor2_id: "",
//         instructor3_id: "",
//         rating: "",
//         tech_rating: "",
//         communication: "",
//         years_of_experience: "",
//         topics_finished: "",
//         current_topics: "",
//         target_date_of_marketing: "",
//         notes: "",
//       });
//     } catch (err) {
//       console.error("Failed to add candidate preparation:", err);
//     }
//   };

//   // ---------------- Render ----------------
//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Candidate Preparations</h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking candidate preparation status</p>
//         </div>
//         <button
//           onClick={() => setShowAddForm(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           + Add Preparation
//         </button>
//       </div>

//       {/* Search */}
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

//       {/* Data Table */}
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
//               height="calc(80vh)"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}

//       {/* Add Candidate Modal */}
//       {showAddForm && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Add Candidate Preparation</h2>
//             <div className="space-y-3">
//               {Object.keys(newCandidate).map((field) => {
//                 if (field === "start_date" || field === "target_date_of_marketing") {
//                   return (
//                     <Input
//                       key={field}
//                       type="date"
//                       placeholder={field.replace(/_/g, " ").toUpperCase()}
//                       value={newCandidate[field]}
//                       onChange={(e) => setNewCandidate({ ...newCandidate, [field]: e.target.value })}
//                     />
//                   );
//                 }
//                 if (field === "status") return null;
//                 return (
//                   <Input
//                     key={field}
//                     placeholder={field.replace(/_/g, " ").toUpperCase()}
//                     value={newCandidate[field]}
//                     onChange={(e) => setNewCandidate({ ...newCandidate, [field]: e.target.value })}
//                   />
//                 );
//               })}
//               <select
//                 value={newCandidate.status}
//                 onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="Status">Status</option>
//                 <option value="active">Active</option>
//                 <option value="break">Break</option>
//                 <option value="inactive">Inactive</option>
//                 <option value="discontinued">Discontinued</option>
//               </select>
//             </div>
//             <div className="flex justify-end mt-6 space-x-3">
//               <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-300 rounded">
//                 Cancel
//               </button>
//               <button onClick={handleAddCandidate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// ////////// above code is removed pagination and it is owrking fine /////////////////////////






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

// // ---------------- Status Renderer ----------------
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // ---------------- Status Filter Header ----------------
// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({ top: rect.bottom, left: rect.left });
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
//             style={{ top: dropdownPos.top, left: dropdownPos.left, position: "fixed" }}
//           >
//             {[{ value: "active", label: "Active" }, { value: "break", label: "Break" }, { value: "inactive", label: "Inactive" }, { value: "discontinued", label: "Discontinued" }].map(
//               ({ value, label }) => (
//                 <label key={value} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded">
//                   <input
//                     type="checkbox"
//                     checked={selectedStatuses.includes(value)}
//                     onChange={() => handleStatusChange(value)}
//                     className="mr-3"
//                   />
//                   {label}
//                 </label>
//               )
//             )}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// // ---------------- Main Page ----------------
// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // --- Add Candidate Form State ---
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newCandidate, setNewCandidate] = useState<any>({
//     candidate_Name: "",
//     batch: "",
//     start_date: "",
//     status: "",
//     instructor1_Name: "",
//     instructor2_Name: "",
//     instructor3_Name: "",
//     rating: "",
//     tech_rating: "",
//     communication: "",
//     years_of_experience: "",
//     topics_finished: "",
//     current_topics: "",
//     target_date_of_marketing: "",
//     notes: "",
//   });

//   // ---------------- Fetch Data ----------------
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations`);
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

//   // ---------------- Filtering ----------------
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
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   // ---------------- Column Defs ----------------
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

//   // ---------------- CRUD Handlers ----------------
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       const payload = { ...updatedRow };
//       await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${updatedRow.id}`, payload);
//       setFilteredCandidates((prev) => prev.map((row) => (row.id === updatedRow.id ? { ...row, ...payload } : row)));
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   // ---------------- Add Candidate ----------------
//   const handleAddCandidate = async () => {
//     try {
//       const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation`, newCandidate);
//       setAllCandidates((prev) => [...prev, res.data]);
//       setShowAddForm(false);
//       setNewCandidate({
//         candidate_id: "",
//         batch: "",
//         start_date: "",
//         status: "",
//         instructor1_id: "",
//         instructor2_id: "",
//         instructor3_id: "",
//         rating: "",
//         tech_rating: "",
//         communication: "",
//         years_of_experience: "",
//         topics_finished: "",
//         current_topics: "",
//         target_date_of_marketing: "",
//         notes: "",
//       });
//     } catch (err) {
//       console.error("Failed to add candidate preparation:", err);
//     }
//   };

//   // ---------------- Render ----------------
//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Candidate Preparations</h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking candidate preparation status</p>
//         </div>
//         <button
//           onClick={() => setShowAddForm(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           + Add Preparation
//         </button>
//       </div>

//       {/* Search */}
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

//       {/* Data Table */}
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
//               height="calc(80vh)"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}

//       {/* Add Candidate Modal */}
//       {showAddForm && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Add Candidate Preparation</h2>
//             <div className="space-y-3">
//               {Object.keys(newCandidate).map((field) => {
//                 if (field === "status") return null;

//                 const label = field
//                   .replace(/_/g, " ")
//                   .replace(/\b\w/g, (l) => l.toUpperCase());

//                 if (field === "start_date" || field === "target_date_of_marketing") {
//                   return (
//                     <div key={field} className="space-y-1">
//                       <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                         {label}
//                       </Label>
//                       <Input
//                         type="date"
//                         placeholder={label}
//                         value={newCandidate[field]}
//                         onChange={(e) => setNewCandidate({ ...newCandidate, [field]: e.target.value })}
//                         className="w-full p-2 border rounded"
//                       />
//                     </div>
//                   );
//                 }

//                 return (
//                   <div key={field} className="space-y-1">
//                     <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                       {label}
//                     </Label>
//                     <Input
//                       placeholder={label}
//                       value={newCandidate[field]}
//                       onChange={(e) => setNewCandidate({ ...newCandidate, [field]: e.target.value })}
//                       className="w-full p-2 border rounded"
//                     />
//                   </div>
//                 );
//               })}

//               {/* Status Dropdown */}
//               <div className="space-y-1">
//                 <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                   Status
//                 </Label>
//                 <select
//                   value={newCandidate.status}
//                   onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
//                   className="w-full p-2 border rounded"
//                 >
//                   <option value="">Select Status</option>
//                   <option value="active">Active</option>
//                   <option value="break">Break</option>
//                   <option value="inactive">Inactive</option>
//                   <option value="discontinued">Discontinued</option>
//                 </select>
//               </div>
//             </div>

//             <div className="flex justify-end mt-6 space-x-3">
//               <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-300 rounded">
//                 Cancel
//               </button>
//               <button onClick={handleAddCandidate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
//                 Save
//               </button>
//             </div>
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

// // ---------------- Status Renderer ----------------
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// // ---------------- Status Filter Header ----------------
// const StatusHeaderComponent = (props: any) => {
//   const { selectedStatuses, setSelectedStatuses } = props;
//   const filterButtonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
//   const [filterVisible, setFilterVisible] = useState(false);

//   const toggleFilter = () => {
//     if (filterButtonRef.current) {
//       const rect = filterButtonRef.current.getBoundingClientRect();
//       setDropdownPos({ top: rect.bottom, left: rect.left });
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
//             style={{ top: dropdownPos.top, left: dropdownPos.left, position: "fixed" }}
//           >
//             {[{ value: "active", label: "Active" }, { value: "break", label: "Break" }, { value: "inactive", label: "Inactive" }, { value: "discontinued", label: "Discontinued" }].map(
//               ({ value, label }) => (
//                 <label key={value} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded">
//                   <input
//                     type="checkbox"
//                     checked={selectedStatuses.includes(value)}
//                     onChange={() => handleStatusChange(value)}
//                     className="mr-3"
//                   />
//                   {label}
//                 </label>
//               )
//             )}
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// // ---------------- Main Page ----------------
// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [instructors, setInstructors] = useState<any[]>([]); // all active instructors

//   // --- Add Candidate Form State ---
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newCandidate, setNewCandidate] = useState<any>({
//     candidate_Name: "",
//     batch: "",
//     start_date: "",
//     status: "",
//     instructor1_id: "",
//     instructor1_Name: "",
//     instructor2_id: "",
//     instructor2_Name: "",
//     instructor3_id: "",
//     instructor3_Name: "",
//     rating: "",
//     tech_rating: "",
//     communication: "",
//     years_of_experience: "",
//     topics_finished: "",
//     current_topics: "",
//     target_date_of_marketing: "",
//     notes: "",
//   });

//   // ---------------- Fetch Data ----------------
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [candidatesRes, instructorsRes] = await Promise.all([
//           axios.get(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations`),
//           axios.get(`${process.env.NEXT_PUBLIC_API_URL}/employees?status=1`) // only active instructors
//         ]);
//         setAllCandidates(candidatesRes.data || []);
//         setInstructors(instructorsRes.data || []);
//       } catch {
//         setError("Failed to load data.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // ---------------- Filtering ----------------
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
//   }, [allCandidates, searchTerm, selectedStatuses]);

//   // ---------------- Column Defs ----------------
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

//   // ---------------- CRUD Handlers ----------------
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       const payload = { ...updatedRow };
//       await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${updatedRow.id}`, payload);
//       setFilteredCandidates((prev) => prev.map((row) => (row.id === updatedRow.id ? { ...row, ...payload } : row)));
//     } catch (err) {
//       console.error("Failed to update:", err);
//     }
//   };

//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${id}`);
//       setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//     } catch (err) {
//       console.error("Failed to delete:", err);
//     }
//   };

//   // ---------------- Add Candidate ----------------
//   const handleAddCandidate = async () => {
//     try {
//       const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation`, newCandidate);
//       setAllCandidates((prev) => [...prev, res.data]);
//       setShowAddForm(false);
//       setNewCandidate({
//         candidate_Name: "",
//         batch: "",
//         start_date: "",
//         status: "",
//         instructor1_id: "",
//         instructor1_Name: "",
//         instructor2_id: "",
//         instructor2_Name: "",
//         instructor3_id: "",
//         instructor3_Name: "",
//         rating: "",
//         tech_rating: "",
//         communication: "",
//         years_of_experience: "",
//         topics_finished: "",
//         current_topics: "",
//         target_date_of_marketing: "",
//         notes: "",
//       });
//     } catch (err) {
//       console.error("Failed to add candidate preparation:", err);
//     }
//   };

//   // ---------------- Render ----------------
//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Candidate Preparations</h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking candidate preparation status</p>
//         </div>
//         <button
//           onClick={() => setShowAddForm(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           + Add Preparation
//         </button>
//       </div>

//       {/* Search */}
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

//       {/* Data Table */}
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
//               height="calc(80vh)"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}

//       {/* Add Candidate Modal */}
//       {showAddForm && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Add Candidate Preparation</h2>
//             <div className="space-y-3">
//               {Object.keys(newCandidate).map((field) => {
//                 if (field === "status" || field.includes("instructor")) return null;
//                 const label = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
//                 if (field === "start_date" || field === "target_date_of_marketing") {
//                   return (
//                     <div key={field} className="space-y-1">
//                       <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
//                       <Input
//                         type="date"
//                         placeholder={label}
//                         value={newCandidate[field]}
//                         onChange={(e) => setNewCandidate({ ...newCandidate, [field]: e.target.value })}
//                         className="w-full p-2 border rounded"
//                       />
//                     </div>
//                   );
//                 }
//                 return (
//                   <div key={field} className="space-y-1">
//                     <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
//                     <Input
//                       placeholder={label}
//                       value={newCandidate[field]}
//                       onChange={(e) => setNewCandidate({ ...newCandidate, [field]: e.target.value })}
//                       className="w-full p-2 border rounded"
//                     />
//                   </div>
//                 );
//               })}

//               {/* Instructor Dropdowns */}
//               {["1", "2", "3"].map((num) => (
//                 <div key={num} className="space-y-1">
//                   <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                     Instructor {num}
//                   </Label>
//                   <select
//                     value={newCandidate[`instructor${num}_id`] || ""}
//                     onChange={(e) => {
//                       const selected = instructors.find((ins) => ins.id === Number(e.target.value));
//                       setNewCandidate({
//                         ...newCandidate,
//                         [`instructor${num}_id`]: selected?.id || "",
//                         [`instructor${num}_Name`]: selected?.name || "",
//                       });
//                     }}
//                     className="w-full p-2 border rounded"
//                   >
//                     <option value="">Select Instructor</option>
//                     {instructors.map((ins) => (
//                       <option key={ins.id} value={ins.id}>
//                         {ins.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               ))}

//               {/* Status Dropdown */}
//               <div className="space-y-1">
//                 <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
//                 <select
//                   value={newCandidate.status}
//                   onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
//                   className="w-full p-2 border rounded"
//                 >
//                   <option value="">Select Status</option>
//                   <option value="active">Active</option>
//                   <option value="break">Break</option>
//                   <option value="inactive">Inactive</option>
//                   <option value="discontinued">Discontinued</option>
//                 </select>
//               </div>
//             </div>

//             <div className="flex justify-end mt-6 space-x-3">
//               <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-300 rounded">
//                 Cancel
//               </button>
//               <button onClick={handleAddCandidate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, left: rect.left });
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
      </svg>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[99999] bg-white border rounded shadow-lg p-3 flex flex-col space-y-2 w-48 pointer-events-auto"
            style={{ top: dropdownPos.top, left: dropdownPos.left, position: "fixed" }}
          >
            {[{ value: "active", label: "Active" }, { value: "break", label: "Break" }, { value: "inactive", label: "Inactive" }, { value: "discontinued", label: "Discontinued" }].map(
              ({ value, label }) => (
                <label key={value} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(value)}
                    onChange={() => handleStatusChange(value)}
                    className="mr-3"
                  />
                  {label}
                </label>
              )
            )}
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

  const [instructors, setInstructors] = useState<any[]>([]); // all active instructors

  // --- Add Candidate Form State ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCandidate, setNewCandidate] = useState<any>({
    candidate_Name: "",
    batch: "",
    start_date: "",
    status: "",
    instructor1_id: "",
    instructor1_Name: "",
    instructor2_id: "",
    instructor2_Name: "",
    instructor3_id: "",
    instructor3_Name: "",
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
    const fetchData = async () => {
      try {
        setLoading(true);
        const [candidatesRes, instructorsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/employees?status=1`) // only active instructors
        ]);
        setAllCandidates(candidatesRes.data || []);
        setInstructors(instructorsRes.data || []);
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------------- Filtering ----------------
  useEffect(() => {
    let filtered = allCandidates;
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((c) => selectedStatuses.includes(c.status?.toLowerCase()));
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => c.candidate?.full_name?.toLowerCase().includes(term));
    }
    setFilteredCandidates(filtered);
  }, [allCandidates, searchTerm, selectedStatuses]);

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
      const payload = { ...updatedRow };
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${updatedRow.id}`, payload);
      setFilteredCandidates((prev) => prev.map((row) => (row.id === updatedRow.id ? { ...row, ...payload } : row)));
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${id}`);
      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // ---------------- Add Candidate ----------------
  const handleAddCandidate = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation`, newCandidate);
      setAllCandidates((prev) => [...prev, res.data]);
      setShowAddForm(false);
      setNewCandidate({
        candidate_Name: "",
        batch: "",
        start_date: "",
        status: "",
        instructor1_id: "",
        instructor1_Name: "",
        instructor2_id: "",
        instructor2_Name: "",
        instructor3_id: "",
        instructor3_Name: "",
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Candidate Preparations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking candidate preparation status</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Preparation
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Candidate Preparations (${filteredCandidates.length})`}
              height="calc(80vh)"
              showSearch={false}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Candidate Preparation</h2>
            <div className="space-y-3">
              {Object.keys(newCandidate).map((field) => {
                if (field === "status" || field.includes("instructor")) return null;
                const label = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                if (field === "start_date" || field === "target_date_of_marketing") {
                  return (
                    <div key={field} className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
                      <Input
                        type="date"
                        placeholder={label}
                        value={newCandidate[field]}
                        onChange={(e) => setNewCandidate({ ...newCandidate, [field]: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  );
                }
                return (
                  <div key={field} className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
                    <Input
                      placeholder={label}
                      value={newCandidate[field]}
                      onChange={(e) => setNewCandidate({ ...newCandidate, [field]: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                );
              })}

              {/* Instructor Dropdowns */}
              {["1", "2", "3"].map((num) => (
                <div key={num} className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Instructor {num}
                  </Label>
                  <select
                    value={newCandidate[`instructor${num}_id`] || ""}
                    onChange={(e) => {
                      const selected = instructors.find((ins) => ins.id === Number(e.target.value));
                      setNewCandidate({
                        ...newCandidate,
                        [`instructor${num}_id`]: selected?.id || "",
                        [`instructor${num}_Name`]: selected?.name || "",
                      });
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Instructor</option>

                    {/* Ensure current instructor shows even if not in list */}
                    {newCandidate[`instructor${num}_id`] &&
                      !instructors.some((ins) => ins.id === Number(newCandidate[`instructor${num}_id`])) && (
                        <option value={newCandidate[`instructor${num}_id`]}>
                          {newCandidate[`instructor${num}_Name`] || "Current Instructor"}
                        </option>
                    )}

                    {instructors.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Status Dropdown */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                <select
                  value={newCandidate.status}
                  onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="break">Break</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-300 rounded">
                Cancel
              </button>
              <button onClick={handleAddCandidate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
