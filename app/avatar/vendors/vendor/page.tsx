"use client";
import React, { useEffect, useState, useRef } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import { createPortal } from "react-dom";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), { ssr: false });

const BadgeRenderer = (params: any, map: Record<string, string>) => {
  const value = params?.value?.toString() || "None";
  const cls = map[value.toLowerCase()] || "bg-gray-100 text-gray-800";
  return <Badge className={cls}>{value.toUpperCase()}</Badge>;
};

const TypeRenderer = (params: any) => {
  const map = {
    client: "bg-green-100 text-green-800",
    "implementation-partner": "bg-blue-100 text-blue-800",
    "third-party-vendor": "bg-yellow-500 text-yellow-800",
    sourcer: "bg-purple-100 text-purple-800",
    "contact-from-ip": "bg-pink-100 text-pink-800",
  };
  return BadgeRenderer(params, map);
};

const StatusRenderer = (params: any) => {
  const map = {
    active: "bg-green-100 text-green-800",
    working: "bg-blue-100 text-blue-800",
    not_useful: "bg-red-100 text-red-800",
    do_not_contact: "bg-gray-500 text-gray-800",
    inactive: "bg-gray-200 text-gray-600",
    prospect: "bg-yellow-200 text-yellow-800",
  };
  return BadgeRenderer(params, map);
};

const YesNoRenderer = (params: any) => {
  const map = {
    YES: "bg-indigo-100 text-indigo-800",
    NO: "bg-gray-100 text-gray-800",
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

const DateFormatter = (params: any) => (params.value ? new Date(params.value).toLocaleDateString() : "");
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
            {selectedStatuses.length} {/* <-- THIS UPDATES DYNAMICALLY */}
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
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const token = localStorage.getItem("token");

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/vendors`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendors(res.data);
      setFilteredVendors(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  
  useEffect(() => {
    let filtered = vendors;
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((v) => selectedStatuses.includes(v.status?.toLowerCase()));
    }
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((v) => selectedTypes.includes(v.type?.toLowerCase()));
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (v) =>
          v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredVendors(filtered);
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
      cellEditorParams: { options: ["client","third-party-vendor","implementation-partner","sourcer","contact-from-ip"] },
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
      cellEditorParams: { options: ["active","working","not_useful","do_not_contact","inactive","prospect"] },
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
    { field: "created_at", headerName: "Created At", width: 180, valueFormatter: DateFormatter, editable: false },
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
    { field: "linkedin_internal_id", headerName: "LinkedIn Internal ID", width: 200, editable: true },
  ], [selectedStatuses, selectedTypes]); 

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
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/vendors/${updatedRow.id}`, payload);
      setFilteredVendors((prev) => prev.map((row) => (row.id === updatedRow.id ? payload : row)));
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/vendors/${id}`);
      setFilteredVendors((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendors</h1>
        {/* <p>Browse, search, and manage vendors.</p> */}
      </div>
      <div className="max-w-md">
        {/* <Label htmlFor="search">Search Vendors</Label> */}
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/3 h-4 w-4 text-gray-400" />
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

      <AGGridTable
        key={`${filteredVendors.length}-${selectedStatuses.join(',')}-${selectedTypes.join(',')}}`} // <-- force re-render when filters change
        rowData={filteredVendors}
        columnDefs={columnDefs}
        title={`All Vendors (${filteredVendors.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}

