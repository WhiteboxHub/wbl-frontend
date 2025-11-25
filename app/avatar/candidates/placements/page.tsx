// app/avatar/placements/page.tsx (or wherever your placements page lives)
// keep client directive
"use client";

import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useState, useEffect, useMemo } from "react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api"; // <-- wrapper from src/utils/api.ts

interface Placement {
  id?: number;
  candidate_id: number | string;
  candidate_name: string;
  company: string;
  position: string;
  placement_date: string;
  type: string;
  status: string;
  base_salary_offered: number | string;
  benefits: string;
  fee_paid: number | string;
  notes: string;
  // priority: number | string;
  last_mod_datetime?: string;
}

const typeOptions = ["Company", "Client", "Vendor", "Implementation Partner"];
const statusOptions = ["Active", "Inactive"];

export default function CandidatesPlacements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allPlacements, setAllPlacements] = useState<Placement[]>([]);
  const [filteredPlacements, setFilteredPlacements] = useState<Placement[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // small helpers / renderers
  const StatusRenderer = (params: any) => (
    <Badge
      className={
        (params.value || "").toString().toLowerCase() === "active"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      }
    >
      {params.value}
    </Badge>
  );
  const AmountRenderer = (params: any) =>
    `$${Number(params.value ?? 0).toLocaleString()}`;

  const CandidateNameRenderer = (params: any) => {
    const candidateId = params.data?.candidate_id;
    const candidateName =
      params.data?.candidate_name || params.data?.candidate?.full_name || params.value;
    if (!candidateId || !candidateName)
      return <span className="text-gray-500">{candidateName || "N/A"}</span>;
    return (
      <Link
        href={`/avatar/candidates/search?candidateId=${candidateId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
      >
        {candidateName}
      </Link>
    );
  };

  // fetch placements using api wrapper
  useEffect(() => {
    const fetchPlacements = async () => {
      setLoading(true);
      setError(null);
      try {
        // api.get returns { data } normalized wrapper
        const res = await api.get("/candidate/placements?page=1&limit=1000");
        const body = res?.data ?? res?.raw ?? [];
        // body may be an array or an object with data
        const placements = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : (body.data ?? []);
        setAllPlacements(placements);
        setFilteredPlacements(placements);

        if (placements.length > 0) {
          const cols: ColDef[] = [
            { field: "id", headerName: "ID", width: 80, pinned: "left" },
            {
              field: "candidate_name",
              headerName: "Candidate Name",
              minWidth: 160,
              cellRenderer: CandidateNameRenderer,
              valueGetter: (params) => params.data?.candidate_name ?? params.data?.candidate?.full_name ?? "N/A",
            },

            {
              field: "company",
              headerName: "Company",
              minWidth: 150,
              editable: true,
            },
            {
              field: "position",
              headerName: "Position",
              minWidth: 150,
              editable: true,
            },
            {
              field: "marketing_start_date",
              headerName: "Marketing Date",
              minWidth: 130,
              editable: true,
            },
            {
              field: "placement_date",
              headerName: "Placement Date",
              minWidth: 130,
              editable: true,
            },

            {
              field: "type",
              headerName: "Type",
              minWidth: 140,
              editable: true,
              cellEditor: "agSelectCellEditor",
              cellEditorParams: { values: typeOptions },
            },
            {
              field: "status",
              headerName: "Status",
              minWidth: 120,
              editable: true,
              cellRenderer: StatusRenderer,
              cellEditor: "agSelectCellEditor",
              cellEditorParams: { values: statusOptions },
            },
            {
              field: "base_salary_offered",
              headerName: "Base Salary Offered",
              minWidth: 140,
              editable: true,
              cellRenderer: AmountRenderer,
            },
            {
              field: "fee_paid",
              headerName: "Fee Paid",
              minWidth: 120,
              editable: true,
              cellRenderer: AmountRenderer,
            },

            {
              field: "benefits",
              headerName: "Benefits",
              minWidth: 150,
              editable: true,
            },
            {
              field: "notes",
              headerName: "Notes",
              minWidth: 150,
              editable: true,
            },

          ];
          setColumnDefs(cols);
        }
      } catch (err: any) {
        console.error("Fetch placements error:", err);
        setError(err?.message || "Failed to fetch placements");
        toast.error("Failed to fetch placements");
      } finally {
        setLoading(false);
      }
    };

    fetchPlacements();
  }, []);

  // search filtering
  useEffect(() => {
    const lower = searchTerm.toLowerCase();

setFilteredPlacements(
  allPlacements
    .filter((p) =>
      Object.values(p).some((v) => String(v).toLowerCase().includes(lower))
    )
    .sort((a, b) => b.id - a.id) 
);

  }, [searchTerm, allPlacements]);

  // update placement
  const handleRowUpdated = async (updatedRow: Placement) => {
    try {
      const id = updatedRow.id;
      if (!id) {
        toast.error("Missing placement id");
        return;
      }
      const payload = { ...updatedRow };
      // call our api wrapper
      await api.put(`/candidate/placements/${id}`, payload);
      setAllPlacements((prev) => prev.map((p) => (p.id === id ? updatedRow : p)));
      setFilteredPlacements((prev) => prev.map((p) => (p.id === id ? updatedRow : p)));
      toast.success("Placement updated successfully!");
    } catch (err) {
      console.error("Update placement error:", err);
      toast.error("Failed to update placement");
    }
  };

  // delete
  const handleRowDeleted = async (id: number) => {
    try {
      if (!id) throw new Error("Missing id");
      await api.delete(`/candidate/placements/${id}`);
      setAllPlacements((prev) => prev.filter((p) => p.id !== id));
      setFilteredPlacements((prev) => prev.filter((p) => p.id !== id));
      toast.success("Placement deleted successfully!");
    } catch (err) {
      console.error("Delete placement error:", err);
      toast.error("Failed to delete placement");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      <div className="space-y-4 md:space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Placements</h1>
            <p className="text-gray-600 dark:text-gray-400">Successfully placed candidates</p>
          </div>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Candidates</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input id="search" type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex w-full justify-center">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredPlacements}
              columnDefs={columnDefs}
              title={`Placements (${filteredPlacements.length})`}
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
