// // wbl\app\avatar\candidates\page.tsx
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

// export default function CandidatesPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);

//   // All candidates data
//   const allCandidates = [
//     {
//       id: 1,
//       fullName: "Alice Johnson",
//       email: "alice.johnson@example.com",
//       contact: "+1 (555) 987-6543",
//       visaStatus: "H1B",
//       education: "Master's in Software Engineering",
//       status: "active",
//       enrolledDate: "2024-01-10",
//       amountPaid: 12000,
//       address: "567 Broadway, New York, NY 10012",
//       referredBy: "Tech Recruiter Inc",
//       pincode: "10012",
//       primaryEmergencyContact: "+1 (555) 111-2222",
//       secondaryEmergencyContact: "+1 (555) 333-4444",
//       notes: "Initial enrollment completed. Ready for next phase.",
//     },
//     {
//       id: 2,
//       fullName: "Bob Smith",
//       email: "bob.smith@example.com",
//       contact: "+1 (555) 876-5432",
//       visaStatus: "Green Card",
//       education: "Bachelor's in Computer Science",
//       status: "preparation",
//       enrolledDate: "2024-01-12",
//       amountPaid: 15000,
//       address: "890 Silicon Valley Blvd, San Jose, CA 95110",
//       referredBy: "LinkedIn Connection",
//       pincode: "95110",
//       primaryEmergencyContact: "+1 (555) 222-3333",
//       secondaryEmergencyContact: "+1 (555) 444-5555",
//       notes: "Moved to preparation phase. Needs technical assessment.",
//     },
//     {
//       id: 3,
//       fullName: "Carol Davis",
//       email: "carol.davis@example.com",
//       contact: "+1 (555) 765-4321",
//       visaStatus: "F1 Student",
//       education: "PhD in Artificial Intelligence",
//       status: "marketing",
//       enrolledDate: "2024-01-08",
//       amountPaid: 8000,
//       address: "234 Innovation Drive, Austin, TX 78701",
//       referredBy: "University Career Center",
//       pincode: "78701",
//       primaryEmergencyContact: "+1 (555) 333-4444",
//       secondaryEmergencyContact: "+1 (555) 555-6666",
//       notes: "Currently in marketing phase. Strong AI background.",
//     },
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
//       id: 5,
//       fullName: "Eva Martinez",
//       email: "eva.martinez@example.com",
//       contact: "+1 (555) 543-2109",
//       visaStatus: "OPT",
//       education: "Master's in Data Analytics",
//       status: "preparation",
//       enrolledDate: "2024-01-09",
//       amountPaid: 10000,
//       address: "678 Research Blvd, Boston, MA 02139",
//       referredBy: "Career Fair",
//       pincode: "02139",
//       primaryEmergencyContact: "+1 (555) 555-6666",
//       secondaryEmergencyContact: "+1 (555) 777-8888",
//       notes: "Data analytics expertise. Preparing for interviews.",
//     },
//     {
//       id: 6,
//       fullName: "Frank Lee",
//       email: "frank.lee@example.com",
//       contact: "+1 (555) 432-1098",
//       visaStatus: "H4 EAD",
//       education: "Bachelor's in Information Systems",
//       status: "marketing",
//       enrolledDate: "2024-01-11",
//       amountPaid: 13000,
//       address: "901 Tech Avenue, Denver, CO 80202",
//       referredBy: "Friend Referral",
//       pincode: "80202",
//       primaryEmergencyContact: "+1 (555) 666-7777",
//       secondaryEmergencyContact: "+1 (555) 888-9999",
//       notes: "Updated resume. Marketing outreach in progress.",
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
//       id: 8,
//       fullName: "Henry Brown",
//       email: "henry.brown@example.com",
//       contact: "+1 (555) 210-9876",
//       visaStatus: "Green Card",
//       education: "Bachelor's in Software Development",
//       status: "preparation",
//       enrolledDate: "2024-01-13",
//       amountPaid: 11000,
//       address: "456 Code Lane, Portland, OR 97201",
//       referredBy: "Online Platform",
//       pincode: "97201",
//       primaryEmergencyContact: "+1 (555) 888-9999",
//       secondaryEmergencyContact: "+1 (555) 000-1111",
//       notes: "Needs algorithm practice. Mock interviews scheduled.",
//     },
//     {
//       id: 9,
//       fullName: "Ivy Parker",
//       email: "ivy.parker@example.com",
//       contact: "+1 (555) 109-8765",
//       visaStatus: "F1 Student",
//       education: "Master's in Cloud Computing",
//       status: "marketing",
//       enrolledDate: "2024-01-07",
//       amountPaid: 14000,
//       address: "789 Cloud Drive, Miami, FL 33101",
//       referredBy: "University Job Fair",
//       pincode: "33101",
//       primaryEmergencyContact: "+1 (555) 999-0000",
//       secondaryEmergencyContact: "+1 (555) 111-2222",
//       notes: "Cloud architecture skills. Looking for AWS positions.",
//     },
//     {
//       id: 15,
//       fullName: "Olivia Rodriguez",
//       email: "olivia.rodriguez@example.com",
//       contact: "+1 (555) 543-2109",
//       visaStatus: "F1 Student",
//       education: "Master's in IoT Systems",
//       status: "active",
//       enrolledDate: "2024-01-01",
//       amountPaid: 13500,
//       address: "333 IoT Circle, Nashville, TN 37201",
//       referredBy: "Academic Advisor",
//       pincode: "37201",
//       primaryEmergencyContact: "+1 (555) 555-6666",
//       secondaryEmergencyContact: "+1 (555) 777-8888",
//       notes: "IoT specialization. Hardware and software integration.",
//     },
//     {
//       id: 16,
//       fullName: "Peter Zhang",
//       email: "peter.zhang@example.com",
//       contact: "+1 (555) 432-1098",
//       visaStatus: "OPT",
//       education: "Bachelor's in AR/VR Development",
//       status: "preparation",
//       enrolledDate: "2023-12-28",
//       amountPaid: 11500,
//       address: "444 VR Street, Las Vegas, NV 89101",
//       referredBy: "Tech Blog",
//       pincode: "89101",
//       primaryEmergencyContact: "+1 (555) 666-7777",
//       secondaryEmergencyContact: "+1 (555) 888-9999",
//       notes: "AR/VR development. Working on portfolio projects.",
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
//     const getStatusColor = (status: string) => {
//       switch (status.toLowerCase()) {
//         case "active":
//           return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
//         case "preparation":
//           return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
//         case "marketing":
//           return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//         case "placed":
//           return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
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
//       { field: "notes", headerName: "Notes", width: 250, minWidth: 200 },
//     ],
//     []
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
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidates Management
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Browse, search, and manage all candidates in the pipeline.
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

//       <div className="flex justify-center w-full">
//         <div className="w-full max-w-7xl">
//           <AGGridTable
//             rowData={filteredCandidates}
//             columnDefs={columnDefs}
//             title={`All Candidates (${filteredCandidates.length})`}
//             height="calc(70vh)"
//             showSearch={false}
//             onRowClicked={(event) => console.log("Row clicked:", event.data)}
//             onRowUpdated={handleRowUpdated}
//             onRowDeleted={handleRowDeleted}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }



// // wbl\app\avatar\candidates\page.tsx

// "use client";

// import React, { useEffect, useState } from "react";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";

// const StatusRenderer = (params: any) => {
//   const status = params?.value?.toString().toLowerCase() ?? "";

//   const colorMap: Record<string, string> = {
//     active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
//     preparation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
//     marketing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//     placed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//     discontinued: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
//     break: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
//     defaulted: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//     completed: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//   };

//   const badgeClass =
//     colorMap[status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";

//   return <Badge className={badgeClass}>{params.value?.toString().toUpperCase()}</Badge>;
// };

// const VisaStatusRenderer = (params: any) => {
//   const visaColors: Record<string, string> = {
//     H1B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//     GC: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
//     "F1 Student": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//     "GC EAD": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
//     L1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//     Citizen: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//     H4: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
//   };

//   const visa = params?.value ?? "";
//   const className =
//     visaColors[visa] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";

//   return <Badge className={className}>{visa}</Badge>;
// };

// const DateFormatter = (params: any) =>
//   params.value ? new Date(params.value).toLocaleDateString() : "";

// const AmountFormatter = (params: any) =>
//   params.value ? `$${Number(params.value).toLocaleString()}` : "";

// export default function CandidatesPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [candidates, setCandidates] = useState<any[]>([]);
//   const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searching, setSearching] = useState(false);
//   const [error, setError] = useState("");

//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(100);
  
  
// const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null); // ✅ new

//   useEffect(() => {
//     setLoading(true);
//     fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates?page=${page}&limit=${pageSize}`)
//       .then(async (res) => {
//         if (!res.ok) throw new Error("Failed to load candidates");
//         const data = await res.json();
//         setCandidates(data);
//         setFilteredCandidates(data);
//       })
//       .catch((e) => setError((e as Error).message))
//       .finally(() => setLoading(false));
//   }, [page, pageSize]);

//   useEffect(() => {
//     if (candidates.length > 0) {
//       const dynamicColumns: ColDef[] = Object.keys(candidates[0]).map((key) => {
//         const headerName = key
//           .replace(/([a-z])([A-Z])/g, "$1 $2")
//           .replace(/\b\w/g, (c) => c.toUpperCase());

//         const column: ColDef = {
//           field: key,
//           headerName,
//           width: 150,
//           editable: true,
//         };

//         if (key.toLowerCase().includes("date") && key.toLowerCase() !== "candidateid") {
//           column.valueFormatter = DateFormatter;
//         } else if (key.toLowerCase() === "status") {
//           column.cellRenderer = StatusRenderer;
//         } else if (key.toLowerCase() === "workstatus"||"visastatus") {
//           column.cellRenderer = VisaStatusRenderer;
//         } else if (["feepaid", "feedue"].includes(key.toLowerCase())) {
//           column.valueFormatter = AmountFormatter;
//         }

//         if (key === "candidateid") {
//           column.pinned = "left";
//           column.checkboxSelection = true;
//           column.width = 100;
//         }

//         return column;
//       });

//       setColumnDefs(dynamicColumns);
//     }
//   }, [candidates]);

//   // Debounced search
//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       const fetchSearchResults = async () => {
//         if (!searchTerm.trim()) {
//           setFilteredCandidates(candidates);
//           return;
//         }

//         setSearching(true);
//         try {
//           const res = await fetch(
//             `${process.env.NEXT_PUBLIC_API_URL}/candidates/by-name/${encodeURIComponent(searchTerm)}`
//           );
//           if (!res.ok) throw new Error("Search failed");
//           const data = await res.json();
//           setFilteredCandidates(data);
//         } catch (err) {
//           setFilteredCandidates([]);
//           console.error("Search error:", err);
//         } finally {
//           setSearching(false);
//         }
//       };

//       fetchSearchResults();
//     }, 300); // debounce delay

//     return () => clearTimeout(timeout);
//   }, [searchTerm]);

//   if (loading) return <p className="text-center mt-8">Loading candidates...</p>;
//   if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Candidates Management
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Browse, search, and manage all candidates in the pipeline.
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
//             placeholder="Search by name, email, phone..."
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
//             {filteredCandidates.length} candidate(s) found
//           </p>
//         )}
//       </div>

//       <div className="flex justify-center w-full">
//         <div className="w-full max-w-7xl">
//           <AGGridTable
//             rowData={filteredCandidates}
//             columnDefs={columnDefs}
//             title={`All Candidates (${filteredCandidates.length})`}
//             height="calc(70vh)"
//             showSearch={false}
//             onRowClicked={(event) => console.log("Row clicked:", event.data)}
            
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
//             className="px-2 py-1 border rounded text-sm"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";

// Cell renderers
const StatusRenderer = (params: any) => {
  const status = params?.value?.toString().toLowerCase() || "";
  const colorMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    preparation: "bg-yellow-100 text-yellow-800",
    marketing: "bg-blue-100 text-blue-800",
    placed: "bg-purple-100 text-purple-800",
    discontinued: "bg-red-100 text-red-800",
    break: "bg-pink-100 text-pink-800",
    defaulted: "bg-orange-100 text-orange-800",
    completed: "bg-indigo-100 text-indigo-800",
  };
  const cls = colorMap[status] || "bg-gray-100 text-gray-800";
  return <Badge className={cls}>{params.value?.toString().toUpperCase()}</Badge>;
};

const VisaStatusRenderer = (params: any) => {
  const visa = (params?.value || "").toString().trim();

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

  const cls = colorMap[visa] || "bg-gray-100 text-gray-800";
  return <Badge className={cls}>{visa}</Badge>;
};


const DateFormatter = (params: any) =>
  params.value ? new Date(params.value).toLocaleDateString() : "";

const AmountFormatter = (params: any) =>
  params.value != null ? `$${Number(params.value).toLocaleString()}` : "";

export default function CandidatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates?page=${page}&limit=${pageSize}`
      );
      setCandidates(res.data);
      setFilteredCandidates(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, pageSize]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }
    if (searchTerm.trim().length < 3) {
      setFilteredCandidates([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/candidates/by-name/${encodeURIComponent(
            searchTerm.trim()
          )}`
        );
        setFilteredCandidates(res.data);
      } catch {
        setFilteredCandidates([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, candidates]);

  useEffect(() => {
    if (candidates.length > 0) {
      const defs: ColDef[] = Object.keys(candidates[0]).map((key) => {
        const header = key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const col: ColDef = {
          field: key,
          headerName: header,
          width: 150,
          editable: true,
        };

        const k = key.toLowerCase();
        if (k.includes("date") && key !== "candidateid") col.valueFormatter = DateFormatter;
        else if (k === "status") col.cellRenderer = StatusRenderer;
        else if (k === "workstatus") col.cellRenderer = VisaStatusRenderer;
        else if (["feepaid", "feedue"].includes(k)) col.valueFormatter = AmountFormatter;
        else if (key === "candidateid") {
          col.pinned = "left";
          col.checkboxSelection = true;
          col.width = 100;
        }

        return col;
      });
      setColumnDefs(defs);
    }
  }, [candidates]);

  const handleUpdate = async (updated: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/${updated.candidateid}`,
        updated
      );
      fetchCandidates();
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${id}`);
      fetchCandidates();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Candidates Management</h1>
        <p>Browse, search, and manage candidates.</p>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search Candidates</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name (min 3 characters)..."
            className="pl-10"
          />
        </div>
        {searching ? (
          <p>Searching...</p>
        ) : (
          searchTerm && <p>{filteredCandidates.length} found</p>
        )}
      </div>

      <AGGridTable
        rowData={filteredCandidates}
        columnDefs={columnDefs}
        title={`All Candidates (${filteredCandidates.length})`}
        height="calc(70vh)"
        onRowUpdated={handleUpdate}
        onRowDeleted={handleDelete}
        showSearch={false}
      />

      <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 border rounded text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
