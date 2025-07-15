// // whiteboxLearning-wbl/app/avatar/candidates/placements/page.tsx
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

// export default function CandidatesPlacements() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);

//   // Sample data - only candidates with "placed" status
//   const allCandidates = [
//     {
//       id: 4,
//       fullName: "David Wilson",
//       email: "david.wilson@example.com",
//       contact: "+1 (555) 654-3210",
//       visaStatus: "L1",
//       education: "Master's in Cybersecurity",
//       status: "placed",
//       enrolledDate: "2024-01-14",
//       amountPaid: 18000,
//       address: "456 Tech Park Way, Seattle, WA 98109",
//       referredBy: "Former Colleague",
//       pincode: "98109",
//       primaryEmergencyContact: "+1 (555) 444-5555",
//       secondaryEmergencyContact: "+1 (555) 666-7777",
//       notes: "Successfully placed at Microsoft. Excellent performance.",
//     },
//     {
//       id: 7,
//       fullName: "Grace Chen",
//       email: "grace.chen@example.com",
//       contact: "+1 (555) 321-0987",
//       visaStatus: "H1B",
//       education: "Master's in Machine Learning",
//       status: "placed",
//       enrolledDate: "2024-01-05",
//       amountPaid: 16000,
//       address: "123 AI Street, San Francisco, CA 94105",
//       referredBy: "Company Alumni",
//       pincode: "94105",
//       primaryEmergencyContact: "+1 (555) 777-8888",
//       secondaryEmergencyContact: "+1 (555) 999-0000",
//       notes: "Placed at Google AI team. Outstanding candidate.",
//     },
//     {
//       id: 11,
//       fullName: "Kelly Wong",
//       email: "kelly.wong@example.com",
//       contact: "+1 (555) 987-6543",
//       visaStatus: "L1",
//       education: "Master's in DevOps",
//       status: "placed",
//       enrolledDate: "2024-01-06",
//       amountPaid: 17000,
//       address: "654 DevOps Street, Los Angeles, CA 90210",
//       referredBy: "Professional Network",
//       pincode: "90210",
//       primaryEmergencyContact: "+1 (555) 111-2222",
//       secondaryEmergencyContact: "+1 (555) 333-4444",
//       notes: "Placed at Netflix DevOps team. Quick turnaround.",
//     },
//     {
//       id: 14,
//       fullName: "Nathan Kim",
//       email: "nathan.kim@example.com",
//       contact: "+1 (555) 654-3210",
//       visaStatus: "Green Card",
//       education: "Bachelor's in Game Development",
//       status: "placed",
//       enrolledDate: "2024-01-02",
//       amountPaid: 15500,
//       address: "222 Gaming Plaza, San Diego, CA 92101",
//       referredBy: "Gaming Community",
//       pincode: "92101",
//       primaryEmergencyContact: "+1 (555) 444-5555",
//       secondaryEmergencyContact: "+1 (555) 666-7777",
//       notes: "Placed at Unity Technologies. Game development role.",
//     },
//     {
//       id: 18,
//       fullName: "Rachel Adams",
//       email: "rachel.adams@example.com",
//       contact: "+1 (555) 210-9876",
//       visaStatus: "H4 EAD",
//       education: "Bachelor's in UI/UX Design",
//       status: "placed",
//       enrolledDate: "2023-12-26",
//       amountPaid: 14500,
//       address: "666 Design Drive, Atlanta, GA 30301",
//       referredBy: "Design Community",
//       pincode: "30301",
//       primaryEmergencyContact: "+1 (555) 888-9999",
//       secondaryEmergencyContact: "+1 (555) 000-1111",
//       notes: "Placed at Adobe design team. Excellent design portfolio.",
//     },
//     {
//       id: 22,
//       fullName: "Wendy Taylor",
//       email: "wendy.taylor@example.com",
//       contact: "+1 (555) 876-5432",
//       visaStatus: "OPT",
//       education: "Bachelor's in API Development",
//       status: "placed",
//       enrolledDate: "2023-12-22",
//       amountPaid: 13000,
//       address: "101 API Avenue, Salt Lake City, UT 84101",
//       referredBy: "Developer Meetup",
//       pincode: "84101",
//       primaryEmergencyContact: "+1 (555) 222-3333",
//       secondaryEmergencyContact: "+1 (555) 444-5555",
//       notes: "Placed at Stripe API team. RESTful API expertise.",
//     },
//   ];

//   // Auto-search functionality
//   const filterCandidates = useCallback((searchTerm: string) => {
//     if (searchTerm.trim() === "") {
//       return allCandidates;
//     } else {
//       return allCandidates.filter((candidate) => {
//         const searchLower = searchTerm.toLowerCase();
//         return (
//           candidate.fullName.toLowerCase().includes(searchLower) ||
//           candidate.email.toLowerCase().includes(searchLower) ||
//           candidate.contact.includes(searchTerm) ||
//           candidate.visaStatus.toLowerCase().includes(searchLower) ||
//           candidate.education.toLowerCase().includes(searchLower) ||
//           candidate.status.toLowerCase().includes(searchLower) ||
//           candidate.address.toLowerCase().includes(searchLower) ||
//           candidate.referredBy.toLowerCase().includes(searchLower) ||
//           candidate.pincode.includes(searchTerm)
//         );
//       });
//     }
//   }, []);

//   useEffect(() => {
//     const filtered = filterCandidates(searchTerm);
//     setFilteredCandidates(filtered);
//   }, [searchTerm, filterCandidates]);

//   const StatusRenderer = (params: any) => {
//     const { value } = params;
//     return (
//       <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
//         {value.toUpperCase()}
//       </Badge>
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
//       { field: "notes", headerName: "Notes", width: 250, minWidth: 200 },
//     ],
//     [],
//   );

//   const handleRowUpdated = (updatedRow) => {
//     setFilteredCandidates((prev) =>
//       prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//     );
//   };

//   const handleRowDeleted = (id) => {
//     setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Placements
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Successfully placed candidates
//           </p>
//         </div>
//       </div>

//       {/* Search Input */}
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

//       {/* AG Grid Table */}
//       <div className="flex justify-center w-full">
//         <div className="w-full max-w-7xl">
//           <AGGridTable
//             rowData={filteredCandidates}
//             columnDefs={columnDefs}
//             title={`Placements (${filteredCandidates.length})`}
//             height="calc(70vh)"
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






// // whiteboxLearning-wbl/app/avatar/candidates/placements/page.tsx
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

// export default function CandidatesPlacements() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch data from backend
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/placements`);
//         if (!res.ok) throw new Error("Failed to fetch placements");

//         const data = await res.json();
//         setAllCandidates(data);
//         setFilteredCandidates(data);

//         if (data.length > 0) {
//           const dynamicColumns: ColDef[] = Object.keys(data[0]).map((key) => ({
//             field: key,
//             headerName: key
//               .replace(/([A-Z])/g, " $1")
//               .replace(/^./, (str) => str.toUpperCase()),
//             width: 150,
//             minWidth: 120,
//             cellRenderer: getCustomRenderer(key),
//           }));
//           setColumnDefs(dynamicColumns);
//         }
//       } catch (err) {
//         console.error("Failed to fetch placements", err);
//         setError("Unable to fetch placements data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const getCustomRenderer = (key: string) => {
//     if (key === "status") return StatusRenderer;
//     if (key === "visaStatus") return VisaStatusRenderer;
//     if (key === "amountPaid") return AmountRenderer;
//     return undefined;
//   };

//   // Filtering
//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") return allCandidates;
//       const searchLower = searchTerm.toLowerCase();
//       return allCandidates.filter((candidate: any) =>
//         Object.values(candidate).some((val) =>
//           String(val).toLowerCase().includes(searchLower),
//         ),
//       );
//     },
//     [allCandidates],
//   );

//   useEffect(() => {
//     const filtered = filterCandidates(searchTerm);
//     setFilteredCandidates(filtered);
//   }, [searchTerm, filterCandidates]);

//   const StatusRenderer = (params: any) => {
//     const { value } = params;
//     return (
//       <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
//         {value?.toUpperCase()}
//       </Badge>
//     );
//   };

//   const VisaStatusRenderer = (params: any) => {
//     const visa = params.value;
//     const colorMap = {
//       H1B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//       "Green Card":
//         "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
//       "F1 Student":
//         "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//       L1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//       OPT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//       "H4 EAD":
//         "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
//     };
//     const badgeClass = colorMap[visa] || "bg-gray-100 text-gray-800 dark:text-gray-300";
//     return <Badge className={badgeClass}>{visa}</Badge>;
//   };

//   const AmountRenderer = (params: any) => {
//     return `$${params.value?.toLocaleString?.() || params.value}`;
//   };

//   const handleRowUpdated = (updatedRow: any) => {
//     setFilteredCandidates((prev) =>
//       prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//     );
//   };

//   const handleRowDeleted = (id: string | number) => {
//     setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Placements
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Successfully placed candidates
//           </p>
//         </div>
//       </div>

//       {/* Search Input */}
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

//       {/* Error Message */}
//       {error && (
//         <p className="text-red-500 dark:text-red-400">{error}</p>
//       )}

//       {/* AG Grid Table */}
//       <div className="flex justify-center w-full">
//         <div className="w-full max-w-7xl">
//           <AGGridTable
//             rowData={filteredCandidates}
//             columnDefs={columnDefs}
//             title={`Placements (${filteredCandidates.length})`}
//             height="calc(70vh)"
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


// // whiteboxLearning-wbl/app/avatar/candidates/placements/page.tsx
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

// export default function CandidatesPlacements() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/placements`);
//         if (!res.ok) throw new Error("Failed to fetch placements");

//         const data = await res.json();
//         setAllCandidates(data);
//         setFilteredCandidates(data);

//         if (data.length > 0) {
//           const dynamicColumns: ColDef[] = Object.keys(data[0]).map((key) => ({
//             field: key,
//             headerName: key
//               .replace(/([A-Z])/g, " $1")
//               .replace(/^./, (str) => str.toUpperCase()),
//             width: 150,
//             minWidth: 120,
//             cellRenderer: getCustomRenderer(key),
//             editable: true,
            
//           }));
          
//           setColumnDefs(dynamicColumns);
//         }
//       } catch (err) {
//         console.error("Failed to fetch placements", err);
//         setError("Unable to fetch placements data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const getCustomRenderer = (key: string) => {
//     if (key === "status") return StatusRenderer;
//     if (key === "visaStatus") return VisaStatusRenderer;
//     if (key === "amountPaid") return AmountRenderer;
//     return undefined;
//   };

 
//   const filterCandidates = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") return allCandidates;
//       const searchLower = searchTerm.toLowerCase();
//       return allCandidates.filter((candidate: any) =>
//         Object.values(candidate).some((val) =>
//           String(val).toLowerCase().includes(searchLower),
//         ),
//       );
//     },
//     [allCandidates],
//   );

//   useEffect(() => {
//     const filtered = filterCandidates(searchTerm);
//     setFilteredCandidates(filtered);
//   }, [searchTerm, filterCandidates]);

//   const StatusRenderer = (params: any) => {
//     const { value } = params;
//     return (
//       <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
//         {value?.toUpperCase()}
//       </Badge>
//     );
//   };

//   const VisaStatusRenderer = (params: any) => {
//     const visa = params.value;
//     const colorMap = {
//     H1B: "bg-blue-100 text-blue-800",
//     GC: "bg-emerald-100 text-emerald-800",
//     "F1 Student": "bg-purple-100 text-purple-800",
//     "GC EAD": "bg-teal-100 text-teal-800",
//     L1: "bg-orange-100 text-orange-800",
//     L2: "bg-orange-100 text-orange-800",
//     Citizen: "bg-indigo-100 text-indigo-800",
//     H4: "bg-pink-100 text-pink-800",
//     None: "bg-gray-200 text-gray-700",
//     Select: "bg-gray-200 text-gray-700",
//     };
//     const badgeClass = colorMap[visa] || "bg-gray-100 text-gray-800 dark:text-gray-300";
//     return <Badge className={badgeClass}>{visa}</Badge>;
//   };

//   const AmountRenderer = (params: any) => {
//     return `$${params.value?.toLocaleString?.() || params.value}`;
//   };

//   const handleRowUpdated = (updatedRow: any) => {
//     setFilteredCandidates((prev) =>
//       prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//     );
//   };

//   const handleRowDeleted = (id: string | number) => {
//     setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Placements
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Successfully placed candidates
//           </p>
//         </div>
//       </div>

//       {/* Search Input */}
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

//       {/* Loading, Error or Table */}
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
//               title={`Placements (${filteredCandidates.length})`}
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


// whiteboxLearning-wbl/app/avatar/candidates/placements/page.tsx
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

export default function CandidatesPlacements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allCandidates, setAllCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/placements`);
        if (!res.ok) throw new Error("Failed to fetch placements");

        const data = await res.json();
        setAllCandidates(data);
        setFilteredCandidates(data);

        if (data.length > 0) {
          const dynamicColumns: ColDef[] = Object.keys(data[0]).map((key) => ({
            field: key,
            headerName: key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase()),
            width: 150,
            minWidth: 120,
            cellRenderer: getCustomRenderer(key),
            editable: true,
          }));

          setColumnDefs(dynamicColumns);
        }
      } catch (err) {
        // console.error("Failed to fetch placements", err);
        setError("Unable to fetch placements data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCustomRenderer = (key: string) => {
    if (key === "status") return StatusRenderer;
    if (key === "visaStatus") return VisaStatusRenderer;
    if (key === "amountPaid") return AmountRenderer;
    return undefined;
  };

  const filterCandidates = useCallback(
    (searchTerm: string) => {
      if (searchTerm.trim() === "") return allCandidates;
      const searchLower = searchTerm.toLowerCase();
      return allCandidates.filter((candidate: any) =>
        Object.values(candidate).some((val) =>
          String(val).toLowerCase().includes(searchLower)
        )
      );
    },
    [allCandidates]
  );

  useEffect(() => {
    const filtered = filterCandidates(searchTerm);
    setFilteredCandidates(filtered);
  }, [searchTerm, filterCandidates]);

  const StatusRenderer = (params: any) => {
    const { value } = params;
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        {value?.toUpperCase()}
      </Badge>
    );
  };

  const VisaStatusRenderer = (params: any) => {
    const visa = params.value;
    const colorMap: Record<string, string> = {
      H1B: "bg-blue-100 text-blue-800",
      GC: "bg-emerald-100 text-emerald-800",
      "F1 Student": "bg-purple-100 text-purple-800",
      "F1": "bg-purple-100 text-purple-800",
      "GC EAD": "bg-teal-100 text-teal-800",
      L1: "bg-orange-100 text-orange-800",
      L2: "bg-orange-100 text-orange-800",
      Citizen: "bg-indigo-100 text-indigo-800",
      H4: "bg-pink-100 text-pink-800",
      None: "bg-gray-200 text-gray-700",
      Select: "bg-gray-200 text-gray-700",
    };
    const badgeClass =
      colorMap[visa] || "bg-gray-100 text-gray-800 dark:text-gray-300";
    return <Badge className={badgeClass}>{visa}</Badge>;
  };

  const AmountRenderer = (params: any) => {
    return `$${params.value?.toLocaleString?.() || params.value}`;
  };

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/placements/${updatedRow.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedRow),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update placement");
      }

      const updatedData = await response.json();

      setFilteredCandidates((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedData : row))
      );
    } catch (error) {
      // console.error("Update error:", error);
      alert("Failed to update placement. Please try again.");
    }
  };

  const handleRowDeleted = async (id: string | number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/placements/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete placement");
      }

      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      // console.error("Delete error:", error);
      alert("Failed to delete placement. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Placements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Successfully placed candidates
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
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

      {/* Loading, Error or Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Placements (${filteredCandidates.length})`}
              height="calc(70vh)"
              showSearch={false}
              // onRowClicked={(event) => {
              //   console.log("Row clicked:", event.data);
              // }}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
