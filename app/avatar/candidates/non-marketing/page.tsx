"use client";
import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable"; // Import our custom AG-Grid wrapper
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, Linkedin, FileText, Github } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast, Toaster } from "sonner";
import { cachedApiFetch } from "@/lib/apiCache";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

const StatusRenderer = (params: any) => {
  const status = (params?.value || "").toString().toLowerCase();
  let badgeClass =
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  if (status === "active") {
    badgeClass =
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  } else if (status === "inactive") {
    badgeClass =
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  }
  return <Badge className={badgeClass}>{(status || "N/A").toUpperCase()}</Badge>;
};

const WorkStatusRenderer = ({ value }: { value?: string }) => {
  if (!value) return null;
  const statusKey = value.toUpperCase().replace(/\s+/g, "_");
  const variantMap: Record<string, string> = {
    US_CITIZEN: "bg-blue-100 text-blue-800",
    GREEN_CARD: "bg-emerald-100 text-emerald-800",
    GC_EAD: "bg-teal-100 text-teal-800",
    I485_EAD: "bg-teal-100 text-teal-800",
    I140_APPROVED: "bg-cyan-100 text-cyan-800",
    F1: "bg-pink-100 text-pink-800",
    F1_OPT: "bg-pink-100 text-pink-800",
    F1_CPT: "bg-pink-100 text-pink-800",
    J1: "bg-amber-100 text-amber-800",
    J1_AT: "bg-amber-100 text-amber-800",
    H1B: "bg-indigo-100 text-indigo-800",
    H1B_TRANSFER: "bg-indigo-100 text-indigo-800",
    H1B_CAP_EXEMPT: "bg-indigo-100 text-indigo-800",
    H4: "bg-purple-100 text-purple-800",
    H4_EAD: "bg-purple-100 text-purple-800",
    L1A: "bg-violet-100 text-violet-800",
    L1B: "bg-violet-100 text-violet-800",
    L2: "bg-violet-100 text-violet-800",
    L2_EAD: "bg-violet-100 text-violet-800",
    O1: "bg-fuchsia-100 text-fuchsia-800",
    TN: "bg-sky-100 text-sky-800",
    E3: "bg-lime-100 text-lime-800",
    E3_EAD: "bg-lime-100 text-lime-800",
    E2: "bg-lime-100 text-lime-800",
    E2_EAD: "bg-lime-100 text-lime-800",
    TPS_EAD: "bg-yellow-100 text-yellow-800",
    ASYLUM_EAD: "bg-orange-100 text-orange-800",
    REFUGEE_EAD: "bg-orange-100 text-orange-800",
    DACA_EAD: "bg-orange-100 text-orange-800"
  };
  return (
    <Badge className={`${variantMap[statusKey] || "bg-gray-100 text-gray-800"} capitalize`}>
      {value}
    </Badge>
  );
};

const workStatusOptions = [
  "US_CITIZEN", "GREEN_CARD", "GC_EAD", "I485_EAD", "I140_APPROVED",
  "F1", "F1_OPT", "F1_CPT", "J1", "J1_AT", "H1B", "H1B_TRANSFER",
  "H1B_CAP_EXEMPT", "H4", "H4_EAD", "L1A", "L1B", "L2", "L2_EAD",
  "O1", "TN", "E3", "E3_EAD", "E2", "E2_EAD", "TPS_EAD",
  "ASYLUM_EAD", "REFUGEE_EAD", "DACA_EAD",
];

const FilterHeaderComponent = ({
  selectedItems,
  setSelectedItems,
  options,
  label,
  color = "blue",
  displayName,
  renderOption = (option: any) => option,
  getOptionValue = (option: any) => option,
  getOptionKey = (option: any) => option,
}: {
  selectedItems: any[];
  setSelectedItems: React.Dispatch<React.SetStateAction<any[]>>;
  options: any[];
  label: string;
  color?: string;
  displayName?: string;
  renderOption?: (option: any) => React.ReactNode;
  getOptionValue?: (option: any) => any;
  getOptionKey?: (option: any) => any;
}) => {
  const handleItemChange = (item: any) => {
    const value = getOptionValue(item);
    setSelectedItems((prev: any[]) => {
      const isSelected = prev.some((i) => getOptionValue(i) === value);
      return isSelected
        ? prev.filter((i) => getOptionValue(i) !== value)
        : [...prev, item];
    });
    setFilterVisible(false);
  };

  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: Math.max(0, rect.left + window.scrollX - 100),
      });
    }
    setFilterVisible((v) => !v);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedItems(e.target.checked ? [...options] : []);
  };

  const isAllSelected = selectedItems.length === options.length && options.length > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < options.length;

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
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
    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterVisible]);

  return (
    <div className="ag-cell-label-container" role="presentation">
      <div className="ag-header-cell-label" role="presentation">
        <span className="ag-header-cell-text">{displayName || label}</span>
        <div
          ref={filterButtonRef}
          className="ag-header-icon ag-header-label-icon"
          onClick={toggleFilter}
          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginLeft: "4px" }}
        >
          {selectedItems.length > 0 && (
            <span className={`${colorMap[color]} min-w-[20px] rounded-full px-2 py-0.5 text-center text-xs text-white`} style={{ marginRight: "4px" }}>
              {selectedItems.length}
            </span>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: selectedItems.length > 0 ? "#8b5cf6" : "#6b7280" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
          </svg>
        </div>
      </div>

      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="filter-dropdown pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
            style={{ top: dropdownPos.top + 5, left: dropdownPos.left, zIndex: 99999, maxHeight: "300px", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 border-b pb-2">
              <label className="font-medium text-sm flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isIndeterminate; }} onChange={handleSelectAll} className="mr-3" />
                Select All
              </label>
            </div>
            {options.map((option) => {
              const value = getOptionValue(option);
              const key = getOptionKey(option);
              const isSelected = selectedItems.some((i) => getOptionValue(i) === value);
              return (
                <label key={key} className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <input type="checkbox" checked={isSelected} onChange={() => handleItemChange(option)} className="mr-3" />
                  {renderOption(option)}
                </label>
              );
            })}
            {selectedItems.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button onClick={(e) => { e.stopPropagation(); setSelectedItems([]); }} className="w-full py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                  Clear All
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

interface StatusHeaderProps {
  selectedStatuses: string[];
  setSelectedStatuses: (values: string[]) => void;
}

const StatusHeaderComponent = ({ selectedStatuses, setSelectedStatuses }: StatusHeaderProps) => {
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
    const valLower = value.toLowerCase();
    if (selectedStatuses.map(s => s.toLowerCase()).includes(valLower)) {
      setSelectedStatuses(selectedStatuses.filter((v) => v.toLowerCase() !== valLower));
    } else {
      setSelectedStatuses([...selectedStatuses, valLower]);
    }
    setFilterVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node) && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFilterVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusOptions = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }];

  return (
    <div className="relative flex items-center w-full" ref={filterButtonRef}>
      <span className="mr-2">Status</span>
      <svg onClick={toggleFilter} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
      </svg>
      {filterVisible &&
        createPortal(
          <div ref={dropdownRef} className="z-[99999] bg-white border border-gray-200 rounded-md shadow-lg w-48 max-h-60 overflow-y-auto" style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px`, position: "absolute" }}>
            <div className="py-1">
              {statusOptions.map(({ value, label }) => (
                <button key={value} onClick={() => handleValueChange(value)} className={`block w-full text-left px-4 py-2 text-sm ${selectedStatuses.map(s => s.toLowerCase()).includes(value.toLowerCase()) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}>
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

export default function NonMarketingCandidatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["active"]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");

  const getCandidateId = (row: any): number | string | null => {
    return row?.candidate_id ?? row?.candidate?.id ?? row?.candidate?.candidate_id ?? row?.id ?? null;
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prepRes, marketingRes] = await Promise.all([
          cachedApiFetch("/candidate_preparations"),
          cachedApiFetch("/candidate/marketing?page=1&limit=1000"),
        ]);

        const prepBody = prepRes?.data ?? prepRes;
        const prepCandidates = Array.isArray(prepBody) ? prepBody : prepBody?.data ?? [];

        const mktBody = marketingRes?.data ?? marketingRes;
        const mktCandidates = Array.isArray(mktBody?.data) ? mktBody.data : Array.isArray(mktBody?.results) ? mktBody.results : Array.isArray(mktBody) ? mktBody : [];

        if (!mounted) return;

        const marketingIds = new Set(
          mktCandidates
            .map((m: any) => getCandidateId(m))
            .filter((id: any) => id !== null && id !== undefined)
            .map((id: any) => String(id))
        );
        const nonMarketing = prepCandidates.filter((p: any) => {
          const candidateId = getCandidateId(p);
          if (candidateId === null || candidateId === undefined) return true;
          return !marketingIds.has(String(candidateId));
        });

        setAllCandidates(nonMarketing);
        setError("");
      } catch (err) {
        console.error("Failed to load data:", err);
        if (mounted) {
          setError("Failed to load data.");
          toast.error("Failed to load data.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  const getAllValues = (obj: any): string[] => {
    let values: string[] = [];
    for (const val of Object.values(obj || {})) {
      if (val && typeof val === "object") {
        values = values.concat(getAllValues(val));
      } else if (val !== null && val !== undefined) {
        values.push(String(val));
      }
    }
    return values;
  };

  useEffect(() => {
    let filtered = [...allCandidates];
    const selectedLower = selectedStatuses.map((s) => s.toLowerCase());

    if (selectedLower.length > 0) {
      filtered = filtered.filter((c) => selectedLower.includes((c?.status || "").toString().toLowerCase()));
    }

    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((c) => selectedWorkStatuses.includes(c?.candidate?.workstatus));
    }

    const term = (searchTerm || "").trim().toLowerCase();
    if (term !== "") {
      if (/^\d+$/.test(term)) {
        filtered = filtered.filter((c) => String(c.id || "").toLowerCase() === term || String(c.candidate_id || "").toLowerCase() === term);
      } else {
        filtered = filtered.filter((c) => getAllValues(c).some((val) => val.toLowerCase().includes(term)));
      }
    }

    // Sort by Batch name ascending (older to newer)
    filtered.sort((a, b) => {
      const aBatch = (a?.candidate?.batch?.batchname || "").toString();
      const bBatch = (b?.candidate?.batch?.batchname || "").toString();
      
      if (!aBatch && !bBatch) return 0;
      if (!aBatch) return 1;
      if (!bBatch) return -1;
      
      // Extract parts (expects YYYY-MM or similar)
      const aParts = aBatch.split("-");
      const bParts = bBatch.split("-");
      
      const aYear = parseInt(aParts[0]) || 0;
      const bYear = parseInt(bParts[0]) || 0;
      
      if (aYear !== bYear) return aYear - bYear;
      
      const aMonth = parseInt(aParts[1]) || 0;
      const bMonth = parseInt(bParts[1]) || 0;
      
      return aMonth - bMonth;
    });

    setFilteredCandidates(filtered);
  }, [allCandidates, searchTerm, selectedStatuses, selectedWorkStatuses]);

  const CandidateNameRenderer = (params: any) => {
    const candidateId = params?.data?.candidate_id || params?.data?.candidate?.id || params?.data?.id;
    const candidateName = params?.data?.candidate?.full_name || params?.data?.candidate_name || params?.value || "";
    if (!candidateId || !candidateName) return <span className="text-gray-500">{candidateName || "N/A"}</span>;
    return (
      <Link href={`/avatar/candidates/search?candidateId=${candidateId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer">
        {candidateName}
      </Link>
    );
  };

  const IconCellRenderer = ({ value, icon: Icon, title, colorClass = "text-blue-600" }: any) => {
    let url = (value || "").trim();
    if (!url) return <span className="text-gray-400 opacity-60">N/A</span>;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={title}>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </a>
    );
  };

  const LinkedinCellRenderer = (params: any) => <IconCellRenderer value={params.value} icon={Linkedin} title="View LinkedIn Profile" colorClass="text-[#0a66c2]" />;
  const ResumeCellRenderer = (params: any) => <IconCellRenderer value={params.value} icon={FileText} title="View Resume" colorClass="text-blue-600" />;
  const GithubCellRenderer = (params: any) => <IconCellRenderer value={params.value} icon={Github} title="View GitHub Profile" colorClass="text-gray-700 dark:text-gray-300" />;

  const formatEnumValue = (value: string) => {
    if (!value) return "N/A";
    return value.toString().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  };

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", pinned: "left", width: 80 },
      {
        field: "candidate_name",
        headerName: "Candidate Name",
        cellRenderer: CandidateNameRenderer,
        sortable: true,
        minWidth: 150,
        editable: false,
        valueGetter: (params) => params.data?.candidate?.full_name || "N/A",
      },
      {
        field: "batch_name",
        headerName: "Batch",
        sortable: false, // Remove the arrow and disable manual sorting
        maxWidth: 150,
        valueGetter: (params) => params.data.candidate?.batch?.batchname || "N/A",
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        sortable: true,
        width: 180,
        editable: false,
        cellRenderer: (params: any) => <WorkStatusRenderer value={params.value} />,
        headerComponent: FilterHeaderComponent,
        headerComponentParams: {
          selectedItems: selectedWorkStatuses,
          setSelectedItems: setSelectedWorkStatuses,
          options: workStatusOptions,
          label: "Work Status",
          displayName: "Work Status",
          color: "green",
          renderOption: (option: string) => <WorkStatusRenderer value={option} />,
          getOptionValue: (option: string) => option,
          getOptionKey: (option: string) => option,
        },
        valueGetter: (params) => params.data.candidate?.workstatus || "N/A",
      },
      { field: "start_date", headerName: "Start Date", sortable: true, maxWidth: 130 },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        maxWidth: 150,
        headerComponent: StatusHeaderComponent,
        headerComponentParams: { selectedStatuses, setSelectedStatuses },
      },
      { field: "instructor1_name", headerName: "Instructor 1", minWidth: 150, valueGetter: (params) => params.data?.instructor1?.name || "N/A" },
      { field: "instructor2_name", headerName: "Instructor 2", minWidth: 150, valueGetter: (params) => params.data?.instructor2?.name || "N/A" },
      { field: "instructor3_name", headerName: "Instructor 3", minWidth: 150, valueGetter: (params) => params.data?.instructor3?.name || "N/A" },
      { field: "rating", headerName: "Rating", minWidth: 120, valueFormatter: (params) => formatEnumValue(params.value) },
      { field: "communication", headerName: "Communication", minWidth: 120, valueFormatter: (params) => formatEnumValue(params.value) },
      { field: "years_of_experience", headerName: "Experience (Years)", minWidth: 140 },
      { field: "github_url", headerName: "GitHub", minWidth: 150, cellRenderer: GithubCellRenderer },
      { field: "resume_url", headerName: "Resume", minWidth: 150, cellRenderer: ResumeCellRenderer },
      { headerName: "LinkedIn", minWidth: 150, valueGetter: (params) => params.data?.candidate?.linkedin_id || null, cellRenderer: LinkedinCellRenderer },
      {
        field: "target_date",
        headerName: "Target Date",
        width: 180,
        sortable: true,
        valueGetter: (params) => params.data?.entry_date ? new Date(params.data.entry_date) : null,
        valueFormatter: (params) => params.value ? params.value.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "-",
      },
      {
        field: "notes",
        headerName: "Notes",
        minWidth: 100,
        editable: false,
        cellRenderer: (params: any) => params.value ? <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: params.value }} /> : "",
      },
    ];
  }, [selectedStatuses, selectedWorkStatuses]);

  if (showLoader) return <Loader />;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-center" richColors />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Non-Marketing Candidates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Candidates in Prep who are not yet in Marketing.</p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Candidates
        </Label>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Search candidates..."
            className="pl-10 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <AGGridTable
            rowData={filteredCandidates}
            columnDefs={columnDefs}
            title={`Non-Marketing Candidates (${allCandidates.length})`}
            height="calc(80vh)"
            showSearch={false}
            showAddButton={false}
          />
        </div>
      </div>
    </div>
  );
}
