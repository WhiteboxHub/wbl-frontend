
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
import { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin_ui/dialog";
import { Button } from "@/components/admin_ui/button";

export default function CandidatesMarketingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [prepCandidates, setPrepCandidates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]); // 🔹 Employee list for instructors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(100);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newCandidate, setNewCandidate] = useState({
    candidate_id: "",
    full_name: "",
    start_date: "",
    status: "",
    email: "",
    password: "",
    google_voice_number: "",
    rating: "",
    priority: "",
    notes: "",
    instructor1_id: "",
    instructor2_id: "",
    instructor3_id: "",
  });

const token = localStorage.getItem("token");

const fetchCandidates = useCallback(async () => {
  try {
    setLoading(true);
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=${page}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = Array.isArray(res.data.data) ? res.data.data : [];
    setAllCandidates(data);
    setFilteredCandidates(data);
  } catch (err: any) {
    console.error(err);
    setError(err.response?.data?.message || "Failed to load candidates.");
  } finally {
    setLoading(false);
  }
}, [page, limit, token]);

useEffect(() => {
  fetchCandidates();
}, [fetchCandidates]);

  useEffect(() => {
    fetchCandidates();
    fetchPrepCandidates();
    fetchEmployees();
  }, [fetchCandidates, fetchPrepCandidates, fetchEmployees]);

  // Filter candidates
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

  // Status badge
  const StatusRenderer = (params: any) => (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
      {params.value?.toUpperCase()}
    </Badge>
  );

  // Resume renderer
  const ResumeRenderer = (params: any) => (
    <div className="flex items-center space-x-2">
      {params.value ? (
        <a
          href={params.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View
        </a>
      ) : (
        <span className="text-gray-400">N/A</span>
      )}
      <input
        type="file"
        id={`fileInput-${params.data.candidate_id}`}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.append("resume", file);
          try {
            const res = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${params.data.candidate_id}/resume`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            const updatedResume = res.data.candidate_resume;
            setFilteredCandidates((prev) =>
              prev.map((row) =>
                row.candidate_id === params.data.candidate_id
                  ? { ...row, candidate_resume: updatedResume }
                  : row
              )
            );
          } catch (err) {
            console.error("Resume upload failed", err);
          }
        }}
      />
    </div>
  );

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

  // Column definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "candidate_name",
        headerName: "Full Name",
        sortable: true,
        minWidth: 150,

        editable: true,
        cellRenderer: CandidateNameRenderer,

        
        valueGetter: (params) => params.data.candidate?.full_name || "N/A",

      },
      {
        field: "start_date",
        headerName: "Start Date",
        sortable: true,
        maxWidth: 120,
        editable: true,
      },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        maxWidth: 110,
        editable: true,
      },
      {
        field: "instructor1_name",
        headerName: "Instructor 1",
        minWidth: 150,
        editable: false,
      },
      {
        field: "instructor2_name",
        headerName: "Instructor 2",
        minWidth: 150,
        editable: false,
      },
      {
        field: "instructor3_name",
        headerName: "Instructor 3",
        minWidth: 150,
        editable: false,
      },
      {
        field: "marketing_manager_obj",
        headerName: "Marketing Manager",
        minWidth: 150,
        editable: false,
        valueGetter: (params) => params.data.marketing_manager_obj?.name || "N/A",
      },
      { field: "email", headerName: "Email", minWidth: 150, editable: true },
      { field: "password", headerName: "Password", minWidth: 150, editable: true },
      {
        field: "google_voice_number",
        headerName: "Google Voice Number",
        minWidth: 150,
        editable: true,
      },
      { field: "rating", headerName: "Rating", maxWidth: 100, editable: true },
      { field: "priority", headerName: "Priority", maxWidth: 100, editable: true },
      { field: "notes", headerName: "Notes", minWidth: 100, editable: true },
      { field: "candidate_resume", headerName: "Resume", minWidth: 200, cellRenderer: ResumeRenderer },
    ],
    []
  );
  // Handle row updates
  const handleRowUpdated = async (updatedRow: any) => {
    if (!updatedRow || !updatedRow.candidate_id) return;
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${updatedRow.candidate_id}`, updatedRow);
      await fetchCandidates();
    } catch (err) {
      console.error("Failed to update candidate:", err);
    }
  };

  // Handle row deletion
  const handleRowDeleted = async (candidate_id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${candidate_id}`);
      await fetchCandidates();
    } catch (err) {
      console.error("Failed to delete candidate:", err);
    }
  };

  // Handle add candidate
  const handleAddCandidate = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing`, newCandidate);
      setIsAddOpen(false);
      setNewCandidate({
        candidate_id: "",
        full_name: "",
        start_date: "",
        status: "",
        email: "",
        password: "",
        google_voice_number: "",
        rating: "",
        priority: "",
        notes: "",
        instructor1_id: "",
        instructor2_id: "",
        instructor3_id: "",
      });
      fetchCandidates();
    } catch (err) {
      console.error("Failed to add candidate:", err);
    }
  };

  // Handle selecting prep candidate
  const handlePrepSelect = (id: string) => {
    const selected = prepCandidates.find((c) => c.id.toString() === id);
    if (!selected) return;

    setNewCandidate((prev) => ({
      ...prev,
      candidate_id: selected.candidate_id || selected.id,
      full_name: selected.candidate?.full_name || "",
      start_date: selected.start_date || "",
      status: selected.status || "",
      rating: selected.rating || "",
      notes: selected.notes || "",
      instructor1_id: selected.instructor1?.id || "",
      instructor2_id: selected.instructor2?.id || "",
      instructor3_id: selected.instructor3?.id || "",
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Marketing Phase Candidates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates currently in marketing phase
          </p>
        </div>

        {/* Add Candidate Modal */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>+ Add Marketing</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Prep candidate selection */}
              <Label>Select Candidate (from Prep)</Label>
              <select
                value={newCandidate.candidate_id}
                onChange={(e) => handlePrepSelect(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value=""> Select Prep Candidate</option>
                {prepCandidates.map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    {cand.candidate?.full_name} ({cand.status})
                  </option>
                ))}
              </select>

              <Input
                placeholder="Email"
                value={newCandidate.email}
                onChange={(e) =>
                  setNewCandidate({ ...newCandidate, email: e.target.value })
                }
              />
              <Input
                placeholder="Password"
                type="password"
                value={newCandidate.password}
                onChange={(e) =>
                  setNewCandidate({ ...newCandidate, password: e.target.value })
                }
              />
              <Input
                placeholder="Google Voice Number"
                value={newCandidate.google_voice_number}
                onChange={(e) =>
                  setNewCandidate({ ...newCandidate, google_voice_number: e.target.value })
                }
              />
              {/* Instructor dropdowns */}
              <Label>Instructor 1</Label>
              <select
                value={newCandidate.instructor1_id}
                onChange={(e) => setNewCandidate({ ...newCandidate, instructor1_id: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="">Select Instructor</option>
                {employees
                  .filter((emp) => emp.status === 1)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>

              <Label>Instructor 2</Label>
              <select
                value={newCandidate.instructor2_id}
                onChange={(e) => setNewCandidate({ ...newCandidate, instructor2_id: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value=""> Select Instructor</option>
                {employees
                  .filter((emp) => emp.status === 1)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>

              <Label>Instructor 3</Label>
              <select
                value={newCandidate.instructor3_id}
                onChange={(e) => setNewCandidate({ ...newCandidate, instructor3_id: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="">Select Instructor</option>
                {employees
                  .filter((emp) => emp.status === 1)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>

              <Button className="w-full" onClick={handleAddCandidate}>
                Add Candidate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search">Search Candidates</Label>
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
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading...</p>
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
              onRowDeleted={handleRowDeleted}
              onRowUpdated={handleRowUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}

