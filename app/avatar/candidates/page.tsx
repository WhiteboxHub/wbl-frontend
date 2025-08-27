

"use client";

import React, { useEffect, useState } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
// import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import AGGridTable, { PhoneRenderer, EmailRenderer } from "@/components/AGGridTable";


// Cell renderers
const StatusRenderer = (params: any) => {
  const status = params?.value?.toString().toLowerCase() || "";
  const colorMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    preparation: "bg-yellow-100 text-yellow-800",
    marketing: "bg-blue-100 text-blue-800",
    placed: "bg-purple-100 text-purple-800",
    discontinued: "bg-red-100 text-red-800",
    break: "bg-pink-100 text-pink-800",
    defaulted: "bg-orange-100 text-orange-800",
    completed: "bg-indigo-100 text-indigo-800",
  };
  const cls = colorMap[status] || "bg-gray-100 text-gray-800";
  return <Badge className={cls}>{params.value?.toString().toUpperCase()}</Badge>;
};

const VisaStatusRenderer = (params: any) => {
  const visa = (params?.value || "").toString().trim();
  const colorMap: Record<string, string> = {
    H1B: "bg-blue-100 text-blue-800",
    GC: "bg-emerald-100 text-emerald-800",
    "F1 Student": "bg-purple-100 text-purple-800",
    F1: "bg-purple-100 text-purple-800",
    "GC EAD": "bg-teal-100 text-teal-800",
    L1: "bg-orange-100 text-orange-800",
    L2: "bg-orange-100 text-orange-800",
    Citizen: "bg-indigo-100 text-indigo-800",
    H4: "bg-pink-100 text-pink-800",
    None: "bg-gray-200 text-gray-700",
    Select: "bg-gray-200 text-gray-700",
  };

  const cls = colorMap[visa] || "bg-gray-100 text-gray-800";
  return <Badge className={cls}>{visa}</Badge>;
};

const DateFormatter = (params: any) =>
  params.value ? new Date(params.value).toLocaleDateString() : "";

const AmountFormatter = (params: any) =>
  params.value != null ? `$${Number(params.value).toLocaleString()}` : "";

export default function CandidatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Fetch candidates with pagination
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates?page=${page}&limit=${pageSize}`
      );

      const rows = res.data?.data || [];
      setCandidates(rows);
      setFilteredCandidates(rows);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, pageSize]);

  // // Handle searching
  // useEffect(() => {
  //   if (!searchTerm.trim()) {
  //     setFilteredCandidates(candidates);
  //     return;
  //   }
  //   if (searchTerm.trim().length < 3) {
  //     setFilteredCandidates([]);
  //     return;
  //   }

  //   const timeout = setTimeout(async () => {
  //     setSearching(true);
  //     try {
  //       const res = await axios.get(
  //         `${process.env.NEXT_PUBLIC_API_URL}/candidates/by-name/${encodeURIComponent(
  //           searchTerm.trim()
  //         )}`
  //       );
  //       setFilteredCandidates(res.data || []);
  //     } catch {
  //       setFilteredCandidates([]);
  //     } finally {
  //       setSearching(false);
  //     }
  //   }, 300);

  //   return () => clearTimeout(timeout);
  // }, [searchTerm, candidates]);


  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }
    if (searchTerm.trim().length < 3) {
      setFilteredCandidates([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/candidates/by-name/${encodeURIComponent(
            searchTerm.trim()
          )}`
        );
        setFilteredCandidates(res.data.data || []); // ✅ use res.data.data
      } catch {
        setFilteredCandidates([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, candidates]);
    
  // Build column definitions dynamically
  useEffect(() => {
    if (candidates.length > 0) {
      const defs: ColDef[] = Object.keys(candidates[0]).map((key) => {
        const header = key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const col: ColDef = {
          field: key,
          headerName: header,
          width: 150,
          editable: true,
        };

        const k = key.toLowerCase();
        if (k.includes("date") && key !== "candidateid")
          col.valueFormatter = DateFormatter;
        else if (k === "status") col.cellRenderer = StatusRenderer;
        else if (k === "workstatus") col.cellRenderer = VisaStatusRenderer;
        else if (["feepaid", "feedue"].includes(k))
          col.valueFormatter = AmountFormatter;
        else if (key === "candidateid") {
          col.pinned = "left";
          col.checkboxSelection = true;
          col.width = 100;
        }

        return col;
      });
      setColumnDefs(defs);
    }
  }, [candidates]);

  // Update row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/${updatedRow.candidateid}`,
        updatedRow
      );
      setFilteredCandidates((prev) =>
        prev.map((row) =>
          row.candidateid === updatedRow.candidateid ? updatedRow : row
        )
      );
    } catch (error) {
      console.error("Failed to update candidate:", error);
    }
  };

  // Delete row
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${id}`);
      setFilteredCandidates((prev) =>
        prev.filter((row) => row.candidateid !== id)
      );
    } catch (error) {
      console.error("Failed to delete candidate:", error);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Candidates Management</h1>
        <p>Browse, search, and manage candidates.</p>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search Candidates</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name (min 3 characters)..."
            className="pl-10"
          />
        </div>
        {searching ? (
          <p>Searching...</p>
        ) : (
          searchTerm && <p>{filteredCandidates.length} found</p>
        )}
      </div>

      <AGGridTable
        rowData={filteredCandidates}
        columnDefs={columnDefs}
        title={`All Candidates (${filteredCandidates.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showFilters={false}
        showSearch={false}
        
      />

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
            {[10,50, 100].map((size) => (
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
