// whiteboxLearning-wbl/app/batches/page.tsx
"use client";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";

export default function BatchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Pagination (frontend-side)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch batches (all or by ID)
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const isIdSearch = !isNaN(Number(debouncedSearch)) && debouncedSearch.trim() !== "";

      if (isIdSearch) {
        // Fetch single batch by ID
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batch/${debouncedSearch.trim()}`);
        if (!res.ok) {
          setBatches([]);
          setTotal(0);
          return;
        }
        const data = await res.json();
        setBatches([data]);
        setTotal(1);
        setPage(1);
      } else {
        // Fetch all batches (or optionally implement backend search if available)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batch`);
        if (!res.ok) {
          setBatches([]);
          setTotal(0);
          return;
        }
        let data: any[] = await res.json();

        // Optional: frontend filter by name/other fields
        if (debouncedSearch.trim()) {
          const term = debouncedSearch.trim().toLowerCase();
          data = data.filter(
            (b) =>
              b.batchname?.toLowerCase().includes(term) ||
              b.description?.toLowerCase().includes(term)
          );
        }

        setTotal(data.length);
        // Slice for pagination
        const paginated = data.slice((page - 1) * pageSize, page * pageSize);
        setBatches(paginated);
      }
    } catch (err) {
      console.error(err);
      setBatches([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [debouncedSearch, page, pageSize]);

  // Column definitions
  const columnDefs = useMemo<ColDef[]>(() => {
    if (batches.length === 0) return [];
    const keys = Object.keys(batches[0]);
    return keys.map((key) => {
      const col: ColDef = {
        field: key,
        headerName: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase()),
        sortable: true,
        resizable: true,
        minWidth: 120,
      };
      if (key === "batchid") {
        col.pinned = "left";
        col.checkboxSelection = true;
        col.width = 80;
      }
      return col;
    });
  }, [batches]);

  // PUT request on row update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/batch/${updatedRow.batchid}`, updatedRow);
      fetchBatches();
    } catch (err) {
      console.error("Failed to update batch:", err);
    }
  };

  // DELETE request on row deletion
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/batch/${id}`);
      fetchBatches();
    } catch (err) {
      console.error("Failed to delete batch:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Batches
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage batches
          </p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search by Batch Name or ID
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Type batch name or numeric ID..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* AG Grid Table */}
      {loading ? (
        <p className="text-center mt-8">Loading...</p>
      ) : batches.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No batches found.</p>
      ) : (
        <AGGridTable
          rowData={batches}
          columnDefs={columnDefs}
          title={`Batches (${total})`}
          height="500px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}

      {/* Pagination Controls */}
      {batches.length > 0 && (
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
                <option key={size} value={size}>{size}</option>
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
            <span className="text-sm">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
              className="px-2 py-1 border rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
