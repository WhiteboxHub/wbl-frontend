
"use client";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback } from "react";

export default function CandidatesPlacements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allCandidates, setAllCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom renderers must be declared before useMemo
  const StatusRenderer = (params: any) => {
    const { value } = params;
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        {value?.toUpperCase()}
      </Badge>
    );
  };

  const VisaStatusRenderer = (params: any) => {
    const visa = params.value;
    const colorMap: Record<string, string> = {
      H1B: "bg-blue-100 text-blue-800",
      GC: "bg-emerald-100 text-emerald-800",
      "F1 Student": "bg-purple-100 text-purple-800",
      F1: "bg-purple-100 text-purple-800",
      "GC EAD": "bg-teal-100 text-teal-800",
      L1: "bg-orange-100 text-orange-800",
      L2: "bg-orange-100 text-orange-800",
      Citizen: "bg-indigo-100 text-indigo-800",
      H4: "bg-pink-100 text-pink-800",
      None: "bg-gray-200 text-gray-700",
      Select: "bg-gray-200 text-gray-700",
    };
    const badgeClass =
      colorMap[visa] || "bg-gray-100 text-gray-800 dark:text-gray-300";
    return <Badge className={badgeClass}>{visa}</Badge>;
  };

  const AmountRenderer = (params: any) => {
    return `$${params.value?.toLocaleString?.() || params.value}`;
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements?page=1&limit=1000`
        );
        if (!res.ok) throw new Error("Failed to fetch placements");

        const responseData = await res.json();
        const data = responseData.data || [];
        setAllCandidates(data);
        setFilteredCandidates(data);

        if (data.length > 0) {
          // Order you want first
          const orderedFields = ["id", "candidate_id", "position", "placement", "company"];

          // Explicit columns in order
          const orderedColumns: ColDef[] = orderedFields
            .filter((field) => field in data[0])
            .map((key) => ({
              field: key,
              headerName: key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase()),
              width: 150,
              minWidth: 120,
              cellRenderer: getCustomRenderer(key),
              editable: true,
            }));

          // Generate remaining dynamically
          const dynamicColumns: ColDef[] = Object.keys(data[0])
            .filter((key) => !orderedFields.includes(key))
            .map((key) => ({
              field: key,
              headerName: key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase()),
              width: 150,
              minWidth: 120,
              cellRenderer: getCustomRenderer(key),
              editable: true,
            }));

          setColumnDefs([...orderedColumns, ...dynamicColumns]);
        }
      } catch (err) {
        setError("Unable to fetch placements data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCustomRenderer = (key: string) => {
    if (key === "status") return StatusRenderer;
    if (key === "visaStatus") return VisaStatusRenderer;
    if (key === "amountPaid") return AmountRenderer;
    return undefined;
  };

  const filterCandidates = useCallback(
    (searchTerm: string) => {
      if (searchTerm.trim() === "") return allCandidates;
      const searchLower = searchTerm.toLowerCase();
      return allCandidates.filter((candidate: any) =>
        Object.values(candidate).some((val) =>
          String(val).toLowerCase().includes(searchLower)
        )
      );
    },
    [allCandidates]
  );

  useEffect(() => {
    const filtered = filterCandidates(searchTerm);
    setFilteredCandidates(filtered);
  }, [searchTerm, filterCandidates]);

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements/${updatedRow.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedRow),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update placement");
      }

      const updatedData = await response.json();

      setFilteredCandidates((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedData : row))
      );
    } catch (error) {
      alert("Failed to update placement. Please try again.");
    }
  };

  const handleRowDeleted = async (id: string | number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete placement");
      }

      setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      alert("Failed to delete placement. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Placements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Successfully placed candidates
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Candidates
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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

      {/* Loading, Error or Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Placements (${filteredCandidates.length})`}
              height="calc(70vh)"
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
