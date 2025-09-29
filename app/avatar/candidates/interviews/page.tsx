"use client";
import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";

export default function CandidatesInterviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // --- Add Interview Modal State ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInterview, setNewInterview] = useState<any>({
    candidate_id: "",
    company: "",
    mode_of_interview: "",
    type_of_interview: "",
    interview_date: "",
    feedback: "",
    interviewer_emails: "",
    interviewer_contact: "",
    notes: "",
    recording_link: "",
    backup_url: "",
    url: "",
  });

  // Get token helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch interviews
  const fetchInterviews = async (page: number, perPage: number) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/interviews?page=${page}&per_page=${perPage}`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) throw new Error("Failed to load interviews");
      const data = await res.json();
      setInterviews(data);
      setTotal(data.total);
    } catch (err) {
      setError("Failed to load interviews.");
      toast.error("Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews(page, perPage);
  }, [page, perPage]);

  // Search/filter
  const filterData = useCallback(
    (term: string) => {
      if (!term.trim()) return interviews;
      const lower = term.toLowerCase();
      return interviews.filter((item) => {
        if (item.candidate?.full_name?.toLowerCase().includes(lower)) return true;
        return Object.values(item).some((val) =>
          val?.toString().toLowerCase().includes(lower)
        );
      });
    },
    [interviews]
  );

  const filteredInterviews = filterData(searchTerm);

  // Status renderer
  const StatusRenderer = (params: any) => {
    const v = params.value?.toLowerCase() ?? "";
    const classes =
      v === "cleared"
        ? "bg-green-100 text-green-800"
        : v === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";
    return <Badge className={classes}>{params.value}</Badge>;
  };

  // Feedback renderer
  const FeedbackRenderer = (params: any) => {
    const value = params.value?.toLowerCase() ?? "";
    if (!value || value === "no response")
      return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    if (value === "positive")
      return <Badge className="bg-green-300 text-green-800">Positive</Badge>;
    if (value === "failure" || value === "negative")
      return <Badge className="bg-red-100 text-red-800">Failure</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{params.value}</Badge>;
  };

  // Link renderer for recording_link, backup_url, url
  const LinkRenderer = (params: any) => {
    const value = params.value;
    if (!value) return <span className="text-gray-500">Not Available</span>;
    const links = value
      .split(/[,​\s]+/)
      .map((link: string) => link.trim())
      .filter((link: string) => link.length > 0);
    if (links.length === 0) return <span className="text-gray-500">Not Available</span>;
    return (
      <div className="flex flex-col space-y-1">
        {links.map((link: string, idx: number) => (
          <a
            key={idx}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {link}
          </a>
        ))}
      </div>
    );
  };
const CandidateNameRenderer = (params: any) => {
  const candidateId = params.data?.candidate_id; // Get candidate ID from row data
  const candidateName = params.value; // Get candidate name
  
  if (!candidateId || !candidateName) {
    return <span className="text-gray-500">{candidateName || "N/A"}</span>;
  }
  
  return (
    <Link 
      href={`/avatar/candidates/search?candidateId=${candidateId}`}
      target="_blank" 
      rel="noopener noreferrer"
      className="text-black-600 hover:text-blue-800 font-medium cursor-pointer" // ← Same clean styling
    >
      {candidateName}
    </Link>
  );
};
  // Columns
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      { field: "candidate.full_name", headerName: "Full Name", cellRenderer: CandidateNameRenderer, sortable: true, minWidth: 140, editable: false },
      { field: "company", headerName: "Company", sortable: true, minWidth: 110, editable: true },
      { field: "mode_of_interview", headerName: "Mode", maxWidth: 130, editable: true },
      { field: "type_of_interview", headerName: "Type", maxWidth: 150, editable: true },
      { field: "interview_date", headerName: "Date", maxWidth: 120, editable: true },
      { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
      { field: "backup_url", headerName: "Backup URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
      { field: "url", headerName: "URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
      { field: "instructor1_name", headerName: "Instructor 1", minWidth: 140 },
      { field: "instructor2_name", headerName: "Instructor 2", minWidth: 140 },
      { field: "instructor3_name", headerName: "Instructor 3", minWidth: 140 },
      { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, maxWidth: 130, editable: true },
      { field: "interviewer_emails", headerName: "Emails", minWidth: 180, editable: true },
      { field: "interviewer_contact", headerName: "Contact", minWidth: 140, editable: true },
      {             field: "notes",
            headerName: "Notes",
            width: 300,
            sortable: true,
            cellRenderer: (params: any) => {
              if (!params.value) return "";
              return (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: params.value }}
                />
              );
            },
          },
    ],
    []
  );

  // Update existing row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = {
        candidate_id: updatedRow.candidate_id,
        company: updatedRow.company,
        mode_of_interview: updatedRow.mode_of_interview,
        type_of_interview: updatedRow.type_of_interview,
        interview_date: updatedRow.interview_date,
        status: updatedRow.status,
        feedback: updatedRow.feedback,
        interviewer_emails: updatedRow.interviewer_emails,
        interviewer_contact: updatedRow.interviewer_contact,
        notes: updatedRow.notes,
        recording_link: updatedRow.recording_link,
        backup_url: updatedRow.backup_url,
        url: updatedRow.url,
      };
      if (updatedRow.id) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/interviews/${updatedRow.id}`,
          payload,
          { headers: getAuthHeaders() }
        );

        // Update the local state directly instead of refetching
        setInterviews((prev) =>
          prev.map((row) => (row.id === updatedRow.id ? { ...row, ...updatedRow } : row))
        );

        toast.success('Interview updated successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update interview.');
    }
  };

  // Delete row
  const handleRowDeleted = async (row: any) => {
    try {
      if (row.id) {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/interviews/${row.id}`,
          { headers: getAuthHeaders() }
        );
      }
      setInterviews((prev) => prev.filter((r) => r !== row));
      toast.success('Interview deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete interview.');
    }
  };

  // Add new interview
  const handleAddInterview = async () => {
    if (!newInterview.candidate_id || !newInterview.company) {
      toast.error("Candidate ID and Company are required!");
      return;
    }
    try {
      const payload = {
        ...newInterview,
        candidate_id: Number(newInterview.candidate_id),
      };
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/interviews`,
        payload,
        { headers: getAuthHeaders() }
      );
      setInterviews((prev) => [res.data, ...prev]);
      setShowAddForm(false);
      setNewInterview({
        candidate_id: "",
        company: "",
        mode_of_interview: "",
        type_of_interview: "",
        interview_date: "",
        status: "",
        feedback: "",
        interviewer_emails: "",
        interviewer_contact: "",
        notes: "",
        recording_link: "",
        backup_url: "",
        url: "",
      });
      toast.success('Interview added successfully!');
    } catch (err: any) {
      console.error("Failed to add interview:", err.response?.data || err);
      toast.error("Failed to add interview. Make sure all fields are valid.");
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
          <p className="text-gray-600 dark:text-gray-400">Candidates scheduled for interviews</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center" onClick={() => setShowAddForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" /> Add Interview
        </Button>
      </div>
      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Search..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      {/* Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">Loading...</p>
      ) : error ? (
        <p className="text-center mt-8 text-red-500">{error}</p>
      ) : (
        <div className="flex flex-col items-center w-full space-y-4">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredInterviews}
              columnDefs={columnDefs}
              title={`Interviews (${filteredInterviews.length})`}
              height="500px"
              showSearch={false}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}
      {/* Add Interview Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Interview</h2>
            <div className="space-y-3">
              <Input
                placeholder="Candidate ID"
                value={newInterview.candidate_id}
                onChange={(e) => setNewInterview({ ...newInterview, candidate_id: e.target.value })}
              />
              <Input
                placeholder="Company"
                value={newInterview.company}
                onChange={(e) => setNewInterview({ ...newInterview, company: e.target.value })}
              />
              {/* Mode of Interview */}
              <select
                value={newInterview.mode_of_interview}
                onChange={(e) => setNewInterview({ ...newInterview, mode_of_interview: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Mode of Interview</option>
                <option value="Virtual">Virtual</option>
                <option value="In Person">In Person</option>
                <option value="Phone">Phone</option>
                <option value="Assessment">Assessment</option>
              </select>
              {/* Type of Interview */}
              <select
                value={newInterview.type_of_interview}
                onChange={(e) => setNewInterview({ ...newInterview, type_of_interview: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Type of Interview</option>
                <option value="Assessment">Assessment</option>
                <option value="Recruiter Call">Recruiter Call</option>
                <option value="Technical">Technical</option>
                <option value="HR Round">HR Round</option>
                <option value="In Person">In Person</option>
                <option value="Prep Call">Prep Call</option>
              </select>
              <Input
                placeholder="Interview Date"
                type="date"
                value={newInterview.interview_date}
                onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
              />
              <Input
                placeholder="Interviewer Emails"
                value={newInterview.interviewer_emails}
                onChange={(e) => setNewInterview({ ...newInterview, interviewer_emails: e.target.value })}
              />
              <Input
                placeholder="Interviewer Contact"
                value={newInterview.interviewer_contact}
                onChange={(e) => setNewInterview({ ...newInterview, interviewer_contact: e.target.value })}
              />
              <Input
                placeholder="Notes"
                value={newInterview.notes}
                onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
              />
              <Input
                placeholder="Recording Link"
                value={newInterview.recording_link}
                onChange={(e) => setNewInterview({ ...newInterview, recording_link: e.target.value })}
              />
              <Input
                placeholder="Backup URL"
                value={newInterview.backup_url}
                onChange={(e) => setNewInterview({ ...newInterview, backup_url: e.target.value })}
              />
              <Input
                placeholder="URL"
                value={newInterview.url}
                onChange={(e) => setNewInterview({ ...newInterview, url: e.target.value })}
              />
              {/* Status Dropdown */}
              <select
                value={newInterview.status}
                onChange={(e) => setNewInterview({ ...newInterview, status: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Status</option>
                <option value="No Update">No Update</option>
                <option value="Cleared">Cleared</option>
                <option value="Rejected">Rejected</option>
              </select>
              {/* Feedback Dropdown */}
              <select
                value={newInterview.feedback}
                onChange={(e) => setNewInterview({ ...newInterview, feedback: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Feedback</option>
                <option value="Pending">Pending</option>
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInterview}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
