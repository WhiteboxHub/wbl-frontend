

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
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function CandidatesPlacements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Modal State */
  const [showModal, setShowModal] = useState(false);

  /** --- State for New Placement --- */
  const [newPlacement, setNewPlacement] = useState<any>({
    candidate_id: "",
    candidate_name: "",
    company: "",
    position: "",
    placement_date: "",
    type: "Company",
    status: "scheduled",
    base_salary_offered: "",
    benefits: "",
    fee_paid: "",
    notes: "",
    priority: "", 
  });

  /** --- Custom Renderers --- */
  const StatusRenderer = (params: any) => {
    const { value } = params;
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        {value?.toUpperCase()}
      </Badge>
    );
  };

  const AmountRenderer = (params: any) =>
    `$${params.value?.toLocaleString?.() || params.value || 0}`;

    const CandidateNameRenderer = (params: any) => {
    const candidateId = params.data?.candidate_id; // Get candidate ID from row data
    const candidateName = params.value; // Get candidate name
    
    if (!candidateId || !candidateName) {
      return <span className="text-gray-500">{candidateName || "N/A"}</span>;
    }
    
    return (
      <Link 
        href={`/avatar/candidates/search?candidateId=${candidateId}`}
        className="text-black-600 hover:text-blue-800 font-medium cursor-pointer"
      >
        {candidateName}
      </Link>
    );
  };


  const getCustomRenderer = (key: string) => {
  if (key === "status") return StatusRenderer;
  if (key === "fee_paid") return AmountRenderer;
  if (key === "candidate_name" || key === "placement" || key === "candidate") return CandidateNameRenderer; // Add this line
  return undefined;
};

  /** --- Fetch Placements --- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements?page=1&limit=1000`
        );
        if (!res.ok) throw new Error("Failed to fetch placements");
        const responseData = await res.json();
        const data = responseData.data || [];
        setAllCandidates(data);
        setFilteredCandidates(data);

        if (data.length > 0) {
          const orderedFields = [
            "id",
            "candidate_name",
            "candidate_id",
            "position",
            "placement",
            "company",
          ];

          const orderedColumns: ColDef[] = orderedFields
            .filter((field) => field in data[0])
            .map((key) => ({
              field: key,
              headerName: key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase()),
              width: 150,
              minWidth: 120,
              cellRenderer: getCustomRenderer(key),
              editable: true,
              ...(key === "fee_paid" && {
                valueParser: (params) => {
                  if (!params.newValue) return 0;
                  const numericValue = Number(
                    String(params.newValue).replace(/[$,]/g, "")
                  );
                  return isNaN(numericValue) ? 0 : numericValue;
                },
              }),
            }));

          const dynamicColumns: ColDef[] = Object.keys(data[0])
            .filter((key) => !orderedFields.includes(key) && key !== "last_mod_datetime")
            .map((key) => ({
              field: key,
              headerName: key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase()),
              width: 150,
              minWidth: 120,
              cellRenderer: getCustomRenderer(key),
              editable: true,
              ...(key === "fee_paid" && {
                valueParser: (params) => {
                  if (!params.newValue) return 0;
                  const numericValue = Number(
                    String(params.newValue).replace(/[$,]/g, "")
                  );
                  return isNaN(numericValue) ? 0 : numericValue;
                },
              }),
            }));

          setColumnDefs([...orderedColumns, ...dynamicColumns]);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements?page=1&limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }

        }
      );
      
      if (!res.ok) throw new Error("Failed to fetch placements");
      const responseData = await res.json();
      const data = responseData.data || [];
      setAllCandidates(data);
      setFilteredCandidates(data);

      if (data.length > 0) {
        const orderedFields = [
          "id",
          "candidate_id",
          "position",
          "placement",
          "company",
        ];
        const orderedColumns: ColDef[] = orderedFields
          .filter((field) => field in data[0])
          .map((key) => ({
            field: key,
            headerName: key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase()),
            width: 150,
            minWidth: 120,
            cellRenderer: getCustomRenderer(key),
            editable: true,
            ...(key === "fee_paid" && {
              valueParser: (params) => {
                if (!params.newValue) return 0;
                const numericValue = Number(
                  String(params.newValue).replace(/[$,]/g, "")
                );
                return isNaN(numericValue) ? 0 : numericValue;
              },
            }),
          }));

        const dynamicColumns: ColDef[] = Object.keys(data[0])
          .filter((key) => !orderedFields.includes(key) && key !== "last_mod_datetime")
          .map((key) => ({
            field: key,
            headerName: key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase()),
            width: 150,
            minWidth: 120,
            cellRenderer: getCustomRenderer(key),
            editable: true,
            ...(key === "fee_paid" && {
              valueParser: (params) => {
                if (!params.newValue) return 0;
                const numericValue = Number(
                  String(params.newValue).replace(/[$,]/g, "")
                );
                return isNaN(numericValue) ? 0 : numericValue;
              },
            }),
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

  /** --- Update Placement --- */
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const { id, ...payload } = updatedRow;

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements/${id}`,
        payload
      );

      setFilteredCandidates((prev) =>
        prev.map((row) => (row.id === id ? res.data : row))
      );
      setAllCandidates((prev) =>
        prev.map((row) => (row.id === id ? res.data : row))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update placement. Try again.");
    }
  };

  /** --- Delete Placement --- */
  const handleRowDeleted = async (id: number | string) => {
    try {
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements/${id}`
      );
      if (res.status !== 200) throw new Error("Delete failed");

      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
      setAllCandidates((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete placement. Try again.");
    }
  };

  /** --- Create Placement --- */
  const handleCreatePlacement = async () => {
    if (!newPlacement.candidate_id || !newPlacement.company || !newPlacement.placement_date) {
      alert("Please fill Candidate ID, Company, and Placement Date.");
      return;
    }

    const payload = {
      candidate_id: Number(newPlacement.candidate_id),
      company: newPlacement.company,
      position: newPlacement.position || undefined,
      placement_date: newPlacement.placement_date,
      type: newPlacement.type || undefined,
      status: newPlacement.status,
      base_salary_offered: newPlacement.base_salary_offered
        ? Number(newPlacement.base_salary_offered)
        : undefined,
      benefits: newPlacement.benefits || undefined,
      fee_paid: newPlacement.fee_paid ? Number(newPlacement.fee_paid) : undefined,
      notes: newPlacement.notes || undefined,
      priority: newPlacement.priority !== "" ? Number(newPlacement.priority) : undefined,
    };

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements`,
        payload
      );

      if (res.status !== 200 && res.status !== 201)
        throw new Error("Create failed");

      const newRow = {
        ...res.data,
        candidate: newPlacement.candidate_id,
        candidate_name: newPlacement.candidate_name || newPlacement.candidate_id,
        priority: newPlacement.priority !== "" ? Number(newPlacement.priority) : undefined,
      };

      setAllCandidates((prev) => [...prev, newRow]);
      setFilteredCandidates((prev) => [...prev, newRow]);
      setShowModal(false);

      setNewPlacement({
        candidate_id: "",
        company: "",
        position: "",
        placement_date: "",
        type: "Company",
        status: "scheduled",
        base_salary_offered: "",
        benefits: "",
        fee_paid: "",
        notes: "",
        priority: "",
      });

      alert("Placement created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create placement. Check required fields and data types.");
    }
  };

  /** --- Render --- */
  return (
    <div className="space-y-6">
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add Placement
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Add Placement
            </h2>
            <div className="space-y-3">
              <Input
                placeholder="Candidate ID"
                value={newPlacement.candidate_id}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, candidate_id: e.target.value })
                }
              />
              <Input
                placeholder="Company"
                value={newPlacement.company}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, company: e.target.value })
                }
              />
              <Input
                placeholder="Position"
                value={newPlacement.position}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, position: e.target.value })
                }
              />
              <Input
                type="date"
                value={newPlacement.placement_date}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, placement_date: e.target.value })
                }
              />
              <select
                value={newPlacement.type}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, type: e.target.value })
                }
                className="w-full p-2 border rounded-md"
              >
                <option>Company</option>
                <option>Client</option>
                <option>Vendor</option>
                <option>Implementation Partner</option>
              </select>
              <select
                value={newPlacement.status}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, status: e.target.value })
                }
                className="w-full p-2 border rounded-md"
              >
                <option>Active</option>
                <option>In Active</option>
              </select>
              <Input
                placeholder="Base Salary"
                value={newPlacement.base_salary_offered}
                onChange={(e) =>
                  setNewPlacement({
                    ...newPlacement,
                    base_salary_offered: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Fee Paid"
                value={newPlacement.fee_paid}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, fee_paid: e.target.value })
                }
              />
              <Input
                placeholder="Notes"
                value={newPlacement.notes}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, notes: e.target.value })
                }
              />
              <Input
                placeholder="Priority"
                type="number"
                value={newPlacement.priority}
                onChange={(e) =>
                  setNewPlacement({ ...newPlacement, priority: e.target.value })
                }
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
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

      {/* Table */}
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

