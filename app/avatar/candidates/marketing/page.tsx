

"use client";

import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function CandidatesMarketingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(100);

  // Fetch marketing candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=${page}&limit=${limit}`
        );
        const dataJson = await res.json();
        const data = Array.isArray(dataJson.data) ? dataJson.data : [];
        setAllCandidates(data);
        setFilteredCandidates(data);
      } catch {
        setError("Failed to load candidates.");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [page, limit]);

  // Filter candidates based on search
  const filterCandidates = useCallback(
    (term: string) => {
      if (!term.trim()) return allCandidates;
      const searchLower = term.toLowerCase();
      return allCandidates.filter((candidate) =>
        Object.values(candidate).some((val) =>
          val?.toString().toLowerCase().includes(searchLower)
        )
      );
    },
    [allCandidates]
  );

  useEffect(() => {
    setFilteredCandidates(filterCandidates(searchTerm));
  }, [searchTerm, filterCandidates]);

  // Status renderer
  const StatusRenderer = (params: any) => (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
      {params.value?.toUpperCase()}
    </Badge>
  );

  // Column definitions aligned with backend model
  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    return [
      {
        field: "candidate.full_name",
        
        headerName: "Full Name",
        sortable: true,
        minWidth: 150,
        // valueGetter: (params) => params.data.candidate?.name || "N/A",
      },
      {
        field: "marketing_manager",
        headerName: "Marketing Manager",
        sortable: true,
        minWidth: 150,
      },
      {
        field: "start_date",
        headerName: "Start Date",
        sortable: true,
        maxWidth: 120,
      },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        maxWidth: 110,
      },
      // Show instructor names (from backend relationship)
      {
        field: "instructor1.name",
        headerName: "Instructor 1",
        minWidth: 150,
        valueGetter: (params) => params.data.instructor1?.name || "N/A",
      },
      {
        field: "instructor2.name",
        headerName: "Instructor 2",
        minWidth: 150,
        valueGetter: (params) => params.data.instructor2?.name || "N/A",
      },
      {
        field: "instructor3.name",
        headerName: "Instructor 3",
        minWidth: 150,
        valueGetter: (params) => params.data.instructor3?.name || "N/A",
      },
      { field: "email", headerName: "Email", minWidth: 150 },
      { field: "password", headerName: "Password", minWidth: 150 },
      {
        field: "google_voice_number",
        headerName: "Google Voice Number",
        minWidth: 150,
      },
      { field: "rating", headerName: "Rating", maxWidth: 100 },
      { field: "priority", headerName: "Priority", maxWidth: 100 },
      { field: "notes", headerName: "Notes", maxWidth: 90 },
    ];
  }, []);

  // Update candidate row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${updatedRow.candidate_id}`,
        updatedRow
      );
      setFilteredCandidates((prev) =>
        prev.map((row) =>
          row.candidate_id === updatedRow.candidate_id ? updatedRow : row
        )
      );
    } catch {}
  };

  // Delete candidate row
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${id}`
      );
      setFilteredCandidates((prev) =>
        prev.filter((row) => row.candidate_id !== id)
      );
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Marketing Phase Candidates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates currently in marketing phase
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Candidates
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredCandidates.length} candidate(s) found
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex w-full justify-center">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Marketing Phase (${filteredCandidates.length})`}
              height="calc(70vh)"
              showSearch={false}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
