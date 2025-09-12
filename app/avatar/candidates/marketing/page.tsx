

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

// // export default function CandidatesMarketingPage() {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
// //   const [allCandidates, setAllCandidates] = useState<any[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");
// //   const [page] = useState(1);
// //   const [limit] = useState(100);

// //   // Fetch marketing candidates
// //   useEffect(() => {
// //     const fetchCandidates = async () => {
// //       try {
// //         setLoading(true);
// //         const res = await fetch(
// //           `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=${page}&limit=${limit}`
// //         );
// //         const dataJson = await res.json();
// //         const data = Array.isArray(dataJson.data) ? dataJson.data : [];
// //         setAllCandidates(data);
// //         setFilteredCandidates(data);
// //       } catch {
// //         setError("Failed to load candidates.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchCandidates();
// //   }, [page, limit]);

// //   // Filter candidates based on search
// //   const filterCandidates = useCallback(
// //     (term: string) => {
// //       if (!term.trim()) return allCandidates;
// //       const searchLower = term.toLowerCase();
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

// //   // Status renderer
// //   const StatusRenderer = (params: any) => (
// //     <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
// //       {params.value?.toUpperCase()}
// //     </Badge>
// //   );

// //   // Column definitions aligned with backend model
// //   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
// //     return [
// //       {
// //         field: "candidate.full_name",
        
// //         headerName: "Full Name",
// //         sortable: true,
// //         minWidth: 150,
// //         // valueGetter: (params) => params.data.candidate?.name || "N/A",
// //       },
// //       // {
// //       //   field: "marketing_manager",
// //       //   headerName: "Marketing Manager",
// //       //   sortable: true,
// //       //   minWidth: 150,
// //       // },
// //       {
// //         field: "start_date",
// //         headerName: "Start Date",
// //         sortable: true,
// //         maxWidth: 120,
// //       },
// //       {
// //         field: "status",
// //         headerName: "Status",
// //         cellRenderer: StatusRenderer,
// //         maxWidth: 110,
// //       },
// //       // Show instructor names (from backend relationship)
// //       {
// //         field: "instructor1.name",
// //         headerName: "Instructor 1",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor1?.name || "N/A",
// //       },
// //       {
// //         field: "instructor2.name",
// //         headerName: "Instructor 2",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor2?.name || "N/A",
// //       },
// //       {
// //         field: "instructor3.name",
// //         headerName: "Instructor 3",
// //         minWidth: 150,
// //         valueGetter: (params) => params.data.instructor3?.name || "N/A",
// //       },
// //       { field: "email", headerName: "Email", minWidth: 150 },
// //       { field: "password", headerName: "Password", maxWidth: 130 },
// //       {
// //         field: "google_voice_number",
// //         headerName: "Google Voice Number",
// //         minWidth: 150,
// //       },
// //       { field: "rating", headerName: "Rating", maxWidth: 100 },
// //       { field: "priority", headerName: "Priority", maxWidth: 100 },
// //       { field: "notes", headerName: "Notes", minWidth: 100 },
// //     ];
// //   }, []);

// //   // Update candidate row
// //   const handleRowUpdated = async (updatedRow: any) => {
// //     try {
// //       await axios.put(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${updatedRow.candidate_id}`,
// //         updatedRow
// //       );
// //       setFilteredCandidates((prev) =>
// //         prev.map((row) =>
// //           row.candidate_id === updatedRow.candidate_id ? updatedRow : row
// //         )
// //       );
// //     } catch {}
// //   };

// //   // Delete candidate row
// //   const handleRowDeleted = async (id: number | string) => {
// //     try {
// //       await axios.delete(
// //         `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${id}`
// //       );
// //       setFilteredCandidates((prev) =>
// //         prev.filter((row) => row.candidate_id !== id)
// //       );
// //     } catch {}
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
// //             Marketing Phase Candidates
// //           </h1>
// //           <p className="text-gray-600 dark:text-gray-400">
// //             Candidates currently in marketing phase
// //           </p>
// //         </div>
// //       </div>

// //       <div className="max-w-md">
// //         <Label
// //           htmlFor="search"
// //           className="text-sm font-medium text-gray-700 dark:text-gray-300"
// //         >
// //           Search Candidates
// //         </Label>
// //         <div className="relative mt-1">
// //           <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
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
// //         <p className="text-center text-sm text-gray-500 dark:text-gray-400">
// //           Loading...
// //         </p>
// //       ) : error ? (
// //         <p className="text-center text-red-500">{error}</p>
// //       ) : (
// //         <div className="flex w-full justify-center">
// //           <div className="w-full max-w-7xl">
// //             <AGGridTable
// //               rowData={filteredCandidates}
// //               columnDefs={columnDefs}
// //               title={`Marketing Phase (${filteredCandidates.length})`}
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


// // whiteboxLearning-wbl\app\avatar\candidates\marketing\page.tsx

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
// import axios from "axios";

// export default function CandidatesMarketingPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=${page}&limit=${limit}`
//         );
//         const dataJson = await res.json();
//         const data = Array.isArray(dataJson.data) ? dataJson.data : [];
//         setAllCandidates(data);
//         setFilteredCandidates(data);
//       } catch {
//         setError("Failed to load candidates.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCandidates();
//   }, [page, limit]);

 
//   const filterCandidates = useCallback(
//     (term: string) => {
//       if (!term.trim()) return allCandidates;
//       const searchLower = term.toLowerCase();
//       return allCandidates.filter((candidate) =>
//         Object.values(candidate).some((val) =>
//           val?.toString().toLowerCase().includes(searchLower)
//         )
//       );
//     },
//     [allCandidates]
//   );

//   useEffect(() => {
//     setFilteredCandidates(filterCandidates(searchTerm));
//   }, [searchTerm, filterCandidates]);

//   const StatusRenderer = (params: any) => (
//     <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//       {params.value?.toUpperCase()}
//     </Badge>
//   );

//   // Resume renderer (view + upload)
//   const ResumeRenderer = (params: any) => (
//     <div className="flex items-center space-x-2">
//       {params.value ? (
//         <a
//           href={params.value}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-blue-600 hover:underline"
//         >
//           View
//         </a>
//       ) : (
//         <span className="text-gray-400">N/A</span>
//       )}
//       {/* <button
//         onClick={() =>
//           document.getElementById(`fileInput-${params.data.candidate_id}`)?.click()
//         }
//         className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
//       >
//         Upload
//       </button> */}
//       <input
//         type="file"
//         id={`fileInput-${params.data.candidate_id}`}
//         className="hidden"
//         onChange={async (e) => {
//           const file = e.target.files?.[0];
//           if (!file) return;

//           const formData = new FormData();
//           formData.append("resume", file);

//           try {
//             const res = await axios.post(
//               `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${params.data.candidate_id}/resume`,
//               formData,
//               { headers: { "Content-Type": "multipart/form-data" } }
//             );

//             const updatedResume = res.data.candidate_resume;

//             setFilteredCandidates((prev) =>
//               prev.map((row) =>
//                 row.candidate_id === params.data.candidate_id
//                   ? { ...row, candidate_resume: updatedResume }
//                   : row
//               )
//             );
//           } catch (err) {
//             console.error("Resume upload failed", err);
//           }
//         }}
//       />
//     </div>
//   );

//   // Resume renderer (view + upload)
//   const ResumeRenderer = (params: any) => (
//     <div className="flex items-center space-x-2">
//       {params.value ? (
//         <a
//           href={params.value}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-blue-600 hover:underline"
//         >
//           View
//         </a>
//       ) : (
//         <span className="text-gray-400">N/A</span>
//       )}
//       {/* <button
//         onClick={() =>
//           document.getElementById(`fileInput-${params.data.candidate_id}`)?.click()
//         }
//         className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
//       >
//         Upload
//       </button> */}
//       <input
//         type="file"
//         id={`fileInput-${params.data.candidate_id}`}
//         className="hidden"
//         onChange={async (e) => {
//           const file = e.target.files?.[0];
//           if (!file) return;

//           const formData = new FormData();
//           formData.append("resume", file);

//           try {
//             const res = await axios.post(
//               `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${params.data.candidate_id}/resume`,
//               formData,
//               { headers: { "Content-Type": "multipart/form-data" } }
//             );

//             const updatedResume = res.data.candidate_resume;

//             setFilteredCandidates((prev) =>
//               prev.map((row) =>
//                 row.candidate_id === params.data.candidate_id
//                   ? { ...row, candidate_resume: updatedResume }
//                   : row
//               )
//             );
//           } catch (err) {
//             console.error("Resume upload failed", err);
//           }
//         }}
//       />
//     </div>
//   );

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       {
//         field: "candidate.full_name",
//         headerName: "Full Name",
//         sortable: true,
//         minWidth: 150,
//       },
//       {
//         field: "start_date",
//         headerName: "Start Date",
//         sortable: true,
//         maxWidth: 120,
//       },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 110,
//       },
//       {
//         field: "instructor1.name",
//         headerName: "Instructor 1",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor1?.name || "N/A",
//       },
//       {
//         field: "instructor2.name",
//         headerName: "Instructor 2",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor2?.name || "N/A",
//       },
//       {
//         field: "instructor3.name",
//         headerName: "Instructor 3",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor3?.name || "N/A",
//       },
//       { field: "email", headerName: "Email", minWidth: 150 },
//       { field: "password", headerName: "Password", maxWidth: 130 },
//       {
//         field: "google_voice_number",
//         headerName: "Google Voice Number",
//         minWidth: 150,
//       },
//       { field: "rating", headerName: "Rating", maxWidth: 100 },
//       { field: "priority", headerName: "Priority", maxWidth: 100 },
//       { field: "notes", headerName: "Notes", minWidth: 100 },

//       // 🔹 New Resume column
//       {
//         field: "candidate_resume",
//         headerName: "Resume",
//         minWidth: 200,
//         cellRenderer: ResumeRenderer,
//       },
//     ];
//   }, []);

//   // Update candidate row
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${updatedRow.candidate_id}`,
//         updatedRow
//       );
//       setFilteredCandidates((prev) =>
//         prev.map((row) =>
//           row.candidate_id === updatedRow.candidate_id ? updatedRow : row
//         )
//       );
//     } catch {}
//   };

//   // Delete candidate row
//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${id}`
//       );
//       setFilteredCandidates((prev) =>
//         prev.filter((row) => row.candidate_id !== id)
//       );
//     } catch {}
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Marketing Phase Candidates
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Candidates currently in marketing phase
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
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         {searchTerm && (
//           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {filteredCandidates.length} candidate(s) found
//           </p>
//         )}
//       </div>

//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">
//           Loading...
//         </p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <div className="flex w-full justify-center">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Marketing Phase (${filteredCandidates.length})`}
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
// import { useMemo, useState, useEffect, useCallback } from "react";
// import axios from "axios";

// export default function CandidatesMarketingPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   // Fetch marketing candidates
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=${page}&limit=${limit}`
//         );
//         const dataJson = await res.json();
//         const data = Array.isArray(dataJson.data) ? dataJson.data : [];
//         setAllCandidates(data);
//         setFilteredCandidates(data);
//       } catch {
//         setError("Failed to load candidates.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCandidates();
//   }, [page, limit]);

//   // Filter candidates based on search
//   const filterCandidates = useCallback(
//     (term: string) => {
//       if (!term.trim()) return allCandidates;
//       const searchLower = term.toLowerCase();
//       return allCandidates.filter((candidate) =>
//         Object.values(candidate).some((val) =>
//           val?.toString().toLowerCase().includes(searchLower)
//         )
//       );
//     },
//     [allCandidates]
//   );

//   useEffect(() => {
//     setFilteredCandidates(filterCandidates(searchTerm));
//   }, [searchTerm, filterCandidates]);

//   // Status renderer
//   const StatusRenderer = (params: any) => (
//     <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//       {params.value?.toUpperCase()}
//     </Badge>
//   );

//   // Resume renderer (view + upload)
//   const ResumeRenderer = (params: any) => (
//     <div className="flex items-center space-x-2">
//       {params.value ? (
//         <a
//           href={params.value}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-blue-600 hover:underline"
//         >
//           View
//         </a>
//       ) : (
//         <span className="text-gray-400">N/A</span>
//       )}
//       {/* <button
//         onClick={() =>
//           document.getElementById(`fileInput-${params.data.candidate_id}`)?.click()
//         }
//         className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
//       >
//         Upload
//       </button> */}
//       <input
//         type="file"
//         id={`fileInput-${params.data.candidate_id}`}
//         className="hidden"
//         onChange={async (e) => {
//           const file = e.target.files?.[0];
//           if (!file) return;

//           const formData = new FormData();
//           formData.append("resume", file);

//           try {
//             const res = await axios.post(
//               `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${params.data.candidate_id}/resume`,
//               formData,
//               { headers: { "Content-Type": "multipart/form-data" } }
//             );

//             const updatedResume = res.data.candidate_resume;

//             setFilteredCandidates((prev) =>
//               prev.map((row) =>
//                 row.candidate_id === params.data.candidate_id
//                   ? { ...row, candidate_resume: updatedResume }
//                   : row
//               )
//             );
//           } catch (err) {
//             console.error("Resume upload failed", err);
//           }
//         }}
//       />
//     </div>
//   );

//   // Column definitions aligned with backend model
//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       {
//         field: "candidate.full_name",
//         headerName: "Full Name",
//         sortable: true,
//         minWidth: 150,
//       },
//       {
//         field: "start_date",
//         headerName: "Start Date",
//         sortable: true,
//         maxWidth: 120,
//       },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         maxWidth: 110,
//       },
//       {
//         field: "instructor1.name",
//         headerName: "Instructor 1",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor1?.name || "N/A",
//       },
//       {
//         field: "instructor2.name",
//         headerName: "Instructor 2",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor2?.name || "N/A",
//       },
//       {
//         field: "instructor3.name",
//         headerName: "Instructor 3",
//         minWidth: 150,
//         valueGetter: (params) => params.data.instructor3?.name || "N/A",
//       },
//       { field: "email", headerName: "Email", minWidth: 150 },
//       { field: "password", headerName: "Password", maxWidth: 130 },
//       {
//         field: "google_voice_number",
//         headerName: "Google Voice Number",
//         minWidth: 150,
//       },
//       { field: "rating", headerName: "Rating", maxWidth: 100 },
//       { field: "priority", headerName: "Priority", maxWidth: 100 },
//       { field: "notes", headerName: "Notes", minWidth: 100 },

//       // 🔹 New Resume column
//       {
//         field: "candidate_resume",
//         headerName: "Resume",
//         minWidth: 200,
//         cellRenderer: ResumeRenderer,
//       },
//     ];
//   }, []);

//   // Update candidate row
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${updatedRow.candidate_id}`,
//         updatedRow
//       );
//       setFilteredCandidates((prev) =>
//         prev.map((row) =>
//           row.candidate_id === updatedRow.candidate_id ? updatedRow : row
//         )
//       );
//     } catch {}
//   };

//   // Delete candidate row
//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${id}`
//       );
//       setFilteredCandidates((prev) =>
//         prev.filter((row) => row.candidate_id !== id)
//       );
//     } catch {}
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Marketing Phase Candidates
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Candidates currently in marketing phase
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
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         {searchTerm && (
//           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {filteredCandidates.length} candidate(s) found
//           </p>
//         )}
//       </div>

//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400">
//           Loading...
//         </p>
//       ) : error ? (
//         <p className="text-center text-red-500">{error}</p>
//       ) : (
//         <div className="flex w-full justify-center">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Marketing Phase (${filteredCandidates.length})`}
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


"use client";

import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function CandidatesMarketingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(100);

  // Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=${page}&limit=${limit}`
        );
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setAllCandidates(data);
        setFilteredCandidates(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load candidates.");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [page, limit]);

  // Filter candidates
  const filterCandidates = useCallback(
    (term: string) => {
      if (!term.trim()) return allCandidates;
      const searchLower = term.toLowerCase();
      return allCandidates.filter((candidate) =>
        Object.values(candidate).some((val) =>
          val?.toString().toLowerCase().includes(searchLower)
        )
      );
    },
    [allCandidates]
  );

  useEffect(() => {
    setFilteredCandidates(filterCandidates(searchTerm));
  }, [searchTerm, filterCandidates]);

  // Status badge
  const StatusRenderer = (params: any) => (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
      {params.value?.toUpperCase()}
    </Badge>
  );

  // Resume renderer
  const ResumeRenderer = (params: any) => (
    <div className="flex items-center space-x-2">
      {params.value ? (
        <a
          href={params.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View
        </a>
      ) : (
        <span className="text-gray-400">N/A</span>
      )}
      <input
        type="file"
        id={`fileInput-${params.data.candidate_id}`}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const formData = new FormData();
          formData.append("resume", file);

          try {
            const res = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${params.data.candidate_id}/resume`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );

            const updatedResume = res.data.candidate_resume;

            setFilteredCandidates(prev =>
              prev.map(row =>
                row.candidate_id === params.data.candidate_id
                  ? { ...row, candidate_resume: updatedResume }
                  : row
              )
            );
          } catch (err) {
            console.error("Resume upload failed", err);
          }
        }}
      />
    </div>
  );

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    { field: "candidate_id", hide: true }, //  hidden column ensures candidate_id exists
    { field: "candidate.full_name", headerName: "Full Name", sortable: true, minWidth: 150, editable: true },
    { field: "start_date", headerName: "Start Date", sortable: true, maxWidth: 120, editable: true },
    { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 110, editable: true },
    { field: "instructor1.name", headerName: "Instructor 1", minWidth: 150, valueGetter: (params) => params.data.instructor1?.name || "N/A", editable: true },
    { field: "instructor2.name", headerName: "Instructor 2", minWidth: 150, valueGetter: (params) => params.data.instructor2?.name || "N/A", editable: true },
    { field: "instructor3.name", headerName: "Instructor 3", minWidth: 150, valueGetter: (params) => params.data.instructor3?.name || "N/A", editable: true },
    { field: "email", headerName: "Email", minWidth: 150, editable: true },
    { field: "password", headerName: "Password", maxWidth: 130, editable: true },
    { field: "google_voice_number", headerName: "Google Voice Number", minWidth: 150, editable: true },
    { field: "rating", headerName: "Rating", maxWidth: 100, editable: true },
    { field: "priority", headerName: "Priority", maxWidth: 100, editable: true },
    { field: "notes", headerName: "Notes", minWidth: 100, editable: true },
    { field: "candidate_resume", headerName: "Resume", minWidth: 200, cellRenderer: ResumeRenderer },
  ], []);

  // Handle row updates
  const handleRowUpdated = async (updatedRow: any) => {
    if (!updatedRow || !updatedRow.candidate_id) {
      console.error("Updated row missing candidate_id", updatedRow);
      return;
    }

    setFilteredCandidates(prev =>
      prev.map(row =>
        row.candidate_id === updatedRow.candidate_id ? { ...row, ...updatedRow } : row
      )
    );

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${updatedRow.candidate_id}`,
        updatedRow
      );
    } catch (err) {
      console.error("Failed to update candidate:", err);
    }
  };

  // Handle row deletion
  const handleRowDeleted = async (candidate_id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${candidate_id}`);
      setFilteredCandidates(prev => prev.filter(row => row.candidate_id !== candidate_id));
    } catch (err) {
      console.error("Failed to delete candidate:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Marketing Phase Candidates</h1>
          <p className="text-gray-600 dark:text-gray-400">Candidates currently in marketing phase</p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Candidates</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input id="search" type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        {searchTerm && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{filteredCandidates.length} candidate(s) found</p>}
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex w-full justify-center">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Marketing Phase (${filteredCandidates.length})`}
              height="calc(70vh)"
              showSearch={false}
              onRowUpdated={params => handleRowUpdated(params.data)}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
