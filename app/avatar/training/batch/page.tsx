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
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/admin_ui/dialog";
// import { toast, Toaster } from "sonner";

// import { apiFetch } from "@/lib/api.js"; // <-- shared wrapper used in vendor page

// export default function BatchPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
//   const [batches, setBatches] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [newBatch, setNewBatch] = useState({
//     batchname: "",
//     orientationdate: "",
//     subject: "ML",
//     startdate: "",
//     enddate: "",
//     courseid: "3", // default for ML
//   });

//   // Debounce search
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedSearch(searchTerm);
//     }, 500);
//     return () => clearTimeout(handler);
//   }, [searchTerm]);

//   // Fetch batches (uses apiFetch)
//   const fetchBatches = useCallback(async () => {
//     try {
//       setLoading(true);
//       const trimmedSearch = debouncedSearch.trim();
//       const isIdSearch = !isNaN(Number(trimmedSearch)) && trimmedSearch !== "";

//       let resData: any = null;
//       if (isIdSearch) {
//         // fetch single by id
//         const d = await apiFetch(`/batch/${trimmedSearch}`);
//         // apiFetch might return object or { data: ... }
//         resData = d && !Array.isArray(d) ? d : d?.data ?? d;
//         setBatches(resData ? [resData] : []);
//       } else if (trimmedSearch) {
//         const d = await apiFetch(`/batch?search=${encodeURIComponent(trimmedSearch)}`);
//         resData = Array.isArray(d) ? d : d?.data ?? [];
//         setBatches(resData);
//       } else {
//         const d = await apiFetch(`/batch`);
//         resData = Array.isArray(d) ? d : d?.data ?? [];
//         setBatches(resData);
//       }
//     } catch (err: any) {
//       // provide server message if available
//       toast.error(err?.message || err?.body || "Failed to fetch batches");
//       setBatches([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [debouncedSearch]);

//   useEffect(() => {
//     fetchBatches();
//   }, [fetchBatches]);

//   // Date formatter
//   const dateFormatter = (params: any) => {
//     const val = params?.value;
//     if (!val) return "";

//     if (val instanceof Date) {
//       return val.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
//     }

//     const s = String(val);
//     const dateStr = s.includes("T") ? s.split("T")[0] : s;
//     const parts = dateStr.split("-");
//     if (parts.length !== 3) return s;
//     const [year, month, day] = parts;
//     const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
//     return dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
//   };

//   // Subject badge renderer
//   const SubjectRenderer = (props: any) => {
//     const value = props.value || "";
//     const colors: Record<string, string> = {
//       QA: "bg-blue-100 text-blue-800",
//       UI: "bg-green-100 text-green-800",
//       ML: "bg-purple-100 text-purple-800",
//     };
//     const className =
//       "px-2 py-1 rounded-full text-xs font-medium " +
//       (colors[value] || "bg-gray-100 text-gray-800");
//     return <span className={className}>{value}</span>;
//   };

//   // AG Grid columns
//   const columnDefs: ColDef[] = useMemo<ColDef[]>(
//     () => [
//       { field: "batchid", headerName: "Batch ID", width: 170, pinned: "left" },
//       { field: "batchname", headerName: "Batch Name", width: 210, editable: true },
//       { field: "orientationdate", headerName: "Orientation Date", width: 220, editable: true, valueFormatter: dateFormatter },
//       { field: "subject", headerName: "Subject", width: 140, editable: true, cellRenderer: SubjectRenderer },
//       { field: "startdate", headerName: "Start Date", width: 200, editable: true, valueFormatter: dateFormatter },
//       { field: "enddate", headerName: "End Date", width: 210, editable: true, valueFormatter: dateFormatter },
//       { field: "courseid", headerName: "Course ID", width: 140 },
//     ],
//     []
//   );

//   // Update row
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       await apiFetch(`/batch/${updatedRow.batchid}`, {
//         method: "PUT",
//         body: updatedRow,
//       });
//       setBatches((prev) => prev.map((r) => (r.batchid === updatedRow.batchid ? updatedRow : r)));
//       toast.success("Batch updated successfully");
//     } catch (err: any) {
//       toast.error(err?.message || err?.body || "Failed to update batch");
//     }
//   };

//   // Delete row
//   const handleRowDeleted = async (id: number | string) => {
//     try {
//       await apiFetch(`/batch/${id}`, { method: "DELETE" });
//       setBatches((prev) => prev.filter((row) => row.batchid !== id));
//       toast.success(`Batch ${id} deleted`);
//     } catch (err: any) {
//       toast.error(err?.message || err?.body || "Failed to delete batch");
//     }
//   };

//   // Add new batch
//   const handleAddBatch = async () => {
//     try {
//       const res = await apiFetch(`/batch`, { method: "POST", body: newBatch });
//       // apiFetch may return created object directly or under data
//       const created = res && !Array.isArray(res) ? (res.data ?? res) : res;
//       setBatches((prev) => [...prev, created]);
//       setIsModalOpen(false);
//       setNewBatch({
//         batchname: "",
//         orientationdate: "",
//         subject: "ML",
//         startdate: "",
//         enddate: "",
//         courseid: "3",
//       });
//       toast.success("New batch created successfully");
//     } catch (err: any) {
//       toast.error(err?.message || err?.body || "Failed to create batch");
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <Toaster position="top-center" richColors />

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Batches</h1>
//           <p className="text-gray-600 dark:text-gray-400">Manage batches</p>
//         </div>
//         <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsModalOpen(true)}>
//           <PlusIcon className="h-4 w-4 mr-2" /> Add Batch
//         </Button>
//       </div>

//       {/* Search */}
//       <div className="max-w-md">
//         <Label htmlFor="search">Search by Batch Name or ID</Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Type batch name or numeric ID..."
//             className="pl-10"
//           />
//         </div>
//       </div>

//       {/* Table */}
//       {loading ? (
//         <p className="text-center mt-8">Loading...</p>
//       ) : batches.length === 0 ? (
//         <p className="text-center mt-8 text-gray-500">No batches found.</p>
//       ) : (
//         <AGGridTable
//           rowData={batches}
//           columnDefs={columnDefs}
//           title={`Batches (${batches.length})`}
//           height="600px"
//           showSearch={false}
//           onRowUpdated={handleRowUpdated}
//           onRowDeleted={handleRowDeleted}
//         />
//       )}

//       {/* Add Batch Modal */}
//       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Add New Batch</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="batchname">Batch Name (YYYY-MM)</Label>
//               <Input
//                 id="batchname"
//                 value={newBatch.batchname}
//                 placeholder="YYYY-MM"
//                 onChange={(e) => setNewBatch({ ...newBatch, batchname: e.target.value })}
//               />
//             </div>
//             <div>
//               <Label htmlFor="orientationdate">Orientation Date</Label>
//               <Input
//                 type="date"
//                 id="orientationdate"
//                 value={newBatch.orientationdate}
//                 onChange={(e) => setNewBatch({ ...newBatch, orientationdate: e.target.value })}
//               />
//             </div>
//             <div>
//               <Label htmlFor="subject">Subject</Label>
//               <select
//                 id="subject"
//                 value={newBatch.subject}
//                 onChange={(e) => {
//                   const selectedSubject = e.target.value;
//                   let courseid = "3"; // default ML
//                   if (selectedSubject === "QA") courseid = "1";
//                   else if (selectedSubject === "UI") courseid = "2";
//                   else if (selectedSubject === "ML") courseid = "3";
//                   setNewBatch({ ...newBatch, subject: selectedSubject, courseid });
//                 }}
//                 className="border rounded px-2 py-1 w-full dark:bg-gray-800 dark:text-white"
//               >
//                 <option value="QA">QA</option>
//                 <option value="UI">UI</option>
//                 <option value="ML">ML</option>
//               </select>
//             </div>
//             <div>
//               <Label htmlFor="startdate">Start Date</Label>
//               <Input
//                 type="date"
//                 id="startdate"
//                 value={newBatch.startdate}
//                 onChange={(e) => setNewBatch({ ...newBatch, startdate: e.target.value })}
//               />
//             </div>
//             <div>
//               <Label htmlFor="enddate">End Date</Label>
//               <Input
//                 type="date"
//                 id="enddate"
//                 value={newBatch.enddate}
//                 onChange={(e) => setNewBatch({ ...newBatch, enddate: e.target.value })}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
//             <Button onClick={handleAddBatch}>Save</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
"use client";

import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";
import { toast, Toaster } from "sonner";

import { apiFetch } from "@/lib/api.js"; // <- matches your src/utils/api.js

export default function BatchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batchname: "",
    orientationdate: "",
    subject: "ML",
    startdate: "",
    enddate: "",
    courseid: "3",
  });

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch batches (list / search / by id)
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const trimmed = debouncedSearch.trim();
      const isIdSearch = trimmed !== "" && !isNaN(Number(trimmed));

      if (isIdSearch) {
        const d = await apiFetch(`/batch/${trimmed}`);
        const single = d && !Array.isArray(d) ? d : d?.data ?? d;
        setBatches(single ? [single] : []);
      } else if (trimmed) {
        const d = await apiFetch(`/batch?search=${encodeURIComponent(trimmed)}`);
        const arr = Array.isArray(d) ? d : d?.data ?? [];
        setBatches(arr);
      } else {
        const d = await apiFetch(`/batch`);
        const arr = Array.isArray(d) ? d : d?.data ?? [];
        setBatches(arr);
      }
    } catch (err: any) {
      toast.error(err?.message || err?.body || "Failed to fetch batches");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Date formatter for AG Grid (safe)
  const dateFormatter = (params: any) => {
    const v = params?.value;
    if (!v) return "";
    if (v instanceof Date) {
      return v.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }
    const s = String(v);
    const datePart = s.includes("T") ? s.split("T")[0] : s;
    const parts = datePart.split("-");
    if (parts.length !== 3) return s;
    const [y, m, d] = parts;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Subject badge renderer
  const SubjectRenderer = (props: any) => {
    const value = props.value || "";
    const colors: Record<string, string> = {
      QA: "bg-blue-100 text-blue-800",
      UI: "bg-green-100 text-green-800",
      ML: "bg-purple-100 text-purple-800",
    };
    const className = "px-2 py-1 rounded-full text-xs font-medium " + (colors[value] || "bg-gray-100 text-gray-800");
    return <span className={className}>{value}</span>;
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "batchid", headerName: "Batch ID", width: 170, pinned: "left" },
      { field: "batchname", headerName: "Batch Name", width: 210, editable: true },
      { field: "orientationdate", headerName: "Orientation Date", width: 220, editable: true, valueFormatter: dateFormatter },
      { field: "subject", headerName: "Subject", width: 140, editable: true, cellRenderer: SubjectRenderer },
      { field: "startdate", headerName: "Start Date", width: 200, editable: true, valueFormatter: dateFormatter },
      { field: "enddate", headerName: "End Date", width: 210, editable: true, valueFormatter: dateFormatter },
      { field: "courseid", headerName: "Course ID", width: 140 },
    ],
    []
  );

  // Update a row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/batch/${updatedRow.batchid}`, { method: "PUT", body: updatedRow });
      setBatches((prev) => prev.map((r) => (r.batchid === updatedRow.batchid ? updatedRow : r)));
      toast.success("Batch updated successfully");
    } catch (err: any) {
      toast.error(err?.message || err?.body || "Failed to update batch");
    }
  };

  // Delete a row
  const handleRowDeleted = async (id: number | string) => {
    try {
      await apiFetch(`/batch/${id}`, { method: "DELETE" });
      setBatches((prev) => prev.filter((row) => row.batchid !== id));
      toast.success(`Batch ${id} deleted`);
    } catch (err: any) {
      toast.error(err?.message || err?.body || "Failed to delete batch");
    }
  };

  // Add new batch
  const handleAddBatch = async () => {
    try {
      const res = await apiFetch(`/batch`, { method: "POST", body: newBatch });
      const created = res && !Array.isArray(res) ? (res.data ?? res) : res;
      setBatches((prev) => [...prev, created]);
      setIsModalOpen(false);
      setNewBatch({
        batchname: "",
        orientationdate: "",
        subject: "ML",
        startdate: "",
        enddate: "",
        courseid: "3",
      });
      toast.success("New batch created successfully");
    } catch (err: any) {
      toast.error(err?.message || err?.body || "Failed to create batch");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Batches</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage batches</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" /> Add Batch
        </Button>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search by Batch Name or ID</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type batch name or numeric ID..."
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center mt-8">Loading...</p>
      ) : batches.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No batches found.</p>
      ) : (
        <AGGridTable
          rowData={batches}
          columnDefs={columnDefs}
          title={`Batches (${batches.length})`}
          height="600px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="batchname">Batch Name (YYYY-MM)</Label>
              <Input
                id="batchname"
                value={newBatch.batchname}
                placeholder="YYYY-MM"
                onChange={(e) => setNewBatch({ ...newBatch, batchname: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="orientationdate">Orientation Date</Label>
              <Input
                type="date"
                id="orientationdate"
                value={newBatch.orientationdate}
                onChange={(e) => setNewBatch({ ...newBatch, orientationdate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                value={newBatch.subject}
                onChange={(e) => {
                  const selected = e.target.value;
                  let courseid = "3";
                  if (selected === "QA") courseid = "1";
                  else if (selected === "UI") courseid = "2";
                  else if (selected === "ML") courseid = "3";
                  setNewBatch({ ...newBatch, subject: selected, courseid });
                }}
                className="border rounded px-2 py-1 w-full dark:bg-gray-800 dark:text-white"
              >
                <option value="QA">QA</option>
                <option value="UI">UI</option>
                <option value="ML">ML</option>
              </select>
            </div>

            <div>
              <Label htmlFor="startdate">Start Date</Label>
              <Input
                type="date"
                id="startdate"
                value={newBatch.startdate}
                onChange={(e) => setNewBatch({ ...newBatch, startdate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="enddate">End Date</Label>
              <Input
                type="date"
                id="enddate"
                value={newBatch.enddate}
                onChange={(e) => setNewBatch({ ...newBatch, enddate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBatch}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
