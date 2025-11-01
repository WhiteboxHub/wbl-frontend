"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon,X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";


export default function SubjectPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });

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

  // Add
  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.error("Subject Name is required");
      return;
    }

    try {
      const res = await apiFetch("/subjects", { method: "POST", body: newSubject });
      const created = res && !Array.isArray(res) ? (res.data ?? res) : res;
      const updated = [...subjects, created].slice().sort((a, b) => b.id - a.id);
      setSubjects(updated);
      setFilteredSubjects(updated);
      toast.success("New subject created.");
      setIsModalOpen(false);
      setNewSubject({ name: "", description: "" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to create subject";
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
        {/* <Button onClick={() => setIsModalOpen(true)}>+ Add Subject</Button> */}
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

      {/* Add Subject Modal - Updated with same colors */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-5 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add Subject
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-3 sm:p-4 md:p-6 bg-white">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:gap-5">
                
                {/* Name */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Name <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSubject.name}
                    maxLength={100}
                    onChange={(e) =>
                      setNewSubject((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter subject name"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Description
                  </label>
                  <textarea
                    value={newSubject.description}
                    maxLength={300}
                    onChange={(e) =>
                      setNewSubject((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter subject description"
                    rows={4}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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