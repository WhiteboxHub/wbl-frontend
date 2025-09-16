"use client";

import React, { useEffect, useState } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic"; 
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";
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

  const key = params?.value?.toString().toLowerCase();
  return BadgeRenderer({ value: key }, map);
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
  const { value, options, colorMap } = props;
  const [current, setCurrent] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrent(e.target.value);
  };

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
        <option key={opt} value={opt} className={colorMap[opt]}>
          {opt.toUpperCase()}
        </option>
      ))}
    </select>
  );
};

const DateFormatter = (params: any) =>
  params.value ? new Date(params.value).toLocaleDateString() : "";

const PhoneRenderer = (params: any) => {
  if (!params.value) return "";
  return (
    <a href={`tel:${params.value}`} className="text-blue-600 hover:underline">
      {params.value}
    </a>
  );
};

const EmailRenderer = (params: any) => {
  if (!params.value) return "";
  return (
    <a
      href={`mailto:${params.value}`}
      className="text-blue-600 hover:underline"
    >
      {params.value}
    </a>
  );
};

export default function VendorPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/vendors`);
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
    if (!searchTerm.trim()) {
      setFilteredVendors(vendors);
      return;
    }
    const filtered = vendors.filter(
      (v) =>
        v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVendors(filtered);
  }, [searchTerm, vendors]);

  const columnDefs: ColDef[] = React.useMemo(() => [
    { field: "id", headerName: "ID", width: 80, editable: false, pinned: "left" },
    { field: "full_name", headerName: "Full Name", width: 180, editable: true },
    { field: "phone_number", headerName: "Phone", width: 150, editable: true, cellRenderer: PhoneRenderer },
    { field: "secondary_phone", headerName: "Alt Phone", width: 150, editable: true, cellRenderer: PhoneRenderer,hide:true ,},
    { field: "email", headerName: "Email", width: 200, editable: true, cellRenderer: EmailRenderer },
    { field: "linkedin_id", headerName: "LinkedIn ID", width: 180, editable: true },

    {
      field: "type",
      headerName: "Type",
      width: 150,
      cellRenderer: TypeRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: {
        options: ["client", "third-party-vendor", "implementation-partner", "sourcer", "contact-from-ip"],
        colorMap: {
          client: "bg-green-100 text-green-800",
          "implementation-partner": "bg-blue-100 text-blue-800",
          "third-party-vendor": "bg-yellow-500 text-yellow-800",
          sourcer: "bg-purple-100 text-purple-800",
          "contact-from-ip": "bg-pink-100 text-pink-800",
        },
      },
    },
    {
      field: "vendor_type",
      headerName: "Vendor Type",
      width: 180,
      cellRenderer: TypeRenderer,
      editable: true,
      hide:true,
      cellEditor: SelectEditor,
      cellEditorParams: {
        options: ["client", "third-party-vendor", "implementation-partner", "sourcer", "contact-from-ip"],
        colorMap: {
          client: "bg-green-100 text-green-800",
          "implementation-partner": "bg-blue-100 text-blue-800",
          "third-party-vendor": "bg-yellow-500 text-yellow-800",
          sourcer: "bg-purple-100 text-purple-800",
          "contact-from-ip": "bg-pink-100 text-pink-800",
        },
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      cellRenderer: StatusRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: {
        options: ["active", "working", "not_useful", "do_not_contact", "inactive", "prospect"],
        colorMap: {
          active: "bg-green-100 text-green-800",
          working: "bg-blue-100 text-blue-800",
          not_useful: "bg-red-100 text-red-800",
          do_not_contact: "bg-gray-500 text-gray-800",
          inactive: "bg-gray-200 text-gray-600",
          prospect: "bg-yellow-200 text-yellow-800",
        },
      },
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
      cellEditorParams: {
        options: ["YES", "NO"],
        colorMap: { YES: "bg-indigo-100 text-indigo-800", NO: "bg-gray-100 text-gray-800" },
      },
    },
    {
      field: "intro_email_sent",
      headerName: "Intro Email Sent",
      width: 180,
      cellRenderer: YesNoRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: {
        options: ["YES", "NO"],
        colorMap: { YES: "bg-indigo-100 text-indigo-800", NO: "bg-gray-100 text-gray-800" },
      },
    },
    {
      field: "intro_call",
      headerName: "Intro Call",
      width: 150,
      cellRenderer: YesNoRenderer,
      editable: true,
      cellEditor: SelectEditor,
      cellEditorParams: {
        options: ["YES", "NO"],
        colorMap: { YES: "bg-indigo-100 text-indigo-800", NO: "bg-gray-100 text-gray-800" },
      },
    },

    { field: "created_at", headerName: "Created At", width: 180, valueFormatter: DateFormatter, editable: false },
    { field: "notes", headerName: "Notes", width: 200, editable: true },
    { field: "linkedin_internal_id", headerName: "LinkedIn Internal ID", width: 200, editable: true },
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
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/vendors/${updatedRow.id}`, payload);
      setFilteredVendors((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? payload : row))
      );
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
        <p>Browse, search, and manage vendors.</p>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search Vendors</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
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
