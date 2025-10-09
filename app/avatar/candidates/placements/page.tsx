"use client";
import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useState, useEffect, useCallback } from "react";
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

  const [showModal, setShowModal] = useState(false);

  const [marketingCandidates, setMarketingCandidates] = useState<Candidate[]>([]);
  const [marketingCandidatesLoading, setMarketingCandidatesLoading] = useState(false);
  const [newPlacement, setNewPlacement] = useState<Omit<Placement, "id">>({
    candidate_id: "",
    candidate_name: "",
    company: "",
    position: "",
    placement_date: "",
    type: "",
    status: "",
    base_salary_offered: "",
    benefits: "",
    fee_paid: "",
    notes: "",
    priority: "",
  });


  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);


  // Fetch marketing candidates
  useEffect(() => {
    const fetchMarketingCandidates = async () => {
      setMarketingCandidatesLoading(true);
      setMarketingCandidatesError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=1&limit=1000`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch marketing candidates");
        const result = await res.json();
        const dataArray = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
          ? result.data
          : [];
        const formatted = dataArray.map((c: any) => ({
          id: c.candidate?.id ?? c.id,
          name: c.candidate?.full_name ?? "Unnamed Candidate",
        }));
        setMarketingCandidates(formatted);
      } catch (err: any) {
        console.error("Error fetching marketing candidates:", err);
        setMarketingCandidatesError(err.message || "Failed to load candidates");
      } finally {
        setMarketingCandidatesLoading(false);
      }
    };
    fetchMarketingCandidates();
  }, []);

  // AG Grid custom renderers
  const StatusRenderer = (params: any) => (
    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
      {params.value?.toUpperCase()}
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


  const StatusRenderer = (params: any) => (
    <Badge className={params.value === "Active" ? "bg-green-100 text-green-800" 
    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}>
      {params.value}
    </Badge>
  );


  const AmountRenderer = (params: any) =>
    `$${params.value?.toLocaleString?.() || params.value || 0}`;


  useEffect(() => {
    const fetchMarketingCandidates = async () => {
      setMarketingCandidatesLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=1&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        const candidates = (Array.isArray(result.data) ? result.data : []).map((c: any) => ({
          id: c.candidate?.id ?? c.id,
          name: c.candidate?.full_name ?? "Unnamed Candidate",
        }));
        setMarketingCandidates(candidates);
      } catch (err) {
        console.error("Failed to fetch marketing candidates", err);
      } finally {
        setMarketingCandidatesLoading(false);
      }
    };
    fetchMarketingCandidates();
  }, []);

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
            // { field: "last_mod_datetime", headerName: "Last Modified", minWidth: 160 }
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


  const handleCreatePlacement = async () => {
    if (!newPlacement.candidate_id || !newPlacement.type || !newPlacement.status || !newPlacement.company || !newPlacement.placement_date) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        ...newPlacement,
        candidate_id: Number(newPlacement.candidate_id),
        base_salary_offered: newPlacement.base_salary_offered ? Number(newPlacement.base_salary_offered) : undefined,
        fee_paid: newPlacement.fee_paid ? Number(newPlacement.fee_paid) : undefined,
        priority: newPlacement.priority ? Number(newPlacement.priority) : 99,

      };
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/candidate/placements`, payload);
      const newRow = { ...res.data, candidate_name: newPlacement.candidate_name };
      setAllPlacements(prev => [...prev, newRow]);
      setFilteredPlacements(prev => [...prev, newRow]);
      setShowModal(false);
      setNewPlacement({
        candidate_id: "",
        candidate_name: "",
        company: "",
        position: "",
        placement_date: "",
        type: "",
        status: "",
        base_salary_offered: "",
        benefits: "",
        fee_paid: "",
        notes: "",
        priority: "",
      });
      toast.success("Placement created successfully!");
    } catch (err) {
      console.error(err);

      toast.error("Failed to create placement");

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
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> Add Placement
        </button>
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

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowModal(false)}
        >
          <div

            className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Add Placement</h2>
            <div className="space-y-3">
              <Label>Candidate</Label>

              <select
                value={newPlacement.candidate_id}
                onChange={e => {
                  const selected = marketingCandidates.find(c => c.id === Number(e.target.value));
                  setNewPlacement({ ...newPlacement, candidate_id: selected?.id || "", candidate_name: selected?.name || "" });
                }}
                className="w-full p-2 border rounded-md"

              >
                <option value="">Select Candidate</option>
                {marketingCandidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <Label>Type</Label>
              <select
                value={newPlacement.type}
                onChange={e => setNewPlacement({ ...newPlacement, type: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Type</option>
                {typeOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>


              <Label>Status</Label>
              <select
                value={newPlacement.status}
                onChange={e => setNewPlacement({ ...newPlacement, status: e.target.value })}
                className="w-full p-2 border rounded-md"

              >
                <option value="">Select Status</option>
                {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>

              {/* Company */}
              <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Company
              </h3>


              <Label>Company</Label>
              <Input
                placeholder="Company"
                value={newPlacement.company}

                onChange={e => setNewPlacement({ ...newPlacement, company: e.target.value })}
              />

              <Label>Position</Label>
              <Input
                placeholder="Position"
                value={newPlacement.position}
                onChange={e => setNewPlacement({ ...newPlacement, position: e.target.value })}
              />

              <Label>Placement Date</Label>
              <Input
                type="date"
                value={newPlacement.placement_date}
                onChange={e => setNewPlacement({ ...newPlacement, placement_date: e.target.value })}
              />


              <Label>Base Salary Offered</Label>
              <Input
                type="number"
                value={newPlacement.base_salary_offered}

                onChange={e => setNewPlacement({ ...newPlacement, base_salary_offered: e.target.value })}
              />

              <Label>Fee Paid</Label>

              <Input
                type="number"
                value={newPlacement.fee_paid}
                onChange={e => setNewPlacement({ ...newPlacement, fee_paid: e.target.value })}
              />


              <Label>Notes</Label>

              <Input
                value={newPlacement.notes}

                onChange={e => setNewPlacement({ ...newPlacement, notes: e.target.value })}

              />

              {/* <Label>Priority</Label>
              <Input
                type="number"
                value={newPlacement.priority}
                onChange={e => setNewPlacement({ ...newPlacement, priority: e.target.value })}
              /> */}
            </div>

            <div className="mt-4 flex justify-end gap-3">

              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">Cancel</button>
              <button onClick={handleCreatePlacement} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>

            </div>
          </div>
        </div>
      )}

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
