
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
//     } catch {
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

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       {
//         field: "candidate.full_name",
//         headerName: "Full Name",
//         minWidth: 150,
//         // valueGetter: (params) => params.data.candidate?.name || "N/A"
//       },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 110 },
  
//         {
//       headerName: "Instructor 1",
//       minWidth: 150,
//       valueGetter: (params) => params.data.instructor1?.name || "N/A",
//     },
//     {
//       headerName: "Instructor 2",
//       minWidth: 150,
//       valueGetter: (params) => params.data.instructor2?.name || "N/A",
//     },
//     {
//       headerName: "Instructor 3",
//       minWidth: 150,
//       valueGetter: (params) => params.data.instructor3?.name || "N/A",
//     },
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
//     } catch {
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
//       return allCandidates.filter((candidate) => {
//         // Explicitly check nested candidate.full_name
//         if (candidate.candidate?.full_name?.toLowerCase().includes(searchLower)) {
//           return true;
//         }
//         // Fallback: check all other values
//         return Object.values(candidate).some((val) =>
//           val?.toString().toLowerCase().includes(searchLower)
//         );
//       });
//     },
//     [allCandidates]
//   );

//   useEffect(() => {
//     setFilteredCandidates(filterCandidates(searchTerm));
//   }, [searchTerm, filterCandidates]);

//   // Helper: show summary of found candidates when searching
//   const candidateSummaries = (() => {
//     if (!searchTerm.trim()) return [];
//     return filteredCandidates.map((c) => {
//       const name = c.candidate?.full_name ?? "Unknown";
//       const status = c.status ?? "N/A";
//       return `${name} → Status: ${status}`;
//     });
//   })();

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     return [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       {
//         field: "candidate.full_name",
//         headerName: "Full Name",
//         minWidth: 150,
//       },
//       { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
//       { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
//       { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 110 },
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
//         {searchTerm && (
//           <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
//             <p>{filteredCandidates.length} candidate(s) found</p>
//             {candidateSummaries.map((line, idx) => (
//               <p key={idx}>{line}</p>
//             ))}
//           </div>
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




"use client";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
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
      return allCandidates.filter((candidate) => {
        if (candidate.candidate?.full_name?.toLowerCase().includes(searchLower)) {
          return true;
        }
        return Object.values(candidate).some((val) =>
          val?.toString().toLowerCase().includes(searchLower)
        );
      });
    },
    [allCandidates]
  );

  useEffect(() => {
    setFilteredCandidates(filterCandidates(searchTerm));
  }, [searchTerm, filterCandidates]);

  const candidateSummaries = (() => {
    if (!searchTerm.trim()) return [];
    return filteredCandidates.map((c) => {
      const name = c.candidate?.full_name ?? "Unknown";
      const status = c.status ?? "N/A";
      return `${name} → Status: ${status}`;
    });
  })();

  // Ref to detect outside click
  const filterRef = useRef<HTMLDivElement>(null);

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      { field: "candidate.full_name", headerName: "Full Name", minWidth: 150 },
      { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
      { field: "start_date", headerName: "Start Date", sortable: true, minWidth: 100 },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        maxWidth: 150,
        headerComponentFramework: () => {
          const [filterVisible, setFilterVisible] = useState(false);
          const [filterValue, setFilterValue] = useState<string>("");

          const toggleFilter = () => setFilterVisible(!filterVisible);

          const handleFilterChange = (value: string) => {
            setFilterValue(value);
            setFilterVisible(false);
            if (!value) {
              setFilteredCandidates(allCandidates);
            } else {
              setFilteredCandidates(allCandidates.filter(c => c.status === value));
            }
          };

          // Close dropdown when clicking outside
          useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
              if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setFilterVisible(false);
              }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
          }, []);

          return (
            <div className="relative flex items-center" ref={filterRef}>
              <span>Status</span>
              <svg
                onClick={toggleFilter}
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
              </svg>

              {filterVisible && (
                <div className="absolute top-full mt-1 left-0 z-50 bg-white border rounded shadow-lg p-1 flex flex-col space-y-1">
                  <button
                    onClick={() => handleFilterChange("Active")}
                    className="text-left px-2 py-1 hover:bg-gray-100"
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleFilterChange("Break")}
                    className="text-left px-2 py-1 hover:bg-gray-100"
                  >
                    Break
                  </button>
                  <button
                    onClick={() => handleFilterChange("Discontinued")}
                    className="text-left px-2 py-1 hover:bg-gray-100"
                  >
                    Discontinued
                  </button>
                </div>
              )}
            </div>
          );
        },
      },
      {
        headerName: "Instructor 1",
        minWidth: 150,
        valueGetter: (params) => params.data.instructor1?.name || "N/A",
      },
      {
        headerName: "Instructor 2",
        minWidth: 150,
        valueGetter: (params) => params.data.instructor2?.name || "N/A",
      },
      {
        headerName: "Instructor 3",
        minWidth: 150,
        valueGetter: (params) => params.data.instructor3?.name || "N/A",
      },
      { field: "rating", headerName: "Rating", minWidth: 100 },
      { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
      { field: "communication", headerName: "Communication", minWidth: 120 },
      { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
      { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
      { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
      { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
      { field: "notes", headerName: "Notes", minWidth: 90 },
    ];
  }, [allCandidates]);

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
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>{filteredCandidates.length} candidate(s) found</p>
            {candidateSummaries.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
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
