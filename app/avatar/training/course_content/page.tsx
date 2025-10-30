
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, X } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";
export default function CourseContentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contents, setContents] = useState<any[]>([]);
  const [filteredContents, setFilteredContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContent, setNewContent] = useState({
    Fundamentals: "",
    AIML: "",
    UI: "",
    QE: "",
  });

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

  // Add
  const handleAddContent = async () => {
    if (!newContent.AIML.trim()) {
      toast.error("AIML field is required");
      return;
    }

    try {
      const res = await apiFetch("/course-contents", { method: "POST", body: newContent });
      const created = res && !Array.isArray(res) ? (res.data ?? res) : res;
      const updated = [...contents, created].slice().sort((a, b) => b.id - a.id);
      setContents(updated);
      setFilteredContents(updated);
      toast.success("Course Content added successfully", { position: "top-center" });
      setIsModalOpen(false);
      setNewContent({ Fundamentals: "", AIML: "", UI: "", QE: "" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to add Course Content";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { position: "top-center" });
    }
  };

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

  if (loading) return <p className="mt-8 text-center">Loading...</p>;
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

          {/* Add Button */}
          <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>

            + Add CourseContent
          </Button>
      </div>

      {/* Add Course Content Modal - Updated with same colors */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-5 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add Course Content
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
              <div className="grid grid-cols-1 sm:grid-cols- gap-2.5 sm:gap-3 md:gap-5">
                
                {/* Fundamentals */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Fundamentals
                  </label>
                  <input
                    type="text"
                    value={newContent.Fundamentals}
                    maxLength={255}
                    onChange={(e) =>
                      setNewContent((prev) => ({
                        ...prev,
                        Fundamentals: e.target.value,
                      }))
                    }
                    placeholder="Enter fundamentals content"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                  />
                </div>

                {/* AIML */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    AIML <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={newContent.AIML}
                    required
                    maxLength={255}
                    onChange={(e) =>
                      setNewContent((prev) => ({ ...prev, AIML: e.target.value }))
                    }
                    placeholder="Enter AIML content"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                  />
                </div>

                {/* UI */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    UI
                  </label>
                  <input
                    type="text"
                    value={newContent.UI}
                    maxLength={255}
                    onChange={(e) =>
                      setNewContent((prev) => ({ ...prev, UI: e.target.value }))
                    }
                    placeholder="Enter UI content"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                  />
                </div>

                {/* QE */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    QE
                  </label>
                  <input
                    type="text"
                    value={newContent.QE}
                    maxLength={255}
                    onChange={(e) =>
                      setNewContent((prev) => ({ ...prev, QE: e.target.value }))
                    }
                    placeholder="Enter QE content"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
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
                  onClick={handleAddContent}
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
        rowData={filteredContents}
        columnDefs={columnDefs}
        title={`Course Contents (${filteredContents.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}