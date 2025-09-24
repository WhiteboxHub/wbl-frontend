

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
import { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import { createPortal } from "react-dom";

// ---------------- Status Renderer ----------------
const StatusRenderer = (params: any) => {
  const status = params.value?.toLowerCase();
  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    break: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    discontinued: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };
  const className = statusColors[status] || "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  return <Badge className={className}>{params.value?.toUpperCase()}</Badge>;
};

const CandidateNameRenderer = (params: any) => {
  // Try multiple possible candidate ID fields
  const candidateId = params.data?.candidate_id || params.data?.candidate?.id || params.data?.id;
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


// ---------------- Status Filter Header ----------------
const StatusHeaderComponent = (props: any) => {
  const { selectedStatuses, setSelectedStatuses } = props;
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, left: rect.left });
    }
    setFilterVisible((v) => !v);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev: string[]) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilterVisible(false);
      }
    };
    const handleScroll = () => setFilterVisible(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <div className="relative flex items-center w-full" ref={filterButtonRef}>
      <span className="mr-12">Status</span>
      <svg
        onClick={toggleFilter}
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
      </svg>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[99999] bg-white border rounded shadow-lg p-3 flex flex-col space-y-2 w-48 pointer-events-auto"
            style={{ top: dropdownPos.top, left: dropdownPos.left, position: "fixed" }}
          >
            {[
              { value: "active", label: "Active" },
              { value: "break", label: "Break" },
              { value: "inactive", label: "Inactive" },
              { value: "discontinued", label: "Discontinued" }
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(value)}
                  onChange={() => handleStatusChange(value)}
                  className="mr-3"
                />
                {label}
              </label>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

// ---------------- Main Page ----------------
export default function CandidatesPrepPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]); // all candidates for dropdown
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [instructors, setInstructors] = useState<any[]>([]);

  // --- Add Candidate Form State ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCandidate, setNewCandidate] = useState<any>({
    candidate_id: "",
    batch: "",
    start_date: "",
    status: "",
    instructor1_id: "",
    instructor1_Name: "",
    instructor2_id: "",
    instructor2_Name: "",
    instructor3_id: "",
    instructor3_Name: "",
    rating: "",
    tech_rating: "",
    communication: "",
    years_of_experience: "",
    topics_finished: "",
    current_topics: "",
    target_date_of_marketing: "",
    notes: "",
  });

  // ---------------- Fetch Data ----------------
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // get the auth token

      const [candidatesRes, instructorsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/employees?status=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }), // only active instructors
      ]);

      setAllCandidates(candidatesRes.data || []);
      setInstructors(instructorsRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  // ---------------- Filtering ----------------
  useEffect(() => {
    let filtered = allCandidates;
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((c) => selectedStatuses.includes(c.status?.toLowerCase()));
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => c.candidate?.full_name?.toLowerCase().includes(term));
    }
    setFilteredCandidates(filtered);
  }, [allCandidates, searchTerm, selectedStatuses]);

  // ---------------- Column Defs ----------------

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      { field: "candidate.full_name", headerName: "Full Name", minWidth: 150, cellRenderer: CandidateNameRenderer },
      { field: "batch", headerName: "Batch", sortable: true, maxWidth: 150 },
      { field: "start_date", headerName: "Start Date", sortable: true, maxWidth: 130 },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        maxWidth: 150,
        headerComponent: StatusHeaderComponent,
        headerComponentParams: { selectedStatuses, setSelectedStatuses },
      },
      { headerName: "Instructor 1", minWidth: 150, valueGetter: (params) => params.data.instructor1?.name || "N/A" },
      { headerName: "Instructor 2", minWidth: 150, valueGetter: (params) => params.data.instructor2?.name || "N/A" },
      { headerName: "Instructor 3", minWidth: 150, valueGetter: (params) => params.data.instructor3?.name || "N/A" },
      { field: "rating", headerName: "Rating", minWidth: 100 },
      { field: "tech_rating", headerName: "Tech Rating", minWidth: 120 },
      { field: "communication", headerName: "Communication", minWidth: 120 },
      { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
      { field: "topics_finished", headerName: "Topics Finished", minWidth: 150 },
      { field: "current_topics", headerName: "Current Topics", minWidth: 150 },
      { field: "target_date_of_marketing", headerName: "Target Marketing Date", minWidth: 160 },
      { field: "notes", headerName: "Notes", minWidth: 90 },
    ];
  }, [selectedStatuses]);


  // ---------------- CRUD Handlers ----------------
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = { ...updatedRow };
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${updatedRow.id}`, payload);
      setFilteredCandidates((prev) => prev.map((row) => (row.id === updatedRow.id ? { ...row, ...payload } : row)));
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation/${id}`);
      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // ---------------- Add Candidate ----------------
  const handleAddCandidate = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/candidate_preparation`, newCandidate);
      setAllCandidates((prev) => [...prev, res.data]);
      setShowAddForm(false);
      setNewCandidate({
        candidate_id: "",
        batch: "",
        start_date: "",
        status: "",
        instructor1_id: "",
        instructor1_Name: "",
        instructor2_id: "",
        instructor2_Name: "",
        instructor3_id: "",
        instructor3_Name: "",
        rating: "",
        tech_rating: "",
        communication: "",
        years_of_experience: "",
        topics_finished: "",
        current_topics: "",
        target_date_of_marketing: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to add candidate preparation:", err);
    }
  };

  // ---------------- Render ----------------
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Candidate Preparations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking candidate preparation status</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Preparation
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Candidates
        </Label>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-2"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Candidate Preparations (${filteredCandidates.length})`}
              height="calc(80vh)"
              showSearch={false}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={() => setShowAddForm(false)}
          />
          {/* Modal content */}
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Add Candidate Preparation</h2>
            <div className="space-y-3">
              {/* Candidate Dropdown */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Candidate</Label>
                <select
                  value={newCandidate.candidate_id}
                  onChange={(e) => setNewCandidate({ ...newCandidate, candidate_id: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Candidate</option>
                  {candidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Batch</Label>
                <Input
                  placeholder="Batch"
                  value={newCandidate.batch}
                  onChange={(e) => setNewCandidate({ ...newCandidate, batch: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={newCandidate.start_date}
                  onChange={(e) => setNewCandidate({ ...newCandidate, start_date: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Instructor Dropdowns */}
              {["1", "2", "3"].map((num) => (
                <div key={num} className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Instructor {num}
                  </Label>
                  <select
                    value={newCandidate[`instructor${num}_id`] || ""}
                    onChange={(e) => {
                      const selected = instructors.find((ins) => ins.id === Number(e.target.value));
                      setNewCandidate({
                        ...newCandidate,
                        [`instructor${num}_id`]: selected?.id || "",
                        [`instructor${num}_Name`]: selected?.name || "",
                      });
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Instructor</option>
                    {instructors
                      .filter((ins) => ins.status === 1)
                      .map((ins) => (
                        <option key={ins.id} value={ins.id}>
                          {ins.name}
                        </option>
                      ))}
                  </select>
                </div>
              ))}

              {/* Status Dropdown */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                <select
                  value={newCandidate.status}
                  onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="break">Break</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end mt-6 space-x-3">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-300 rounded">
                Cancel
              </button>
              <button onClick={handleAddCandidate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

