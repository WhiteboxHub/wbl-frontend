"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { AGGridTable } from "@/components/AGGridTable";
import { createPortal } from "react-dom";
import axios from "axios";
import Link from "next/link";

type Candidate = {
  id: number;
  full_name?: string | null;
  enrolled_date?: string | Date | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  workstatus?: string | null;
  education?: string | null;
  workexperience?: string | null;
  ssn?: string | null;
  agreement?: string | null;
  secondaryemail?: string | null;
  secondaryphone?: string | null;
  address?: string | null;
  linkedin_id?: string | null;
  dob?: string | Date | null;
  emergcontactname?: string | null;
  emergcontactemail?: string | null;
  emergcontactphone?: string | null;
  emergcontactaddrs?: string | null;
  fee_paid?: number | null;
  github_link?: string | null;
  batchid: number;
  candidate_folder?: string | null;
  notes?: string | null;
};

type FormData = {
  full_name: string;
  enrolled_date?: string;
  email: string;
  phone: string;
  status: string;
  workstatus: string;
  education: string;
  workexperience: string;
  ssn: string;
  agreement: string;
  secondaryemail: string;
  secondaryphone: string;
  address: string;
  linkedin_id: string;
  dob?: string;
  emergcontactname: string;
  emergcontactemail: string;
  emergcontactphone: string;
  emergcontactaddrs: string;
  fee_paid: number;
  github_link: string;
  batchid: number;
  candidate_folder: string;
  notes: string;
};

type Batch = {
  batchid: number;
  batchname: string;
  subject?: string;
  courseid?: number;
  orientationdate?: string;
  startdate?: string;
  enddate?: string;
};

const statusOptions = ["active", "discontinued", "break", "closed"];
const workStatusOptions = [
  "Waiting for Status",
  "Citizen",
  "Visa",
  "Permanent resident",
  "EAD",
];

const initialFormData: FormData = {
  full_name: "",
  enrolled_date: new Date().toISOString().split("T")[0],
  email: "",
  phone: "",
  status: "active",
  workstatus: "Waiting for Status",
  education: "",
  workexperience: "",
  ssn: "",
  agreement: "N",
  secondaryemail: "",
  secondaryphone: "",
  address: "",
  linkedin_id: "",
  emergcontactname: "",
  emergcontactemail: "",
  emergcontactphone: "",
  emergcontactaddrs: "",
  fee_paid: 0,
  github_link: "",
  batchid: 0,
  candidate_folder: "",
  notes: ""
};

const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    active:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    discontinued:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    break: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <Badge className={`${variantMap[status] || variantMap.default} capitalize`}>
      {value || "N/A"}
    </Badge>
  );
};

const WorkStatusRenderer = ({ value }: { value?: string }) => {
  const workstatus = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    citizen:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    visa: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "permanent resident":
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    ead: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    "waiting for status":
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <Badge
      className={`${variantMap[workstatus] || variantMap.default} capitalize`}
    >
      {value || "N/A"}
    </Badge>
  );
};

const CandidateNameRenderer = (params: any) => {
  const candidateId = params.data?.id;
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

const FilterHeaderComponent = ({
  selectedItems,
  setSelectedItems,
  options,
  label,
  color = "blue",
  renderOption = (option: any) => option,
  getOptionValue = (option: any) => option,
  getOptionKey = (option: any) => option,
}: {
  selectedItems: any[];
  setSelectedItems: React.Dispatch<React.SetStateAction<any[]>>;
  options: any[];
  label: string;
  color?: string;
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
  };
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
    { top: 0, left: 0 }
  );
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

  const isAllSelected =
    selectedItems.length === options.length && options.length > 0;
  const isIndeterminate =
    selectedItems.length > 0 && selectedItems.length < options.length;

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

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setFilterVisible(false);
      }
    };

    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true,
      });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">{label}</span>
      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedItems.length > 0 && (
          <span
            className={`${colorMap[color]} min-w-[20px] rounded-full px-2 py-0.5 text-center text-xs text-white`}
          >
            {selectedItems.length}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-500 hover:text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
          />
        </svg>
      </div>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="filter-dropdown pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: "300px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 border-b pb-2">
              <label
                className="flex cursor-pointer items-center rounded px-2 py-1 font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="mr-3"
                />
                Select All
              </label>
            </div>
            {options.map((option) => {
              const value = getOptionValue(option);
              const key = getOptionKey(option);
              const isSelected = selectedItems.some(
                (i) => getOptionValue(i) === value
              );

              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleItemChange(option)}
                    className="mr-3"
                  />
                  {renderOption(option)}
                </label>
              );
            })}
            {selectedItems.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItems([]);
                  }}
                  className="w-full py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
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

export default function CandidatesPage() {
  const gridRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewCandidate = searchParams.get("newcandidate") === "true";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState("all");
  const [sortModel, setSortModel] = useState([
    { colId: "enrolled_date", sort: "desc" as "desc" },
  ]);
  const [filterModel, setFilterModel] = useState({});
  const [newCandidateForm, setNewCandidateForm] = useState(isNewCandidate);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

  const [allBatches, setAllBatches] = useState<Batch[]>([]);

  const [mlBatches, setMlBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  useEffect(() => {
    console.log("📊 Batch State Update:");
    console.log("   - All batches:", allBatches.length);
    console.log("   - ML batches for form:", mlBatches.length);
    if (mlBatches.length > 0) {
      console.log(
        "   - ML batches details:",
        mlBatches.map((b) => ({
          id: b.batchid,
          name: b.batchname,
          subject: b.subject,
          courseid: b.courseid,
        }))
      );
    }
  }, [allBatches, mlBatches]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>(
    []
  );
  const [selectedBatches, setSelectedBatches] = useState<Batch[]>([]);

  // API Endpoints
  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/candidates`,
    []
  );
  const courseId = "3";

  // Sync form visibility with URL
  useEffect(() => {
    const newCandidateParam = searchParams.get("newcandidate") === "true";
    setNewCandidateForm(newCandidateParam);
  }, [searchParams]);

  // Fetch candidates
  const fetchCandidates = useCallback(
    async (
      search?: string,
      searchBy: string = "all",
      sort: any[] = [{ colId: "enrolled_date", sort: "desc" }],
      filters: any = {}
    ) => {
      setLoading(true);
      try {
        let url = `${apiEndpoint}?limit=0`;

        if (search && search.trim()) {
          url += `&search=${encodeURIComponent(
            search.trim()
          )}&search_by=${searchBy}`;
        }

        const sortToApply =
          sort && sort.length > 0
            ? sort
            : [{ colId: "enrolled_date", sort: "desc" }];
        const sortParam = sortToApply
          .map((s) => `${s.colId}:${s.sort}`)
          .join(",");
        url += `&sort=${encodeURIComponent(sortParam)}`;

        if (Object.keys(filters).length > 0) {
          url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
        }

        //  Get token from localStorage (or cookies/session depending on your auth setup)
        const token = localStorage.getItem("token");

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`, // pass token here
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setCandidates(data.data);
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Failed to load candidates";
        setError(error);
        toast.error(error);
      } finally {
        setLoading(false);
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    },
    [apiEndpoint]
  );

  useEffect(() => {
    const fetchBatches = async () => {
      setBatchesLoading(true);
      try {
        const token = localStorage.getItem("accesstoken");

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/batch`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const sortedAllBatches = [...res.data].sort(
          (a: Batch, b: Batch) => b.batchid - a.batchid
        );
        setAllBatches(sortedAllBatches);

        const uniqueSubjects = [
          ...new Set(sortedAllBatches.map((batch) => batch.subject)),
        ];
        const uniqueCourseIds = [
          ...new Set(sortedAllBatches.map((batch) => batch.courseid)),
        ];
        console.log(" Available subjects:", uniqueSubjects);
        console.log(" Available course IDs:", uniqueCourseIds);
        console.log(" Total batches:", sortedAllBatches.length);

        let mlBatchesOnly = sortedAllBatches.filter((batch) => {
          const subject = batch.subject?.toLowerCase();
          return (
            subject === "ml" ||
            subject === "machine learning" ||
            subject === "machinelearning" ||
            subject?.includes("ml")
          );
        });

        if (mlBatchesOnly.length === 0) {
          console.log(" No ML batches found by subject, trying courseid = 3");
          mlBatchesOnly = sortedAllBatches.filter(
            (batch) => batch.courseid === 3
          );
        }

        if (mlBatchesOnly.length === 0) {
          console.warn(
            " No ML batches found! Showing all batches in form as fallback"
          );
          mlBatchesOnly = sortedAllBatches;
        }

        console.log(" Filtered ML batches for form:", mlBatchesOnly.length);
        setMlBatches(mlBatchesOnly);

        if (
          isNewCandidate &&
          mlBatchesOnly.length > 0 &&
          mlBatchesOnly[0]?.batchid
        ) {
          setFormData((prev) => ({
            ...prev,
            batchid: mlBatchesOnly[0].batchid,
          }));
        }
      } catch (error) {
        console.error("Failed to load batches:", error);
      } finally {
        setBatchesLoading(false);
      }
    };

    fetchBatches();
  }, [courseId, isNewCandidate]);

  useEffect(() => {
    let filtered = [...candidates];
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((candidate) =>
        selectedStatuses.some(
          (status) =>
            status.toLowerCase() === (candidate.status || "").toLowerCase()
        )
      );
    }
    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((candidate) =>
        selectedWorkStatuses.some(
          (ws) =>
            ws.toLowerCase() === (candidate.workstatus || "").toLowerCase()
        )
      );
    }
    if (selectedBatches.length > 0) {
      filtered = filtered.filter((candidate) =>
        selectedBatches.some((batch) => batch.batchid === candidate.batchid)
      );
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.full_name?.toLowerCase().includes(term) ||
          candidate.email?.toLowerCase().includes(term) ||
          candidate.phone?.toLowerCase().includes(term) ||
          candidate.id.toString().includes(term)
      );
    }
    setFilteredCandidates(filtered);
  }, [
    candidates,
    selectedStatuses,
    selectedWorkStatuses,
    selectedBatches,
    searchTerm,
  ]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const getWorkStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "waiting for status":
        return { backgroundColor: "#FFEDD5", color: "#C2410C" }; // orange
      case "citizen":
        return { backgroundColor: "#D1FAE5", color: "#065F46" }; // green
      case "visa":
        return { backgroundColor: "#DBEAFE", color: "#1D4ED8" }; // blue
      case "others":
        return { backgroundColor: "#F3E8FF", color: "#7C3AED" }; // purple
      case "ead":
        return { backgroundColor: "#FEF3C7", color: "#92400E" }; // yellow
      default:
        return { backgroundColor: "white", color: "black" };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return { backgroundColor: "#ECFDF5", color: "#065F46" }; // Light green (matches "citizen")
      case "discontinued":
        return { backgroundColor: "#FEF2F2", color: "#991B1B" }; // Light red (matches error states)
      case "break":
        return { backgroundColor: "#FDF2F8", color: "#7C2D12" }; // Light pink
      case "closed":
        return { backgroundColor: "#F3F4F6", color: "#374151" }; // Light gray
      default:
        return { backgroundColor: "#FFFFFF", color: "#000000" }; // White with black text
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const autoSearchBy = detectSearchBy(searchTerm);
        fetchCandidates(searchTerm, autoSearchBy, sortModel, filterModel);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchBy, sortModel, filterModel, fetchCandidates]);

  const detectSearchBy = (search: string) => {
    if (/^\d+$/.test(search)) return "id";
    if (/^\S+@\S+\.\S+$/.test(search)) return "email";
    if (/^[\d\s\+\-()]+$/.test(search)) return "phone";
    return "full_name";
  };

  const handleOpenNewCandidateForm = () => {
    router.push("/avatar/candidates?newcandidate=true", { scroll: false });
    setNewCandidateForm(true);

    if (mlBatches.length > 0) {
      const latestBatch = mlBatches[0];
      setFormData((prev) => ({
        ...prev,
        batchid: latestBatch?.batchid,
      }));
    }
  };

  const handleCloseNewCandidateForm = () => {
    router.push("/avatar/candidates", { scroll: false });
    setNewCandidateForm(false);
    setFormData(initialFormData);
  };

  const handleNewCandidateFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (
      name === "phone" ||
      name === "secondaryphone" ||
      name === "emergcontactphone"
    ) {
      // Allow only numbers
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === "full_name" || name === "emergcontactname") {
      // Allow letters (a-z, A-Z), dot, and spaces
      const nameValue = value.replace(/[^a-zA-Z. ]/g, "");
      setFormData((prev) => ({ ...prev, [name]: nameValue }));
      return;
    }
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked ? "Y" : "N" }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNewCandidateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setFormSaveLoading(true);
    try {
      const payload = {
        ...formData,
        enrolled_date:
          formData.enrolled_date || new Date().toISOString().split("T")[0],
        status: formData.status || "active",
        workstatus: formData.workstatus || "Waiting for Status",
        agreement: formData.agreement || "N",
        fee_paid: formData.fee_paid || 0,
      };
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create candidate");
      }
      const newId = await response.json();
      toast.success(`Candidate created successfully with ID: ${newId}`);
      setNewCandidateForm(false);
      setFormData(initialFormData);
      fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
    } catch (error) {
      toast.error("Failed to create candidate: " + (error as Error).message);
      console.error("Error creating candidate:", error);
    } finally {
      setFormSaveLoading(false);
    }
  };

  const handleRowUpdated = useCallback(
    async (updatedRow: Candidate) => {
      setLoadingRowId(updatedRow.id);
      try {
        const updatedData = { ...updatedRow };
        if (!updatedData.status || updatedData.status === "") {
          updatedData.status = "active";
        }
        const { id, ...payload } = updatedData;
        const response = await fetch(`${apiEndpoint}/${updatedRow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update candidate");
        fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
        toast.success("Candidate updated successfully");
      } catch (error) {
        toast.error("Failed to update candidate");
        console.error("Error updating candidate:", error);
      } finally {
        setLoadingRowId(null);
      }
    },
    [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchCandidates]
  );

  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete candidate");
        toast.success("Candidate deleted successfully");
        fetchCandidates(searchTerm, searchBy, sortModel, filterModel);
      } catch (error) {
        toast.error("Failed to delete candidate");
        console.error("Error deleting candidate:", error);
      }
    },
    [apiEndpoint, searchTerm, searchBy, sortModel, filterModel, fetchCandidates]
  );

  const handleFilterChanged = useCallback(
    (filterModelFromGrid: any) => {
      setFilterModel(filterModelFromGrid);
      fetchCandidates(searchTerm, searchBy, sortModel, filterModelFromGrid);
    },
    [searchTerm, searchBy, sortModel, fetchCandidates]
  );

  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    return `+1 ${phoneNumberString}`;
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
  };

  // Add ESC key listener
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseNewCandidateForm();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Column Definitions
  const columnDefs: ColDef<any, any>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        pinned: "left",
        sortable: true,
      },
      {
        field: "full_name",
        headerName: "Full Name",
        width: 180,
        sortable: true,
        cellRenderer: CandidateNameRenderer,
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        editable: true,
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          const formattedPhone = formatPhoneNumber(params.value);
          return (
            <a
              href={`tel:${params.value}`}
              className="text-blue-600 underline hover:text-blue-800"
            >
              {formattedPhone}
            </a>
          );
        },
      },

      headerComponent: (props: any) => (
        <FilterHeaderComponent
          {...props}
          selectedItems={selectedBatches}
          setSelectedItems={setSelectedBatches}
          options={mlBatches}
          label="Batch"
          color="purple"
          renderOption={(option: Batch) => option.batchname}
          getOptionValue={(option: Batch) => option}
          getOptionKey={(option: Batch) => option.batchid}
        />
      ),
    },

    {
      field: "status",
      headerName: "Status",
      width: 120,
      sortable: true,
      cellRenderer: StatusRenderer,
      headerComponent: (props: any) => (
        <FilterHeaderComponent
          {...props}
          selectedItems={selectedStatuses}
          setSelectedItems={setSelectedStatuses}
          options={statusOptions}
          label="Status"
          color="blue"
          renderOption={(option) => <StatusRenderer value={option} />}
          getOptionValue={(option) => option}
          getOptionKey={(option) => option}
        />
      ),
    },
    {
      field: "workstatus",
      headerName: "Work Status",
      width: 150,
      sortable: true,
      cellRenderer: WorkStatusRenderer,
      headerComponent: (props: any) => (
        <FilterHeaderComponent
          {...props}
          selectedItems={selectedWorkStatuses}
          setSelectedItems={setSelectedWorkStatuses}
          options={workStatusOptions}
          label="Work Status"
          color="green"
          renderOption={(option) => option}
          getOptionValue={(option) => option}
          getOptionKey={(option) => option}
        />
      ),
    },
    {
      field: "enrolled_date",
      headerName: "Enrolled Date",
      width: 150,
      sortable: true,
      valueFormatter: ({ value }: ValueFormatterParams) => formatDate(value),
    },
    {
      field: "education",
      headerName: "Education",
      width: 200,
      sortable: true,
    },
    {
      field: "workexperience",
      headerName: "Work Experience",
      width: 200,
      sortable: true,
    },
    {
      field: "ssn",
      headerName: "SSN",
      width: 120,
      sortable: true,
    },
    {
      field: "agreement",
      headerName: "Agreement",
      width: 100,
      sortable: true,
    },
    {
      field: "secondaryemail",
      headerName: "Secondary Email",
      width: 200,
      sortable: true,
    },
    {
      field: "secondaryphone",
      headerName: "Secondary Phone",
      width: 150,
      sortable: true,
    },
    {
      field: "address",
      headerName: "Address",
      width: 300,
      sortable: true,
    },
    {
      field: "linkedin_id",
      headerName: "LinkedIn ID",
      width: 150,
      sortable: true,
    },
{
  field: "dob",
  headerName: "Date of Birth",
  width: 150,
  sortable: true,
  editable: true,
  valueFormatter: ({ value }: ValueFormatterParams) => formatDate(value),
  valueParser: (params) => {
    if (!params.newValue) return null;
   
    const date = new Date(params.newValue);
    return date.toISOString();
  },
  cellEditor: 'agDateCellEditor', // Use AG Grid's built-in date editor
  cellEditorParams: {
    // Optional: Configure the date picker format
    min: '1900-01-01', // Example: Set min date
    max: new Date().toISOString().split('T')[0] // Example: Set max date to today
  }
},
    {
      field: "emergcontactname",
      headerName: "Emergency Contact Name",
      width: 200,
      sortable: true,
    },
    {
      field: "emergcontactemail",
      headerName: "Emergency Contact Email",
      width: 200,
      sortable: true,
    },
    {
      field: "emergcontactphone",
      headerName: "Emergency Contact Phone",
      width: 150,
      sortable: true,
    },
    {
      field: "emergcontactaddrs",
      headerName: "Emergency Contact Address",
      width: 300,
      sortable: true,
    },
    {
      field: "fee_paid",
      headerName: "Fee Paid",
      width: 120,
      sortable: true,
      valueFormatter: ({ value }: ValueFormatterParams) => value != null ? `$${Number(value).toLocaleString()}` : "",
    },
    {
            field: "notes",
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
            field: "linkedin_id",
            headerName: "LinkedIn Profile",
            width: 200,
            sortable: true,
            cellRenderer: (params: any) => {
              if (!params.value) return "";
              return (
                <a
                  href={params.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                  onClick={(event) => event.stopPropagation()}
                >
                  {params.value}
                </a>
              );
            },
          },
          {
            field: "github_link",
            headerName: "Git Hub Profile",
            width: 200,
            sortable: true,
            cellRenderer: (params: any) => {
              if (!params.value) return "";
              return (
                <a
                  href={params.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                  onClick={(event) => event.stopPropagation()}
                >
                  {params.value}
                </a>
              );
            },
          },
          {
            field: "candidate_folder",
            headerName: "Candidate Folder",
            width: 200,
            sortable: true,
            cellRenderer: (params: any) => {
              if (!params.value) return "";
              return (
                <a
                  href={params.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                  onClick={(event) => event.stopPropagation()}
                >
                  {params.value}
                </a>
              );
            },
          },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCandidates(data.data);
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Failed to load candidates";
        setError(error);
        toast.error(error);
      } finally {
        setLoading(false);
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    },
    [apiEndpoint]
  );

  // Error handling
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() =>
            fetchCandidates(searchTerm, searchBy, sortModel, filterModel)
          }
          className="ml-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add CSS for scrollable dropdowns */}
      <style jsx global>{`
        .filter-dropdown {
          scrollbar-width: thin;
        }
        .filter-dropdown::-webkit-scrollbar {
          width: 8px;
        }
        .filter-dropdown::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .filter-dropdown::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .filter-dropdown::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>

      <Toaster position="top-center" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidates Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All Candidates ({candidates.length})
            {selectedStatuses.length > 0 ||
            selectedWorkStatuses.length > 0 ||
            selectedBatches.length > 0 ? (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                - Filtered ({filteredCandidates.length} shown)
              </span>
            ) : (
              " - Sorted by latest first"
            )}
          </p>
        </div>
        <Button
          onClick={handleOpenNewCandidateForm}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Candidate
        </Button>
      </div>

      {/* Search */}
      <div key="search-container" className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Candidates
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            key="search-input"
            id="search"
            type="text"
            ref={searchInputRef}
            placeholder="Search by ID, name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filteredCandidates.length} candidates found
          </p>
        )}
      </div>

      {/* AG Grid Table */}
      <div className="flex w-full justify-center">
        <AGGridTable
          key={`${filteredCandidates.length}-${selectedStatuses.join(
            ","
          )}-${selectedWorkStatuses.join(",")}-${selectedBatches
            .map((b) => b.batchid)
            .join(",")}`}
          rowData={loading ? undefined : filteredCandidates}
          columnDefs={columnDefs}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          showFilters={true}
          showSearch={false}
          batches={allBatches}
          loading={loading}
          height="600px"
          overlayNoRowsTemplate={
            loading
              ? ""
              : '<span class="ag-overlay-no-rows-center">No candidates found</span>'
          }
        />
      </div>

      {/* + Add New candidate */}
      {newCandidateForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseNewCandidateForm();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-gradient-to-b from-white to-gray-50 p-6 shadow-xl dark:from-gray-300 dark:to-gray-300">
            <h2 className="mb-4 text-center text-2xl font-bold text-indigo-400 dark:text-indigo-400">
              New Candidate Form
            </h2>

            <form onSubmit={handleNewCandidateFormSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {/* Row 1 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleNewCandidateFormChange}
                    required
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleNewCandidateFormChange}
                    required
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                {/* Row 2 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Phone *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleNewCandidateFormChange}
                    required
                    placeholder="+1 (123) 456-7890"
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Status
                  </Label>

                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-semibold shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                    style={getStatusColor(formData.status)} // Apply dynamic color to the select box
                  >
                    {statusOptions.map((status) => (
                      <option
                        key={status}
                        value={status}
                        style={getStatusColor(status)} // Apply color to each option
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 3 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="workstatus"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Work Status
                  </Label>
                  <select
                    id="workstatus"
                    name="workstatus"
                    value={formData.workstatus}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-semibold shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                    style={getWorkStatusColor(formData.workstatus)}
                  >
                    {workStatusOptions.map((status) => (
                      <option
                        key={status}
                        value={status}
                        style={getWorkStatusColor(status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="education"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Education
                  </Label>
                  <Input
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                {/* Row 4 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="workexperience"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Work Experience
                  </Label>
                  <Input
                    id="workexperience"
                    name="workexperience"
                    value={formData.workexperience}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="agreement"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Agreement
                  </Label>
                  <select
                    id="agreement"
                    name="agreement"
                    value={formData.agreement}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  >
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </select>
                </div>

                {/* Row 5 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="ssn"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    SSN
                  </Label>
                  <Input
                    id="ssn"
                    name="ssn"
                    type="password"
                    value={formData.ssn}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="secondaryemail"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Secondary Email
                  </Label>
                  <Input
                    id="secondaryemail"
                    name="secondaryemail"
                    type="email"
                    value={formData.secondaryemail}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                {/* Row 6 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="secondaryphone"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Secondary Phone
                  </Label>
                  <Input
                    id="secondaryphone"
                    name="secondaryphone"
                    type="tel"
                    value={formData.secondaryphone}
                    onChange={handleNewCandidateFormChange}
                    placeholder="+1 (123) 456-7890"
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="linkedin_id"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    LinkedIn ID
                  </Label>
                  <Input
                    id="linkedin_id"
                    name="linkedin_id"
                    value={formData.linkedin_id}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                {/* Row 7 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="dob"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Date of Birth *
                  </Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleNewCandidateFormChange}
                    required
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="emergcontactname"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Emergency Contact Name
                  </Label>
                  <Input
                    id="emergcontactname"
                    name="emergcontactname"
                    value={formData.emergcontactname}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                {/* Row 8 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="emergcontactemail"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Emergency Contact Email
                  </Label>
                  <Input
                    id="emergcontactemail"
                    name="emergcontactemail"
                    type="email"
                    value={formData.emergcontactemail}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="emergcontactphone"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Emergency Contact Phone
                  </Label>
                  <Input
                    id="emergcontactphone"
                    name="emergcontactphone"
                    type="tel"
                    value={formData.emergcontactphone}
                    onChange={handleNewCandidateFormChange}
                    placeholder="+1 (123) 456-7890"
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                {/* Row 9 - Full width */}
                <div className="space-y-1 md:col-span-2">
                  <Label
                    htmlFor="emergcontactaddrs"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Emergency Contact Address
                  </Label>
                  <Input
                    id="emergcontactaddrs"
                    name="emergcontactaddrs"
                    value={formData.emergcontactaddrs}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                {/* Row 10 */}
                <div className="space-y-1">
                  <Label
                    htmlFor="fee_paid"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Fee Paid ($)
                  </Label>
                  <Input
                    id="fee_paid"
                    name="fee_paid"
                    type="number"
                    value={formData.fee_paid}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="batchid"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Batch *
                  </Label>
                  <select
                    id="batchid"
                    name="batchid"
                    value={formData.batchid}
                    onChange={handleNewCandidateFormChange}
                    required
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    disabled={batchesLoading}
                  >
                    {batchesLoading ? (
                      <option value="0">Loading batches...</option>
                    ) : (
                      <>
                        {mlBatches.map((batch) => (
                          <option key={batch.batchid} value={batch.batchid}>
                            {batch.batchname}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* Row 11 - Full width */}
                <div className="space-y-1 md:col-span-2">
                  <Label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Notes
                  </Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleNewCandidateFormChange}
                    className="min-h-[100px] w-full resize-none rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label
                    htmlFor="candidate_folder"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Candidate Folder
                  </Label>
                  <Input
                    id="candidate_folder"
                    name="candidate_folder"
                    value={formData.candidate_folder}
                    onChange={handleNewCandidateFormChange}
                    placeholder="Google Drive/Dropbox link"
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="enrolled_date"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Enrolled Date
                  </Label>
                  <Input
                    id="enrolled_date"
                    name="enrolled_date"
                    type="date"
                    value={formData.enrolled_date}
                    onChange={handleNewCandidateFormChange}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 md:col-span-5">
                <button
                  type="submit"
                  disabled={formSaveLoading}
                  className={`w-full rounded-lg py-3 text-sm font-semibold text-white shadow-md transition duration-200 ${
                    formSaveLoading
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  }`}
                >
                  {formSaveLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>

            <button
              onClick={handleCloseNewCandidateForm}
              className="absolute right-4 top-4 text-3xl font-bold text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
