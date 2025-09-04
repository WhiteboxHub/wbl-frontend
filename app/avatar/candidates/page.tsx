
"use client";
import React, { useEffect, useState } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import AGGridTable from "@/components/AGGridTable";

// Cell renderers
const StatusRenderer = (params: any) => {
  const status = params?.value?.toString().toLowerCase() || "";
  const colorMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    discontinued: "bg-red-100 text-red-800",
    break: "bg-pink-100 text-pink-800",
    closed: "bg-gray-100 text-gray-800",
  };
  const cls = colorMap[status] || "bg-gray-100 text-gray-800";
  return <Badge className={cls}>{params.value?.toString().toUpperCase()}</Badge>;
};

const VisaStatusRenderer = (params: any) => {
  const visa = (params?.value || "").toString().trim();
  const colorMap: Record<string, string> = {
    Citizen: "bg-indigo-100 text-indigo-800",
    Visa: "bg-blue-100 text-blue-800",
    "Permanent resident": "bg-emerald-100 text-emerald-800",
    EAD: "bg-teal-100 text-teal-800",
    "Waiting for Status": "bg-orange-100 text-orange-800",
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

  // Fetch candidates on initial load or page change
  useEffect(() => {
    fetchCandidates();
  }, [page, pageSize]);

  // Handle searching
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      // If search is empty, reset to full list
      setFilteredCandidates(candidates);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/candidates/search`,
          { params: { term: searchTerm.trim() } }
        );
        console.log("Search API response:", res.data);
        setFilteredCandidates(res.data.data || []);
      } catch (err) {
        console.error("Search failed:", err);
        setFilteredCandidates([]);
      } finally {
        setSearching(false);
      }
    }, 400); // Debounce delay of 400ms

    return () => clearTimeout(timeout);
  }, [searchTerm, candidates]);

  // Build column definitions
  useEffect(() => {
    const defs: ColDef[] = [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        pinned: "left",
        checkboxSelection: false,
      },
      {
        field: "full_name",
        headerName: "Full Name",
        width: 200,
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        editable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={`tel:${params.value}`}
              className="text-blue-600 underline hover:text-blue-800"
            >
              {params.value}
            </a>
          );
        },
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
        editable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={`mailto:${params.value}`}
              className="text-blue-600 underline hover:text-blue-800"
              onClick={(event) => event.stopPropagation()} // stop row selection
            >
              {params.value}
            </a>
          );
        },
      },
      {
        field: "enrolled_date",
        headerName: "Enrolled Date",
        valueFormatter: DateFormatter,
        width: 150,
      },

      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        width: 120,
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        cellRenderer: VisaStatusRenderer,
        width: 150,
      },
      {
        field: "education",
        headerName: "Education",
        width: 200,
      },
      {
        field: "workexperience",
        headerName: "Work Experience",
        width: 200,
      },
      {
        field: "ssn",
        headerName: "SSN",
        width: 120,
      },
      {
        field: "agreement",
        headerName: "Agreement",
        width: 100,
      },
      {
        field: "secondaryemail",
        headerName: "Secondary Email",
        width: 200,
      },
      {
        field: "secondaryphone",
        headerName: "Secondary Phone",
        width: 150,
      },
      {
        field: "address",
        headerName: "Address",
        width: 300,
      },
      {
        field: "linkedin_id",
        headerName: "LinkedIn ID",
        width: 150,
      },
      {
        field: "dob",
        headerName: "Date of Birth",
        valueFormatter: DateFormatter,
        width: 150,
      },
      {
        field: "emergcontactname",
        headerName: "Emergency Contact Name",
        width: 200,
      },
      {
        field: "emergcontactemail",
        headerName: "Emergency Contact Email",
        width: 200,
      },
      {
        field: "emergcontactphone",
        headerName: "Emergency Contact Phone",
        width: 150,
      },
      {
        field: "emergcontactaddrs",
        headerName: "Emergency Contact Address",
        width: 300,
      },
      {
        field: "fee_paid",
        headerName: "Fee Paid",
        valueFormatter: AmountFormatter,
        width: 120,
      },
      {
        field: "notes",
        headerName: "Notes",
        width: 200,
      },
      {
        field: "batchid",
        headerName: "Batch ID",
        width: 100,
      },
      {
        field: "candidate_folder",
        headerName: "Candidate Folder",
        width: 200,
      },
    ];
    setColumnDefs(defs);
  }, [candidates]);

  // Update row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/${updatedRow.id}`,
        updatedRow
      );
      setFilteredCandidates((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
    } catch (error) {
      console.error("Failed to update candidate:", error);
    }
  };

  // Delete row
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${id}`);
      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
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
            placeholder="Search by name, email, or ID..."
            className="pl-10"
          />
        </div>
        {searching ? (
          <p>Searching...</p>
        ) : (
          searchTerm && <p>{filteredCandidates.length} candidates found</p>
        )}
      </div>
      <AGGridTable
        rowData={searchTerm ? filteredCandidates : candidates}
        columnDefs={columnDefs}
        title={`All Candidates (${searchTerm ? filteredCandidates.length : candidates.length})`}
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
            {[10, 50, 100].map((size) => (
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
