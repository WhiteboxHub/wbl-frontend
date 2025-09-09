"use client";

import React, { useEffect, useState } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";

const BadgeRenderer = (params: any, map: Record<string, string>) => {
  const value = params?.value?.toString() || "None";
  const cls = map[value.toLowerCase()] || "bg-gray-100 text-gray-800";
  return <Badge className={cls}>{value.toUpperCase()}</Badge>;
};

const VendorTypeRenderer = (params: any) => {
  const map = {
    client: "bg-green-100 text-green-800",
    implementation_partner: "bg-blue-100 text-blue-800",
    third_party: "bg-yellow-100 text-yellow-800",
  };

  const key = params?.value?.toString().toLowerCase().replace(/ /g, "_");
  return BadgeRenderer({ value: key }, map);
};

const TypeRenderer = (params: any) => {
  const map = {
    client: "bg-green-100 text-green-800",
    implementation_partner: "bg-blue-100 text-blue-800",
    third_party: "bg-yellow-100 text-yellow-800",
  };

  const key = params?.value?.toString().toLowerCase().replace(/ /g, "_");
  return BadgeRenderer({ value: key }, map);
};

const StatusRenderer = (params: any) => {
  const map = {
    active: "bg-green-100 text-green-800",
    working: "bg-blue-100 text-blue-800",
    not_useful: "bg-red-100 text-red-800",
    do_not_contact: "bg-gray-300 text-gray-800",
    inactive: "bg-gray-200 text-gray-600",
    prospect: "bg-yellow-100 text-yellow-800",
  };
  return BadgeRenderer(params, map);
};

const YesNoRenderer = (params: any) => {
  const map = {
    yes: "bg-indigo-100 text-indigo-800",
    no: "bg-gray-100 text-gray-800",
  };

  const key = params?.value?.toString().toLowerCase();
  return BadgeRenderer({ value: key }, map);
};

const DateFormatter = (params: any) =>
  params.value ? new Date(params.value).toLocaleDateString() : "";

export default function VendorPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/vendors`);
      setVendors(res.data);
      setFilteredVendors(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVendors(vendors);
      return;
    }
  const filtered = vendors.filter((v) =>
    v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

    setFilteredVendors(filtered);
  }, [searchTerm, vendors]);

  useEffect(() => {
    if (vendors.length > 0) {
      const defs: ColDef[] = Object.keys(vendors[0]).map((key) => {
        const header = key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const col: ColDef = {
          field: key,
          headerName: header,
          width: 160,
          editable: true,
        };

        const k = key.toLowerCase();
        if (k.includes("date") || k.includes("created_at")) {
          col.valueFormatter = DateFormatter;
          col.editable = false;
        } else if (k === "vendor_type") {
          col.cellRenderer = VendorTypeRenderer;
        } else if (k === "type") {
          col.cellRenderer = TypeRenderer;
          col.cellEditor = "agSelectCellEditor"; 
          col.cellEditorParams = {
            values: ["client", "implementation_partner", "third_party"],
          };
        } else if (k === "status") {
          col.cellRenderer = StatusRenderer;
        } else if (
          ["linkedin_connected", "intro_email_sent", "intro_call"].includes(k)
        ) {
          col.cellRenderer = YesNoRenderer;
        } else if (k === "id") {
          col.pinned = "left";
          col.editable = false;
          col.width = 80;
        }

        return col;
      });

      setColumnDefs(defs);
    }
  }, [vendors]);

  const handleRowUpdated = async (updatedRow: any) => {
    const { email, phone_number, linkedin_id } = updatedRow;

    if (!email && !phone_number && !linkedin_id) {
      alert("At least one contact info (email, phone, or LinkedIn) is required.");
      return;
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/vendors/${updatedRow.id}`,
        updatedRow
      );
      setFilteredVendors((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/vendors/${id}`);
      setFilteredVendors((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendors</h1>
        <p>Browse, search, and manage vendors.</p>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search Vendors</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="pl-10"
          />
        </div>
        {searchTerm && <p>{filteredVendors.length} found</p>}
      </div>

      <AGGridTable
        rowData={filteredVendors.slice((page - 1) * pageSize, page * pageSize)}
        columnDefs={columnDefs}
        title={`All Vendors (${filteredVendors.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
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
            disabled={page * pageSize >= filteredVendors.length}
            className="px-2 py-1 border rounded text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}