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
import { AgGridReact } from "ag-grid-react";
import type { AgGridReact as AgGridReactType } from "ag-grid-react";
import type { GridApi } from "ag-grid-community";

type Lead = {
  id: number;
  full_name?: string | null;
  email: string;
  phone?: string | null;
  workstatus?: string | null;
  status?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  entry_date?: string | Date | null;
  closed_date?: string | Date | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  moved_to_candidate?: boolean;
  notes?: string | null;
  massemail_unsubscribe?: boolean;
  massemail_email_sent?: boolean;
};

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  workstatus: string;
  address: string;
  secondary_email: string | null;
  secondary_phone: string | null;
  status: string;
  moved_to_candidate: boolean;
  notes: string;
  entry_date?: string;
  massemail_unsubscribe: boolean;
  massemail_email_sent: boolean;
};

const initialFormData: FormData = {
  full_name: "",
  email: "",
  phone: "",
  workstatus: "Waiting for Status",
  address: "",
  status: "Open",
  moved_to_candidate: false,
  notes: "",
  massemail_unsubscribe: false,
  massemail_email_sent: false,
  secondary_email: "",
  secondary_phone: "",
};

const statusOptions = ["Open", "Closed", "Future"];
const workStatusOptions = [
  "Waiting for Status",
  "H1B",
  "H4 EAD",
  "Permanent Resident",
  "Citizen",
  "OPT",
  "CPT",
];

const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    future:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
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
    "waiting for status":
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    h1b: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "h4 ead":
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    "permanent resident":
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    citizen:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    opt: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    cpt: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
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

const StatusFilterHeaderComponent = (props: any) => {
  const { selectedStatuses, setSelectedStatuses } = props;
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
    {
      top: 0,
      left: 0,
    }
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

  const handleStatusChange = (
    status: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    setSelectedStatuses((prev: string[]) => {
      const isSelected = prev.includes(status);
      if (isSelected) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedStatuses([...statusOptions]);
    } else {
      setSelectedStatuses([]);
    }
  };

  const isAllSelected = selectedStatuses.length === statusOptions.length;
  const isIndeterminate =
    selectedStatuses.length > 0 &&
    selectedStatuses.length < statusOptions.length;

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
    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">Status</span>
      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedStatuses.length > 0 && (
          <span className="min-w-[20px] rounded-full bg-blue-500 px-2 py-0.5 text-center text-xs text-white">
            {selectedStatuses.length}
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
            className="pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 shadow-xl dark:border-gray-600 dark:bg-gray-800"
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
              <label className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="mr-3"
                  onClick={(e) => e.stopPropagation()}
                />
                Select All
              </label>
            </div>
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  onChange={(e) => handleStatusChange(status, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3"
                />
                <StatusRenderer value={status} />
              </label>
            ))}
            {selectedStatuses.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatuses([]);
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

const WorkStatusFilterHeaderComponent = (props: any) => {
  const { selectedWorkStatuses, setSelectedWorkStatuses } = props;
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
    {
      top: 0,
      left: 0,
    }
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

  const handleWorkStatusChange = (
    workStatus: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    setSelectedWorkStatuses((prev: string[]) => {
      if (prev.includes(workStatus)) {
        return prev.filter((s) => s !== workStatus);
      } else {
        return [...prev, workStatus];
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedWorkStatuses([...workStatusOptions]);
    } else {
      setSelectedWorkStatuses([]);
    }
  };

  const isAllSelected =
    selectedWorkStatuses.length === workStatusOptions.length;
  const isIndeterminate =
    selectedWorkStatuses.length > 0 &&
    selectedWorkStatuses.length < workStatusOptions.length;

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
    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">Work Status</span>
      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedWorkStatuses.length > 0 && (
          <span className="min-w-[20px] rounded-full bg-green-500 px-2 py-0.5 text-center text-xs text-white">
            {selectedWorkStatuses.length}
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
            className="pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
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
              <label className="flex cursor-pointer items-center rounded px-2 py-1 font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
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
            {workStatusOptions.map((workStatus) => (
              <label
                key={workStatus}
                className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedWorkStatuses.includes(workStatus)}
                  onChange={(e) => handleWorkStatusChange(workStatus, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3"
                />
                <WorkStatusRenderer value={workStatus} />
              </label>
            ))}
            {selectedWorkStatuses.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkStatuses([]);
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

export default function LeadsPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewLead = searchParams.get("newlead") === "true";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState("full_name");
  const [sortModel, setSortModel] = useState([
    { colId: "entry_date", sort: "desc" as "desc" },
  ]);
  const [newLeadForm, setNewLeadForm] = useState(isNewLead);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedWorkStatuses, setSelectedWorkStatuses] = useState<string[]>(
    []
  );
  const gridRef = useRef<InstanceType<typeof AgGridReact> | null>(null);
  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/leads`,
    []
  );

  // Helper functions for form dropdown colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return { backgroundColor: "#DBEAFE", color: "#1E40AF" };
      case "closed":
        return { backgroundColor: "#D1FAE5", color: "#065F46" };
      case "future":
        return { backgroundColor: "#EDE9FE", color: "#7C3AED" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#374151" };
    }
  };

  const getWorkStatusColor = (workstatus: string) => {
    switch (workstatus.toLowerCase()) {
      case "waiting for status":
        return { backgroundColor: "#FFEDD5", color: "#9A3412" };
      case "h1b":
        return { backgroundColor: "#DBEAFE", color: "#1E40AF" };
      case "h4 ead":
        return { backgroundColor: "#FCE7F3", color: "#BE185D" };
      case "permanent resident":
        return { backgroundColor: "#D1FAE5", color: "#065F46" };
      case "citizen":
        return { backgroundColor: "#E0E7FF", color: "#4338CA" };
      case "opt":
        return { backgroundColor: "#FEF3C7", color: "#92400E" };
      case "cpt":
        return { backgroundColor: "#FEF3C7", color: "#B45309" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#374151" };
    }
  };

  const fetchLeads = useCallback(
    async (
      search?: string,
      searchBy: string = "all",
      sort: any[] = [{ colId: "entry_date", sort: "desc" }]
    ) => {
      setLoading(true);
      try {
        let url = `${apiEndpoint}`;
        const params = new URLSearchParams();
        if (search && search.trim()) {
          params.append("search", search.trim());
          params.append("search_by", searchBy);
        }
        const sortToApply =
          sort && sort.length > 0
            ? sort
            : [{ colId: "entry_date", sort: "desc" }];
        const sortParam = sortToApply
          .map((s) => `${s.colId}:${s.sort}`)
          .join(",");
        params.append("sort", sortParam);
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        let leadsData = [];
        if (data.data && Array.isArray(data.data)) {
          leadsData = data.data;
        } else if (Array.isArray(data)) {
          leadsData = data;
        } else {
          throw new Error("Invalid response format");
        }
        setLeads(leadsData);
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Failed to load leads";
        setError(error);
        toast.error(error);
      } finally {
        setLoading(false);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    },
    [apiEndpoint]
  );

  useEffect(() => {
    let filtered = [...leads];
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((lead) =>
        selectedStatuses.some(
          (status) => status.toLowerCase() === (lead.status || "").toLowerCase()
        )
      );
    }
    if (selectedWorkStatuses.length > 0) {
      filtered = filtered.filter((lead) =>
        selectedWorkStatuses.some(
          (ws) => ws.toLowerCase() === (lead.workstatus || "").toLowerCase()
        )
      );
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.full_name?.toLowerCase().includes(term) ||
          lead.email?.toLowerCase().includes(term) ||
          lead.phone?.toLowerCase().includes(term) ||
          lead.id.toString().includes(term)
      );
    }
    setFilteredLeads(filtered);
    setTotalLeads(filtered.length);
  }, [leads, selectedStatuses, selectedWorkStatuses, searchTerm]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        const detectedSearchBy = detectSearchBy(searchTerm);
        fetchLeads(searchTerm, detectedSearchBy, sortModel);
      } else {
        fetchLeads("", searchBy, sortModel);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchBy, sortModel, fetchLeads]);

  const detectSearchBy = (search: string) => {
    if (/^\d+$/.test(search)) return "id";
    if (/^\S+@\S+\.\S+$/.test(search)) return "email";
    if (/^[\d\s\+\-()]+$/.test(search)) return "phone";
    return "full_name";
  };

  const handleNewLeadFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "phone" || name === "secondary_phone") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === "address") {
      const sanitizedValue = value.replace(/[^a-zA-Z0-9, ]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    } else if (name === "full_name") {
      const sanitizedValue = value.replace(/[^a-zA-Z. ]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNewLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaveLoading(true);
    try {
      const updatedData = { ...formData };
      if (!updatedData.status || updatedData.status === "") {
        updatedData.status = "waiting for status";
      }
      if (!updatedData.workstatus || updatedData.workstatus === "") {
        updatedData.workstatus = "Waiting for Status";
      }
      if (updatedData.moved_to_candidate) {
        updatedData.status = "Closed";
      }
      if (!updatedData.status || updatedData.status === "") {
        updatedData.status = updatedData.moved_to_candidate ? "Closed" : "Open";
      }
      if (!updatedData.workstatus || updatedData.workstatus === "") {
        updatedData.workstatus = "Waiting for Status";
      }
      const booleanFields = [
        "moved_to_candidate",
        "massemail_email_sent",
        "massemail_unsubscribe",
      ];
      booleanFields.forEach((field) => {
        if (
          updatedData[field] === undefined ||
          updatedData[field] === null ||
          updatedData[field] === ""
        ) {
          updatedData[field] = false;
        }
      });
      const payload = {
        ...updatedData,
        entry_date: new Date().toISOString(),
        closed_date:
          updatedData.status === "Closed"
            ? new Date().toISOString().split("T")[0]
            : null,
      };
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create lead");
      toast.success("Lead created successfully!");
      setNewLeadForm(false);
      setFormData(initialFormData);
      fetchLeads(searchTerm, searchBy, sortModel);
    } catch (error) {
      toast.error("Failed to create lead");
      console.error("Error creating lead:", error);
    } finally {
      setFormSaveLoading(false);
    }
  };

  const handleOpenNewLeadForm = () => {
    router.push("/avatar/leads?newlead=true");
    setNewLeadForm(true);
  };

  const handleCloseNewLeadForm = () => {
    router.push("/avatar/leads");
    setNewLeadForm(false);
    setFormData(initialFormData);
  };

  const handleRowUpdated = useCallback(
    async (updatedRow: Lead) => {
      setLoadingRowId(updatedRow.id);
      try {
        const { id, entry_date, ...payload } = updatedRow;
        if (payload.moved_to_candidate && payload.status !== "Closed") {
          payload.status = "Closed";
          payload.closed_date = new Date().toISOString().split("T")[0];
        } else if (!payload.moved_to_candidate && payload.status === "Closed") {
          payload.status = "Open";
          payload.closed_date = null;
        }
        payload.moved_to_candidate = Boolean(payload.moved_to_candidate);
        payload.massemail_unsubscribe = Boolean(payload.massemail_unsubscribe);
        payload.massemail_email_sent = Boolean(payload.massemail_email_sent);
        const response = await fetch(`${apiEndpoint}/${updatedRow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update lead");
        }
        const updatedLead = { ...updatedRow, ...payload };
        if (gridRef.current) {
          gridRef.current.api.applyTransaction({ update: [updatedLead] });
        }
        toast.success(
          payload.moved_to_candidate
            ? "Lead moved to candidate and marked Closed"
            : "Lead updated successfully"
        );
      } catch (error) {
        toast.error("Failed to update lead");
        console.error("Error updating lead:", error);
      } finally {
        setLoadingRowId(null);
      }
    },
    [apiEndpoint]
  );

  const handleRowDeleted = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete candidate");
        const rowNode = gridRef.current?.api.getRowNode(id.toString());
        if (rowNode) rowNode.setData(null);
        gridRef.current?.api.applyTransaction({ remove: [rowNode.data] });
        toast.success("Candidate deleted successfully");
      } catch (error) {
        toast.error("Failed to delete candidate");
        console.error(error);
      }
    },
    [apiEndpoint]
  );

  const handleMoveToCandidate = useCallback(
    async (lead: Lead, Moved: boolean) => {
      setLoadingRowId(lead.id);
      try {
        const method = Moved ? "DELETE" : "POST";
        const url = `${apiEndpoint}/${lead.id}/move-to-candidate`;
        const payload: Partial<Lead> = {
          moved_to_candidate: !Moved,
          status: !Moved ? "Closed" : "Open",
          closed_date: !Moved ? new Date().toISOString().split("T")[0] : null,
        };
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || "Failed to move lead to candidate"
          );
        }
        const data = await response.json();
        fetchLeads(searchTerm, searchBy, sortModel);
        if (Moved) {
          toast.success(
            `Lead removed from candidate list (Candidate ID: ${data.candidate_id})`
          );
        } else {
          toast.success(
            `Lead moved to candidate (Candidate ID: ${data.candidate_id}) and status set to Closed`
          );
        }
      } catch (error: any) {
        console.error("Error moving lead to candidate:", error);
        toast.error(error.message || "Failed to move lead to candidate");
      } finally {
        setLoadingRowId(null);
      }
    },
    [apiEndpoint, searchTerm, searchBy, sortModel, fetchLeads]
  );

  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
    return `+1 ${phoneNumberString}`;
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseNewLeadForm();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

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
      {
        field: "email",
        headerName: "Email",
        width: 200,
        editable: true,
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={`mailto:${params.value}`}
              className="text-blue-600 underline hover:text-blue-800"
              onClick={(event) => event.stopPropagation()}
            >
              {params.value}
            </a>
          );
        },
      },
      {
        field: "entry_date",
        headerName: "Entry Date",
        width: 180,
        sortable: true,
        valueFormatter: ({ value }: ValueFormatterParams) =>
          value
            ? new Date(value).toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : "-",
      },
      {
        field: "workstatus",
        headerName: "Work Status",
        width: 200,
        sortable: true,
        cellRenderer: WorkStatusRenderer,
        headerComponent: WorkStatusFilterHeaderComponent,
        headerComponentParams: {
          selectedWorkStatuses,
          setSelectedWorkStatuses,
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        sortable: true,
        cellRenderer: StatusRenderer,
        headerComponent: StatusFilterHeaderComponent,
        headerComponentParams: { selectedStatuses, setSelectedStatuses },
      },
      {
        field: "secondary_email",
        headerName: "Secondary Email",
        width: 220,
        sortable: true,
      },
      {
        field: "secondary_phone",
        headerName: "Secondary Phone",
        width: 150,
        sortable: true,
      },
      {
        field: "address",
        headerName: "Address",
        width: 250,
        sortable: true,
      },
      {
        field: "closed_date",
        headerName: "Closed Date",
        width: 150,
        sortable: true,
        valueFormatter: ({ value }: ValueFormatterParams) =>
          value
            ? new Date(value).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
              })
            : "-",
      },
      {
        field: "notes",
        headerName: "Notes",
        width: 300,
        sortable: true,
        valueFormatter: ({ value }: ValueFormatterParams) => value || "-",
      },
      {
        field: "massemail_unsubscribe",
        headerName: "Mass Email Unsubscribe",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.massemail_unsubscribe !== undefined
            ? params.data.massemail_unsubscribe
            : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
      {
        field: "massemail_email_sent",
        headerName: "Mass Email Sent",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.massemail_email_sent !== undefined
            ? params.data.massemail_email_sent
            : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
      {
        field: "moved_to_candidate",
        headerName: "Moved to Candidate",
        width: 180,
        editable: true,
        sortable: true,
        valueGetter: (params) =>
          params.data.moved_to_candidate !== undefined
            ? params.data.moved_to_candidate
            : false,
        valueFormatter: ({ value }) => (value ? "True" : "False"),
      },
    ],
    [selectedStatuses, selectedWorkStatuses]
  );

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
        <Button
          variant="outline"
          onClick={() => fetchLeads(searchTerm, searchBy, sortModel)}
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
      <Toaster position="top-center" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Title and description */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leads Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All Leads ({totalLeads})
            {selectedStatuses.length > 0 || selectedWorkStatuses.length > 0 ? (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                - Filtered ({filteredLeads.length} shown)
              </span>
            ) : (
              " - Sorted by latest first"
            )}
          </p>

          {/* Search input */}
          <div className="mt-2 sm:mt-0 sm:max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                ref={searchInputRef}
                placeholder="Search by ID, name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 text-sm sm:text-base"
              />
            </div>
            {searchTerm && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {leads.length} candidates found
              </p>
            )}
          </div>
        </div>

        {/* Right side: Button */}
        <div className="mt-2 flex flex-row items-center gap-2 sm:mt-0">
          <Button
            onClick={handleOpenNewLeadForm}
            className="whitespace-nowrap bg-green-600 text-white hover:bg-green-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Lead
          </Button>
        </div>
      </div>

      <div className="flex w-full justify-center">
        <AGGridTable
          key={`${filteredLeads.length}-${selectedStatuses.join(
            ","
          )}-${selectedWorkStatuses.join(",")}`}
          rowData={filteredLeads}
          columnDefs={columnDefs}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          loading={loading}
          showFilters={true}
          showSearch={false}
          height="600px"
        />
      </div>

      {newLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative min-h-[40vh] w-full max-w-xl rounded-lg bg-white p-4 shadow-md">
            <h2 className="mb-4 text-center text-xl font-semibold">
              New Lead Form
            </h2>
            <form className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries({
                full_name: {
                  label: "Full Name *",
                  type: "text",
                  required: true,
                },
                email: { label: "Email *", type: "email", required: true },
                phone: { label: "Phone *", type: "tel", required: true },
                secondary_email: { label: "Secondary Email", type: "email" },
                secondary_phone: { label: "Secondary Phone", type: "tel" },
                workstatus: {
                  label: "Work Status",
                  type: "select",
                  options: workStatusOptions,
                  required: true,
                },
                address: { label: "Address", type: "text" },
                status: {
                  label: "Status",
                  type: "select",
                  options: statusOptions,
                  required: true,
                },
                notes: { label: "Notes (optional)", type: "textarea" },
                moved_to_candidate: {
                  label: "Moved to Candidate",
                  type: "checkbox",
                },
                massemail_unsubscribe: {
                  label: "Mass Email Unsubscribe",
                  type: "checkbox",
                },
                massemail_email_sent: {
                  label: "Mass Email Sent",
                  type: "checkbox",
                },
              }).map(([name, config]) => (
                <div
                  key={name}
                  className={config.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <label
                    htmlFor={name}
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {config.label}
                  </label>
                  {config.type === "select" ? (
                    <select
                      id={name}
                      name={name}
                      value={
                        (formData[name as keyof FormData] as string) ||
                        "Waiting for Status"
                      }
                      onChange={handleNewLeadFormChange}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      style={
                        name === "status"
                          ? getStatusColor(formData.status)
                          : name === "workstatus"
                          ? getWorkStatusColor(formData.workstatus)
                          : {}
                      }
                      required={config.required}
                    >
                      {config.options?.map((option) => (
                        <option
                          key={option}
                          value={option}
                          style={
                            name === "status"
                              ? getStatusColor(option)
                              : name === "workstatus"
                              ? getWorkStatusColor(option)
                              : {}
                          }
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : config.type === "textarea" ? (
                    <textarea
                      id={name}
                      name={name}
                      value={formData[name as keyof FormData] as string}
                      onChange={handleNewLeadFormChange}
                      rows={3}
                      className="w-full rounded-sm border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                  ) : config.type === "checkbox" ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={formData[name as keyof FormData] as boolean}
                        onChange={handleNewLeadFormChange}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={name}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        {config.label}
                      </label>
                    </div>
                  ) : (
                    <input
                      type={config.type}
                      id={name}
                      name={name}
                      value={formData[name as keyof FormData] as string}
                      onChange={handleNewLeadFormChange}
                      className="w-full rounded-sm border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      required={config.required}
                    />
                  )}
                </div>
              ))}
              <div className="md:col-span-2">
                <label
                  htmlFor="entry_date"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Entry Date
                </label>
                <input
                  type="date"
                  id="entry_date"
                  name="entry_date"
                  value={
                    formData.entry_date ||
                    new Date().toISOString().split("T")[0]
                  }
                  onChange={handleNewLeadFormChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={formSaveLoading}
                  onClick={handleNewLeadFormSubmit}
                  className={`w-full rounded-md py-2 transition duration-200 ${
                    formSaveLoading
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {formSaveLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
            <button
              onClick={handleCloseNewLeadForm}
              className="absolute right-3 top-3 text-2xl leading-none text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
