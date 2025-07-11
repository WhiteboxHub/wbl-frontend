// // whiteboxLearning-wbl/app/avatar/candidates/search/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import axios from "axios";

const StatusRenderer = (params: any) => {
  const status = params?.value?.toString().toLowerCase() ?? "";

  const colorMap: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    preparation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    marketing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    placed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    discontinued: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    break: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    defaulted: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    completed: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  };

  const badgeClass =
    colorMap[status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";

  return <Badge className={badgeClass}>{params.value?.toString().toUpperCase()}</Badge>;
};

const VisaStatusRenderer = (params: any) => {
  const visa = (params?.value || "").toString().trim();

  const colorMap: Record<string, string> = {
    H1B: "bg-blue-100 text-blue-800",
    GC: "bg-emerald-100 text-emerald-800",
    "F1 Student": "bg-purple-100 text-purple-800",
    "F1": "bg-purple-100 text-purple-800",
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
  params.value ? `$${Number(params.value).toLocaleString()}` : "";

export default function CandidateSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!searchTerm.trim()) {
      setFilteredCandidates([]);
      setColumnDefs([]);
      setError("");
      return;
    }

    debounceTimeout.current = setTimeout(() => {
      if (abortController.current) {
        abortController.current.abort();
      }

      const controller = new AbortController();
      abortController.current = controller;

      const fetchCandidates = async () => {
        setSearching(true);
        setError("");

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/candidates/by-name/${encodeURIComponent(
              searchTerm
            )}`,
            { signal: controller.signal }
          );

          if (!res.ok) throw new Error("Search failed");

          const data = await res.json();
          setFilteredCandidates(data);

          if (data.length > 0) {
            const dynamicColumns: ColDef[] = Object.keys(data[0]).map((key) => {
              const headerName = key
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .replace(/\b\w/g, (c) => c.toUpperCase());

              const column: ColDef = {
                field: key,
                headerName,
                width: 150,
                editable: false,
              };

              if (key.toLowerCase().includes("date") && key.toLowerCase() !== "candidateid") {
                column.valueFormatter = DateFormatter;
              } else if (key.toLowerCase() === "status") {
                column.cellRenderer = StatusRenderer;
              } else if (key.toLowerCase() === "workstatus") {
                column.cellRenderer = VisaStatusRenderer;
              } else if (["feepaid", "feedue", "amount_paid"].includes(key.toLowerCase())) {
                column.valueFormatter = AmountFormatter;
              }

              if (key === "candidateid") {
                column.pinned = "left";
                column.checkboxSelection = true;
                column.width = 100;
              }

              return column;
            });

            setColumnDefs(dynamicColumns);
          } else {
            setColumnDefs([]);
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            setFilteredCandidates([]);
            setColumnDefs([]);
            setError("Search failed");
          }
        } finally {
          setSearching(false);
        }
      };

      fetchCandidates();
    }, 300);
  }, [searchTerm]);


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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Search Candidates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search Candidates by Name 
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search by Name
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Enter candidate name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {searching && (
          <p className="mt-2 text-sm text-blue-500 dark:text-blue-400">Searching...</p>
        )}
        {searchTerm && !searching && !error && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredCandidates.length} candidate(s) found
          </p>
        )}
        {error && !searching && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
      </div>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={filteredCandidates}
            columnDefs={columnDefs}
            title={`Search Results (${filteredCandidates.length})`}
            height="calc(70vh)"
            showSearch={false}
            onRowClicked={(event) => console.log("Row clicked:", event.data)}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>
    </div>
  );
}