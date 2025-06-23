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

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLeads, setFilteredLeads] = useState([]);

  const leads = [
    {
      id: 1,
      fullName: "John Smith",
      email: "john.smith@example.com",
      contact: "+1 (555) 123-4567",
      visaStatus: "H1B",
      education: "Master's in Computer Science",
      status: "active",
      enrolledDate: "2024-01-15",
      amountPaid: 5000,
      address: "123 Main St, Apt 4B, New York, NY 10001",
      referredBy: "Jane Doe",
      pincode: "10001",
      primaryEmergencyContact: "+1 (555) 987-6543",
      secondaryEmergencyContact: "+1 (555) 456-7890",
    },
    {
      id: 2,
      fullName: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      contact: "+1 (555) 234-5678",
      visaStatus: "Green Card",
      education: "Bachelor's in Information Technology",
      status: "active",
      enrolledDate: "2024-01-14",
      amountPaid: 7500,
      address: "456 Oak Ave, San Francisco, CA 94102",
      referredBy: "Mike Wilson",
      pincode: "94102",
      primaryEmergencyContact: "+1 (555) 876-5432",
      secondaryEmergencyContact: "+1 (555) 654-3210",
    },
  ];

  // Auto-search functionality
  const filterLeads = useCallback((searchTerm: string) => {
    if (searchTerm.trim() === "") {
      return leads;
    } else {
      return leads.filter((lead) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          lead.fullName.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower) ||
          lead.contact.includes(searchTerm) ||
          lead.visaStatus.toLowerCase().includes(searchLower) ||
          lead.education.toLowerCase().includes(searchLower) ||
          lead.status.toLowerCase().includes(searchLower) ||
          lead.address.toLowerCase().includes(searchLower) ||
          lead.referredBy.toLowerCase().includes(searchLower) ||
          lead.pincode.includes(searchTerm)
        );
      });
    }
  }, []);

  useEffect(() => {
    const filtered = filterLeads(searchTerm);
    setFilteredLeads(filtered);
  }, [searchTerm, filterLeads]);

  const StatusRenderer = (params: any) => {
    const { value } = params;
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "inactive":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      }
    };
    return (
      <Badge className={getStatusColor(value)}>{value.toUpperCase()}</Badge>
    );
  };

  const VisaStatusRenderer = (params: any) => {
    const { value } = params;
    const getVisaColor = (visa: string) => {
      switch (visa) {
        case "H1B":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "Green Card":
          return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
        case "F1 Student":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        case "L1":
          return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
        case "OPT":
          return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
        case "H4 EAD":
          return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      }
    };
    return <Badge className={getVisaColor(value)}>{value}</Badge>;
  };

  const AmountRenderer = (params: any) => {
    return `$${params.value.toLocaleString()}`;
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80, pinned: "left", checkboxSelection: true },
      { field: "fullName", headerName: "Full Name", width: 180, minWidth: 150 },
      { field: "email", headerName: "Email", width: 220, minWidth: 180 },
      { field: "contact", headerName: "Contact", width: 150, minWidth: 120 },
      {
        field: "visaStatus",
        headerName: "Visa Status",
        cellRenderer: VisaStatusRenderer,
        width: 130,
        minWidth: 120,
      },
      {
        field: "education",
        headerName: "Education",
        width: 250,
        minWidth: 200,
      },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusRenderer,
        width: 120,
        minWidth: 100,
      },
      {
        field: "enrolledDate",
        headerName: "Enrolled Date",
        width: 130,
        minWidth: 120,
      },
      {
        field: "amountPaid",
        headerName: "Amount Paid",
        cellRenderer: AmountRenderer,
        width: 130,
        minWidth: 120,
        type: "numericColumn",
      },
      { field: "address", headerName: "Address", width: 300, minWidth: 250 },
      {
        field: "referredBy",
        headerName: "Referred By",
        width: 150,
        minWidth: 120,
      },
      { field: "pincode", headerName: "Pincode", width: 100, minWidth: 80 },
      {
        field: "primaryEmergencyContact",
        headerName: "Primary Emergency",
        width: 180,
        minWidth: 150,
      },
      {
        field: "secondaryEmergencyContact",
        headerName: "Secondary Emergency",
        width: 180,
        minWidth: 150,
      },
    ],
    []
  );

  const handleRowUpdated = (updatedRow) => {
    setFilteredLeads((prev) =>
      prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
  };

  const handleRowDeleted = (id) => {
    setFilteredLeads((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leads Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track your potential clients with comprehensive
            information
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Leads
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search by name, email, visa status, education..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredLeads.length} lead(s) found
          </p>
        )}
      </div>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={filteredLeads}
            columnDefs={columnDefs}
            title={`All Leads (${filteredLeads.length})`}
            height="calc(60vh)"
            showSearch={false}
            onRowClicked={(event) => {
              console.log("Row clicked:", event.data);
            }}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>
    </div>
  );
}
