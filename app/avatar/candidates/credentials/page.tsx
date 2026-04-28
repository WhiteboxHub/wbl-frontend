"use client";
import { useMemo, useState, useEffect } from "react";
import { ColDef } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon, RefreshCw, Eye, X, ClipboardType, Copy, Check } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import api from "@/lib/api";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type CandidateCredential = {
  id: number;
  full_name: string;
  email: string;
  resume_json: any;
  resume_actions?: any;
  resume_created_at: string;
  resume_updated_at: string;
  api_key: string;
  provider_name: string;
  model_name: string;
  api_key_created_at: string;
  api_key_updated_at: string;
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CandidateCredentialsPage() {
  const [data, setData] = useState<CandidateCredential[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/candidates/credentials");
      setData(response.data.data);
    } catch (err: any) {
      console.error("Error fetching credentials:", err);
      setError(err.response?.data?.detail || "Failed to fetch candidate credentials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.full_name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.provider_name?.toLowerCase().includes(term) ||
        item.id.toString().includes(term)
    );
  }, [data, searchTerm]);

  const columnDefs: ColDef<CandidateCredential>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        sortable: true,
        filter: "agNumberColumnFilter",
      },
      {
        field: "full_name",
        headerName: "Candidate Name",
        width: 180,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "provider_name",
        headerName: "LLM Provider",
        width: 130,
        sortable: true,
        cellRenderer: (params: any) => (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 capitalize">
            {params.value}
          </Badge>
        ),
      },
      {
        headerName: "Resume",
        field: "resume_actions",
        width: 100,
        cellRenderer: (params: any) => (
          <div className="flex items-center justify-center h-full">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 group"
              onClick={() => setSelectedResume(params.data.resume_json)}
              title="View Details"
            >
              <Eye className="h-4 w-4 text-blue-600 transition-transform group-hover:scale-110" />
            </Button>
          </div>
        ),
      },
      {
        field: "api_key",
        headerName: "API Key",
        width: 150,
        cellRenderer: (params: any) => (
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded dark:bg-gray-700">
            {"*".repeat(15)}
          </code>
        ),
      },
      {
        field: "resume_created_at",
        headerName: "Resume Date",
        width: 160,
        sortable: true,
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        field: "api_key_created_at",
        headerName: "Key Added Date",
        width: 160,
        sortable: true,
        valueFormatter: (params) => formatDate(params.value),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Candidate Credentials
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Combined view of candidates with both resumes and LLM API keys.
          </p>
        </div>
        <Button onClick={() => fetchData()} variant="outline" size="sm" className="gap-2 h-10 px-4 border-gray-200">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4 text-blue-600"} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Candidates
        </label>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search by name, email, or provider..."
            className="pl-10 h-10 border-gray-200 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : showLoader ? (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <Loader />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <AGGridTable
            rowData={filteredData}
            columnDefs={columnDefs}
            title="Candidate Credentials"
            domLayout="autoHeight"
            showAddButton={false}
            showEditButton={false}
            onRowUpdated={() => fetchData()}
            onRowDeleted={async (id) => {
              try {
                // Since this is a combined view, we might not have a direct delete endpoint
                // but we can provide the logic here if needed. 
                // For now, let's keep it simple as the user mentioned generic behavior.
                fetchData();
              } catch (err) {
                console.error("Delete failed:", err);
              }
            }}
          />
        </div>
      )}

      {selectedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden dark:bg-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 shrink-0">
              <div className="flex items-center space-x-2">
                <ClipboardType className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Resume Data Preview
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-100"
                  onClick={() => {
                    const json = JSON.stringify(selectedResume, null, 2);
                    navigator.clipboard.writeText(json);
                    toast.success("Resume JSON copied to clipboard!");
                  }}
                >
                  <Copy size={14} className="text-blue-600" />
                  Copy JSON
                </Button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={() => setSelectedResume(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="text-sm font-mono p-4 bg-gray-50 rounded-xl border dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(selectedResume, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
