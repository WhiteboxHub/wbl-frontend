"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api.js";
import { toast, Toaster } from "sonner";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), { ssr: false });

const BadgeRenderer = (params: any, map: Record<string, string>) => {
  const value = params?.value?.toString() || "None";
  const cls = map[value.toLowerCase()] || "bg-gray-100 text-gray-800";
  return <Badge className={cls}>{value.toUpperCase()}</Badge>;
};

const TypeRenderer = (params: any) => {
  const map = {
    client: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "implementation-partner": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "third-party-vendor": "bg-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    sourcer: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "contact-from-ip": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  };
  return BadgeRenderer(params, map);
};

const StatusRenderer = (params: any) => {
  const map = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    working: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    not_useful: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    do_not_contact: "bg-gray-500 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    inactive: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    prospect: "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  };
  return BadgeRenderer(params, map);
};

const YesNoRenderer = (params: any) => {
  const map = {
    YES: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    NO: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
  };
  const key = params?.value?.toString().toUpperCase();
  return BadgeRenderer({ value: key }, map);
};

const SelectEditor = (props: any) => {
  const { value, options } = props;
  const [current, setCurrent] = useState(value);
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => setCurrent(e.target.value);
  useEffect(() => {
    props.api.addEventListener("cellEditingStopped", () => {
      props.api.stopEditing();
    });
  }, []);
  return (
    <select
      value={current}
      onChange={handleChange}
      autoFocus
      style={{ padding: "4px", borderRadius: "6px" }}
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt.toUpperCase()}
        </option>
      ))}
    </select>
  );
};

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const date = new Date(params.value);
  if (isNaN(date.getTime())) return params.value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const DateTimeFormatter = (params: any) => {
  if (!params.value) return "";
  const date = new Date(params.value);
  if (isNaN(date.getTime())) return params.value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
const PhoneRenderer = (params: any) =>
  params.value ? <a href={`tel:${params.value}`} className="text-blue-600 hover:underline">{params.value}</a> : "";
const EmailRenderer = (params: any) =>
  params.value ? <a href={`mailto:${params.value}`} className="text-blue-600 hover:underline">{params.value}</a> : "";

const StatusFilterHeaderComponent = (props: any) => {
  const { selectedStatuses, setSelectedStatuses } = props;
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

  const handleStatusChange = (status: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSelectedStatuses(["active", "working", "not_useful", "do_not_contact", "inactive", "prospect"]);
    } else {
      setSelectedStatuses([]);
    }
  };

  const isAllSelected = selectedStatuses.length === 6;
  const isIndeterminate = selectedStatuses.length > 0 && selectedStatuses.length < 6;

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
    <div className="relative flex items-center w-full">
      <span className="mr-2 flex-grow">Status</span>
      <div
        ref={filterButtonRef}
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
        onClick={toggleFilter}
      >
        {selectedStatuses.length > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
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
            className="fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600 text-sm"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b pb-2 mb-2">
              <label className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded font-medium text-sm">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={handleSelectAll}
                  className="mr-3"
                  onClick={(e) => e.stopPropagation()}
                />
                Select All
              </label>
            </div>
            {["active", "working", "not_useful", "do_not_contact", "inactive", "prospect"].map((status) => (
              <label
                key={status}
                className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
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
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatuses([]);
                  }}
                  className="w-full text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 py-1"
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

// ---------- Type Filter Header Component ----------
const TypeFilterHeaderComponent = (props: any) => {
  const { selectedTypes, setSelectedTypes } = props;
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

  const handleTypeChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedTypes((prev: string[]) => {
      const isSelected = prev.includes(type);
      if (isSelected) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedTypes(["client", "implementation-partner", "third-party-vendor", "sourcer", "contact-from-ip"]);
    } else {
      setSelectedTypes([]);
    }
  };

  const isAllSelected = selectedTypes.length === 5;
  const isIndeterminate = selectedTypes.length > 0 && selectedTypes.length < 5;

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
    <div className="relative flex items-center w-full">
      <span className="mr-2 flex-grow">Type</span>

      <div
        ref={filterButtonRef}
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded text-sm"
        onClick={toggleFilter}
      >
        {selectedTypes.length > 0 && (
          <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {selectedTypes.length}
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
            className="fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600 text-sm"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b pb-2 mb-2">
              <label className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded font-medium">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={handleSelectAll}
                  className="mr-3"
                  onClick={(e) => e.stopPropagation()}
                />
                Select All
              </label>
            </div>
            {["client", "implementation-partner", "third-party-vendor", "sourcer", "contact-from-ip"].map((type) => (
              <label
                key={type}
                className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={(e) => handleTypeChange(type, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3"
                />
                <TypeRenderer value={type} />
              </label>
            ))}
            {selectedTypes.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTypes([]);
                  }}
                  className="w-full text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 py-1"
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

export default function VendorPage() {
  const gridRef = useRef<any>(null);
  const selectedRowsRef = useRef<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/vendors");
      const arr = Array.isArray(data) ? data : data?.data || [];
      console.log("[fetchVendors] Successfully loaded", arr.length, "vendors");
      setVendors(arr);
    } catch (e: any) {
      console.error("[fetchVendors] Error:", e);
      toast.error(e?.message || e?.body || "Failed to load vendors");
      setError(e?.message || e?.body || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Stable filtered data with useMemo (no state updates to prevent re-renders)
  const filteredVendors = useMemo(() => {
    let filtered = vendors;
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((v) => selectedStatuses.includes(v.status?.toLowerCase()));
    }
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((v) => selectedTypes.includes(v.type?.toLowerCase()));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.full_name?.toLowerCase().includes(term) ||
          v.email?.toLowerCase().includes(term) ||
          v.company_name?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [vendors, searchTerm, selectedStatuses, selectedTypes]);

  const columnDefs: ColDef[] = React.useMemo(() => [
    { field: "id", headerName: "ID", width: 80, pinned: "left", editable: false },
    { field: "full_name", headerName: "Full Name", width: 180, editable: true },
    { field: "phone_number", headerName: "Phone", width: 150, editable: true, cellRenderer: PhoneRenderer },
    { field: "secondary_phone", headerName: "Alt Phone", width: 150, editable: true, cellRenderer: PhoneRenderer, hide: true },
    { field: "email", headerName: "Email", width: 200, editable: true, cellRenderer: EmailRenderer },
    { field: "linkedin_id", headerName: "LinkedIn ID", width: 180, editable: true },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      cellRenderer: TypeRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: { options: ["client", "third-party-vendor", "implementation-partner", "sourcer", "contact-from-ip"] },
      headerComponent: TypeFilterHeaderComponent,
      headerComponentParams: {
        selectedTypes,
        setSelectedTypes
      }
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      cellRenderer: StatusRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: { options: ["active", "working", "not_useful", "do_not_contact", "inactive", "prospect"] },
      headerComponent: StatusFilterHeaderComponent,
      headerComponentParams: {
        selectedStatuses,
        setSelectedStatuses
      }
    },
    { field: "company_name", headerName: "Company Name", width: 180, editable: true },
    { field: "city", headerName: "City", width: 140, editable: true },
    { field: "postal_code", headerName: "Postal Code", width: 140, editable: true },
    { field: "address", headerName: "Address", width: 200, editable: true },
    { field: "country", headerName: "Country", width: 150, editable: true },
    { field: "location", headerName: "Location", width: 180, editable: true },
    {
      field: "linkedin_connected",
      headerName: "LinkedIn Connected",
      width: 180,
      cellRenderer: YesNoRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: { options: ["YES", "NO"] },
    },
    {
      field: "intro_email_sent",
      headerName: "Intro Email Sent",
      width: 180,
      cellRenderer: YesNoRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: { options: ["YES", "NO"] },
    },
    {
      field: "intro_call",
      headerName: "Intro Call",
      width: 150,
      cellRenderer: YesNoRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: { options: ["YES", "NO"] },
    },
    { field: "created_at", headerName: "Created At", width: 200, valueFormatter: DateTimeFormatter, filter: "agDateColumnFilter", editable: false },
    { field: "linkedin_internal_id", headerName: "LinkedIn Internal ID", width: 200, editable: true },
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
    { field: "last_modified_datetime", headerName: "Last Modified", width: 200, valueFormatter: DateTimeFormatter, editable: false }, 
  ], []);

  const handleRowUpdated = async (updatedRow: any) => {
    const normalizeYesNo = (val: any) => (!val ? "NO" : val.toString().toUpperCase());
    const payload = {
      ...updatedRow,
      email: updatedRow.email?.trim() === "" ? null : updatedRow.email,
      linkedin_connected: normalizeYesNo(updatedRow.linkedin_connected),
      intro_email_sent: normalizeYesNo(updatedRow.intro_email_sent),
      intro_call: normalizeYesNo(updatedRow.intro_call),
    };
    try {
      await apiFetch(`/vendors/${updatedRow.id}`, { method: "PUT", body: payload });
      console.log("[handleRowUpdated] Successfully updated vendor:", updatedRow.id);
      setVendors((prev) => prev.map((row) => (row.id === updatedRow.id ? payload : row)));
      toast.success("Vendor updated successfully");
    } catch (error: any) {
      console.error("Update failed", error);
      toast.error(error?.message || "Failed to update vendor");
    }
  };

  // Helper: Get only visible selected rows (after AG Grid column filters)
  const getVisibleSelectedRows = useCallback(() => {
    const currentSelectedRows = selectedRowsRef.current;
    if (!currentSelectedRows || currentSelectedRows.length === 0) return [];
    if (!gridRef.current?.api) return currentSelectedRows;

    // Get IDs of visible rows after AG Grid filters
    const visibleRowIds = new Set();
    gridRef.current.api.forEachNodeAfterFilter((node: any) => {
      if (node.data?.id) visibleRowIds.add(node.data.id);
    });

    // Return only selected rows that are visible
    return currentSelectedRows.filter((row: any) => visibleRowIds.has(row.id));
  }, []);

  const handleRowDeleted = useCallback(async (vendorId: number | string) => {
    // Get only visible selected rows (respects AG Grid column filters)
    const visibleSelectedRows = getVisibleSelectedRows();
    const deleteCount = visibleSelectedRows.length > 1 ? visibleSelectedRows.length : 1;

    // Show confirmation with exact count
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Delete',
      message: `Delete ${deleteCount} vendor${deleteCount > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        if (visibleSelectedRows.length > 1) {
          // Bulk delete - only visible rows
          try {
            const vendorIds = visibleSelectedRows.map((row: any) => row.id);

            const result = await apiFetch(`/vendors/bulk-delete`, {
              method: "POST",
              body: vendorIds,
            });

            console.log("[handleRowDeleted] Successfully deleted", visibleSelectedRows.length, "vendors");
            toast.success(`Deleted ${visibleSelectedRows.length} vendors`);
            setSelectedRows([]);
            fetchVendors();
          } catch (err: any) {
            console.error("Bulk delete error:", err);
            toast.error(err?.message || "Failed to delete vendors");
          }
        } else {
          // Single delete
          try {
            await apiFetch(`/vendors/${vendorId}`, { method: "DELETE" });
            console.log("[handleRowDeleted] Successfully deleted vendor:", vendorId);
            toast.success("Deleted 1 vendor");
            fetchVendors();
          } catch (error: any) {
            console.error("Delete failed", error);
            toast.error(error?.message || "Failed to delete vendor");
          }
        }
      },
    });
  }, [fetchVendors, getVisibleSelectedRows]);

  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Vendors</h1>
      </div>
      <div className="max-w-md">
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="pl-10"
          />
        </div>
        {searchTerm && <p>{filteredVendors.length} found</p>}
      </div>

      <div className="flex w-full justify-center">
        <div className="w-full max-w-7xl">
          {showLoader ? (
            <Loader />
          ) : (
            <AGGridTable
              rowData={filteredVendors}
              columnDefs={columnDefs}
              title={`All Vendors (${filteredVendors.length})`}
              height="calc(70vh)"
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
              skipDeleteConfirmation={true}
              showSearch={false}
              onFilterChanged={() => {
                if (gridRef.current?.api) {
                  gridRef.current.api.deselectAll();
                }
                setSelectedRows([]);
                selectedRowsRef.current = [];
              }}
              onSelectionChanged={(rows: any[]) => {
                selectedRowsRef.current = rows;
                setSelectedRows(rows);
              }}
              onRowAdded={async (newRow: any) => {
                try {
                  const payload = {
                    full_name: newRow.full_name || newRow.name || "",
                    phone_number: newRow.phone_number || newRow.phone || null,
                    secondary_phone: newRow.secondary_phone || null,
                    email: newRow.email || null,
                    linkedin_id: newRow.linkedin_id || newRow.linkedin || null,
                    type: newRow.type || newRow.vendor_type || "client",
                    status: newRow.status || "active",
                    company_name: newRow.company_name || newRow.company || null,
                    city: newRow.city || null,
                    postal_code: newRow.postal_code || null,
                    address: newRow.address || null,
                    country: newRow.country || null,
                    location: newRow.location || null,
                    linkedin_connected: (newRow.linkedin_connected || "NO").toString().toUpperCase(),
                    intro_email_sent: (newRow.intro_email_sent || "NO").toString().toUpperCase(),
                    intro_call: (newRow.intro_call || "NO").toString().toUpperCase(),
                    notes: newRow.notes || null,
                    linkedin_internal_id: newRow.linkedin_internal_id || null,
                  };
                  if (!payload.full_name) { console.warn('Vendor name required'); return; }
                  const res = await apiFetch("/vendors", { method: "POST", body: payload });
                  const created = Array.isArray(res) ? res : (res?.data ?? res);
                  console.log("[onRowAdded] Successfully created vendor:", created);
                  setVendors((prev) => [created, ...prev]);
                  toast.success("Vendor created successfully");
                } catch (e: any) {
                  console.error('Failed to create vendor', e);
                  toast.error(e?.message || "Failed to create vendor");
                }
              }}
            />
          )}

          {/* Confirmation Dialog */}
          {confirmDialog.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-2">{confirmDialog.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{confirmDialog.message}</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <Toaster position="top-center" richColors />
        </div>
      </div>
    </div>
  );
}
