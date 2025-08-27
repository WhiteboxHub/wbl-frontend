

"use client";
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
  const [allInterviews, setAllInterviews] = useState<any[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch interviews from backend
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/interviews?skip=0&limit=1000`
        );
        if (!res.ok) throw new Error("Failed to load interviews");
        const data = await res.json();
        setAllInterviews(data);
        setFilteredInterviews(data);
      } catch (err) {
        setError("Failed to load interviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  // Search/filter
  const filterData = useCallback(
    (term: string) => {
      if (!term.trim()) return allInterviews;
      const lower = term.toLowerCase();
      return allInterviews.filter((item) =>
        Object.values(item).some((val) =>
          val?.toString().toLowerCase().includes(lower)
        )
      );
    },
    [allInterviews]
  );

  useEffect(() => {
    setFilteredInterviews(filterData(searchTerm));
  }, [searchTerm, filterData]);

  // Status renderer
  const StatusRenderer = (params: any) => {
    const v = params.value?.toLowerCase() ?? "";
    const classes =
      v === "selected"
        ? "bg-green-100 text-green-800"
        : v === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";
    return <Badge className={classes}>{params.value}</Badge>;
  };

  // Feedback renderer
  const FeedbackRenderer = (params: any) => {
    const value = params.value?.toLowerCase() ?? "";

    if (!value || value === "no response") {
      return <Badge className="bg-gray-100 text-gray-800">No response</Badge>;
    }
    if (value === "positive") {
      return <Badge className="bg-green-300 text-green-800">Positive</Badge>;
    }
    if (value === "failure" || value === "negative") {
      return <Badge className="bg-red-100 text-red-800">Failure</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{params.value}</Badge>;
  };

  // Recording link renderer
  const RecordingRenderer = (params: any) => {
    const value = params.value;
    if (!value) {
      return <span className="text-gray-500">Not Recorded</span>;
    }

    const links = value
      .split(/[,\s]+/)
      .map((link: string) => link.trim())
      .filter((link: string) => link.length > 0);

    if (links.length === 0) {
      return <span className="text-gray-500">Not Recorded</span>;
    }

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

  // Backup URL renderer
  const BackupRenderer = (params: any) => {
    const value = params.value;
    if (!value) {
      return <span className="text-gray-500">Not Available</span>;
    }

    const links = value
      .split(/[,\s]+/)
      .map((link: string) => link.trim())
      .filter((link: string) => link.length > 0);

    if (links.length === 0) {
      return <span className="text-gray-500">Not Available</span>;
    }

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

  // Column definitions with Backup URL after interviewer_contact
  const columnDefs = useMemo<ColDef[]>(() => {
    return [

      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      // { field: "candidate_id", headerName: "Candidate ID", sortable: true, maxWidth: 110 },
      { field: "candidate_name", headerName: "Full Name", sortable: true, minWidth: 150 },
      { field: "company", headerName: "Company", sortable: true, minWidth: 150 },
      { field: "interview_type", headerName: "Type", maxWidth: 90 },
      { field: "interview_date", headerName: "Date", maxWidth: 110 },
      { field: "recording_link", headerName: "Recording", cellRenderer: RecordingRenderer, minWidth: 200 },


      { field: "status", headerName: "Status", cellRenderer: StatusRenderer, minWidth: 120 },
      { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, minWidth: 120 },

      // Other columns
      { field: "interviewer_emails", headerName: "Emails", minWidth: 180 },
      { field: "interviewer_contact", headerName: "Contact", maxWidth: 140 },
      { field: "backup_url", headerName: "Backup URL", cellRenderer: BackupRenderer, minWidth: 200 },
      { field: "notes", headerName: "Notes", minWidth: 120 },
      { field: "last_mod_datetime", headerName: "Last Modified", minWidth: 160 },
    ];
  }, []);

  // PUT request on row update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/interviews/${updatedRow.id}`,
        updatedRow
      );
      setAllInterviews((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
      setFilteredInterviews((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
    } catch (err) {
      alert("Failed to update interview.");
    }
  };

  // DELETE request
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${id}`);
      setAllInterviews((prev) => prev.filter((row) => row.id !== id));
      setFilteredInterviews((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      alert("Failed to delete interview.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Interviews
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates scheduled for interviews and assessment sessions
          </p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white">
          <PlusIcon className="h-4 w-4 mr-2" />
          Schedule Interview
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
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredInterviews.length} result(s)
          </p>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center mt-8 text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
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
    </div>
  );
}
