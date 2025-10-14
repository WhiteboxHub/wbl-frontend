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
  id: number;
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
}

const typeOptions = ["Company", "Client", "Vendor", "Implementation Partner"];
const statusOptions = ["Active", "Inactive"];

export default function CandidatesPlacements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allCandidates, setAllCandidates] = useState<Placement[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Placement[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [marketingCandidates, setMarketingCandidates] = useState<Candidate[]>([]);
  const [marketingCandidatesLoading, setMarketingCandidatesLoading] = useState(false);
  const [marketingCandidatesError, setMarketingCandidatesError] = useState<string | null>(null);
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
      if (e.key === "Escape") {
        setShowModal(false);
      }
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

  const getCustomRenderer = (key: string) => {
    if (key === "status") return StatusRenderer;
    if (key === "fee_paid") return AmountRenderer;
    if (key === "candidate_name" || key === "placement" || key === "candidate")
      return CandidateNameRenderer;
    return undefined;
  };

  // Fetch placements
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements?page=1&limit=1000`,
          {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch placements");
        const responseData = await res.json();
        const data = responseData.data || [];
        setAllCandidates(data);
        setFilteredCandidates(data);

        if (data.length > 0) {
          const orderedFields = ["id", "candidate_id", "position", "placement", "company"];
          const orderedColumns: ColDef[] = orderedFields
            .filter((field) => field in data[0])
            .map((key) => ({
              field: key,
              headerName: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
              width: 150,
              minWidth: 120,
              cellRenderer: getCustomRenderer(key),
              editable: true,
            }));
          const dynamicColumns: ColDef[] = Object.keys(data[0])
            .filter((key) => !orderedFields.includes(key) && key !== "last_mod_datetime")
            .map((key) => ({
              field: key,
              headerName: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
              width: 150,
              minWidth: 120,
              cellRenderer: getCustomRenderer(key),
              editable: true,
              ...(key === "fee_paid" && {
                valueParser: (params: any) => {
                  if (!params.newValue) return 0;
                  const numericValue = Number(String(params.newValue).replace(/[$,]/g, ""));
                  return isNaN(numericValue) ? 0 : numericValue;
                },
              }),
              ...(key === "priority" && { valueParser: (params: any) => Number(params.newValue) || null }),
              ...(key === "type" && { cellEditor: "agSelectCellEditor", cellEditorParams: { values: typeOptions } }),
              ...(key === "status" && { cellEditor: "agSelectCellEditor", cellEditorParams: { values: statusOptions } }),
            }));
          setColumnDefs([...orderedColumns, ...dynamicColumns]);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Unable to fetch placements data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Search filter
  const filterCandidates = useCallback(
    (term: string) => {
      if (!term.trim()) return allCandidates;
      const lower = term.toLowerCase();
      return allCandidates.filter((c) =>
        Object.values(c).some((v) => String(v).toLowerCase().includes(lower))
      );
    },
    [allCandidates]
  );

  useEffect(() => {
    setFilteredCandidates(filterCandidates(searchTerm));
  }, [searchTerm, filterCandidates]);

  // Row updates
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const { id, candidate_name, ...payload } = updatedRow;
      ["base_salary_offered", "fee_paid", "priority"].forEach((field) => {
        if (payload[field] !== undefined) payload[field] = Number(payload[field]) || null;
      });
      ["position", "type", "notes", "benefits"].forEach((field) => {
        if (payload[field] === "") payload[field] = null;
      });
      if (payload.type && !typeOptions.includes(payload.type)) payload.type = null;
      if (payload.status) payload.status = payload.status.trim();
      if (!statusOptions.includes(payload.status)) payload.status = "Active";
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements/${id}`,
        payload
      );
      setFilteredCandidates((prev) => prev.map((row) => (row.id === id ? res.data : row)));
      setAllCandidates((prev) => prev.map((row) => (row.id === id ? res.data : row)));
      toast.success("Placement updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update placement. Try again.");
    }
  };

  // Row deletion
  const handleRowDeleted = async (id: number | string) => {
    try {
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements/${id}`
      );
      if (res.status !== 200) throw new Error("Delete failed");
      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
      setAllCandidates((prev) => prev.filter((row) => row.id !== id));
      toast.success("Placement deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete placement. Try again.");
    }
  };

  // Create placement
  const handleCreatePlacement = async () => {
    if (!newPlacement.candidate_id) {
      toast.error("Please select a candidate.");
      return;
    }
    if (!newPlacement.type) {
      toast.error("Please select a type.");
      return;
    }
    if (!newPlacement.status) {
      toast.error("Please select a status.");
      return;
    }
    if (!newPlacement.company || !newPlacement.placement_date) {
      toast.error("Please fill Company and Placement Date.");
      return;
    }
    const payload = {
      candidate_id: newPlacement.candidate_id
        ? Number(newPlacement.candidate_id)
        : null,
      company: newPlacement.company,
      position: newPlacement.position || null,
      placement_date: newPlacement.placement_date,
      type: newPlacement.type,
      status: newPlacement.status,
      base_salary_offered: newPlacement.base_salary_offered
        ? Number(newPlacement.base_salary_offered)
        : undefined,
      benefits: newPlacement.benefits || undefined,
      fee_paid: newPlacement.fee_paid ? Number(newPlacement.fee_paid) : undefined,
      notes: newPlacement.notes || undefined,
      priority:
        newPlacement.priority !== "" ? Number(newPlacement.priority) : undefined,
    };
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements`,
        payload
      );

      if (res.status !== 200 && res.status !== 201) throw new Error("Create failed");
      const newRow = {
        ...res.data,
        candidate: newPlacement.candidate_id,
        candidate_name: newPlacement.candidate_name,
        priority:
          newPlacement.priority !== "" ? Number(newPlacement.priority) : undefined,

      };
      setAllCandidates((prev) => [...prev, newRow]);
      setFilteredCandidates((prev) => [...prev, newRow]);
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
      toast.error("Failed to create placement. Check required fields and data types.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Placements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Successfully placed candidates
          </p>
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
      </div>
      {/* Add Placement Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div

            className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"

            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Add Placement
            </h2>
            <div className="space-y-3 flex-1">
              {/* Candidate */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Candidate
              </h3>
              <select
                value={newPlacement.candidate_id}
                onChange={(e) => {
                  const selected = marketingCandidates.find(
                    (c) => c.id === Number(e.target.value)
                  );
                  setNewPlacement({
                    ...newPlacement,
                    candidate_id: selected?.id || "",
                    candidate_name: selected?.name || "",
                  });
                }}
                className="w-full p-2 border rounded-md"
                disabled={
                  marketingCandidatesLoading || marketingCandidates.length === 0
                }
              >
                <option value="">Select Candidate</option>
                {marketingCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {/* Type */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Type
              </h3>
              <select
                value={newPlacement.type}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, type: e.target.value })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Type</option>
                {typeOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              {/* Status */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Status
              </h3>
              <select
                value={newPlacement.status}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, status: e.target.value })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Status</option>
                {statusOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              {/* Company */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Company
              </h3>

              <Input
                placeholder="Company"
                value={newPlacement.company}
                onChange={(e) => setNewPlacement({ ...newPlacement, company: e.target.value })}
              />
              {/* Position */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Position
              </h3>
              <Input
                placeholder="Position"
                value={newPlacement.position}
                onChange={(e) => setNewPlacement({ ...newPlacement, position: e.target.value })}
              />
              {/* Placement Date */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Placement Date
              </h3>
              <Input
                type="date"
                value={newPlacement.placement_date}

                onChange={(e) =>
                  setNewPlacement({
                    ...newPlacement,
                    placement_date: e.target.value,
                  })
                }
              />
              {/* Base Salary */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Base Salary
              </h3>

              <Input
                placeholder="Base Salary"
                type="number"
                value={newPlacement.base_salary_offered}
                onChange={(e) => setNewPlacement({ ...newPlacement, base_salary_offered: e.target.value })}
              />
              {/* Fee Paid */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Fee Paid
              </h3>
              <Input
                placeholder="Fee Paid"
                type="number"
                value={newPlacement.fee_paid}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, fee_paid: e.target.value })
                }
              />
              {/* Notes */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </h3>
              <Input
                placeholder="Notes"
                value={newPlacement.notes}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, notes: e.target.value })
                }

              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlacement}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AG Grid Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Placements (${filteredCandidates.length})`}
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

