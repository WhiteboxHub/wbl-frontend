// "use client";

// import React, { useEffect, useState } from "react";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { ColDef } from "ag-grid-community";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, PlusCircle } from "lucide-react";
// import axios from "axios";
// import { Dialog } from "@/components/admin_ui/dialog"; // if you have shadcn dialog
// import { Button } from "@/components/admin_ui/button";

// // Date Formatter
// const DateFormatter = (params: any) =>
//   params.value ? new Date(params.value).toLocaleString() : "";

// export default function CoursePage() {
//   const [courses, setCourses] = useState<any[]>([]);
//   const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(20);

//   // Add Course Modal state
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [newCourse, setNewCourse] = useState({
//     name: "",
//     alias: "",
//     description: "",
//     syllabus: "",
//   });

//   // Fetch courses
//   const fetchCourses = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`);
//       setCourses(res.data);
//       setFilteredCourses(res.data);
//     } catch (e: any) {
//       setError(e.response?.data?.detail || e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCourses();
//   }, []);

//   // Apply search filter (id, name, alias)
//   useEffect(() => {
//     if (!searchTerm.trim()) {
//       setFilteredCourses(courses);
//       return;
//     }
//     const term = searchTerm.toLowerCase();
//     const filtered = courses.filter(
//       (c) =>
//         c.id?.toString().includes(term) ||
//         c.name?.toLowerCase().includes(term) ||
//         c.alias?.toLowerCase().includes(term)
//     );
//     setFilteredCourses(filtered);
//   }, [searchTerm, courses]);

//   // Setup column definitions
//   useEffect(() => {
//     if (courses.length > 0) {
//       const defs: ColDef[] = Object.keys(courses[0]).map((key) => {
//         const header = key
//           .replace(/([a-z])([A-Z])/g, "$1 $2")
//           .replace(/\b\w/g, (c) => c.toUpperCase());

//         const col: ColDef = {
//           field: key,
//           headerName: header,
//           width: 180,
//           editable: !["id", "lastmoddatetime"].includes(key),
//         };

//         if (key === "id") {
//           col.pinned = "left";
//           col.editable = false;
//           col.width = 80;
//         }
//         if (key === "lastmoddatetime") {
//           col.valueFormatter = DateFormatter;
//           col.editable = false;
//         }
//         if (["description", "syllabus"].includes(key)) {
//           col.width = 300;
//         }
//         return col;
//       });

//       setColumnDefs(defs);
//     }
//   }, [courses]);

//   // Update row
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/courses/${updatedRow.id}`,
//         updatedRow
//       );
//       setFilteredCourses((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (error) {
//       console.error("Update failed", error);
//       alert("Update failed. Check logs.");
//     }
//   };

//   // Delete row
//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`);
//       setFilteredCourses((prev) => prev.filter((row) => row.id !== id));
//     } catch (error) {
//       console.error("Delete failed", error);
//       alert("Delete failed. Check logs.");
//     }
//   };

//   // Add new course
//   const handleAddCourse = async () => {
//     if (!newCourse.name || !newCourse.alias) {
//       alert("Name and Alias are required.");
//       return;
//     }
//     try {
//       const res = await axios.post(
//         `${process.env.NEXT_PUBLIC_API_URL}/courses`,
//         newCourse
//       );
//       setCourses((prev) => [...prev, res.data]);
//       setFilteredCourses((prev) => [...prev, res.data]);
//       setIsModalOpen(false);
//       setNewCourse({ name: "", alias: "", description: "", syllabus: "" });
//     } catch (e: any) {
//       alert(e.response?.data?.detail || "Failed to add course");
//     }
//   };

//   if (loading) return <p className="text-center mt-8">Loading...</p>;
//   if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

//   return (
//     <div className="space-y-6">
//       {/* Header + Add Button */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold">Courses</h1>
//           <p>Browse, search, and manage courses.</p>
//         </div>
//         <Button
//           onClick={() => setIsModalOpen(true)}
//           className="flex items-center space-x-2"
//         >
//           <PlusCircle className="w-4 h-4" />
//           <span>Add Course</span>
//         </Button>
//       </div>

//       {/* Search */}
//       <div className="max-w-md">
//         <Label htmlFor="search">Search Courses (ID, Name, Alias)</Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Search by ID, name, or alias..."
//             className="pl-10"
//           />
//         </div>
//         {searchTerm && <p>{filteredCourses.length} found</p>}
//       </div>

//       {/* Data Table */}
//       <AGGridTable
//         rowData={filteredCourses.slice((page - 1) * pageSize, page * pageSize)}
//         columnDefs={columnDefs}
//         title={`All Courses (${filteredCourses.length})`}
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
//             disabled={page * pageSize >= filteredCourses.length}
//             className="px-2 py-1 border rounded text-sm"
//           >
//             Next
//           </button>
//         </div>
//       </div>

//       {/* Add Course Modal */}
//       {isModalOpen && (
//         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//           <div className="p-6 space-y-4">
//             <h2 className="text-lg font-bold">Add New Course</h2>
//             <Input
//               placeholder="Name"
//               value={newCourse.name}
//               onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
//             />
//             <Input
//               placeholder="Alias"
//               value={newCourse.alias}
//               onChange={(e) => setNewCourse({ ...newCourse, alias: e.target.value })}
//             />
//             <Input
//               placeholder="Description"
//               value={newCourse.description}
//               onChange={(e) =>
//                 setNewCourse({ ...newCourse, description: e.target.value })
//               }
//             />
//             <Input
//               placeholder="Syllabus"
//               value={newCourse.syllabus}
//               onChange={(e) =>
//                 setNewCourse({ ...newCourse, syllabus: e.target.value })
//               }
//             />
//             <div className="flex justify-end space-x-2">
//               <Button variant="outline" onClick={() => setIsModalOpen(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleAddCourse}>Save</Button>
//             </div>
//           </div>
//         </Dialog>
//       )}
//     </div>
//   );
// }

//try1
// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Button } from "@/components/admin_ui/button";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, PlusIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useCallback } from "react";
// import axios from "axios";

// // Define the Course interface based on your schema
// interface Course {
//   id: number;
//   name: string;
//   alias: string;
//   description?: string;
//   syllabus?: string;
//   lastmoddatetime?: string;
// }

// export default function CoursesPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [allCourses, setAllCourses] = useState<Course[]>([]);
//   const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
//   // Form state for creating
//   const [formData, setFormData] = useState({
//     name: "",
//     alias: "",
//     description: "",
//     syllabus: ""
//   });

//   // Fetch courses from backend
//   useEffect(() => {
//     const fetchCourses = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/courses`
//         );
//         if (!res.ok) throw new Error("Failed to load courses");
//         const data = await res.json();
//         setAllCourses(data);
//         setFilteredCourses(data);
//       } catch (err) {
//         setError("Failed to load courses.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCourses();
//   }, []);

//   // Search/filter logic
//   const filterData = useCallback(
//     (term: string) => {
//       if (!term.trim()) return allCourses;
//       const lower = term.toLowerCase();
//       return allCourses.filter((course) =>
//         Object.values(course).some((val) =>
//           val?.toString().toLowerCase().includes(lower)
//         )
//       );
//     },
//     [allCourses]
//   );

//   useEffect(() => {
//     setFilteredCourses(filterData(searchTerm));
//   }, [searchTerm, filterData]);

//   // Handle create new course
//   const handleCreateCourse = async () => {
//     try {
//       const response = await axios.post(
//         `${process.env.NEXT_PUBLIC_API_URL}/courses`,
//         formData
//       );

//       // Add the new course to our state
//       const newCourse = response.data;
//       setAllCourses(prev => [...prev, newCourse]);
//       setFilteredCourses(prev => [...prev, newCourse]);
      
//       // Reset form and close dialog
//       setFormData({
//         name: "",
//         alias: "",
//         description: "",
//         syllabus: ""
//       });
//       setIsCreateDialogOpen(false);
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to create course.");
//     }
//   };

//   // PUT request on row update
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/courses/${updatedRow.id}`,
//         updatedRow
//       );

//       setAllCourses((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//       setFilteredCourses((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to update course.");
//     }
//   };

//   // DELETE request on row deletion
//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`
//       );

//       setAllCourses((prev) => prev.filter((row) => row.id !== id));
//       setFilteredCourses((prev) => prev.filter((row) => row.id !== id));
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to delete course.");
//     }
//   };

//   // Handle form input changes
//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   // Column definitions
//   const columnDefs = useMemo<ColDef[]>(() => {
//     return [
//       {
//         field: "id",
//         headerName: "ID",
//         pinned: "left",
//         checkboxSelection: true,
//         width: 80,
//       },
//       { field: "name", headerName: "Course Name", sortable: true, minWidth: 150, editable: true },
//       { field: "alias", headerName: "Alias", sortable: true, minWidth: 120, editable: true },
//       { 
//         field: "description", 
//         headerName: "Description", 
//         flex: 1,
//         editable: true,
//         cellRenderer: (params: any) => {
//           return params.value ? 
//             <span title={params.value}>
//               {params.value.length > 50 ? `${params.value.substring(0, 50)}...` : params.value}
//             </span> : 
//             <span className="text-gray-400">No description</span>;
//         }
//       },
//       { 
//         field: "syllabus", 
//         headerName: "Syllabus", 
//         flex: 1,
//         editable: true,
//         cellRenderer: (params: any) => {
//           return params.value ? 
//             <span title={params.value}>
//               {params.value.length > 50 ? `${params.value.substring(0, 50)}...` : params.value}
//             </span> : 
//             <span className="text-gray-400">No syllabus</span>;
//         }
//       },
//       { 
//         field: "lastmoddatetime", 
//         headerName: "Last Modified", 
//         minWidth: 160,
//         valueFormatter: (params: any) => {
//           return params.value ? new Date(params.value).toLocaleString() : 'N/A';
//         }
//       }
//     ];
//   }, []);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             Courses
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Manage all available courses in the system
//           </p>
//         </div>
//         <Button 
//           className="bg-whitebox-600 hover:bg-whitebox-700 text-white"
//           onClick={() => setIsCreateDialogOpen(true)}
//         >
//           <PlusIcon className="h-4 w-4 mr-2" />
//           Add Course
//         </Button>
//       </div>

//       {/* Search Input */}
//       <div className="max-w-md">
//         <Label
//           htmlFor="search"
//           className="text-sm font-medium text-gray-700 dark:text-gray-300"
//         >
//           Search
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             value={searchTerm}
//             placeholder="Search courses..."
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         {searchTerm && (
//           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {filteredCourses.length} result(s)
//           </p>
//         )}
//       </div>

//       {/* Loading, Error, or Table */}
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
//           Loading...
//         </p>
//       ) : error ? (
//         <p className="text-center mt-8 text-red-500">{error}</p>
//       ) : (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCourses}
//               columnDefs={columnDefs}
//               title={`Courses (${filteredCourses.length})`}
//               height="500px"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}

//       {/* Create Course Dialog */}
//       {isCreateDialogOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
//             <h2 className="text-xl font-bold mb-4">Create New Course</h2>
            
//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="create-name">Name *</Label>
//                 <Input
//                   id="create-name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   className="mt-1"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <Label htmlFor="create-alias">Alias *</Label>
//                 <Input
//                   id="create-alias"
//                   name="alias"
//                   value={formData.alias}
//                   onChange={handleInputChange}
//                   className="mt-1"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <Label htmlFor="create-description">Description</Label>
//                 <textarea
//                   id="create-description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   className="mt-1 w-full border rounded-md p-2 h-20"
//                 />
//               </div>
              
//               <div>
//                 <Label htmlFor="create-syllabus">Syllabus</Label>
//                 <textarea
//                   id="create-syllabus"
//                   name="syllabus"
//                   value={formData.syllabus}
//                   onChange={handleInputChange}
//                   className="mt-1 w-full border rounded-md p-2 h-32"
//                 />
//               </div>
//             </div>
            
//             <div className="flex justify-end space-x-2 mt-6">
//               <Button 
//                 variant="outline" 
//                 onClick={() => setIsCreateDialogOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button 
//                 onClick={handleCreateCourse}
//                 className="bg-whitebox-600 hover:bg-whitebox-700"
//               >
//                 Create Course
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
//try2
// "use client";

// import React, { useEffect, useState } from "react";
// import { ColDef } from "ag-grid-community";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { Button } from "@/components/admin_ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/admin_ui/dialog";
// import axios from "axios";

// const CoursesPage = () => {
//   const [allCourses, setAllCourses] = useState<any[]>([]);
//   const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

//   const [formData, setFormData] = useState({
//     name: "",
//     alias: "",
//     description: "",
//     syllabus: "",
//   });

//   // Fetch courses from backend
//   useEffect(() => {
//     const fetchCourses = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/courses` // ✅ FIXED
//         );
//         if (!res.ok) throw new Error("Failed to load courses");
//         const data = await res.json();
//         setAllCourses(data);
//         setFilteredCourses(data);
//       } catch (err) {
//         setError("Failed to load courses.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCourses();
//   }, []);

//   // Search filter
//   useEffect(() => {
//     const filtered = allCourses.filter((course) =>
//       Object.values(course).some((value) =>
//         value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
//       )
//     );
//     setFilteredCourses(filtered);
//   }, [searchQuery, allCourses]);

//   // Handle form input
//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // Create
//   const handleCreateCourse = async () => {
//     try {
//       const response = await axios.post(
//         `${process.env.NEXT_PUBLIC_API_URL}/courses`, // ✅ FIXED
//         formData
//       );

//       const newCourse = response.data;
//       setAllCourses((prev) => [...prev, newCourse]);
//       setFilteredCourses((prev) => [...prev, newCourse]);

//       setFormData({ name: "", alias: "", description: "", syllabus: "" });
//       setIsCreateDialogOpen(false);
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to create course.");
//     }
//   };

//   // Update
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/courses/${updatedRow.id}`, // ✅ FIXED
//         updatedRow
//       );

//       setAllCourses((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//       setFilteredCourses((prev) =>
//         prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
//       );
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to update course.");
//     }
//   };

//   // Delete
//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/courses/${id}` // ✅ FIXED
//       );

//       setAllCourses((prev) => prev.filter((row) => row.id !== id));
//       setFilteredCourses((prev) => prev.filter((row) => row.id !== id));
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to delete course.");
//     }
//   };

//   const columnDefs: ColDef[] = [
//     { field: "id", headerName: "ID", width: 80 },
//     { field: "name", headerName: "Name", flex: 1, editable: true },
//     { field: "alias", headerName: "Alias", flex: 1, editable: true },
//     { field: "description", headerName: "Description", flex: 1.5, editable: true },
//     { field: "syllabus", headerName: "Syllabus", flex: 1.5, editable: true },
//   ];

//   return (
//     <div className="p-4 md:p-6 space-y-4">
//       {/* Header Section */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//         <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
//           Courses <Badge variant="secondary">{allCourses.length}</Badge>
//         </h1>

//         <div className="flex items-center gap-2">
//           <Input
//             type="text"
//             placeholder="Search courses..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="max-w-xs"
//           />
//           <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
//             <DialogTrigger asChild>
//               <Button variant="default">+ Add Course</Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-lg">
//               <DialogHeader>
//                 <DialogTitle>Create New Course</DialogTitle>
//               </DialogHeader>
//               <div className="grid gap-4 py-4">
//                 <div className="space-y-2">
//                   <Label>Name</Label>
//                   <Input
//                     name="name"
//                     value={formData.name}
//                     onChange={handleInputChange}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Alias</Label>
//                   <Input
//                     name="alias"
//                     value={formData.alias}
//                     onChange={handleInputChange}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Description</Label>
//                   <Input
//                     name="description"
//                     value={formData.description}
//                     onChange={handleInputChange}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Syllabus</Label>
//                   <Input
//                     name="syllabus"
//                     value={formData.syllabus}
//                     onChange={handleInputChange}
//                   />
//                 </div>
//               </div>
//               <Button onClick={handleCreateCourse}>Create</Button>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* Error or Loading */}
//       {loading && <p>Loading courses...</p>}
//       {error && <p className="text-red-500">{error}</p>}

//       {/* AG Grid */}
//       <AGGridTable
//         rowData={filteredCourses}
//         columnDefs={columnDefs}
//         onRowUpdated={handleRowUpdated}
//         onRowDeleted={handleRowDeleted}
//         height="600px"
//       />
//     </div>
//   );
// };

// export default CoursesPage;
// try2------------>-------------------------->
// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Button } from "@/components/admin_ui/button";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, PlusIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useCallback } from "react";
// import axios from "axios";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/admin_ui/dialog";

// interface Course {
//   id: number;
//   name: string;
//   alias: string;
//   description: string;
//   syllabus: string;
//   lastmoddatetime: string;
// }

// export default function CoursesPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [allCourses, setAllCourses] = useState<Course[]>([]);
//   const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     name: "",
//     alias: "",
//     description: "",
//     syllabus: "",
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [formError, setFormError] = useState("");

//   // Fetch courses from backend
//   useEffect(() => {
//     const fetchCourses = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/`);
//         if (!res.ok) throw new Error("Failed to load courses");
//         const data = await res.json();
//         setAllCourses(data);
//         setFilteredCourses(data);
//       } catch (err) {
//         setError("Failed to load courses.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCourses();
//   }, []);

//   // Search/filter logic
//   const filterData = useCallback((term: string) => {
//     if (!term.trim()) return allCourses;
//     const lower = term.toLowerCase();
//     return allCourses.filter(course =>
//       course.name.toLowerCase().includes(lower) ||
//       course.alias.toLowerCase().includes(lower) ||
//       course.description.toLowerCase().includes(lower)
//     );
//   }, [allCourses]);

//   useEffect(() => {
//     setFilteredCourses(filterData(searchTerm));
//   }, [searchTerm, filterData]);

//   const DateRenderer = (params: any) => {
//     if (!params.value) return null;
//     const date = new Date(params.value);
//     return date.toLocaleDateString();
//   };

//   const columnDefs = useMemo<ColDef[]>(() => [
//     {
//       field: "id",
//       headerName: "ID",
//       width: 80,
//       pinned: "left",
//       checkboxSelection: true,
//     },
//     {
//       field: "name",
//       headerName: "Name",
//       flex: 1,
//       sortable: true,
//       resizable: true,
//     },
//     {
//       field: "alias",
//       headerName: "Alias",
//       flex: 1,
//       sortable: true,
//       resizable: true,
//     },
//     {
//       field: "description",
//       headerName: "Description",
//       flex: 2,
//       sortable: true,
//       resizable: true,
//       cellRenderer: (params: any) => {
//         const desc = params.value || "";
//         return desc.length > 100 ? `${desc.substring(0, 100)}...` : desc;
//       }
//     },
//     {
//       field: "syllabus",
//       headerName: "Syllabus",
//       flex: 2,
//       sortable: true,
//       resizable: true,
//       cellRenderer: (params: any) => {
//         const syllabus = params.value || "";
//         return syllabus.length > 100 ? `${syllabus.substring(0, 100)}...` : syllabus;
//       }
//     },
//     {
//       field: "lastmoddatetime",
//       headerName: "Last Modified",
//       width: 150,
//       sortable: true,
//       resizable: true,
//       cellRenderer: DateRenderer,
//     }
//   ], []);

//   // PUT request on row update
//   const handleRowUpdated = async (updatedRow: Course) => {
//     try {
//       await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/courses/${updatedRow.id}`, updatedRow);

//       setAllCourses(prev =>
//         prev.map(row => row.id === updatedRow.id ? updatedRow : row)
//       );
//       setFilteredCourses(prev =>
//         prev.map(row => row.id === updatedRow.id ? updatedRow : row)
//       );
//     } catch (err) {
//       alert("Failed to update course.");
//     }
//   };

//   // DELETE request on row deletion
//   const handleRowDeleted = async (id: number) => {
//     try {
//       await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`);

//       setAllCourses(prev => prev.filter(row => row.id !== id));
//       setFilteredCourses(prev => prev.filter(row => row.id !== id));
//     } catch (err) {
//       alert("Failed to delete course.");
//     }
//   };

//   // Handle form input changes
//   const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   // POST request to add a new course
//   const handleAddCourse = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setFormError("");

//     // Basic validation
//     if (!formData.name.trim() || !formData.alias.trim()) {
//       setFormError("Name and alias are required");
//       setIsSubmitting(false);
//       return;
//     }

//     // Alias validation (alphanumeric and hyphens only)
//     const aliasRegex = /^[a-zA-Z0-9-]+$/;
//     if (!aliasRegex.test(formData.alias)) {
//       setFormError("Alias can only contain letters, numbers, and hyphens");
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/courses/`, formData);
//       const newCourse = response.data;
      
//       setAllCourses(prev => [...prev, newCourse]);
//       setFilteredCourses(prev => [...prev, newCourse]);
      
//       // Reset form
//       setFormData({
//         name: "",
//         alias: "",
//         description: "",
//         syllabus: "",
//       });
//       setIsDialogOpen(false);
      
//     } catch (err: any) {
//       setFormError(err.response?.data?.detail || "Failed to add course. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Courses</h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Manage all available courses in the system
//           </p>
//         </div>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white">
//               <PlusIcon className="h-4 w-4 mr-2" />
//               Add Course
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>Add New Course</DialogTitle>
//             </DialogHeader>
            
//             {/* Course Form */}
//             <form onSubmit={handleAddCourse} className="space-y-4 py-4">
//               {formError && (
//                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//                   {formError}
//                 </div>
//               )}
              
//               <div className="space-y-2">
//                 <Label htmlFor="name">Course Name *</Label>
//                 <Input
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleFormChange}
//                   placeholder="Enter course name"
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="alias">Alias *</Label>
//                 <Input
//                   id="alias"
//                   name="alias"
//                   value={formData.alias}
//                   onChange={handleFormChange}
//                   placeholder="Enter course alias (e.g., java-basics)"
//                   required
//                 />
//                 <p className="text-sm text-gray-500">Alias must be unique and contain only letters, numbers, and hyphens</p>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="description">Description</Label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleFormChange}
//                   placeholder="Enter course description"
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-whitebox-600 focus:border-transparent"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="syllabus">Syllabus</Label>
//                 <textarea
//                   id="syllabus"
//                   name="syllabus"
//                   value={formData.syllabus}
//                   onChange={handleFormChange}
//                   placeholder="Enter course syllabus"
//                   rows={4}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-whitebox-600 focus:border-transparent"
//                 />
//               </div>

//               <div className="flex justify-end space-x-2 pt-4">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setIsDialogOpen(false)}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="bg-whitebox-600 hover:bg-whitebox-700"
//                 >
//                   {isSubmitting ? "Adding..." : "Add Course"}
//                 </Button>
//               </div>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Search Input */}
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Search
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             value={searchTerm}
//             placeholder="Search by name, alias, or description..."
//             onChange={e => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         {searchTerm && (
//           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {filteredCourses.length} result(s)
//           </p>
//         )}
//       </div>

//       {/* Loading, Error, or Table */}
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
//           Loading...
//         </p>
//       ) : error ? (
//         <p className="text-center mt-8 text-red-500">{error}</p>
//       ) : (
//         <div className="flex justify-center w-full">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredCourses}
//               columnDefs={columnDefs}
//               title={`Courses (${filteredCourses.length})`}
//               height="500px"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={(id: number | string) => handleRowDeleted(Number(id))}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// } 
//try3
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

export default function CoursePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`
      );
      setCourses(res.data);
      setFilteredCourses(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // // Search filter
  // useEffect(() => {
  //   const lower = searchTerm.trim().toLowerCase();
  //   if (!lower) return setFilteredCourses(courses);

  //   const filtered = courses.filter(
  //     (row) =>
  //       row.name?.toLowerCase().includes(lower) ||
  //       row.alias?.toLowerCase().includes(lower) ||
  //       row.description?.toLowerCase().includes(lower)
  //   );
  //   setFilteredCourses(filtered);
  // }, [searchTerm, courses]);

  // Search filter
useEffect(() => {
  const lower = searchTerm.trim().toLowerCase();
  if (!lower) return setFilteredCourses(courses);

  const filtered = courses.filter((row) => {
    const idMatch = row.id?.toString().includes(lower); // ✅ Convert id to string for matching
    const nameMatch = row.name?.toLowerCase().includes(lower);
    const aliasMatch = row.alias?.toLowerCase().includes(lower);
    const descMatch = row.description?.toLowerCase().includes(lower);

    return idMatch || nameMatch || aliasMatch || descMatch;
  });

  setFilteredCourses(filtered);
}, [searchTerm, courses]);

  // Column definitions
  useEffect(() => {
    if (courses.length > 0) {
      const defs: ColDef[] = Object.keys(courses[0]).map((key) => {
        const col: ColDef = {
          field: key,
          headerName: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          width: 200,
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
  }, [courses]);

  // Update row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${updatedRow.id}`,
        updatedRow
      );
      setFilteredCourses((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
      );
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  // Delete row
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`);
      setFilteredCourses((prev) => prev.filter((row) => row.id !== id));
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
          <h1 className="text-2xl font-bold">Courses</h1>
          <p>Manage all courses here.</p>
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
            placeholder="Search by Id name, alias, or description..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredCourses.slice((page - 1) * pageSize, page * pageSize)}
        columnDefs={columnDefs}
        title={`Courses (${filteredCourses.length})`}
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
