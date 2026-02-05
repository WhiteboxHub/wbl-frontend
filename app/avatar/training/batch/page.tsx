"use client";

import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, X } from "lucide-react";
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

import { apiFetch } from "@/lib/api.js";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

export default function BatchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);

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
  }, [debouncedSearch]);



  // Date formatter for AG Grid (safe)
  const dateFormatter = (params: any) => {

    if (!params.value) return "";

    // Handle ISO or raw YYYY-MM-DD safely
    const dateStr = params.value.split("T")[0];
    const [year, month, day] = dateStr.split("-");

    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  };


  // Add this useEffect after your existing useEffects
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isModalOpen]);


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
    if (!newBatch.batchname.trim()) {
      toast.error("Batch Name is required");
      return;
    }

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
      <Toaster position="top-center" />


      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">Batches</h1>
          <p>Manage batches</p>
        </div>
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

      {/* Table */}

      {showLoader ? (
        <Loader />
      ) : batches.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No batches found.</p>
      ) : (
        <AGGridTable
          rowData={batches}
          columnDefs={columnDefs}
          title={`Batches (${batches.length})`}
          height="600px"
          showSearch={false}
          onRowAdded={async (newRow: any) => {
            try {
              const subject = newRow.subject || "ML";
              let courseid = "3";
              if (subject === "QA") courseid = "1";
              else if (subject === "UI") courseid = "2";
              else if (subject === "ML") courseid = "3";

              const payload = {
                batchname: newRow.batchname || "",
                orientationdate: newRow.orientationdate || "",
                subject,
                startdate: newRow.startdate || "",
                enddate: newRow.enddate || "",
                courseid,
              };

              if (!payload.batchname) { toast.error("Batch Name is required"); return; }

              const res = await apiFetch(`/batch`, { method: "POST", body: payload });
              const created = res && !Array.isArray(res) ? (res.data ?? res) : res;
              setBatches((prev) => [...prev, created]);
              toast.success("Batch created successfully");
            } catch (err: any) {
              toast.error(err?.message || err?.body || "Failed to create batch");
            }
          }}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}
    </div>
  );
}
