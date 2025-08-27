"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";

const validTypes = ['P', 'C', 'D', 'S', 'I', 'B', 'N', 'T', 'G', 'M'];

export default function CourseMaterialPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [materials, setMaterials] = useState<any[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/course-materials`);
      setMaterials(res.data);
      setFilteredMaterials(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // search filter
  useEffect(() => {
  const lower = searchTerm.trim().toLowerCase();
  if (!lower) return setFilteredMaterials(materials);

  const filtered = materials.filter((row) => {
    const idStr = row.id?.toString().toLowerCase() || "";
    const nameStr = row.name?.toLowerCase() || "";
    const typeStr = row.type?.toLowerCase() || "";
    const courseIdStr = row.course_id?.toString().toLowerCase() || "";
    const subjectIdStr = row.subject_id?.toString().toLowerCase() || "";

    return (
      idStr.includes(lower) ||
      nameStr.includes(lower) ||
      typeStr.includes(lower) ||
      courseIdStr.includes(lower) ||
      subjectIdStr.includes(lower)
    );
  });

  setFilteredMaterials(filtered);
}, [searchTerm, materials]);


  // AG Grid column defs
  useEffect(() => {
    if (materials.length > 0) {
      const defs: ColDef[] = Object.keys(materials[0]).map((key) => {
        const col: ColDef = {
          field: key,
          headerName: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          width: 200,
          editable: key !== "id",
        };
        if (key === "id") col.pinned = "left";
        return col;
      });
      setColumnDefs(defs);
    }
  }, [materials]);

  // update row
  const handleRowUpdated = async (updatedRow: any) => {
    if (updatedRow.type && !validTypes.includes(updatedRow.type)) {
      alert(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
      return;
    }
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/course-materials/${updatedRow.id}`, updatedRow);
      setFilteredMaterials(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  // delete row
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/course-materials/${id}`);
      setFilteredMaterials(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course Materials</h1>
        <p>Manage course materials for courses and subjects.</p>
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
            placeholder="Search by ID, name, type or ..."
            className="pl-10"
          />
        </div>
      </div>

      {/* AG Grid */}
      <AGGridTable
        rowData={filteredMaterials.slice((page-1)*pageSize,page*pageSize)}
        columnDefs={columnDefs}
        title={`Course Materials (${filteredMaterials.length})`}
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
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10,20,50,100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(p-1,1))}
            disabled={page===1}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >Previous</button>
          <span className="text-sm">Page {page}</span>
          <button
            onClick={() => setPage(p => p+1)}
            className="px-2 py-1 border rounded text-sm"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
