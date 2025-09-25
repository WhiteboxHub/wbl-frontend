
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

export default function CandidatesInterviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // Add Interview Modal State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInterview, setNewInterview] = useState<any>({
    candidate_id: "",
    company: "",
    mode_of_interview: "",
    type_of_interview: "",
    interview_date: "",
    interviewer_emails: "",
    // optional fields still exist but won't be shown
    feedback: "",
    interviewer_contact: "",
    notes: "",
    recording_link: "",
    backup_url: "",
    url: "",
  });
  const handleNewInterviewChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewInterview((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Marketing candidates
const [marketingCandidates, setMarketingCandidates] = useState<any[]>([]);

useEffect(() => {
  const fetchMarketingCandidates = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No access token found");
        setMarketingCandidates([]);
        return;
      }

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/marketing/active`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMarketingCandidates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch marketing candidates", err);
      setMarketingCandidates([]);
    }
  };

  fetchMarketingCandidates();
}, []);

  // Fetch interviews
const fetchInterviews = async (page: number, perPage: number) => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token"); // get the auth token

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/interviews?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error("Failed to load interviews");

    const data = await res.json();
    setInterviews(data);
    setTotal(data.total);
  } catch (err) {
    setError("Failed to load interviews.");
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
        if (item.candidate?.full_name?.toLowerCase().includes(lower))
          return true;
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
      return <Badge className="bg-gray-100 text-gray-800">No Response</Badge>;
    if (value === "positive")
      return <Badge className="bg-green-300 text-green-800">Positive</Badge>;
    if (value === "failure" || value === "negative")
      return <Badge className="bg-red-100 text-red-800">Failure</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{params.value}</Badge>;
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
          className="text-black-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          {candidateName}
        </Link>
      );
    };
 

  const LinkRenderer = (params: any) => {
    const value = params.value;
    if (!value) return <span className="text-gray-500">Not Available</span>;
    const links = value
      .split(/[,​\s]+/)
      .map((link: string) => link.trim())
      .filter((link: string) => link.length > 0);
    if (links.length === 0)
      return <span className="text-gray-500">Not Available</span>;
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

  // Columns
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },

      { field: "candidate.full_name", headerName: "Full Name", sortable: true, minWidth: 140, cellRenderer: CandidateNameRenderer },
      { field: "instructor1_name", headerName: "Instructor 1", minWidth: 140 },
      { field: "instructor2_name", headerName: "Instructor 2", minWidth: 140 },
      { field: "instructor3_name", headerName: "Instructor 3", minWidth: 140 },
      { field: "company", headerName: "Company", sortable: true, minWidth: 110, editable: true },
      { field: "mode_of_interview", headerName: "Mode", maxWidth: 130, editable: true },
      { field: "type_of_interview", headerName: "Type", maxWidth: 150, editable: true },
      { field: "interview_date", headerName: "Date", maxWidth: 120, editable: true },
      { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
      { field: "backup_url", headerName: "Backup URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
      { field: "url", headerName: "URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },


      // { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 150, editable: true },
      { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, maxWidth: 130, editable: true },
      { field: "interviewer_emails", headerName: "Emails", minWidth: 180, editable: true },
      { field: "interviewer_contact", headerName: "Contact", minWidth: 140, editable: true },

      { field: "notes", headerName: "Notes", minWidth: 120, editable: true },
    ],
    []
  );

  const handleAddInterview = async () => {
    if (
      !newInterview.candidate_id ||
      !newInterview.company ||
      !newInterview.interview_date
    ) {
      alert("Candidate, Company, and Interview Date are required!");
      return;
    }

    try {
      const payload: any = {
        candidate_id: Number(newInterview.candidate_id),
        company: newInterview.company,
        interview_date: newInterview.interview_date,
        mode_of_interview: newInterview.mode_of_interview || null,
        type_of_interview: newInterview.type_of_interview || null,
        feedback: newInterview.feedback || null,
        interviewer_emails: newInterview.interviewer_emails || null,
        interviewer_contact: newInterview.interviewer_contact || null,
        notes: newInterview.notes || null,
        recording_link: newInterview.recording_link || null,
        backup_url: newInterview.backup_url || null,
        url: newInterview.url || null,
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/interviews`,
        payload
      );
      alert("Interview Added successfully!");

      setInterviews((prev) => [res.data, ...prev]);
      setShowAddForm(false);
      setNewInterview({
        candidate_id: "",
        company: "",
        mode_of_interview: "",
        type_of_interview: "",
        interview_date: "",
        interviewer_emails: "",
        feedback: "",
        interviewer_contact: "",
        notes: "",
        recording_link: "",
        backup_url: "",
        url: "",
      });
    } catch (err: any) {
      console.error("Failed to add interview:", err.response?.data || err);
      alert(`Failed to add interview. ${JSON.stringify(err.response?.data)}`);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Interviews
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates scheduled for interviews
          </p>
        </div>
        <Button
          className="flex items-center bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setShowAddForm(true)}
        >
          <PlusIcon className="mr-2 h-4 w-4" /> Add Interview
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
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
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : error ? (
        <p className="mt-8 text-center text-red-500">{error}</p>
      ) : (
        <div className="flex w-full flex-col items-center space-y-4">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredInterviews}
              columnDefs={columnDefs}
              title={`Interviews (${filteredInterviews.length})`}
              height="500px"
              onRowDeleted={async (id: number | string) => {
                try {
                  await axios.delete(
                    `${process.env.NEXT_PUBLIC_API_URL}/interviews/${id}`
                  );
                  setInterviews((prev) =>
                    prev.filter((interview) => interview.id !== id)
                  );
                  alert("Interview deleted successfully!");
                } catch (err: any) {
                  console.error(
                    "Failed to delete interview:",
                    err.response?.data || err
                  );
                  alert(
                    `Failed to delete interview. ${JSON.stringify(
                      err.response?.data
                    )}`
                  );
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Add Interview Modal - Only Required Fields */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">Add Interview</h2>
            <div className="space-y-3">
              <select
                name="candidate_id"
                value={newInterview.candidate_id}
                onChange={handleNewInterviewChange}
                className="w-full rounded border p-2"
              >
                <option value="">Select Candidate (Marketing)</option>
                {marketingCandidates.map((candidate) => (
                  <option
                    key={candidate.candidate_id}
                    value={candidate.candidate_id}
                  >
                    {candidate.full_name}
                  </option>
                ))}
              </select>

              <Input
                name="company"
                placeholder="Company"
                value={newInterview.company}
                onChange={handleNewInterviewChange}
              />

              <Input
                name="interview_date"
                placeholder="Interview Date"
                type="date"
                value={newInterview.interview_date}
                onChange={handleNewInterviewChange}
              />

              <select
                name="mode_of_interview"
                value={newInterview.mode_of_interview}
                onChange={handleNewInterviewChange}
                className="w-full rounded border p-2"
              >
                <option value="">Mode of Interview</option>
                <option value="Virtual">Virtual</option>
                <option value="In Person">In Person</option>
                <option value="Phone">Phone</option>
                <option value="Assessment">Assessment</option>
              </select>

              <select
                name="type_of_interview"
                value={newInterview.type_of_interview}
                onChange={handleNewInterviewChange}
                className="w-full rounded border p-2"
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
                name="interviewer_emails"
                placeholder="Interviewer Emails"
                value={newInterview.interviewer_emails}
                onChange={handleNewInterviewChange}
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded bg-gray-300 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInterview}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
