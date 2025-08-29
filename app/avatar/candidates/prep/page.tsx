
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

const StatusRenderer = (params: any) => (
  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
    {params.value?.toUpperCase()}
  </Badge>
);

export default function CandidatesPrepPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(100);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations?page=${page}&limit=${limit}`
      );
      const data = res.data;
      if (!Array.isArray(data)) throw new Error("Invalid data format");

      setAllCandidates(data);
      setFilteredCandidates(data);
    } catch {
      setError("Failed to load candidate preparations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, limit]);

  const filterCandidates = useCallback(
    (searchTerm: string) => {
      if (searchTerm.trim() === "") return allCandidates;
      const searchLower = searchTerm.toLowerCase();
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

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      {
        field: "candidate.full_name",
        headerName: "Full Name",
        minWidth: 150,
        // valueGetter: (params) => params.data.candidate?.name || "N/A"
      },
      { field: "batch", headerName: "Batch", sortable: true, minWidth: 110 },
      { field: "start_date", headerName: "Start Date", sortable: true, maxWidth: 100 },
      { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 110 },
  
        {
      headerName: "Instructor 1",
      minWidth: 150,
      valueGetter: (params) => params.data.instructor1?.name || "N/A",
    },
    {
      headerName: "Instructor 2",
      minWidth: 150,
      valueGetter: (params) => params.data.instructor2?.name || "N/A",
    },
    {
      headerName: "Instructor 3",
      minWidth: 150,
      valueGetter: (params) => params.data.instructor3?.name || "N/A",
    },
      { field: "rating", headerName: "Rating", minWidth: 100 },
      { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
      { field: "communication", headerName: "Communication", minWidth: 120 },
      { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
      { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
      { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
      { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
      { field: "notes", headerName: "Notes", minWidth: 90 },
    ];
  }, []);

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${updatedRow.id}`,
        updatedRow
      );
      setFilteredCandidates((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations/${id}`);
      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidate Preparations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tracking candidate preparation status
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Candidates
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Candidate Preparations (${filteredCandidates.length})`}
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
