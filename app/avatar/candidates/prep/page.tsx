
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

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `http://127.0.0.1:8000/api/candidates/active?page=${page}&limit=${limit}`
//         );
//         const data = await res.json();

//         if (!Array.isArray(data)) {
//           throw new Error("Invalid data format");
//         }

//         setAllCandidates(data);
//         setFilteredCandidates(data);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load candidates.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, [page, limit]);

//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") return allCandidates;
//       const searchLower = searchTerm.toLowerCase();
//       return allCandidates.filter((candidate) => {
//         return (
//           candidate.name?.toLowerCase().includes(searchLower) ||
//           candidate.email?.toLowerCase().includes(searchLower) ||
//           candidate.phone?.includes(searchTerm) ||
//           candidate.workstatus?.toLowerCase().includes(searchLower) ||
//           candidate.education?.toLowerCase().includes(searchLower) ||
//           candidate.status?.toLowerCase().includes(searchLower) ||
//           candidate.address?.toLowerCase().includes(searchLower) ||
//           candidate.zip?.includes(searchTerm) ||
//           candidate.batchname?.toLowerCase().includes(searchLower)
//         );
//       });
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

//   const VisaStatusRenderer = (params: any) => {
//     const visaColors: Record<string, string> = {
//       "H1B": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//       "Green Card": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
//       "F1 Student": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//       "L1": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//       "OPT": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//       "H4 EAD": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
//     };

//     return (
//       <Badge
//         className={
//           visaColors[params.value] ||
//           "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
//         }
//       >
//         {params.value}
//       </Badge>
//     );
//   };

//   const AmountRenderer = (params: any) =>
//     params.value ? `$${Number(params.value).toLocaleString()}` : "$0";

//   const columnDefs: ColDef[] = useMemo(
//     () => [
//       {
//         field: "candidateid",
//         headerName: "ID",
//         width: 80,
//         pinned: "left",
//         checkboxSelection: true,
//       },
//       { field: "name", headerName: "Full Name", width: 180 },
//       { field: "email", headerName: "Email", width: 220 },
//       { field: "phone", headerName: "Phone", width: 150 },
//       {
//         field: "workstatus",
//         headerName: "Visa Status",
//         cellRenderer: VisaStatusRenderer,
//         width: 130,
//       },
//       { field: "education", headerName: "Education", width: 250 },
//       {
//         field: "status",
//         headerName: "Status",
//         cellRenderer: StatusRenderer,
//         width: 120,
//       },
//       { field: "enrolleddate", headerName: "Enrolled Date", width: 130 },
//       {
//         field: "feepaid",
//         headerName: "Fee Paid",
//         cellRenderer: AmountRenderer,
//         width: 130,
//         type: "numericColumn",
//       },
//       { field: "address", headerName: "Address", width: 200 },
//       { field: "city", headerName: "City", width: 120 },
//       { field: "state", headerName: "State", width: 100 },
//       { field: "zip", headerName: "Pincode", width: 100 },
//       {
//         field: "emergcontactname",
//         headerName: "Emergency Contact Name",
//         width: 180,
//       },
//       {
//         field: "emergcontactphone",
//         headerName: "Emergency Contact Phone",
//         width: 180,
//       },
//       { field: "notes", headerName: "Notes", width: 250 },
//       { field: "batchname", headerName: "Batch", width: 150 },
//       { field: "term", headerName: "Term", width: 100 },
//       { field: "dob", headerName: "Date of Birth", width: 130 },
//     ],
//     []
//   );

//   const handleRowUpdated = (updatedRow: any) => {
//     setFilteredCandidates((prev) =>
//       prev.map((row) => (row.candidateid === updatedRow.candidateid ? updatedRow : row))
//     );
//   };

//   const handleRowDeleted = (id: number) => {
//     setFilteredCandidates((prev) => prev.filter((row) => row.candidateid !== id));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Active Candidates
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Candidates currently active in the system
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
//             placeholder="Search by name, email, visa status, education..."
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
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Active Candidates (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowClicked={(event) => {
//                 console.log("Row clicked:", event.data);
//               }}
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

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `http://127.0.0.1:8000/api/candidates/active?page=${page}&limit=${limit}`
//         );
//         const data = await res.json();

//         if (!Array.isArray(data)) {
//           throw new Error("Invalid data format");
//         }

//         setAllCandidates(data);
//         setFilteredCandidates(data);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load candidates.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, [page, limit]);

//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") {
//         return allCandidates;
//       }
//       const searchLower = searchTerm.toLowerCase();
//       return allCandidates.filter((candidate) =>
//         Object.values(candidate).some((val) =>
//           val?.toString().toLowerCase().includes(searchLower)
//         )
//       );
//     },
//     [allCandidates]
//   );

//   useEffect(() => {
//     const filtered = filterCandidates(searchTerm);
//     setFilteredCandidates(filtered);
//   }, [searchTerm, filterCandidates]);

//   const StatusRenderer = (params: any) => (
//     <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//       {params.value?.toUpperCase()}
//     </Badge>
//   );

//   const VisaStatusRenderer = (params: any) => {
//     const visaColors: Record<string, string> = {
//       "H1B": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//       "Green Card": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
//       "F1 Student": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//       "L1": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//       "OPT": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//       "H4 EAD": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
//     };

//     return (
//       <Badge
//         className={
//           visaColors[params.value] ||
//           "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
//         }
//       >
//         {params.value}
//       </Badge>
//     );
//   };

//   const AmountRenderer = (params: any) => {
//     return `$${parseFloat(params.value || 0).toLocaleString()}`;
//   };

//   const columnDefs: ColDef[] = useMemo(() => {
//     const allKeys = new Set<string>();
//     filteredCandidates.forEach((row) => {
//       Object.keys(row).forEach((key) => allKeys.add(key));
//     });

//     return Array.from(allKeys).map((key) => {
//       const col: ColDef = {
//         field: key,
//         headerName: key
//           .replace(/([A-Z])/g, " $1")
//           .replace(/^./, (str) => str.toUpperCase()),
//         flex: 1,
//         sortable: true,
//         resizable: true,
//       };

//       if (key === "status") {
//         col.cellRenderer = StatusRenderer;
//       } else if (key === "workstatus" || key === "visaStatus") {
//         col.headerName = "workstatus";
//         col.cellRenderer = VisaStatusRenderer;
//       } else if (key === "feepaid" || key === "amountPaid") {
//         col.cellRenderer = AmountRenderer;
//         col.type = "numericColumn";
//       } else if (key.toLowerCase().includes("date")) {
//         col.width = 130;
//       } else if (key.toLowerCase().includes("phone")) {
//         col.width = 150;
//       } else if (key === "candidateid" || key === "id") {
//         col.pinned = "left";
//         col.width = 80;
//         col.checkboxSelection = true;
//       }

//       return col;
//     });
//   }, [filteredCandidates]);

//   const handleRowUpdated = (updatedRow: any) => {
//     setFilteredCandidates((prev) =>
//       prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//     );
//   };

//   const handleRowDeleted = (id: number) => {
//     setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Active Candidates
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Candidates currently active in the system
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
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Active Candidates (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowClicked={(event) => {
//                 console.log("Row clicked:", event.data);
//               }}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





// // whiteboxLearning-wbl/app/avatar/candidates/prep/page.tsx
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

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidates/active?page=${page}&limit=${limit}`
//         );
//         if (!res.ok) throw new Error("Failed to load candidates");
//         const data = await res.json();

//         if (!Array.isArray(data)) {
//           throw new Error("Invalid data format");
//         }

//         setAllCandidates(data);
//         setFilteredCandidates(data);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load candidates.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, [page, limit]);

//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") {
//         return allCandidates;
//       }
//       const searchLower = searchTerm.toLowerCase();
//       return allCandidates.filter((candidate) =>
//         Object.values(candidate).some((val) =>
//           val?.toString().toLowerCase().includes(searchLower)
//         )
//       );
//     },
//     [allCandidates]
//   );

//   useEffect(() => {
//     const filtered = filterCandidates(searchTerm);
//     setFilteredCandidates(filtered);
//   }, [searchTerm, filterCandidates]);

//   const StatusRenderer = (params: any) => (
//     <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//       {params.value?.toUpperCase()}
//     </Badge>
//   );

//   const VisaStatusRenderer = (params: any) => {
//     const visaColors: Record<string, string> = {
//       H1B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//       GC: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
//       "F1 Student": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//       L1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//       Citizen: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//       H4: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
//     };

//     return (
//       <Badge
//         className={
//           visaColors[params.value] ||
//           "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
//         }
//       >
//         {params.value}
//       </Badge>
//     );
//   };

//   const AmountRenderer = (params: any) => {
//     return `$${parseFloat(params.value || 0).toLocaleString()}`;
//   };

//   const columnDefs: ColDef[] = useMemo(() => {
//     const allKeys = new Set<string>();
//     filteredCandidates.forEach((row) => {
//       Object.keys(row).forEach((key) => allKeys.add(key));
//     });

//     return Array.from(allKeys).map((key) => {
//       const col: ColDef = {
//         field: key,
//         headerName: key
//           .replace(/([A-Z])/g, " $1")
//           .replace(/^./, (str) => str.toUpperCase()),
//         flex: 1,
//         sortable: true,
//         resizable: true,
//       };

//       if (key === "status") {
//         col.cellRenderer = StatusRenderer;
//       } else if (key === "workstatus" || key === "visaStatus") {
//         col.cellRenderer = VisaStatusRenderer;
//       } else if (key === "feepaid" || key === "amountPaid") {
//         col.cellRenderer = AmountRenderer;
//         col.type = "numericColumn";
//       } else if (key.toLowerCase().includes("date")) {
//         col.width = 130;
//       } else if (key.toLowerCase().includes("phone")) {
//         col.width = 150;
//       } else if (key === "candidateid" || key === "id") {
//         col.pinned = "left";
//         col.width = 80;
//         col.checkboxSelection = true;
//       }

//       return col;
//     });
//   }, [filteredCandidates]);

//   const handleRowUpdated = (updatedRow: any) => {
//     setFilteredCandidates((prev) =>
//       prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//     );
//   };

//   const handleRowDeleted = (id: number) => {
//     setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Active Candidates
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Candidates currently active in the system
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
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Active Candidates (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowClicked={(event) => {
//                 console.log("Row clicked:", event.data);
//               }}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// // whiteboxLearning-wbl/app/avatar/candidates/prep/page.tsx
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

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidates/active?page=${page}&limit=${limit}`
//         );
//         if (!res.ok) throw new Error("Failed to load candidates");
//         const data = await res.json();

//         if (!Array.isArray(data)) {
//           throw new Error("Invalid data format");
//         }

//         setAllCandidates(data);
//         setFilteredCandidates(data);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load candidates.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, [page, limit]);

//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") {
//         return allCandidates;
//       }
//       const searchLower = searchTerm.toLowerCase();
//       return allCandidates.filter((candidate) =>
//         Object.values(candidate).some((val) =>
//           val?.toString().toLowerCase().includes(searchLower)
//         )
//       );
//     },
//     [allCandidates]
//   );


// // whiteboxLearning-wbl/app/avatar/candidates/prep/page.tsx
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

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   const fetchCandidates = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidates/active?page=${page}&limit=${limit}`
//       );
//       if (!res.ok) throw new Error("Failed to load candidates");
//       const data = await res.json();

//       if (!Array.isArray(data)) {
//         throw new Error("Invalid data format");
//       }

//       setAllCandidates(data);
//       setFilteredCandidates(data);
//     } catch (err) {

//       // console.error(err);

//       setError("Failed to load candidates.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCandidates();
//   }, [page, limit]);

//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") {
//         return allCandidates;
//       }
//       const searchLower = searchTerm.toLowerCase();
//       return allCandidates.filter((candidate) =>
//         Object.values(candidate).some((val) =>
//           val?.toString().toLowerCase().includes(searchLower)
//         )
//       );
//     },
//     [allCandidates]
//   );

//   useEffect(() => {
//     const filtered = filterCandidates(searchTerm);
//     setFilteredCandidates(filtered);
//   }, [searchTerm, filterCandidates]);

//   const StatusRenderer = (params: any) => (
//     <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//       {params.value?.toUpperCase()}
//     </Badge>
//   );

//   const VisaStatusRenderer = (params: any) => {
//     const visaColors: Record<string, string> = {
//       H1B: "bg-blue-100 text-blue-800",
//       GC: "bg-emerald-100 text-emerald-800",
//       "F1 Student": "bg-purple-100 text-purple-800",
//       F1: "bg-purple-100 text-purple-800",
//       "GC EAD": "bg-teal-100 text-teal-800",
//       L1: "bg-orange-100 text-orange-800",
//       L2: "bg-orange-100 text-orange-800",
//       Citizen: "bg-indigo-100 text-indigo-800",
//       H4: "bg-pink-100 text-pink-800",
//       None: "bg-gray-200 text-gray-700",
//       Select: "bg-gray-200 text-gray-700",
//     };

//     return (
//       <Badge
//         className={
//           visaColors[params.value] ||
//           "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
//         }
//       >
//         {params.value}
//       </Badge>
//     );
//   };

//   const AmountRenderer = (params: any) => {
//     return `$${parseFloat(params.value || 0).toLocaleString()}`;
//   };

//   const columnDefs: ColDef[] = useMemo(() => {
//     const allKeys = new Set<string>();
//     filteredCandidates.forEach((row) => {
//       Object.keys(row).forEach((key) => allKeys.add(key));
//     });

//     const baseColumns: ColDef[] = Array.from(allKeys).map((key) => {
//       const col: ColDef = {
//         field: key,
//         headerName: key
//           .replace(/([A-Z])/g, " $1")
//           .replace(/^./, (str) => str.toUpperCase()),
//         flex: 1,
//         sortable: true,
//         resizable: true,
//       };

//       if (key === "status") {
//         col.cellRenderer = StatusRenderer;
//       } else if (key === "workstatus" || key === "visaStatus") {
//         col.cellRenderer = VisaStatusRenderer;
//       } else if (key === "feepaid" || key === "amountPaid") {
//         col.cellRenderer = AmountRenderer;
//         col.type = "numericColumn";
//       } else if (key.toLowerCase().includes("date")) {
//         col.width = 130;
//       } else if (key.toLowerCase().includes("phone")) {
//         col.width = 150;
//       } else if (key === "candidateid") {
//         col.pinned = "left";
//         col.width = 100;
//         col.checkboxSelection = true;
//       }

//       return col;
//     });

//     const candidateIdCol = baseColumns.find((col) => col.field === "candidateid");
//     const otherCols = baseColumns.filter((col) => col.field !== "candidateid");

//     return candidateIdCol ? [candidateIdCol, ...otherCols] : otherCols;
//   }, [filteredCandidates]);


//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidates/${updatedRow.candidateid}`,
//         updatedRow
//       );

//       setFilteredCandidates((prev) =>
//         prev.map((row) =>
//           row.candidateid === updatedRow.candidateid ? updatedRow : row
//         )
//       );
//     } catch (error) {

//       // console.error("Failed to update candidate:", error);

//     }
//   };


//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${id}`);

//       setFilteredCandidates((prev) =>
//         prev.filter((row) => row.candidateid !== id)
//       );
//     } catch (error) {

//       // console.error("Failed to delete candidate:", error);

//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Active Candidates
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Candidates currently active in the system
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
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Active Candidates (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               // onRowClicked={(event) => {
//               //   console.log("Row clicked:", event.data);
//               // }}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// // // whiteboxLearning-wbl/app/avatar/candidates/prep/page.tsx

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

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   const fetchCandidates = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=${page}&limit=${limit}`
//       );

//       const data = res.data;

//       if (!Array.isArray(data)) throw new Error("Invalid data format");

//       setAllCandidates(data);
//       setFilteredCandidates(data);
//     } catch (err) {
//       setError("Failed to load candidate preparations.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCandidates();
//   }, [page, limit]);

//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") return allCandidates;
//       const searchLower = searchTerm.toLowerCase();
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

//   const columnDefs: ColDef[] = useMemo(() => {
//     const allKeys = new Set<string>();
//     filteredCandidates.forEach((row) =>
//       Object.keys(row).forEach((key) => allKeys.add(key))
//     );

//     const baseColumns: ColDef[] = Array.from(allKeys).map((key) => {
//       const col: ColDef = {
//         field: key,
//         headerName: key
//           .replace(/_/g, " ")
//           .replace(/([A-Z])/g, " $1")
//           .replace(/^./, (str) => str.toUpperCase()),
//         flex: 1,
//         sortable: true,
//         resizable: true,
//       };
//       if (key === "status") col.cellRenderer = StatusRenderer;
//       else if (key.toLowerCase().includes("date")) col.width = 130;
//       else if (key === "candidate_id") {
//         col.width = 100;
//         col.checkboxSelection = true;
//         col.pinned = "left";
//       }
//       return col;
//     });

//     // Reorder columns: id first, candidate_id second, rest after
//     const idCol = baseColumns.find((col) => col.field === "id");
//     const candidateIdCol = baseColumns.find((col) => col.field === "candidate_id");
//     const otherCols = baseColumns.filter(
//       (col) => col.field !== "id" && col.field !== "candidate_id"
//     );

//     const finalCols: ColDef[] = [];
//     if (idCol) finalCols.push(idCol);
//     if (candidateIdCol) finalCols.push(candidateIdCol);
//     return [...finalCols, ...otherCols];
//   }, [filteredCandidates]);

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
//         {searchTerm && (
//           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {filteredCandidates.length} candidate(s) found
//           </p>
//         )}
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
// import { useMemo, useState, useEffect, useCallback } from "react";
// import axios from "axios";

// // Custom status badge renderer
// const StatusRenderer = (params: any) => (
//   <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
//     {params.value?.toUpperCase()}
//   </Badge>
// );

// export default function CandidatesPrepPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [allCandidates, setAllCandidates] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);

//   const fetchCandidates = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=${page}&limit=${limit}`
//       );

//       const data = res.data;
//       if (!Array.isArray(data)) throw new Error("Invalid data format");

//       setAllCandidates(data);
//       setFilteredCandidates(data);
//     } catch (err) {
//       setError("Failed to load candidate preparations.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCandidates();
//   }, [page, limit]);

//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") return allCandidates;
//       const searchLower = searchTerm.toLowerCase();
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

//   // Static column definitions based on CandidatePreparationBase
//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", checkboxSelection: false, width: 80 },
//       { field: "candidate_id", headerName: "Candidate ID", sortable: true, minWidth: 120 },
//       { field: "batch", headerName: "Batch", sortable: true, maxWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 110 },
//       { field: "instructor_1id", headerName: "Instructor 1 ID", minWidth: 120 },
//       { field: "instructor_2id", headerName: "Instructor 2 ID", minWidth: 120 },
//       { field: "instructor_3id", headerName: "Instructor 3 ID", minWidth: 120 },
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
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`
//       );
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
//         <Label
//           htmlFor="search"
//           className="text-sm font-medium text-gray-700 dark:text-gray-300"
//         >
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

const StatusRenderer = (params: any) => (
  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
    {params.value?.toUpperCase()}
  </Badge>
);

export default function CandidatesPrepPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(100);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=${page}&limit=${limit}`
      );
      const data = res.data;
      if (!Array.isArray(data)) throw new Error("Invalid data format");

      setAllCandidates(data);
      setFilteredCandidates(data);
    } catch {
      setError("Failed to load candidate preparations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, limit]);

  const filterCandidates = useCallback(
    (searchTerm: string) => {
      if (searchTerm.trim() === "") return allCandidates;
      const searchLower = searchTerm.toLowerCase();
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

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      {
        field: "candidate.full_name",
        headerName: "Full Name",
        minWidth: 150,
        // valueGetter: (params) => params.data.candidate?.name || "N/A"
      },
      { field: "batch", headerName: "Batch", sortable: true, maxWidth: 110 },
      { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
      { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 110 },
      { field: "instructor_1id", headerName: "Instructor 1 ID", minWidth: 120 },
      { field: "instructor_2id", headerName: "Instructor 2 ID", minWidth: 120 },
      { field: "instructor_3id", headerName: "Instructor 3 ID", minWidth: 120 },
      { field: "rating", headerName: "Rating", minWidth: 100 },
      { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
      { field: "communication", headerName: "Communication", minWidth: 120 },
      { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
      { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
      { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
      { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
      { field: "notes", headerName: "Notes", minWidth: 90 },
    ];
  }, []);

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
        updatedRow
      );
      setFilteredCandidates((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidate Preparations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tracking candidate preparation status
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Candidates
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredCandidates.length} candidate(s) found
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Candidate Preparations (${filteredCandidates.length})`}
              height="calc(70vh)"
              showSearch={false}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
