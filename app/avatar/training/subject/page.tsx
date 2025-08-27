// "use client";

// import React, { useEffect, useState } from "react";
// import { ColDef } from "ag-grid-community";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, Plus } from "lucide-react";
// import axios from "axios";

// const DateFormatter = (params: any) =>
//   params.value ? new Date(params.value).toLocaleString() : "";

// export default function SubjectPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [subjects, setSubjects] = useState<any[]>([]);
//   const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(20);

//   const fetchSubjects = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/subjects`
//       );
//       setSubjects(res.data);
//       setFilteredSubjects(res.data);
//     } catch (e: any) {
//       setError(e.response?.data?.detail || e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSubjects();
//   }, []);

//   // Search filter
//   useEffect(() => {
//     const lower = searchTerm.trim().toLowerCase();
//     if (!lower) return setFilteredSubjects(subjects);

//     const filtered = subjects.filter(
//       (row) =>
//         row.name?.toLowerCase().includes(lower) ||
//         row.description?.toLowerCase().includes(lower)
//     );
//     setFilteredSubjects(filtered);
//   }, [searchTerm, subjects]);

//   // Column definitions
//   useEffect(() => {
//     if (subjects.length > 0) {
//       const defs: ColDef[] = Object.keys(subjects[0]).map((key) => {
//         const col: ColDef = {
//           field: key,
//           headerName: key
//             .replace(/_/g, " ")
//             .replace(/\b\w/g, (l) => l.toUpperCase()),
//           width: 180,
//           editable: key !== "id" && key !== "lastmoddatetime",
//         };

//         if (key.toLowerCase().includes("date"))
//           col.valueFormatter = DateFormatter;

//         if (key === "id") {
//           col.pinned = "left";
//           col.width = 80;
//         }

//         return col;
//       });

//       setColumnDefs(defs);
//     }
//   }, [subjects]);

//   // Update row
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/subjects/${updatedRow.id}`,
//         updatedRow
//       );
//       setFilteredSubjects((prev) =>
//         prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
//       );
//     } catch (e) {
//       console.error("Update failed", e);
//     }
//   };

//   // Delete row
//   const handleRowDeleted = async (id: number) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/subjects/${id}`);
//       setFilteredSubjects((prev) => prev.filter((row) => row.id !== id));
//     } catch (e) {
//       console.error("Delete failed", e);
//     }
//   };

//   // Add subject
//   const handleAddSubject = async () => {
//     const newSubject = {
//       name: "New Subject",
//       description: "Description here...",
//     };

//     try {
//       const res = await axios.post(
//         `${process.env.NEXT_PUBLIC_API_URL}/subjects`,
//         newSubject
//       );
//       setFilteredSubjects((prev) => [...prev, res.data]);
//     } catch (e) {
//       console.error("Add failed", e);
//     }
//   };

//   if (loading) return <p className="text-center mt-8">Loading...</p>;
//   if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold">Subjects</h1>
//           <p>Manage all subjects here.</p>
//         </div>
//         <button
//           onClick={handleAddSubject}
//           className="flex items-center space-x-2 px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700"
//         >
//           <Plus className="h-4 w-4" />
//           <span>Add Subject</span>
//         </button>
//       </div>

//       <div className="max-w-md">
//         <Label htmlFor="search">Search</Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Search by name or description..."
//             className="pl-10"
//           />
//         </div>
//       </div>

//       <AGGridTable
//         rowData={filteredSubjects.slice((page - 1) * pageSize, page * pageSize)}
//         columnDefs={columnDefs}
//         title={`Subjects (${filteredSubjects.length})`}
//         height="calc(70vh)"
//         onRowUpdated={handleRowUpdated}
//         onRowDeleted={handleRowDeleted}
//         showSearch={false}
//       />

//       {/* Pagination */}
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
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";

const DateFormatter = (params: any) =>
  params.value ? new Date(params.value).toLocaleString() : "";

export default function SubjectPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/subjects`
      );
      setSubjects(res.data);
      setFilteredSubjects(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

//   // Search filter
//   useEffect(() => {
//     const lower = searchTerm.trim().toLowerCase();
//     if (!lower) return setFilteredSubjects(subjects);

//     const filtered = subjects.filter(
//       (row) =>
//         row.name?.toLowerCase().includes(lower) ||
//         row.description?.toLowerCase().includes(lower)
//     );
//     setFilteredSubjects(filtered);
//   }, [searchTerm, subjects]);

// Search filter
useEffect(() => {
  const lower = searchTerm.trim().toLowerCase();
  if (!lower) return setFilteredSubjects(subjects);

  const filtered = subjects.filter((row) => {
    const idMatch = row.id?.toString().includes(lower); // ✅ search by ID
    const nameMatch = row.name?.toLowerCase().includes(lower);
    const descMatch = row.description?.toLowerCase().includes(lower);

    return idMatch || nameMatch || descMatch;
  });

  setFilteredSubjects(filtered);
}, [searchTerm, subjects]);

  // Column definitions
  useEffect(() => {
    if (subjects.length > 0) {
      const defs: ColDef[] = Object.keys(subjects[0]).map((key) => {
        const col: ColDef = {
          field: key,
          headerName: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          width: 180,
          editable: key !== "id" && key !== "lastmoddatetime",
        };

        if (key.toLowerCase().includes("date"))
          col.valueFormatter = DateFormatter;

        if (key === "id") {
          col.pinned = "left";
          col.width = 80;
        }

        return col;
      });

      setColumnDefs(defs);
    }
  }, [subjects]);

  // Update row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/subjects/${updatedRow.id}`,
        updatedRow
      );
      setFilteredSubjects((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
      );
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  // Delete row
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/subjects/${id}`);
      setFilteredSubjects((prev) => prev.filter((row) => row.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p>Manage all subjects here.</p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Id name or description..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredSubjects.slice((page - 1) * pageSize, page * pageSize)}
        columnDefs={columnDefs}
        title={`Subjects (${filteredSubjects.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

      {/* Pagination */}
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
