"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";
export default function CourseContentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contents, setContents] = useState<any[]>([]);
  const [filteredContents, setFilteredContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");

  const fetchContents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch("/course-contents");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedContents = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);

      setContents(sortedContents);
      setFilteredContents(sortedContents);
      toast.success("Course Content fetched successfully", { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to fetch Course Content";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error("Failed to fetch Course Content", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // search
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredContents(contents);

    const filtered = contents.filter(
      (row) =>
        row.id?.toString().includes(lower) ||
        row.Fundamentals?.toLowerCase().includes(lower) ||
        row.AIML?.toLowerCase().includes(lower) ||
        row.UI?.toLowerCase().includes(lower) ||
        row.QE?.toLowerCase().includes(lower)
    );
    setFilteredContents(filtered);
  }, [searchTerm, contents]);

  const columnDefs: ColDef[] = useMemo<ColDef[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 120,
        pinned: "left",
        editable: false,
      },
      {
        field: "Fundamentals",
        headerName: "Fundamentals",
        width: 300,
        editable: true,
      },
      { field: "AIML", headerName: "AIML", width: 300, editable: true },
      { field: "UI", headerName: "UI", width: 300, editable: true },
      { field: "QE", headerName: "QE", width: 300, editable: true },
    ],
    []
  );

  // update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/course-contents/${updatedRow.id}`, { method: "PUT", body: updatedRow });
      setContents((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
      setFilteredContents((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
      toast.success("Course Content updated successfully", { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to update Course Content";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { position: "top-center" });
    }
  };

  // delete
  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/course-contents/${id}`, { method: "DELETE" });
      setContents((prev) => prev.filter((row) => row.id !== id));
      setFilteredContents((prev) => prev.filter((row) => row.id !== id));
      toast.success(`Course Content ${id} deleted`, { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to delete Course Content";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { position: "top-center" });
    }
  };

  if (showLoader) return <Loader />;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      {/* Header + Search Section - Updated for left-side search */}
      <div className="flex flex-col gap-4 sm:flex-col md:flex-row md:items-center md:justify-between">
        {/* Left: Title, Description + Search Box */}
        <div className="flex-1">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Course Contents</h1>
            <p>Manage course contents for Fundamentals, AIML, UI, QE.</p>
          </div>

          {/* Search Box - Now on LEFT side under title */}
          <div className="max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID or content field..."
                className="w-full pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <AGGridTable
        rowData={filteredContents}
        columnDefs={columnDefs}
        title={`Course Contents (${filteredContents.length})`}
        height="calc(70vh)"
        onRowAdded={async (newRow: any) => {
          try {
            const payload = {
              Fundamentals: newRow.Fundamentals || "",
              AIML: newRow.AIML || "",
              UI: newRow.UI || "",
              QE: newRow.QE || "",
            };
            if (!payload.AIML) { toast.error("AIML is required"); return; }
            const res = await apiFetch("/course-contents", { method: "POST", body: payload });
            const created = Array.isArray(res) ? res : (res?.data ?? res);
            const updated = [created, ...contents].slice().sort((a: any, b: any) => b.id - a.id);
            setContents(updated);
            setFilteredContents(updated);
            toast.success("Course Content created");
          } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to create Course Content";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
          }
        }}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}