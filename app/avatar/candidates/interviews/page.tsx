// app/avatar/candidates/interviews/page.tsx (or wherever you keep it)
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
import { toast, Toaster } from "sonner";
import api from "@/lib/api"; // <-- thin wrapper around your apiFetch (see src/utils/api.ts)

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

  // Fetch interviews (uses api wrapper that delegates to apiFetch)
  const fetchInterviews = useCallback(
    async (pageNum: number, perPageNum: number) => {
      setLoading(true);
      setError("");
      try {
        // call api.get which returns { data: ... } as implemented in the wrapper
        const res = await api.get(`/interviews?page=${pageNum}&per_page=${perPageNum}`);
        const body = res?.data ?? res;
        const items = Array.isArray(body) ? body : body.data ?? [];
        setInterviews(items);
        setTotal(body.total ?? items.length);
      } catch (err: any) {
        console.error("Failed to load interviews:", err);
        setError("Failed to load interviews.");
        toast.error("Failed to load interviews.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchInterviews(page, perPage);
  }, [fetchInterviews, page, perPage]);

  // When add form opens, fetch candidate marketing list
  useEffect(() => {
    if (!showAddForm) return;
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/candidate/marketing?page=1&limit=200");
        const body = res?.data ?? res;
        const arr = Array.isArray(body) ? body : body.data ?? [];
        const activeCandidates = (arr || []).filter((m: any) => (m?.status || "").toString().toLowerCase() === "active" && !!m.candidate);
        if (!mounted) return;
        setCandidates(activeCandidates);
      } catch (err: any) {
        console.error("Failed to fetch marketing candidates:", err?.body ?? err);
        toast.error("Failed to load candidates from marketing.");
      }
    })();
    return () => { mounted = false; };
  }, [showAddForm]);

  // Filtering helper
  const filterData = useCallback(
    (term: string) => {
      if (!term.trim()) return interviews;
      const lower = term.toLowerCase();
      return interviews.filter((item) => {
        const name = item?.candidate?.full_name || item?.candidate_name || "";
        if (name.toLowerCase().includes(lower)) return true;
        return Object.values(item || {}).some((val) =>
          String(val || "").toLowerCase().includes(lower)
        );
      });
    },
    [interviews]
  );

  const filteredInterviews = filterData(searchTerm);

  // Cell renderers
  const StatusRenderer = (params: any) => {
    const v = (params.value || "").toString().toLowerCase();
    const classes =
      v === "cleared"
        ? "bg-green-100 text-green-800"
        : v === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";
    const label = params.value ?? "N/A";
    return <Badge className={classes}>{label}</Badge>;
  };

  const FeedbackRenderer = (params: any) => {
    const value = (params.value || "").toString().toLowerCase();
    if (!value || value === "no response")
      return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    if (value === "positive")
      return <Badge className="bg-green-300 text-green-800">Positive</Badge>;
    if (value === "failure" || value === "negative")
      return <Badge className="bg-red-100 text-red-800">Failure</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{params.value}</Badge>;
  };

  const LinkRenderer = (params: any) => {
    const raw = params.value;
    if (!raw) return <span className="text-gray-500">Not Available</span>;

    // normalize and split links (commas/spaces/newlines)
    const links = String(raw)
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (links.length === 0) return <span className="text-gray-500">Not Available</span>;

    return (
      <div className="flex flex-col space-y-1">
        {links.map((link: string, idx: number) => {
          let href = link;
          if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
          return (
            <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
              Click here
            </a>
          );
        })}
      </div>
    );
  };

  const CandidateNameRenderer = (params: any) => {
    const candidateId = params.data?.candidate_id || params.data?.candidate?.id;
    const candidateName = params.data?.candidate?.full_name || params.value || "N/A";
    if (!candidateId) return <span className="text-gray-500">{candidateName}</span>;
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

  // Column definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      {
        field: "candidate.full_name",
        headerName: "Full Name",
        cellRenderer: CandidateNameRenderer,
        sortable: true,
        width: 200,
        editable: false,
      },
      { field: "company", headerName: "Company", sortable: true, width: 160, editable: true },
      { field: "mode_of_interview", headerName: "Mode", width: 120, editable: true },
      {
        field: "type_of_interview",
        headerName: "Type",
        width: 150,
        editable: true,
        filter: "agSetColumnFilter",
        filterParams: {
          values: ["Technical", "Phone Call", "Virtual", "Assessment", "Recruiter Call", "HR Round", "In Person", "Prep Call"],
        },
      },
      { field: "company_type", headerName: "Company Type", sortable: true, width: 150, editable: true },
      { field: "interview_date", headerName: "Date", width: 120, editable: true },
      { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, width: 160, editable: true },
      { field: "transcript", headerName: "Transcript", cellRenderer: LinkRenderer, width: 160, editable: true },
      { field: "backup_url", headerName: "Backup URL", cellRenderer: LinkRenderer, width: 160, editable: true },
      { field: "url", headerName: "Job URL", cellRenderer: LinkRenderer, width: 160, editable: true },
      { field: "instructor1_name", headerName: "Instructor 1", width: 180 },
      { field: "instructor2_name", headerName: "Instructor 2", width: 180 },
      { field: "instructor3_name", headerName: "Instructor 3", width: 180 },
      { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, width: 130, editable: true },
      { field: "interviewer_emails", headerName: "Emails", width: 200, editable: true },
      { field: "interviewer_contact", headerName: "Phone", width: 140, editable: true },
      {
        field: "notes",
        headerName: "Notes",
        width: 300,
        sortable: true,
        cellRenderer: (params: any) =>
          params.value ? <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: params.value }} /> : "",
      },
    ],
    []
  );

  // Update row handler (PUT)
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const id = updatedRow?.id;
      if (!id) throw new Error("Missing id on updated row");
      const res = await api.put(`/interviews/${id}`, updatedRow);
      const body = res?.data ?? res;
      // update local list using id
      setInterviews((prev) => prev.map((row) => (row.id === id ? { ...row, ...body } : row)));
      toast.success("Interview updated successfully!");
    } catch (err) {
      console.error("Failed to update interview:", err);
      toast.error("Failed to update interview.");
    }
  };

  // Delete row handler (DELETE)
  const handleRowDeleted = async (interviewId: number) => {
    try {
      if (!interviewId) {
        toast.error("Cannot delete interview: missing ID");
        return;
      }
      await api.delete(`/interviews/${interviewId}`);
      setInterviews((prev) => prev.filter((r) => r.id !== interviewId));
      toast.success("Interview deleted successfully!");
    } catch (err) {
      console.error("Failed to delete interview:", err);
      toast.error("Failed to delete interview.");
    }
  };

  // Add interview (POST)
  const handleAddInterview = async () => {
    if (!newInterview.candidate_id || !newInterview.company) {
      toast.error("Candidate and Company are required!");
      return;
    }
    try {
      const payload = { ...newInterview, candidate_id: Number(newInterview.candidate_id) };
      const res = await api.post("/interviews", payload);
      const body = res?.data ?? res;
      // If API returns created item or wraps it, normalize
      const added = Array.isArray(body) ? body[0] : body;
      setInterviews((prev) => [added, ...prev]);
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
      toast.success("Interview added successfully!");
    } catch (err: any) {
      console.error("Failed to add interview:", err?.body ?? err);
      toast.error("Failed to add interview. Make sure all fields are valid.");
    }
  };

  return (
    <div className="space-y-6 p-4">
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
          <Input id="search" type="text" value={searchTerm} placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50" onClick={() => setShowAddForm(false)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add Interview</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="candidate_id">Candidate Name</Label>
                <select id="candidate_id" value={newInterview.candidate_id} onChange={(e) => {
                  const selected = candidates.find((m) => String(m.candidate?.id) === e.target.value);
                  setNewInterview({ ...newInterview, candidate_id: selected?.candidate?.id || "", candidate_name: selected?.candidate?.full_name || "" });
                }} className="w-full p-2 border rounded">
                  <option value="">Select Candidate</option>
                  {candidates.map((m) => (
                    <option key={m.candidate?.id} value={m.candidate?.id}>
                      {m.candidate?.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Enter company name" value={newInterview.company} onChange={(e) => setNewInterview({ ...newInterview, company: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="company_type">Company Type</Label>
                <select id="company_type" value={newInterview.company_type} onChange={(e) => setNewInterview({ ...newInterview, company_type: e.target.value })} className="w-full p-2 border rounded">
                  <option value="">Select Company Type</option>
                  <option value="client">Client</option>
                  <option value="third-party-vendor">Third-Party Vendor</option>
                  <option value="implementation-partner">Implementation Partner</option>
                  <option value="sourcer">Sourcer</option>
                  <option value="contact-from-ip">Contact from IP</option>
                </select>
              </div>

              <div>
                <Label htmlFor="interview_date">Interview Date</Label>
                <Input type="date" id="interview_date" value={newInterview.interview_date} onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="mode_of_interview">Mode of Interview</Label>
                <select id="mode_of_interview" value={newInterview.mode_of_interview} onChange={(e) => setNewInterview({ ...newInterview, mode_of_interview: e.target.value })} className="w-full p-2 border rounded">
                  <option value="">Select Mode</option>
                  <option value="Virtual">Virtual</option>
                  <option value="In Person">In Person</option>
                  <option value="Phone">Phone</option>
                  <option value="Assessment">Assessment</option>
                </select>
              </div>

              <div>
                <Label htmlFor="type_of_interview">Type of Interview</Label>
                <select id="type_of_interview" value={newInterview.type_of_interview} onChange={(e) => setNewInterview({ ...newInterview, type_of_interview: e.target.value })} className="w-full p-2 border rounded">
                  <option value="">Select Type</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Recruiter Call">Recruiter Call</option>
                  <option value="Technical">Technical</option>
                  <option value="HR Round">HR Round</option>
                  <option value="In Person">In Person</option>
                  <option value="Prep Call">Prep Call</option>
                </select>
              </div>

              <div>
                <Label htmlFor="interviewer_emails">Interviewer Emails</Label>
                <Input id="interviewer_emails" placeholder="Enter emails" value={newInterview.interviewer_emails} onChange={(e) => setNewInterview({ ...newInterview, interviewer_emails: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="interviewer_contact">Interviewer Contact</Label>
                <Input id="interviewer_contact" placeholder="Enter contact" value={newInterview.interviewer_contact} onChange={(e) => setNewInterview({ ...newInterview, interviewer_contact: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea id="notes" className="w-full p-2 border rounded" rows={4} value={newInterview.notes} onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })} />
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
