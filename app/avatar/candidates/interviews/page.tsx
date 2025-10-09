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

  const [showAddForm, setShowAddForm] = useState(false);
  const [newInterview, setNewInterview] = useState<any>({
    candidate_id: "",
    candidate_name: "",
    company: "",
    company_type: "",
    interviewer_emails: "",
    interviewer_contact: "",
    interview_date: "",
    mode_of_interview: "",
    type_of_interview: "",
    notes: "",
  });

  // Candidate Marketing state
  const [candidates, setCandidates] = useState<any[]>([]);

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
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load interviews");
      const data = await res.json();
      setInterviews(data.data || data);
      setTotal(data.total || data.length);
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

  useEffect(() => {
    if (!showAddForm) return;

    const fetchMarketingCandidates = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing?page=1&limit=200`,
          { headers: getAuthHeaders() }
        );

        console.log("Marketing API Response:", res.data);

        // Only active candidates
        const activeCandidates = res.data?.data?.filter(
          (m: any) => m.status === "active" && m.candidate
        );

        setCandidates(activeCandidates);
      } catch (err: any) {
        console.error("Failed to fetch marketing candidates:", err.response?.data || err.message);
        toast.error("Failed to load candidates from marketing.");
      }
    };

    fetchMarketingCandidates();
  }, [showAddForm]);

  // Filter data for search
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
            Click here
          </a>
        ))}
      </div>
    );
  };

  const CandidateNameRenderer = (params: any) => {
    const candidateId = params.data?.candidate_id;
    const candidateName = params.value;
    if (!candidateId || !candidateName) {
      return <span className="text-gray-500">{candidateName || "N/A"}</span>;
    }
    return (
      <Link
        href={`/avatar/candidates/search?candidateId=${candidateId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-black-600 hover:text-blue-800 font-medium cursor-pointer"
      >
        {candidateName}
      </Link>
    );
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      { field: "candidate.full_name", headerName: "Full Name", cellRenderer: CandidateNameRenderer, sortable: true, Width: 140, editable: false },
      { field: "company", headerName: "Company", sortable: true, width: 130, editable: true },
      { field: "mode_of_interview", headerName: "Mode", width: 130, editable: true },
      {
        field: "type_of_interview",
        headerName: "Type",
        width: 150,
        editable: true,
        filter: "agSetColumnFilter",
        filterParams: {
          values: ["Technical", "Phone Call", "Virtual", "Assessment", "Recruiter Call", "HR Round", "In Person", "Prep Call"],
          comparator: (a: string, b: string) => a.localeCompare(b),
        },
      },
      { field: "company_type", headerName: "Company Type", sortable: true, width: 150, editable: true },
      { field: "interview_date", headerName: "Date", width: 120, editable: true },
      { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, width: 200, editable: true },
      { field: "transcript", headerName: "Transcript", cellRenderer: LinkRenderer, width: 200, editable: true },
      { field: "backup_url", headerName: "Backup URL", cellRenderer: LinkRenderer, width: 200, editable: true },
      { field: "url", headerName: "Job URL", cellRenderer: LinkRenderer, width: 200, editable: true },
      { field: "instructor1_name", headerName: "Instructor 1", width: 180 },
      { field: "instructor2_name", headerName: "Instructor 2", width: 180 },
      { field: "instructor3_name", headerName: "Instructor 3", width: 180 },
      { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, width: 130, editable: true },
      { field: "interviewer_emails", headerName: "Emails", width: 200, editable: true },
      { field: "interviewer_contact", headerName: "Phone", width: 140, editable: true },
      { field: "notes", headerName: "Notes", width: 300, sortable: true, cellRenderer: (params: any) => params.value ? <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: params.value }} /> : "" },
    ],
    []
  );

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = { ...updatedRow };
      if (updatedRow.id) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/interviews/${updatedRow.id}`,
          payload,
          { headers: getAuthHeaders() }
        );
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

  const handleRowDeleted = async (interviewId: number) => {
    try {
      if (!interviewId) {
        toast.error("Cannot delete interview: missing ID");
        return;
      }
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/interviews/${interviewId}`,
        { headers: getAuthHeaders() }
      );
      if (res.status === 200) {
        setInterviews((prev) => prev.filter((r) => r.id !== interviewId));
        toast.success("Interview deleted successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete interview.");
    }
  };

  const handleAddInterview = async () => {
    if (!newInterview.candidate_id || !newInterview.company) {
      toast.error("Candidate and Company are required!");
      return;
    }
    try {
      const payload = { ...newInterview, candidate_id: Number(newInterview.candidate_id) };
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/interviews`,
        payload,
        { headers: getAuthHeaders() }
      );
      setInterviews((prev) => [res.data, ...prev]);
      setShowAddForm(false);
      setNewInterview({
        candidate_id: "",
        candidate_name: "",
        company: "",
        company_type: "",
        interviewer_emails: "",
        interviewer_contact: "",
        interview_date: "",
        mode_of_interview: "",
        type_of_interview: "",
        notes: "",
      });
      toast.success('Interview added successfully!');
    } catch (err: any) {
      console.error("Failed to add interview:", err.response?.data || err);
      toast.error("Failed to add interview. Make sure all fields are valid.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
          <p className="text-gray-600 dark:text-gray-400">Candidates scheduled for interviews</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center" onClick={() => setShowAddForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" /> Add Interview
        </Button>
      </div>

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
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowAddForm(false);
            }}
          >
            <h2 className="text-xl font-bold mb-4">Add Interview</h2>
            <div className="space-y-4">
              {/* Candidate Dropdown */}
              <div>
                <Label htmlFor="candidate_id">Candidate Name</Label>
                <select
                  id="candidate_id"
                  value={newInterview.candidate_id}
                  onChange={(e) => {
                    const selected = candidates.find(
                      (m) => m.candidate.id.toString() === e.target.value
                    );
                    setNewInterview({
                      ...newInterview,
                      candidate_id: selected?.candidate.id || "",
                      candidate_name: selected?.candidate.full_name || "",
                    });
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Candidate</option>
                  {candidates.map((m) => (
                    <option key={m.candidate.id} value={m.candidate.id}>
                      {m.candidate.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company */}
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Enter company name"
                  value={newInterview.company}
                  onChange={(e) =>
                    setNewInterview({ ...newInterview, company: e.target.value })
                  }
                />
              </div>

              {/* Company Type */}
              <div>
                <Label htmlFor="company_type">Company Type</Label>
                <select
                  id="company_type"
                  value={newInterview.company_type}
                  onChange={(e) => setNewInterview({ ...newInterview, company_type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Company Type</option>
                  <option value="client">Client</option>
                  <option value="third-party-vendor">Third-Party Vendor</option>
                  <option value="implementation-partner">Implementation Partner</option>
                  <option value="sourcer">Sourcer</option>
                  <option value="contact-from-ip">Contact from IP</option>
                </select>
              </div>

              {/* Interview Date */}
              <div>
                <Label htmlFor="interview_date">Interview Date</Label>
                <Input
                  type="date"
                  id="interview_date"
                  value={newInterview.interview_date}
                  onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
                />
              </div>

              {/* Mode of Interview */}
              <div>
                <Label htmlFor="mode_of_interview">Mode of Interview</Label>
                <select
                  id="mode_of_interview"
                  value={newInterview.mode_of_interview}
                  onChange={(e) => setNewInterview({ ...newInterview, mode_of_interview: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Mode</option>
                  <option value="Virtual">Virtual</option>
                  <option value="In Person">In Person</option>
                  <option value="Phone">Phone</option>
                  <option value="Assessment">Assessment</option>
                </select>
              </div>

              {/* Type of Interview */}
              <div>
                <Label htmlFor="type_of_interview">Type of Interview</Label>
                <select
                  id="type_of_interview"
                  value={newInterview.type_of_interview}
                  onChange={(e) => setNewInterview({ ...newInterview, type_of_interview: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Type</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Recruiter Call">Recruiter Call</option>
                  <option value="Technical">Technical</option>
                  <option value="HR Round">HR Round</option>
                  <option value="In Person">In Person</option>
                  <option value="Prep Call">Prep Call</option>
                </select>
              </div>

              {/* Interviewer Emails */}
              <div>
                <Label htmlFor="interviewer_emails">Interviewer Emails</Label>
                <Input
                  id="interviewer_emails"
                  placeholder="Enter emails"
                  value={newInterview.interviewer_emails}
                  onChange={(e) => setNewInterview({ ...newInterview, interviewer_emails: e.target.value })}
                />
              </div>

              {/* Interviewer Contact */}
              <div>
                <Label htmlFor="interviewer_contact">Interviewer Contact</Label>
                <Input
                  id="interviewer_contact"
                  placeholder="Enter contact"
                  value={newInterview.interviewer_contact}
                  onChange={(e) => setNewInterview({ ...newInterview, interviewer_contact: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full p-2 border rounded"
                  rows={4}
                  value={newInterview.notes}
                  onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                />
              </div>

            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={handleAddInterview} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
