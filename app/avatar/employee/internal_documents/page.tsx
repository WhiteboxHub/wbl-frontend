

"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";

export default function InternalDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    filename: "",
  });

  const columnDefs: ColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      pinned: "left",
      editable: false,
    },
    {
      field: "title",
      headerName: "Title",
      width: 200,
      editable: true,
    },
    {
      field: "description",
      headerName: "Description",
      width: 300,
      editable: true,
    },
    {
      field: "filename",
      headerName: "Filename",
      width: 250,
      editable: true,
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 180,
      editable: false,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      },
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 180,
      editable: false,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      },
    },
  ];

  // Helper function to extract error message
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.detail) return error.detail;
    if (error?.message) return error.message;
    return "An unknown error occurred";
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch("/internal-documents/");

      console.log("API Response:", res);

      const arr = Array.isArray(res) ? res : [];
      const sortedDocuments = arr.slice().sort((a: any, b: any) => b.id - a.id);

      setDocuments(sortedDocuments);
      setFilteredDocuments(sortedDocuments);
      toast.success("Fetched documents successfully.");
    } catch (e: any) {
      console.error("Fetch error:", e);
      const msg = getErrorMessage(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
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
    if (!lower) return setFilteredDocuments(documents);

    const filtered = documents.filter((row) => {
      const idMatch = row.id?.toString().includes(lower);
      const titleMatch = row.title?.toLowerCase().includes(lower);
      const descriptionMatch = row.description?.toLowerCase().includes(lower);
      const filenameMatch = row.filename?.toLowerCase().includes(lower);

      return idMatch || titleMatch || descriptionMatch || filenameMatch;
    });

    setFilteredDocuments(filtered);
  }, [searchTerm, documents]);

  // Update document
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/internal-documents/${updatedRow.id}`, {
        method: "PUT",
        body: updatedRow,
      });

      const updated = documents
        .map((doc) => (doc.id === updatedRow.id ? updatedRow : doc))
        .slice()
        .sort((a, b) => b.id - a.id);

      setDocuments(updated);
      setFilteredDocuments(updated);
      toast.success("Document updated successfully.");
    } catch (e: any) {
      const msg = getErrorMessage(e);
      toast.error(msg);
    }
  };

  // Delete document
  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/internal-documents/${id}`, { method: "DELETE" });
      const updated = documents.filter((doc) => doc.id !== id);
      setDocuments(updated);
      setFilteredDocuments(updated);
      toast.success(`Document ${id} deleted.`);
    } catch (e: any) {
      const msg = getErrorMessage(e);
      toast.error(msg);
    }
  };

  // Add document
  const handleAddDocument = async () => {
    if (!newDocument.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!newDocument.filename.trim()) {
      toast.error("Filename is required");
      return;
    }

    try {
      const res = await apiFetch("/internal-documents/", {
        method: "POST",
        body: newDocument
      });

      const updated = [...documents, res].slice().sort((a, b) => b.id - a.id);
      setDocuments(updated);
      setFilteredDocuments(updated);
      toast.success("New document created.");
      setIsModalOpen(false);
      setNewDocument({ title: "", description: "", filename: "" });
    } catch (e: any) {
      const msg = getErrorMessage(e);
      toast.error(msg);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Internal Documents</h1>
          <p>Manage all internal documents here.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Document</Button>
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
            placeholder="Search by ID, title, description, or filename..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-5 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add Document
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5">

                {/* Title */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Title <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                  />
                </div>

                {/* Filename */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Filename <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDocument.filename}
                    onChange={(e) => setNewDocument((prev) => ({ ...prev, filename: e.target.value }))}
                    placeholder="Enter filename"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Description
                  </label>
                  <textarea
                    value={newDocument.description}
                    onChange={(e) => setNewDocument((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))}
                    placeholder="Enter document description"
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
                  onClick={handleAddDocument}
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
        rowData={filteredDocuments}
        columnDefs={columnDefs}
        title={`Internal Documents (${filteredDocuments.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}