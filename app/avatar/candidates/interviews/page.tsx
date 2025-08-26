// // whiteboxLearning-wbl/app/avatar/candidates/interviews/page.tsx
// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Button } from "@/components/admin_ui/button";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, PlusIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useCallback } from "react";

// export default function CandidatesInterviews() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);

//   // Sample interview data - candidates in interview stage
//   const allCandidates = [
//     {
//       id: 3,
//       fullName: "Carol Davis",
//       email: "carol.davis@example.com",
//       contact: "+1 (555) 765-4321",
//       visaStatus: "F1 Student",
//       education: "PhD in Artificial Intelligence",
//       status: "active",
//       enrolledDate: "2024-01-08",
//       amountPaid: 8000,
//       address: "234 Innovation Drive, Austin, TX 78701",
//       referredBy: "University Career Center",
//       pincode: "78701",
//       primaryEmergencyContact: "+1 (555) 333-4444",
//       secondaryEmergencyContact: "+1 (555) 555-6666",
//     },
//     {
//       id: 4,
//       fullName: "David Wilson",
//       email: "david.wilson@example.com",
//       contact: "+1 (555) 654-3210",
//       visaStatus: "L1",
//       education: "Master's in Cybersecurity",
//       status: "active",
//       enrolledDate: "2024-01-14",
//       amountPaid: 18000,
//       address: "456 Tech Park Way, Seattle, WA 98109",
//       referredBy: "Former Colleague",
//       pincode: "98109",
//       primaryEmergencyContact: "+1 (555) 444-5555",
//       secondaryEmergencyContact: "+1 (555) 666-7777",
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
//           return "bg-green-100 text-green-800";
//         case "inactive":
//           return "bg-red-100 text-red-800";
//         default:
//           return "bg-gray-100 text-gray-800";
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
//           return "bg-blue-100 text-blue-800";
//         case "Green Card":
//           return "bg-emerald-100 text-emerald-800";
//         case "F1 Student":
//           return "bg-purple-100 text-purple-800";
//         case "L1":
//           return "bg-orange-100 text-orange-800";
//         case "OPT":
//           return "bg-indigo-100 text-indigo-800";
//         case "H4 EAD":
//           return "bg-pink-100 text-pink-800";
//         default:
//           return "bg-gray-100 text-gray-800";
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
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Candidates scheduled for interviews and assessment sessions
//           </p>
//         </div>
//         <Button className="bg-whitebox-600 hover:bg-whitebox-700">
//           <PlusIcon className="h-4 w-4 mr-2" />
//           Schedule Interview
//         </Button>
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

//       {/* AG Grid Table - Centered and expandable */}
//       <div className="flex justify-center w-full">
//         <div className="w-full max-w-7xl">
//           <div style={{ height: 500, width: "100%" }}>
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Interviews (${filteredCandidates.length})`}
//               height="500px"
//               showSearch={false}
//               onRowClicked={(event) => {
//                 console.log("Row clicked:", event.data);
//               }}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// // whiteboxLearning-wbl/app/avatar/candidates/interviews/page.tsx
// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Button } from "@/components/admin_ui/button";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, PlusIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useCallback } from "react";

// export default function CandidatesInterviews() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [allInterviews, setAllInterviews] = useState<any[]>([]);
//   const [filteredInterviews, setFilteredInterviews] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
  
//   // Fetch from backend once
//   useEffect(() => {
//     const fetchInterviews = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews?limit=100&offset=0`);
//         if (!res.ok) throw new Error("Failed to load interviews");
//         const data = await res.json();
//         setAllInterviews(data);
//         setFilteredInterviews(data);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load interviews.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchInterviews();
//   }, []);

//   // Filter logic
//   const filterData = useCallback((term: string) => {
//     if (!term.trim()) return allInterviews;
//     const lower = term.toLowerCase();
//     return allInterviews.filter(item =>
//       Object.values(item).some(val =>
//         val?.toString().toLowerCase().includes(lower)
//       )
//     );
//   }, [allInterviews]);

//   useEffect(() => {
//     setFilteredInterviews(filterData(searchTerm));
//   }, [searchTerm, filterData]);

//   const StatusRenderer = (params: any) => {
//     const v = params.value?.toLowerCase() ?? "";
//     const classes = v === "active"
//       ? "bg-green-100 text-green-800"
//       : v === "inactive"
//       ? "bg-red-100 text-red-800"
//       : "bg-gray-100 text-gray-800";
//     return <Badge className={classes}>{params.value?.toUpperCase()}</Badge>;
//   };

//   const VisaStatusRenderer = (params: any) => {
//     const v = params.value;
//     const map: Record<string, string> = {
//       H1B: "bg-blue-100 text-blue-800",
//       "Green Card": "bg-emerald-100 text-emerald-800",
//       "F1 Student": "bg-purple-100 text-purple-800",
//       L1: "bg-orange-100 text-orange-800",
//       OPT: "bg-indigo-100 text-indigo-800",
//       "H4 EAD": "bg-pink-100 text-pink-800",
//     };
//     return <Badge className={map[v] ?? "bg-gray-100 text-gray-800"}>{v}</Badge>;
//   };

//   const AmountRenderer = (params: any) =>
//     `$${Number(params.value).toLocaleString()}`;

//   const columnDefs = useMemo<ColDef[]>(() => {
//     if (filteredInterviews.length === 0) return [];
//     const keys = Object.keys(filteredInterviews[0]);
//     return keys.map(key => {
//       const col: ColDef = {
//         field: key,
//         headerName: key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
//         sortable: true,
//         resizable: true,
//         minWidth: 100,
//       };

//       if (key === "status") col.cellRenderer = StatusRenderer;
//       if (key === "visaStatus" || key === "candidate_role") col.cellRenderer = VisaStatusRenderer;
//       if (key === "interview_time" || key === "interview_date") col.width = 130;
//       if (key === "interview_time") col.width = 110;
//       if (key === "interview_mode" || key === "client_name" || key === "interview_location") col.flex = 1;
//       if (key === "id") {
//         col.pinned = "left";
//         col.checkboxSelection = true;
//         col.width = 80;
//       }

//       return col;
//     });
//   }, [filteredInterviews]);

//   const handleRowUpdated = (updated: any) =>
//     setFilteredInterviews(prev =>
//       prev.map(row => (row.id === updated.id ? updated : row))
//     );

//   const handleRowDeleted = (id: any) =>
//     setFilteredInterviews(prev => prev.filter(r => r.id !== id));

//   if (loading) return <p className="text-center mt-8">Loading interviews...</p>;
//   if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
//           <p className="text-gray-600">
//             Candidates scheduled for interviews and assessment sessions
//           </p>
//         </div>
//         <Button className="bg-whitebox-600 hover:bg-whitebox-700">
//           <PlusIcon className="h-4 w-4 mr-2" />
//           Schedule Interview
//         </Button>
//       </div>

//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700">
//           Search
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             value={searchTerm}
//             placeholder="Name, mode, date..."
//             onChange={e => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         {searchTerm && (
//           <p className="mt-2 text-sm text-gray-500">
//             {filteredInterviews.length} result(s)
//           </p>
//         )}
//       </div>

//       <div className="flex justify-center w-full">
//         <div className="w-full max-w-7xl">
//           <AGGridTable
//             rowData={filteredInterviews}
//             columnDefs={columnDefs}
//             title={`Interviews (${filteredInterviews.length})`}
//             height="500px"
//             showSearch={false}
//             onRowClicked={e => console.log("Row clicked:", e.data)}
//             onRowUpdated={handleRowUpdated}
//             onRowDeleted={handleRowDeleted}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }



// whiteboxLearning-wbl/app/avatar/candidates/interviews/page.tsx
"use client";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function CandidatesInterviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allInterviews, setAllInterviews] = useState<any[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch interviews from backend
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews?limit=100&offset=0`);
        if (!res.ok) throw new Error("Failed to load interviews");
        const data = await res.json();
        setAllInterviews(data);
        setFilteredInterviews(data);
      } catch (err) {
        // console.error(err);
        setError("Failed to load interviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  // Search/filter logic
  const filterData = useCallback((term: string) => {
    if (!term.trim()) return allInterviews;
    const lower = term.toLowerCase();
    return allInterviews.filter(item =>
      Object.values(item).some(val =>
        val?.toString().toLowerCase().includes(lower)
      )
    );
  }, [allInterviews]);

  useEffect(() => {
    setFilteredInterviews(filterData(searchTerm));
  }, [searchTerm, filterData]);

  const StatusRenderer = (params: any) => {
    const v = params.value?.toLowerCase() ?? "";
    const classes = v === "active"
      ? "bg-green-100 text-green-800"
      : v === "inactive"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
    return <Badge className={classes}>{params.value?.toUpperCase()}</Badge>;
  };

  const VisaStatusRenderer = (params: any) => {
    const v = params.value;
    const map: Record<string, string> = {
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
    return <Badge className={map[v] ?? "bg-gray-100 text-gray-800"}>{v}</Badge>;
  };

  const AmountRenderer = (params: any) =>
    `$${Number(params.value).toLocaleString()}`;

  const columnDefs = useMemo<ColDef[]>(() => {
    if (filteredInterviews.length === 0) return [];
    const keys = Object.keys(filteredInterviews[0]);
    return keys.map(key => {
      const col: ColDef = {
        field: key,
        headerName: key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
        sortable: true,
        resizable: true,
        minWidth: 100,
      };

      if (key === "status") col.cellRenderer = StatusRenderer;
      if (key === "visaStatus" || key === "candidate_role") col.cellRenderer = VisaStatusRenderer;
      if (key === "interview_time") col.width = 110;
      if (key === "interview_date") col.width = 130;
      if (["interview_mode", "client_name", "interview_location"].includes(key)) col.flex = 1;
      if (key === "id") {
        col.pinned = "left";
        col.checkboxSelection = true;
        col.width = 80;
      }

      return col;
    });
  }, [filteredInterviews]);


    // PUT request on row update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${updatedRow.id}`, updatedRow);

      setAllInterviews(prev =>
        prev.map(row => row.id === updatedRow.id ? updatedRow : row)
      );
      setFilteredInterviews(prev =>
        prev.map(row => row.id === updatedRow.id ? updatedRow : row)
      );
    } catch (err) {


      // console.error("Failed to update interview:", err);

      alert("Failed to update interview.");
    }
  };

  // DELETE request on row deletion
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${id}`);

      setAllInterviews(prev => prev.filter(row => row.id !== id));
      setFilteredInterviews(prev => prev.filter(row => row.id !== id));
    } catch (err) {

      // console.error("Failed to delete interview:", err);
      alert("Failed to delete interview.");
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates scheduled for interviews and assessment sessions
          </p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white">
          <PlusIcon className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Search..."
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredInterviews.length} result(s)
          </p>
        )}
      </div>

      {/* Loading, Error, or Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center mt-8 text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredInterviews}
              columnDefs={columnDefs}
              title={`Interviews (${filteredInterviews.length})`}
              height="500px"
              showSearch={false}
              // onRowClicked={e => console.log("Row clicked:", e.data)}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={(id: number | string) => handleRowDeleted(id)}
              
            />
          </div>
        </div>
      )}
    </div>
  );
}
