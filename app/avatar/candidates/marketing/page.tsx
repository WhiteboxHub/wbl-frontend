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
import { toast, Toaster } from "sonner";

export default function CandidatesMarketingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(100);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch candidates
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


  const StatusRenderer = (params: any) => {
    const status = params.value?.toLowerCase();

    let colorClass = "bg-gray-100 text-gray-700"; 
    if (status === "active") colorClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    else if (status === "inactive") colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    // else if (status === "pending") colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";

    return (
      <Badge className={colorClass}>
        {params.value ? params.value.toUpperCase() : "N/A"}
      </Badge>
    );
  };

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
            setAllCandidates((prev) =>
              prev.map((row) =>
                row.candidate_id === params.data.candidate_id
                  ? { ...row, candidate_resume: updatedResume }
                  : row
              )
            );

            toast.success("Resume uploaded successfully!");
          } catch (err) {
            console.error("Resume upload failed", err);
            toast.error("Failed to upload resume.");
          }
        }}
      />
    </div>
  );

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
        maxWidth: 120,
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
        valueGetter: (params) =>
          params.data.marketing_manager_obj?.name || "N/A",
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
      { field: "move_to_placement", headerName: "Move to Placement", width: 190, sortable: true,filter: 'agSetColumnFilter', cellRenderer: (params: any) => (
          <span>
            {params.value ? "Yes" : "No"}
          </span>
        )
      },
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
      {
        field: "candidate_resume",
        headerName: "Resume",
        minWidth: 200,
        cellRenderer: ResumeRenderer,
      },
    ],
    []
  );


  const handleRowUpdated = async (updatedRow: any) => {
    if (!updatedRow || !updatedRow.candidate_id) {
      console.error("Updated row missing candidate_id", updatedRow);
      toast.error("Failed to update candidate: Missing candidate ID.");
      return;
    }

    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${updatedRow.id}`,
        updatedRow
      );
      const updatedRecord = res.data;


    setFilteredCandidates((prev) =>
      prev.map((row) =>
        row.candidate_id === updatedRow.candidate_id
          ? { ...row, ...updatedRecord } 
          : row
      )
    );
    setAllCandidates((prev) =>
      prev.map((row) =>
        row.candidate_id === updatedRow.candidate_id
          ? { ...row, ...updatedRecord } 
          : row
      )
    );

      toast.success("Candidate updated successfully!");
    } catch (err) {
      console.error("Failed to update candidate:", err);
      toast.error("Failed to update candidate.");
    }
  };


  const handleRowDeleted = async (candidate_id: number | string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/marketing/${candidate_id}`
      );

      setFilteredCandidates((prev) =>
        prev.filter((row) => row.candidate_id !== candidate_id)
      );
      setAllCandidates((prev) =>
        prev.filter((row) => row.candidate_id !== candidate_id)
      );

      toast.success("Candidate deleted successfully!");
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      toast.error("Failed to delete candidate.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
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
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredCandidates.length} candidate(s) found
          </p>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
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
