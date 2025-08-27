"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";

export default function CourseContentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contents, setContents] = useState<any[]>([]);
  const [filteredContents, setFilteredContents] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/course-content`
      );
      setContents(res.data);
      setFilteredContents(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // search filter
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

  // set AG Grid column defs dynamically
  useEffect(() => {
    if (contents.length > 0) {
      const defs: ColDef[] = Object.keys(contents[0]).map((key) => {
        const col: ColDef = {
          field: key,
          headerName: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          width: 200,
          editable: key !== "id",
        };

        if (key === "id") {
          col.pinned = "left";
          col.width = 100;
        }
        return col;
      });

      setColumnDefs(defs);
    }
  }, [contents]);

  // update row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-content/${updatedRow.id}`,
        updatedRow
      );
      setFilteredContents((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
      );
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  // delete row
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/course-content/${id}`
      );
      setFilteredContents((prev) => prev.filter((row) => row.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course Contents</h1>
        <p>Manage course contents for Fundamentals, AIML, UI, QE.</p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID or content field..."
            className="pl-10"
          />
        </div>
      </div>

      {/* AG Grid */}
      <AGGridTable
        rowData={filteredContents.slice((page - 1) * pageSize, page * pageSize)}
        columnDefs={columnDefs}
        title={`Course Contents (${filteredContents.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 border rounded text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
