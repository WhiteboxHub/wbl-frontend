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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batchname: "",
    orientationdate: "",
    subject: "ML",
    startdate: "",
    enddate: "",
    courseid: "3", // default for ML
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch batches
 const token = localStorage.getItem("token"); // get token once

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const trimmedSearch = debouncedSearch.trim();
      const isIdSearch = !isNaN(Number(trimmedSearch)) && trimmedSearch !== "";

      let url = "";
      if (isIdSearch) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/batch/${trimmedSearch}`;
      } else if (trimmedSearch) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/batch?search=${encodeURIComponent(trimmedSearch)}`;
      } else {
        url = `${process.env.NEXT_PUBLIC_API_URL}/batch`;
      }

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`, // pass token in headers
        },
      });

      setBatches(isIdSearch ? [res.data] : res.data);
    } catch (err: any) {
      toast.error("Failed to fetch batches: " + (err.response?.data?.message || err.message));
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [debouncedSearch]);
  
  // Date formatter
  const dateFormatter = (params: any) => {
    if (!params.value) return "";

    // Handle ISO or raw YYYY-MM-DD safely
    const dateStr = params.value.split("T")[0]; // take only date part if datetime
    const [year, month, day] = dateStr.split("-");

    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    // Force formatting as "DD Mon YYYY" without timezone shifts
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Subject badge renderer
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

  // AG Grid columns
  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "batchid", headerName: "Batch ID", width: 170, pinned: "left" },
    { field: "batchname", headerName: "Batch Name", width: 210, editable: true },
    { field: "orientationdate", headerName: "Orientation Date", width: 220, editable: true, valueFormatter: dateFormatter },
    { field: "subject", headerName: "Subject", width: 140, editable: true, cellRenderer: SubjectRenderer },
    { field: "startdate", headerName: "Start Date", width: 200, editable: true, valueFormatter: dateFormatter },
    { field: "enddate", headerName: "End Date", width: 210, editable: true, valueFormatter: dateFormatter },
    { field: "courseid", headerName: "Course ID", width: 140 },
  ], []);

  // Update row
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

  // Delete row
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/batch/${id}`);
      setBatches((prev) => prev.filter((row) => row.batchid !== id));
      toast.success(`Batch ${id} deleted`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete batch");
    }
  };

  // Add new batch
  const handleAddBatch = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/batch`, newBatch);
      setBatches((prev) => [...prev, res.data]);
      setIsModalOpen(false);
      setNewBatch({
        batchname: "",
        orientationdate: "",
        subject: "ML",
        startdate: "",
        enddate: "",
        courseid: "3", // reset to default 3
      });
      toast.success("New batch created successfully");
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
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type batch name or numeric ID..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
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
                onChange={(e) => {
                  const selectedSubject = e.target.value;
                  let courseid = "3"; // default ML
                  if (selectedSubject === "QA") courseid = "1";
                  else if (selectedSubject === "UI") courseid = "2";
                  else if (selectedSubject === "ML") courseid = "3";
                  setNewBatch({ ...newBatch, subject: selectedSubject, courseid });
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


