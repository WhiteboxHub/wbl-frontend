// "use client";

// import React, { useEffect, useState } from "react";
// import { ColDef } from "ag-grid-community";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, Plus } from "lucide-react";
// import axios from "axios";

// const DateFormatter = (params: any) =>
//   params.value ? new Date(params.value).toLocaleString() : "";

// export default function CourseSubjectPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [courseSubjects, setCourseSubjects] = useState<any[]>([]);
//   const [filteredCourseSubjects, setFilteredCourseSubjects] = useState<any[]>(
//     []
//   );
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(20);

//   // Fetch all course-subject mappings
//   const fetchCourseSubjects = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/course-subjects`
//       );
//       setCourseSubjects(res.data);
//       setFilteredCourseSubjects(res.data);
//     } catch (e: any) {
//       setError(e.response?.data?.detail || e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCourseSubjects();
//   }, []);

//   // Search filter
//   useEffect(() => {
//     const lower = searchTerm.trim().toLowerCase();
//     if (!lower) return setFilteredCourseSubjects(courseSubjects);

//     const filtered = courseSubjects.filter(
//       (row) =>
//         row.course_id?.toString().includes(lower) ||
//         row.subject_id?.toString().includes(lower)
//     );
//     setFilteredCourseSubjects(filtered);
//   }, [searchTerm, courseSubjects]);

//   // Column definitions
//   useEffect(() => {
//     if (courseSubjects.length > 0) {
//       const defs: ColDef[] = Object.keys(courseSubjects[0]).map((key) => {
//         const col: ColDef = {
//           field: key,
//           headerName: key
//             .replace(/_/g, " ")
//             .replace(/\b\w/g, (l) => l.toUpperCase()),
//           width: 180,
//           editable: false, // IDs not editable
//         };

//         if (key.toLowerCase().includes("date"))
//           col.valueFormatter = DateFormatter;

//         if (key === "course_id" || key === "subject_id") {
//           col.pinned = "left";
//           col.width = 120;
//         }

//         return col;
//       });

//       setColumnDefs(defs);
//     }
//   }, [courseSubjects]);

//   // Add new mapping
//   const handleAddCourseSubject = async () => {
//     const courseId = prompt("Enter Course ID:");
//     const subjectId = prompt("Enter Subject ID:");

//     if (!courseId || !subjectId) return;

//     const newMapping = {
//       course_id: Number(courseId),
//       subject_id: Number(subjectId),
//     };

//     try {
//       const res = await axios.post(
//         `${process.env.NEXT_PUBLIC_API_URL}/course-subjects`,
//         newMapping
//       );
//       setFilteredCourseSubjects((prev) => [...prev, res.data]);
//     } catch (e: any) {
//       alert(e.response?.data?.detail || "Add failed");
//     }
//   };

//   // Delete mapping
//   const handleRowDeleted = async (row: any) => {
//     try {
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/course-subjects`,
//         {
//           params: { course_id: row.course_id, subject_id: row.subject_id },
//         }
//       );
//       setFilteredCourseSubjects((prev) =>
//         prev.filter(
//           (r) =>
//             !(
//               r.course_id === row.course_id && r.subject_id === row.subject_id
//             )
//         )
//       );
//     } catch (e: any) {
//       alert(e.response?.data?.detail || "Delete failed");
//     }
//   };

//   // Update mapping (basically refresh lastmoddatetime)
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/course-subjects`, {
//         course_id: updatedRow.course_id,
//         subject_id: updatedRow.subject_id,
//         lastmoddatetime: new Date().toISOString(),
//       });
//     } catch (e) {
//       console.error("Update failed", e);
//     }
//   };

//   if (loading) return <p className="text-center mt-8">Loading...</p>;
//   if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold">Course-Subject Relationships</h1>
//           <p>Manage mappings between courses and subjects.</p>
//         </div>
//         <button
//           onClick={handleAddCourseSubject}
//           className="flex items-center space-x-2 px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700"
//         >
//           <Plus className="h-4 w-4" />
//           <span>Add Mapping</span>
//         </button>
//       </div>

//       <div className="max-w-md">
//         <Label htmlFor="search">Search</Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2  h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Enter course ID or subject ID..."
//             className="pl-10"
//           />
//         </div>
//       </div>

//       <AGGridTable
//         rowData={filteredCourseSubjects.slice(
//           (page - 1) * pageSize,
//           page * pageSize
//         )}
//         columnDefs={columnDefs}
//         title={`Course-Subject Mappings (${filteredCourseSubjects.length})`}
//         height="calc(70vh)"
//         onRowUpdated={handleRowUpdated}
//         onRowDeleted={(row) => handleRowDeleted(row)}
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
//above working
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

export default function CourseSubjectPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSubjects, setCourseSubjects] = useState<any[]>([]);
  const [filteredCourseSubjects, setFilteredCourseSubjects] = useState<any[]>(
    []
  );
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch all course-subject mappings
  const fetchCourseSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/course-subjects`
      );
      setCourseSubjects(res.data);
      setFilteredCourseSubjects(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseSubjects();
  }, []);


// Search filter
useEffect(() => {
  const lower = searchTerm.trim().toLowerCase();
  if (!lower) return setFilteredCourseSubjects(courseSubjects);

  const filtered = courseSubjects.filter((row) => {
    const courseIdStr = row.course_id?.toString() || "";
    const subjectIdStr = row.subject_id?.toString() || "";

    //  searches like "1 22" or "22 1"
    const parts = lower.split(/\s+/).filter(Boolean); // split by space
    if (parts.length === 2) {
      return (
        (parts[0] === courseIdStr && parts[1] === subjectIdStr) ||
        (parts[1] === courseIdStr && parts[0] === subjectIdStr)
      );
    }

    // Normal  search
    return (
      courseIdStr.includes(lower) ||
      subjectIdStr.includes(lower) ||
      `${courseIdStr}-${subjectIdStr}`.includes(lower)
    );
  });

  setFilteredCourseSubjects(filtered);
}, [searchTerm, courseSubjects]);

  // Column definitions
  useEffect(() => {
    if (courseSubjects.length > 0) {
      const defs: ColDef[] = Object.keys(courseSubjects[0]).map((key) => {
        const col: ColDef = {
          field: key,
          headerName: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          width: 180,
          editable: false, // IDs not editable
        };

        if (key.toLowerCase().includes("date"))
          col.valueFormatter = DateFormatter;

        if (key === "course_id" || key === "subject_id") {
          col.pinned = "left";
          col.width = 120;
        }

        return col;
      });

      setColumnDefs(defs);
    }
  }, [courseSubjects]);


// Delete mapping - FIXED
const handleRowDeleted = async (row: any) => {
  try {
    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/course-subjects?course_id=${row.course_id}&subject_id=${row.subject_id}`
    );
    setFilteredCourseSubjects((prev) =>
      prev.filter(
        (r) =>
          !(r.course_id === row.course_id && r.subject_id === row.subject_id)
      )
    );
  } catch (e: any) {
    console.error("Delete failed", e);
    setError(e.response?.data?.detail || "Delete failed");
    alert(e.response?.data?.detail || "Delete failed");
  }
};
  // Update mapping (basically refresh lastmoddatetime)
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/course-subjects`, {
//         course_id: updatedRow.course_id,
//         subject_id: updatedRow.subject_id,
//         lastmoddatetime: new Date().toISOString(),
//       });
//     } catch (e) {
//       console.error("Update failed", e);
//     }
//   };
// Update mapping 
const handleRowUpdated = async (updatedRow: any) => {
  try {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/course-subjects`,
      {
        course_id: updatedRow.course_id,
        subject_id: updatedRow.subject_id,
        lastmoddatetime: new Date().toISOString(),
      }
    );
    
    // Update the local state with the response data
    setFilteredCourseSubjects((prev) =>
      prev.map((r) =>
        r.course_id === updatedRow.course_id && r.subject_id === updatedRow.subject_id
          ? response.data
          : r
      )
    );
  } catch (e: any) {
    console.error("Update failed", e);
    setError(e.response?.data?.detail || "Update failed");
  }
};

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Course-Subject Relationships</h1>
          <p>Manage mappings between courses and subjects.</p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2  h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter course ID or subject ID..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredCourseSubjects.slice(
          (page - 1) * pageSize,
          page * pageSize
        )}
        columnDefs={columnDefs}
        title={`Course-Subject Mappings (${filteredCourseSubjects.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={(row) => handleRowDeleted(row)}
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
