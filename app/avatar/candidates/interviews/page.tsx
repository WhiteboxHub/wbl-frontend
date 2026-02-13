"use client";
import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon, X } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { toast, Toaster } from "sonner";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { createPortal } from "react-dom";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

// --- Generic Filter Component ---
interface FilterOption {
  value: string;
  label: string;
}

interface FilterHeaderProps {
  columnName: string;
  options: FilterOption[];
  selectedValues: string[];
  setSelectedValues: (values: string[]) => void;
}

const FilterHeaderComponent = ({
  columnName,
  options,
  selectedValues,
  setSelectedValues,
}: FilterHeaderProps) => {
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left });
    }
    setFilterVisible((v) => !v);
  };

  const handleValueChange = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((v) => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
    setFilterVisible(false);
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
      <span className="mr-2">{columnName}</span>
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
            className="z-[99999] bg-white border border-gray-200 rounded-md shadow-lg w-48 max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              position: "absolute",
            }}
          >
            <div className="py-1">
              {options.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleValueChange(value)}
                  className={`block w-full text-left px-4 py-2 text-sm ${selectedValues.includes(value)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// --- Renderers ---
const ModeRenderer = (params: any) => {
  const value = (params.value || "").toString().toLowerCase();
  let badgeClass = "bg-gray-100 text-gray-800";
  if (value === "virtual") badgeClass = "bg-blue-100 text-blue-800";
  else if (value === "in person") badgeClass = "bg-green-100 text-green-800";
  else if (value === "phone") badgeClass = "bg-yellow-100 text-yellow-800";
  else if (value === "assessment") badgeClass = "bg-purple-100 text-purple-800";
  else if (value === "ai interview") badgeClass = "bg-indigo-50 text-indigo-800";
  return <Badge className={badgeClass}>{params.value}</Badge>;
};

const TypeRenderer = (params: any) => {
  const value = (params.value || "").toString().toLowerCase();
  let badgeClass = "bg-gray-100 text-gray-800";
  if (value === "technical") badgeClass = "bg-indigo-100 text-indigo-800";
  else if (value === "hr") badgeClass = "bg-pink-100 text-pink-800";
  else if (value === "recruiter call") badgeClass = "bg-cyan-100 text-cyan-800";
  else if (value === "prep call") badgeClass = "bg-teal-100 text-teal-800";
  else if (value === "assessment") badgeClass = "bg-purple-100 text-purple-800";
  return <Badge className={badgeClass}>{params.value}</Badge>;
};

const CompanyTypeRenderer = (params: any) => {
  const value = params.value || "";
  const valueLower = value.toLowerCase();
  let badgeClass = "bg-gray-100 text-gray-800";
  if (valueLower === "client") badgeClass = "bg-blue-100 text-blue-800";
  else if (valueLower === "third-party-vendor") badgeClass = "bg-orange-100 text-orange-800";
  else if (valueLower === "implementation-partner") badgeClass = "bg-green-100 text-green-800";
  else if (valueLower === "sourcer") badgeClass = "bg-red-100 text-red-800";
  const displayText = value
    .split(/[- ]/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return <Badge className={badgeClass}>{displayText}</Badge>;
};

const StatusRenderer = (params: any) => {
  const v = (params.value || "").toString().toLowerCase();
  const classes =
    v === "cleared"
      ? "bg-green-100 text-green-800"
      : v === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";
  return <Badge className={classes}>{params.value}</Badge>;
};

const FeedbackRenderer = (params: any) => {
  const value = (params.value || "").toString().toLowerCase();
  if (!value || value === "no response" || value === "pending")
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
      className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
    >
      {candidateName}
    </Link>
  );
};

// --- Form Data Type ---
type InterviewFormData = {
  candidate_id: string;
  candidate_name?: string;
  company: string;
  company_type?: string;
  interviewer_emails?: string;
  interviewer_contact?: string;
  interviewer_linkedin?: string;
  interview_date?: string;
  mode_of_interview?: string;
  type_of_interview?: string;
  notes?: string;
  recording_link?: string;
  backup_recording_url?: string;
  job_posting_url?: string;
  feedback?: string;
  position_id?: number | string;
};

const initialFormData: InterviewFormData = {
  candidate_id: "",
  candidate_name: "",
  company: "",
  company_type: "client",
  interviewer_emails: "",
  interviewer_contact: "",
  interviewer_linkedin: "",
  interview_date: "",
  mode_of_interview: "Virtual",
  type_of_interview: "Recruiter Call",
  notes: "",
  recording_link: "",
  backup_recording_url: "",
  job_posting_url: "",
  feedback: "Pending",
  position_id: "",
};

export default function CandidatesInterviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCompanyTypes, setSelectedCompanyTypes] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<InterviewFormData>({
    defaultValues: initialFormData,
  });

  const modeOfInterviewOptions = [
    { value: "Virtual", label: "Virtual" },
    { value: "In Person", label: "In Person" },
    { value: "Phone", label: "Phone" },
    { value: "Assessment", label: "Assessment" },
    { value: "AI Interview", label: "AI Interview" },
  ];

  const companyTypeOptions = [
    { value: "client", label: "Client" },
    { value: "third-party-vendor", label: "Third Party Vendor" },
    { value: "implementation-partner", label: "Implementation Partner" },
    { value: "sourcer", label: "Sourcer" },
  ];

  const typeOfInterviewOptions = [
    { value: "Recruiter Call", label: "Recruiter Call" },
    { value: "Technical", label: "Technical" },
    { value: "HR", label: "HR" },
    { value: "Prep Call", label: "Prep Call" },
  ];


  const EmailRenderer = (params: any) => {
    const value = params.value;
    if (!value) return <span className="text-gray-500">No Email</span>;

    const emails = String(value)
      .split(/[\s,]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    return (
      <div className="flex flex-col space-y-1">
        {emails.map((email: string, idx: number) => (
          <a
            key={idx}
            href={`mailto:${email}`}
            className="text-blue-600 underline hover:text-blue-800"
          >
            {email}
          </a>
        ))}
      </div>
    );
  };

  const PhoneRenderer = (params: any) => {
    const value = params.value;
    if (!value) return <span className="text-gray-500">No Phone</span>;

    const phones = String(value)
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    return (
      <div className="flex flex-col space-y-1">
        {phones.map((phone: string, idx: number) => (
          <a
            key={idx}
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            className="text-blue-600 underline hover:text-blue-800"
          >
            {phone}
          </a>
        ))}
      </div>
    );
  };

  const fetchInterviews = useCallback(async (pageNum: number, perPageNum: number) => {
    setLoading(true);
    setError("");
    try {
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
  }, []);

  useEffect(() => {
    fetchInterviews(page, perPage);
  }, [fetchInterviews, page, perPage]);

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

  useEffect(() => {
    if (!showAddForm) return;
    const textarea = document.querySelector('textarea[id="notes"]') as HTMLTextAreaElement;
    const dragHandle = document.querySelector(".drag-handle") as HTMLElement;
    if (!textarea || !dragHandle) return;
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    const startResize = (e: MouseEvent) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = parseInt(document.defaultView?.getComputedStyle(textarea).height || "0", 10);
      e.preventDefault();
    };
    const resize = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = e.clientY - startY;
      textarea.style.height = `${Math.max(60, startHeight + deltaY)}px`;
    };
    const stopResize = () => { isResizing = false; };
    dragHandle.addEventListener("mousedown", startResize);
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
    return () => {
      dragHandle.removeEventListener("mousedown", startResize);
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };
  }, [showAddForm]);

  const filterData = useCallback(() => {
    let filtered = [...interviews];
    if (selectedModes.length > 0) {
      const lowerSelectedModes = selectedModes.map(v => v.toLowerCase());
      filtered = filtered.filter(i =>
        i.mode_of_interview && lowerSelectedModes.includes(i.mode_of_interview.toLowerCase())
      );
    }
    if (selectedTypes.length > 0) {
      const lowerSelectedTypes = selectedTypes.map(v => v.toLowerCase());
      filtered = filtered.filter(i =>
        i.type_of_interview && lowerSelectedTypes.includes(i.type_of_interview.toLowerCase())
      );
    }
    if (selectedCompanyTypes.length > 0) {
      filtered = filtered.filter((i) =>
        selectedCompanyTypes.includes((i.company_type || "").toString().toLowerCase())
      );
    }
    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((i) => {
        if (i.candidate?.full_name?.toLowerCase().includes(lower)) return true;
        return Object.values(i).some((val) =>
          val?.toString().toLowerCase().includes(lower)
        );
      });
    }
    return filtered;
  }, [interviews, searchTerm, selectedModes, selectedTypes, selectedCompanyTypes]);

  const filteredInterviews = filterData();

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = { ...updatedRow };
      if (updatedRow.backup_recording_url === undefined && (updatedRow as any).backup_url) {
        payload.backup_recording_url = (updatedRow as any).backup_url;
      }
      if (updatedRow.job_posting_url === undefined && (updatedRow as any).url) {
        payload.job_posting_url = (updatedRow as any).url;
      }
      if (updatedRow.id) {
        const res = await api.put(`/interviews/${updatedRow.id}`, payload);
        const updated = res?.data ?? res;
        setInterviews((prev) =>
          prev.map((row) => (row.id === updatedRow.id ? updated : row))
        );
        toast.success("Interview updated successfully!");
      }
    } catch (err: any) {
      console.error("Failed to update interview:", err);
      toast.error(err.response?.data?.message || "Failed to update interview.");
    }
  };

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

  const onSubmit = async (data: InterviewFormData) => {
    if (!data.candidate_id || !data.company.trim()) {
      toast.error("Candidate and Company are required!");
      return;
    }
    try {
      const payload: any = {
        candidate_id: Number(data.candidate_id),
        company: data.company,
        company_type: data.company_type || null,
        interviewer_emails: data.interviewer_emails || null,
        interviewer_contact: data.interviewer_contact || null,
        interviewer_linkedin: data.interviewer_linkedin || null,
        interview_date: data.interview_date || null,
        mode_of_interview: data.mode_of_interview || null,
        type_of_interview: data.type_of_interview || null,
        notes: data.notes || null,
        recording_link: data.recording_link || null,
        backup_recording_url: data.backup_recording_url || null,
        job_posting_url: data.job_posting_url || null,
        feedback: data.feedback || null,
        position_id: data.position_id ? Number(data.position_id) : null,
      };
      const res = await api.post(`/interviews`, payload);
      setInterviews((prev) => [res.data, ...prev]);
      setShowAddForm(false);
      reset();
      toast.success('Interview added successfully!');
    } catch (err: any) {
      console.error("Failed to add interview:", err?.body ?? err);
      toast.error("Failed to add interview. Make sure all fields are valid.");
    }
  };

  const handleOpenModal = () => { setShowAddForm(true); };
  const handleCloseModal = () => { setShowAddForm(false); reset(initialFormData); };

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCandidate = candidates.find(
      (m) => m.candidate.id.toString() === e.target.value
    );
    if (selectedCandidate) {
      setValue("candidate_id", selectedCandidate.candidate.id.toString());
      setValue("candidate_name", selectedCandidate.candidate.full_name);
    } else {
      setValue("candidate_id", "");
      setValue("candidate_name", "");
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCloseModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const columnDefs = useMemo<ColDef[]>(() => [
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
    { field: "position_title", headerName: "Position Title", width: 180 },
    {
      field: "mode_of_interview",
      headerName: "Mode",
      width: 120,
      editable: true,
      cellRenderer: ModeRenderer,
      headerComponent: FilterHeaderComponent,
      headerComponentParams: {
        columnName: "Mode",
        options: modeOfInterviewOptions,
        selectedValues: selectedModes,
        setSelectedValues: setSelectedModes,
      },
    },
    {
      field: "type_of_interview",
      headerName: "Type",
      width: 150,
      editable: true,
      headerComponent: FilterHeaderComponent,
      headerComponentParams: {
        columnName: "Type",
        options: typeOfInterviewOptions,
        selectedValues: selectedTypes,
        setSelectedValues: setSelectedTypes,
      },
      cellRenderer: TypeRenderer,
    },
    {
      field: "company_type",
      headerName: "Company Type",
      width: 170,
      editable: true,
      headerComponent: FilterHeaderComponent,
      headerComponentParams: {
        columnName: "Company Type",
        options: companyTypeOptions,
        selectedValues: selectedCompanyTypes,
        setSelectedValues: setSelectedCompanyTypes,
      },
      cellRenderer: CompanyTypeRenderer,
    },
    { field: "interview_date", headerName: "Date", width: 120, editable: true },
    { field: "interviewer_emails", headerName: "Interviewer Email", cellRenderer: EmailRenderer, width: 190, editable: true },
    { field: "interviewer_contact", headerName: "Interviewer Phone", cellRenderer: PhoneRenderer, width: 190, editable: true },
    { field: "interviewer_linkedin", headerName: "Interviewer Linkedin", cellRenderer: LinkRenderer, width: 190, editable: true },
    { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, width: 120, editable: true },
    { field: "transcript", headerName: "Transcript", cellRenderer: LinkRenderer, width: 120, editable: true },
    { field: "backup_recording_url", headerName: "Backup Recording", cellRenderer: LinkRenderer, width: 140, editable: true },
    { field: "job_posting_url", headerName: "Job Posting URL", cellRenderer: LinkRenderer, width: 140, editable: true },
    { field: "instructor1_name", headerName: "Instructor 1", width: 150 },
    { field: "instructor2_name", headerName: "Instructor 2", width: 150 },
    { field: "instructor3_name", headerName: "Instructor 3", width: 150 },
    { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, width: 120, editable: true },
    {
      field: "notes",
      headerName: "Notes",
      width: 300,
      sortable: true,
      cellRenderer: (params: any) =>
        params.value ? <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: params.value }} /> : "",
    },
  ], [selectedModes, selectedTypes, selectedCompanyTypes]);


  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-center" richColors />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
          <p className="text-gray-600 dark:text-gray-400">Candidates scheduled for interviews</p>
        </div>
      </div>
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input id="search" type="text" value={searchTerm} placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>
      {showLoader ? (
        <Loader />
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
              onRowAdded={async (newRow: any) => {
                try {
                  const payload: any = {
                    candidate_id: newRow.candidate_id ? Number(newRow.candidate_id) : undefined,
                    company: newRow.company || "",
                    company_type: newRow.company_type || null,
                    interviewer_emails: newRow.interviewer_emails || null,
                    interviewer_contact: newRow.interviewer_contact || null,
                    interviewer_linkedin: newRow.interviewer_linkedin || null,
                    interview_date: newRow.interview_date || null,
                    mode_of_interview: newRow.mode_of_interview || null,
                    type_of_interview: newRow.type_of_interview || null,
                    notes: newRow.notes || null,
                    recording_link: newRow.recording_link || null,
                    backup_recording_url: newRow.backup_recording_url || (newRow.backup_url || null),
                    job_posting_url: newRow.job_posting_url || (newRow.url || null),
                    feedback: newRow.feedback || null,
                    position_id: newRow.position_id ? Number(newRow.position_id) : null,
                  };
                  if (!payload.candidate_id || !payload.company) {
                    toast.error("Candidate and Company are required!");
                    return;
                  }
                  const res = await api.post(`/interviews`, payload);
                  const created = res?.data ?? res;
                  setInterviews((prev) => [created, ...prev]);
                  toast.success("Interview added successfully!");
                } catch (err: any) {
                  console.error("Failed to add interview via + form:", err);
                  toast.error("Failed to add interview. Make sure all fields are valid.");
                }
              }}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}