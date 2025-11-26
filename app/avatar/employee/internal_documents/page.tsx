
"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";

interface InternalDocument {
  id: number;
  title: string;
  description: string;
  file: string;
}

export default function InternalDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<InternalDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<InternalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      field: "file",
      headerName: "File",
      width: 250,
      editable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return "";
        return React.createElement(
          "a",
          {
            href: params.value,
            target: "_blank",
            rel: "noopener noreferrer",
            className:
              "text-blue-600 hover:text-blue-800 underline transition-colors",
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
          "click here"
        );
      },
    },
  ];

  const getErrorMessage = (error: any): string => {
    if (typeof error === "string") return error;
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
      const sortedDocuments = documentsArray.sort(
        (a: InternalDocument, b: InternalDocument) => b.id - a.id
      );

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
        doc.file?.toLowerCase().includes(lower)
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading documents...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Internal Documents</h1>
        <p className="text-gray-600 mt-2">
          Manage and organize your internal documents
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700"
        >
          Search Documents
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, description, or file..."
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

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








