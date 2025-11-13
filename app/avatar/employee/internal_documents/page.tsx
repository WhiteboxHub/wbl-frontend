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

interface InternalDocument {
  id: number;
  title: string;
  description: string;
  filename: string;
  link: string;
}

export default function InternalDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<InternalDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<InternalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    filename: "",
    link: "",
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
      width: 250,
      editable: true,
    },
    {
      field: "description",
      headerName: "Description",
      width: 400,
      editable: true,
    },
    {
      field: "filename",
      headerName: "Filename",
      width: 250,
      editable: true,
    },
    {
      field: "link",
      headerName: "Link",
      width: 250,
      editable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return '';
        return React.createElement('a', {
          href: params.value,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-blue-600 hover:text-blue-800 underline transition-colors',
          onClick: (e: React.MouseEvent) => e.stopPropagation()
        }, 'click here');
      },
    },
  ];

  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.detail) return error.detail;
    if (error?.message) return error.message;
    return "An unknown error occurred";
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch("/internal-documents/");
      const documentsArray = Array.isArray(res) ? res : [];
      const sortedDocuments = documentsArray.sort((a: InternalDocument, b: InternalDocument) => b.id - a.id);

      setDocuments(sortedDocuments);
      setFilteredDocuments(sortedDocuments);
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

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) {
      setFilteredDocuments(documents);
      return;
    }

    const filtered = documents.filter((doc) => {
      return (
        doc.id?.toString().includes(lower) ||
        doc.title?.toLowerCase().includes(lower) ||
        doc.description?.toLowerCase().includes(lower) ||
        doc.filename?.toLowerCase().includes(lower) ||
        doc.link?.toLowerCase().includes(lower)
      );
    });

    setFilteredDocuments(filtered);
  }, [searchTerm, documents]);

  const handleRowUpdated = async (updatedRow: InternalDocument) => {
    try {
      await apiFetch(`/internal-documents/${updatedRow.id}`, {
        method: "PUT",
        body: updatedRow,
      });

      const updatedDocuments = documents
        .map((doc) => (doc.id === updatedRow.id ? updatedRow : doc))
        .sort((a, b) => b.id - a.id);

      setDocuments(updatedDocuments);
      setFilteredDocuments(updatedDocuments);
      toast.success("Document updated successfully.");
    } catch (e: any) {
      const msg = getErrorMessage(e);
      toast.error(msg);
    }
  };

  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/internal-documents/${id}`, { method: "DELETE" });
      const updatedDocuments = documents.filter((doc) => doc.id !== id);
      setDocuments(updatedDocuments);
      setFilteredDocuments(updatedDocuments);
      toast.success(`Document ${id} deleted successfully.`);
    } catch (e: any) {
      const msg = getErrorMessage(e);
      toast.error(msg);
    }
  };

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

      const updatedDocuments = [...documents, res].sort((a, b) => b.id - a.id);
      setDocuments(updatedDocuments);
      setFilteredDocuments(updatedDocuments);
      toast.success("Document created successfully.");
      setIsModalOpen(false);
      setNewDocument({ title: "", description: "", filename: "", link: "" });
    } catch (e: any) {
      const msg = getErrorMessage(e);
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setNewDocument({ title: "", description: "", filename: "", link: "" });
    setIsModalOpen(false);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-lg">Loading documents...</div></div>;
  if (error) return <div className="flex justify-center items-center h-64"><div className="text-red-600 text-lg">{error}</div></div>;

  return (
    <div className="space-y-6 p-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Internal Documents</h1>
          <p className="text-gray-600 mt-2">Manage and organize your internal documents</p>
        </div>
        {/* <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Add Document
        </Button> */}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search Documents</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, description, filename..."
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Add New Document</h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="filename" className="text-sm font-medium text-gray-700">
                    Filename *
                  </Label>
                  <Input
                    id="filename"
                    value={newDocument.filename}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, filename: e.target.value }))}
                    placeholder="Enter filename"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="link" className="text-sm font-medium text-gray-700">
                  Document Link
                </Label>
                <Input
                  id="link"
                  type="url"
                  value={newDocument.link}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://example.com/document"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <textarea
                  id="description"
                  value={newDocument.description}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter document description"
                  rows={4}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddDocument}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
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