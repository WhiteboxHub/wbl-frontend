"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";


export default function SubjectPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch("/subjects");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedSubjects = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setSubjects(sortedSubjects);
      setFilteredSubjects(sortedSubjects);
      toast.success("Subjects loaded successfully.");
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to load subjects";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) {
      setFilteredSubjects(subjects);
      return;
    }

    const filtered = subjects.filter((row) => {
      const idMatch = row.id?.toString().includes(lower);
      const nameMatch = row.name?.toLowerCase().includes(lower);
      const descMatch = row.description?.toLowerCase().includes(lower);
      return idMatch || nameMatch || descMatch;
    });

    setFilteredSubjects(filtered);
  }, [searchTerm, subjects]);

  useEffect(() => {
    setColumnDefs([
      { field: "id", headerName: "ID", width: 150, editable: false },
      { field: "name", headerName: "Name", width: 300, editable: true },
      { field: "description", headerName: "Description", width: 450, editable: true },
    ]);
  }, []);

  // Update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/subjects/${updatedRow.id}`, { method: "PUT", body: updatedRow });
      setFilteredSubjects((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
      setSubjects((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
      toast.success("Subject updated successfully.");
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to update subject";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // Delete
  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/subjects/${id}`, { method: "DELETE" });
      setFilteredSubjects((prev) => prev.filter((row) => row.id !== id));
      setSubjects((prev) => prev.filter((row) => row.id !== id));
      toast.success(`Subject ${id} deleted.`);
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to delete subject";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p>Manage all subjects here.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Id, name, or description..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredSubjects}
        columnDefs={columnDefs}
        title={`Subjects (${filteredSubjects.length})`}
        height="calc(70vh)"
        onRowAdded={async (newRow: any) => {
          try {
            const payload = {
              name: newRow.name || newRow.subject_name || "",
              description: newRow.description || newRow.desc || "",
            };
            if (!payload.name) { toast.error("Name is required"); return; }
            const res = await apiFetch("/subjects", { method: "POST", body: payload });
            const created = Array.isArray(res) ? res : (res?.data ?? res);
            const updated = [created, ...subjects].slice().sort((a:any,b:any)=>b.id-a.id);
            setSubjects(updated);
            setFilteredSubjects(updated);
            toast.success("Subject created");
          } catch (e:any) {
            const msg = e?.body || e?.message || "Failed to create subject";
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