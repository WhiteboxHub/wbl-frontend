// // whiteboxLearning-wbl/app/avatar/candidates/marketing/page.tsx
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

// export default function CandidatesMarketingPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true); // Prevent hydration mismatch
//   }, []);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//            `${process.env.NEXT_PUBLIC_API_URL}/candidates/marketing?page=${page}&limit=${limit}`
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
//       "Green Card":
//         "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
//       "F1 Student":
//         "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//       L1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//       OPT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//       "H4 EAD":
//         "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
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
//     `$${parseFloat(params.value || 0).toLocaleString()}`;

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
//       ) : mounted ? (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Marketing Phase (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowClicked={(event) =>
//                 console.log("Row clicked:", event.data)
//               }
//             />
//           </div>
//         </div>
//       ) : null}
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

// export default function CandidatesMarketingPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page] = useState(1);
//   const [limit] = useState(100);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true); // Prevent hydration mismatch
//   }, []);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidates/marketing?page=${page}&limit=${limit}`
//         );
//         const data = await res.json();

//         if (!Array.isArray(data)) {
//           throw new Error("Invalid data format");
//         }

//         setAlls(data);
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
//       "Green Card":
//         "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
//       "F1 Student":
//         "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
//       L1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//       OPT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
//       "H4 EAD":
//         "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
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
//     `$${parseFloat(params.value || 0).toLocaleString()}`;

//   const columnDefs: ColDef[] = useMemo(() => {
//     const allKeys = new Set<string>();
//     filteredCandidates.forEach((row) => {
//       Object.keys(row).forEach((key) => allKeys.add(key));
//     });

//     const keysArray = Array.from(allKeys);
//     const candidateIdKey =
//       keysArray.find((key) => key.toLowerCase() === "candidateid") ||
//       keysArray.find((key) => key.toLowerCase() === "id");

//     const reorderedKeys = candidateIdKey
//       ? [candidateIdKey, ...keysArray.filter((k) => k !== candidateIdKey)]
//       : keysArray;

//     return reorderedKeys.map((key) => {
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
//         col.headerName = "Work Status";
//         col.cellRenderer = VisaStatusRenderer;
//       } else if (key === "feepaid" || key === "amountPaid") {
//         col.cellRenderer = AmountRenderer;
//         col.type = "numericColumn";
//       } else if (key.toLowerCase().includes("date")) {
//         col.width = 130;
//       } else if (key.toLowerCase().includes("phone")) {
//         col.width = 150;
//       }

//       if (key === candidateIdKey) {
//         col.pinned = "left";
//         col.width = 80;
//         col.checkboxSelection = true;
//       }

//       return col;
//     });
//   }, [filteredCandidates]);

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
//       ) : mounted ? (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCandidates}
//               columnDefs={columnDefs}
//               title={`Marketing Phase (${filteredCandidates.length})`}
//               height="calc(70vh)"
//               showSearch={false}
//               onRowClicked={(event) =>
//                 console.log("Row clicked:", event.data)
//               }
//             />
//           </div>
//         </div>
//       ) : null}
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
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(100);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Prevent hydration mismatch
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/candidates/marketing?page=${page}&limit=${limit}`
        );
        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format");
        }

        setAllCandidates(data);
        setFilteredCandidates(data);
      } catch (err) {
        // console.error(err);
        setError("Failed to load candidates.");
      } finally {
        setLoading(false);
      }
    };

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
    const filtered = filterCandidates(searchTerm);
    setFilteredCandidates(filtered);
  }, [searchTerm, filterCandidates]);

  const StatusRenderer = (params: any) => (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
      {params.value?.toUpperCase()}
    </Badge>
  );

  const VisaStatusRenderer = (params: any) => {
    const visaColors: Record<string, string> = {
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

    const visaAliases: Record<string, string> = {
      "Green Card": "GC",
      "US Citizen": "Citizen",
      F1: "F1 Student",
    };

    const raw = typeof params.value === "string" ? params.value.trim() : "";
    const normalized = visaAliases[raw] || raw;

    return (
      <Badge
        className={
          visaColors[normalized] ||
          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }
      >
        {normalized || "N/A"}
      </Badge>
    );
  };

  const AmountRenderer = (params: any) =>
    `$${parseFloat(params.value || 0).toLocaleString()}`;

  const columnDefs: ColDef[] = useMemo(() => {
    const allKeys = new Set<string>();
    filteredCandidates.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key));
    });

    const keysArray = Array.from(allKeys);
    const candidateIdKey =
      keysArray.find((key) => key.toLowerCase() === "candidateid") ||
      keysArray.find((key) => key.toLowerCase() === "id");

    const reorderedKeys = candidateIdKey
      ? [candidateIdKey, ...keysArray.filter((k) => k !== candidateIdKey)]
      : keysArray;

    return reorderedKeys.map((key) => {
      const col: ColDef = {
        field: key,
        headerName: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()),
        flex: 1,
        sortable: true,
        resizable: true,
      };

      if (key === "status") {
        col.cellRenderer = StatusRenderer;
      } else if (key === "workstatus" || key === "visaStatus") {
        col.headerName = "Work Status";
        col.cellRenderer = VisaStatusRenderer;
      } else if (key === "feepaid" || key === "amountPaid") {
        col.cellRenderer = AmountRenderer;
        col.type = "numericColumn";
      } else if (key.toLowerCase().includes("date")) {
        col.width = 130;
      } else if (key.toLowerCase().includes("phone")) {
        col.width = 150;
      }

      if (key === candidateIdKey) {
        col.pinned = "left";
        col.width = 80;
        col.checkboxSelection = true;
      }

      return col;
    });
  }, [filteredCandidates]);

    const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/${updatedRow.candidateid}`,
        updatedRow
      );

      setFilteredCandidates((prev) =>
        prev.map((row) =>
          row.candidateid === updatedRow.candidateid ? updatedRow : row
        )
      );
    } catch (error) {

      // console.error("Failed to update candidate:", error);

    }
  };


  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${id}`);

      setFilteredCandidates((prev) =>
        prev.filter((row) => row.candidateid !== id)
      );
    } catch (error) {

      // console.error("Failed to delete candidate:", error);

    }
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Marketing Phase Candidates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates currently in marketing phase
          </p>
        </div>
      </div>

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

      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : mounted ? (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Marketing Phase (${filteredCandidates.length})`}
              height="calc(70vh)"
              showSearch={false}

              // onRowClicked={(event) =>
              //   console.log("Row clicked:", event.data)
              // }
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}