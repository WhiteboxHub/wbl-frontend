"use client";

import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";
import { toast, Toaster } from "sonner";

export default function BatchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Add Batch modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batchname: "",
    orientationdate: "",
    subject: "ML",
    startdate: "",
    enddate: "",
    courseid: "",
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const isIdSearch =
        !isNaN(Number(debouncedSearch)) && debouncedSearch.trim() !== "";

      if (isIdSearch) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/batch/${debouncedSearch.trim()}`
        );
        if (!res.ok) {
          setBatches([]);
          setTotal(0);
          return;
        }
        const data = await res.json();
        setBatches([data]);
        setTotal(1);
        setPage(1);
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/batch?page=${page}&per_page=${pageSize}&search=${debouncedSearch}`
        );
        if (!res.ok) {
          setBatches([]);
          setTotal(0);
          return;
        }
        const data = await res.json();
        setBatches(data.batches);
        setTotal(data.total);
      }
    } catch (err: any) {
      toast.error("Failed to fetch batches: " + err.message);
      setBatches([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [debouncedSearch, page, pageSize]);

  const dateFormatter = (params: any) => {
    if (!params.value) return "";
    try {
      return new Date(params.value).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return params.value;
    }
  };

  const SubjectRenderer = (props: any) => {
    const value = props.value || "";
    const colors: Record<string, string> = {
      QA: "bg-blue-100 text-blue-800",
      UI: "bg-green-100 text-green-800",
      ML: "bg-purple-100 text-purple-800",
    };
    const className =
      "px-2 py-1 rounded-full text-xs font-medium " +
      (colors[value] || "bg-gray-100 text-gray-800");
    return <span className={className}>{value}</span>;
  };

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "batchid", headerName: "Batch ID", width: 130, pinned: "left" },
    { field: "batchname", headerName: "Batch Name", width: 190, editable: true },
    { field: "orientationdate", headerName: "Orientation Date", width: 190, editable: true, valueFormatter: dateFormatter },
    { field: "subject", headerName: "Subject", width: 140, editable: true, cellRenderer: SubjectRenderer },
    { field: "startdate", headerName: "Start Date", width: 170, editable: true, valueFormatter: dateFormatter },
    { field: "enddate", headerName: "End Date", width: 190, editable: true, valueFormatter: dateFormatter },
    { field: "courseid", headerName: "Course ID", width: 140 },
  ], []);

  // Optimistic Update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/batch/${updatedRow.batchid}`, updatedRow);
      setBatches((prev) =>
        prev.map((r) => (r.batchid === updatedRow.batchid ? updatedRow : r))
      );
      toast.success("Batch updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update batch");
    }
  };

  // Optimistic Delete
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/batch/${id}`);
      setBatches((prev) => prev.filter((row) => row.batchid !== id));
      setTotal((t) => t - 1);
      toast.success(`Batch ${id} deleted`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete batch");
    }
  };

  const handleAddBatch = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/batch`, newBatch);
      setBatches((prev) => [...prev, res.data]);
      setTotal((t) => t + 1);
      setIsModalOpen(false);
      setNewBatch({
        batchname: "",
        orientationdate: "",
        subject: "ML",
        startdate: "",
        enddate: "",
        courseid: "",
      });
      toast.success("New batch created successfully ");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create batch");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Batches</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage batches</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" /> Add Batch
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search">Search by Batch Name or ID</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Type batch name or numeric ID..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center mt-8">Loading...</p>
      ) : batches.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No batches found.</p>
      ) : (
        <AGGridTable
          rowData={batches.slice((page - 1) * pageSize, page * pageSize)}
          columnDefs={columnDefs}
          title={`Batches (${total})`}
          height="500px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}

      {/* Pagination */}
      {batches.length > 0 && (
        <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Rows per page:</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1 text-sm">
              {[10, 20, 50, 100].map((size) => (<option key={size} value={size}>{size}</option>))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="px-2 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm">Page {page} of {Math.ceil(total / pageSize)}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= total} className="px-2 py-1 border rounded text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
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
                onChange={(e) => setNewBatch({ ...newBatch, subject: e.target.value })}
                className="border rounded px-2 py-1 w-full dark:bg-gray-800 dark:text-white"
              >
                <option value="QA">QA</option>
                <option value="UI">UI</option>
                <option value="ML">ML</option>
              </select>
            </div>
            <div>
              <Label htmlFor="startdate">Start Date</Label>
              <Input type="date" id="startdate" value={newBatch.startdate} onChange={(e) => setNewBatch({ ...newBatch, startdate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="enddate">End Date</Label>
              <Input type="date" id="enddate" value={newBatch.enddate} onChange={(e) => setNewBatch({ ...newBatch, enddate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="courseid">Course ID</Label>
              <Input type="number" id="courseid" value={newBatch.courseid} onChange={(e) => setNewBatch({ ...newBatch, courseid: e.target.value })} />
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
