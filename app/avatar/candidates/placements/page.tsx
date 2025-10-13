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
import axios from "axios";
import { toast, Toaster } from "sonner";

interface Candidate {
  id: number;
  name: string;
}

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
  priority: number | string;
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

  // AG Grid custom renderers
  const StatusRenderer = (params: any) => (
    <Badge className={params.value === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}>
      {params.value}
    </Badge>
  );

  const AmountRenderer = (params: any) =>
    `$${params.value?.toLocaleString?.() || params.value || 0}`;

  const CandidateNameRenderer = (params: any) => {
    const candidateId = params.data?.candidate_id;
    const candidateName = params.value;
    if (!candidateId || !candidateName) return <span className="text-gray-500">{candidateName || "N/A"}</span>;
    return (
      <Link
        href={`/avatar/candidates/search?candidateId=${candidateId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-black-600 cursor-pointer font-medium hover:text-blue-800"
      >
        {candidateName}
      </Link>
    );
  };

  // Fetch placements
  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/placements?page=1&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch placements");
        const data = (await res.json()).data || [];
        setAllPlacements(data);
        setFilteredPlacements(data);
        if (data.length > 0) {
          const cols: ColDef[] = [
            { field: "id", headerName: "ID", width: 80, pinned: "left" },
            { field: "candidate_name", headerName: "Candidate Name", minWidth: 160, cellRenderer: CandidateNameRenderer },
            { field: "company", headerName: "Company", minWidth: 150, editable: true },
            { field: "position", headerName: "Position", minWidth: 150, editable: true },
            { field: "placement_date", headerName: "Placement Date", minWidth: 130, editable: true },
            { field: "type", headerName: "Type", minWidth: 140, editable: true, cellEditor: "agSelectCellEditor", cellEditorParams: { values: typeOptions } },
            { field: "status", headerName: "Status", minWidth: 120, editable: true, cellRenderer: StatusRenderer, cellEditor: "agSelectCellEditor", cellEditorParams: { values: statusOptions } },
            { field: "base_salary_offered", headerName: "Base Salary Offered", minWidth: 140, editable: true, cellRenderer: AmountRenderer },
            { field: "fee_paid", headerName: "Fee Paid", minWidth: 120, editable: true, cellRenderer: AmountRenderer },
            { field: "benefits", headerName: "Benefits", minWidth: 150, editable: true },
            { field: "notes", headerName: "Notes", minWidth: 150, editable: true },
            { field: "priority", headerName: "Priority", minWidth: 90, editable: true },
          ];
          setColumnDefs(cols);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch placements");
      } finally {
        setLoading(false);
      }
    };
    fetchPlacements();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredPlacements(
      allPlacements.filter(p => Object.values(p).some(v => String(v).toLowerCase().includes(lower)))
    );
  }, [searchTerm, allPlacements]);

  const handleRowUpdated = async (updatedRow: Placement) => {
    try {
      const { id, ...payload } = updatedRow;
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/candidate/placements/${id}`, payload);
      setAllPlacements(prev => prev.map(p => p.id === id ? updatedRow : p));
      setFilteredPlacements(prev => prev.map(p => p.id === id ? updatedRow : p));
      toast.success("Placement updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update placement");
    }
  };

  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate/placements/${id}`);
      setAllPlacements(prev => prev.filter(p => p.id !== id));
      setFilteredPlacements(prev => prev.filter(p => p.id !== id));
      toast.success("Placement deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete placement");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Placements</h1>
          <p className="text-gray-600 dark:text-gray-400">Successfully placed candidates</p>
        </div>
      </div>
      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Candidates</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      {/* AG Grid Table */}
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
