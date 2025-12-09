


// app/avatar/placements/page.tsx
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
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";

interface Placement {
  id?: number;
  candidate_id: number | string;
  candidate_name: string;
  company: string;
  position: string;
  placement_date: string;
  joining_date: string;
  type: string;
  status: string;
  base_salary_offered: number | string;
  benefits: string;
  fee_paid: number | string;
  notes: string;
  // priority: number | string;
  last_mod_datetime?: string;
  marketing_start_date?: string;
}

const typeOptions = ["Company", "Client", "Vendor", "Implementation Partner"];
const statusOptions = ["Active", "Inactive", "Complete", "Fired","did not take off"];

export default function CandidatesPlacements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allPlacements, setAllPlacements] = useState<Placement[]>([]);
  const [filteredPlacements, setFilteredPlacements] = useState<Placement[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status Renderer
  const StatusRenderer = (params: any) => {
    const status = (params.value || "").toString().toLowerCase();
    let badgeClass = "";

    switch (status) {
      case "active":
        badgeClass = "bg-green-100 text-green-800";
        break;
      case "inactive":
        badgeClass = "bg-red-100 text-red-800";
        break;
      case "Complete":
        badgeClass = "bg-blue-100 text-blue-800";
        break;
      case "Fired":
        badgeClass = "bg-orange-100 text-orange-800";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-700";
      case "did not take off":
        badgeClass = "bg-purple-100 text-purple-800"; 
        break;
    }

    return <Badge className={badgeClass}>{params.value}</Badge>;
  };

  // Date Renderer
  const DateRenderer = (params: any) => {
    if (!params.value) return <span className="text-gray-500">N/A</span>;
    try {
      const date = new Date(params.value);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return <span className="text-gray-500">Invalid Date</span>;
    }
  };

  // Amount Renderer
  const AmountRenderer = (params: any) =>
    `$${Number(params.value ?? 0).toLocaleString()}`;

  // Candidate name link
  const CandidateNameRenderer = (params: any) => {
    const candidateId = params.data?.candidate_id;
    const candidateName =
      params.data?.candidate_name ||
      params.data?.candidate?.full_name ||
      params.value;

    if (!candidateId || !candidateName)
      return <span className="text-gray-500">{candidateName || "N/A"}</span>;

    return (
      <Link
        href={`/avatar/candidates/search?candidateId=${candidateId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800 font-medium"
      >
        {candidateName}
      </Link>
    );
  };

  // Fetch placements
  useEffect(() => {
    const fetchPlacements = async () => {
      setLoading(true);
      try {
        const res = await api.get("/candidate/placements?page=1&limit=1000");
        const body = res?.data ?? res?.raw ?? [];
        const placements = Array.isArray(body)
          ? body
          : Array.isArray(body.data)
          ? body.data
          : body.data ?? [];

        // Ensure joining_date field exists
        const placementsWithJoiningDate = placements.map((p: any) => ({
          ...p,
          joining_date: p.joining_date || null,
          marketing_start_date: p.marketing_start_date || null,
          placement_date: p.placement_date || null,
        }));

        setAllPlacements(placementsWithJoiningDate);
        setFilteredPlacements(placementsWithJoiningDate);

        if (placementsWithJoiningDate.length > 0) {
          const cols: ColDef[] = [
            { field: "id", headerName: "ID", width: 80, pinned: "left" },

            {
              field: "candidate_name",
              headerName: "Candidate",
              minWidth: 160,
              cellRenderer: CandidateNameRenderer,
              valueGetter: (p) =>
                p.data?.candidate_name ??
                p.data?.candidate?.full_name ??
                "N/A",
            },

            { field: "company", headerName: "Company", minWidth: 150, editable: true },
            { field: "position", headerName: "Position", minWidth: 150, editable: true },

            // 📌 UPDATED DATE COLUMNS WITH FILTERS
            {
              field: "marketing_start_date",
              headerName: "Marketing Date",
              minWidth: 140,
              editable: true,
              cellRenderer: DateRenderer,
              filter: "agDateColumnFilter",
            },
            {
              field: "placement_date",
              headerName: "Placement Date",
              minWidth: 140,
              editable: true,
              cellRenderer: DateRenderer,
              filter: "agDateColumnFilter",
            },

            {
              field: "joining_date",
              headerName: "Joining Date",
              minWidth: 140,
              editable: true,
              cellRenderer: DateRenderer,
              filter: "agDateColumnFilter",
              valueGetter: (p) => p.data?.joining_date || null,
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
              headerName: "Base Salary",
              minWidth: 160,
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

            { field: "benefits", headerName: "Benefits", minWidth: 150, editable: true },
            { field: "notes", headerName: "Notes", minWidth: 150, editable: true },
          ];

          setColumnDefs(cols);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch placements");
      } finally {
        setLoading(false);
      }
    };

    fetchPlacements();
  }, []);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredPlacements(
      allPlacements
        .filter((p) =>
          Object.values(p).some((v) => String(v).toLowerCase().includes(lower))
        )
        .sort((a, b) => (b.id || 0) - (a.id || 0))
    );
  }, [searchTerm, allPlacements]);

  // Update row
  const handleRowUpdated = async (updatedRow: Placement) => {
    try {
      if (!updatedRow.id) return toast.error("Missing placement ID");

      await api.put(`/candidate/placements/${updatedRow.id}`, updatedRow);

      setAllPlacements((prev) =>
        prev.map((p) => (p.id === updatedRow.id ? updatedRow : p))
      );
      toast.success("Updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
    }
  };

  // Delete row
  const handleRowDeleted = async (id: number) => {
    try {
      await api.delete(`/candidate/placements/${id}`);
      setAllPlacements((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Placements
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Successfully placed candidates
      </p>

      <div className="max-w-md">
        <Label htmlFor="search">Search Candidates</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="w-full flex justify-center">
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


