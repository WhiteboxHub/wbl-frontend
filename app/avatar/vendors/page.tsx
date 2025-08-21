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

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);

  const vendors = [
    {
      id: 1,
      company: "TechStaff Solutions",
      contact: "Maria Rodriguez",
      email: "maria@techstaff.com",
      phone: "+1 (555) 456-7890",
      services: "IT Recruitment, Contract Staffing",
      location: "San Francisco, CA",
      partnership: "Premium",
      activeContracts: 12,
      lastContact: "2024-01-15",
      rating: 4.8,
      notes: "Excellent performance. Renewed contract for 2024.",
    },
    {
      id: 2,
      company: "Global Recruiting Partners",
      contact: "James Kim",
      email: "james@globalrecruiting.com",
      phone: "+1 (555) 567-8901",
      services: "Executive Search, Technical Recruitment",
      location: "New York, NY",
      partnership: "Standard",
      activeContracts: 8,
      lastContact: "2024-01-12",
      rating: 4.5,
    },
    {
      id: 3,
      company: "Talent Bridge Inc",
      contact: "Lisa Chen",
      email: "lisa@talentbridge.com",
      phone: "+1 (555) 678-9012",
      services: "Permanent Placement, Temporary Staffing",
      location: "Austin, TX",
      partnership: "Premium",
      activeContracts: 15,
      lastContact: "2024-01-14",
      rating: 4.9,
    },
    {
      id: 4,
      company: "Elite Staffing Group",
      contact: "Michael Brown",
      email: "michael@elitestaffing.com",
      phone: "+1 (555) 789-0123",
      services: "Contract Staffing, Project Teams",
      location: "Seattle, WA",
      partnership: "Basic",
      activeContracts: 5,
      lastContact: "2024-01-10",
      rating: 4.2,
    },
  ];

  // Auto-search functionality
  const filterVendors = useCallback((searchTerm: string) => {
    if (searchTerm.trim() === "") {
      return vendors;
    } else {
      return vendors.filter((vendor) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          vendor.company.toLowerCase().includes(searchLower) ||
          vendor.contact.toLowerCase().includes(searchLower) ||
          vendor.email.toLowerCase().includes(searchLower) ||
          vendor.phone.includes(searchTerm) ||
          vendor.services.toLowerCase().includes(searchLower) ||
          vendor.location.toLowerCase().includes(searchLower) ||
          vendor.partnership.toLowerCase().includes(searchLower)
        );
      });
    }
  }, []);

  useEffect(() => {
    const filtered = filterVendors(searchTerm);
    setFilteredVendors(filtered);
  }, [searchTerm, filterVendors]);

  const PartnershipRenderer = (params: any) => {
    const { value } = params;
    const getPartnershipColor = (partnership: string) => {
      switch (partnership) {
        case "Premium":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        case "Standard":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "Basic":
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      }
    };
    return (
      <Badge className={getPartnershipColor(value)}>
        {value.toUpperCase()}
      </Badge>
    );
  };

  const RatingRenderer = (params: any) => {
    const { value } = params;
    return (
      <div className="flex items-center space-x-1">
        <span className="text-yellow-500">★</span>
        <span>{value}</span>
      </div>
    );
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80, pinned: "left", checkboxSelection: true },
      { field: "company", headerName: "Company", flex: 1, minWidth: 200 },
      {
        field: "contact",
        headerName: "Contact Person",
        flex: 1,
        minWidth: 150,
      },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      { field: "phone", headerName: "Phone", flex: 1, minWidth: 150 },
      { field: "services", headerName: "Services", flex: 1, minWidth: 200 },
      { field: "location", headerName: "Location", flex: 1, minWidth: 150 },
      {
        field: "partnership",
        headerName: "Partnership",
        cellRenderer: PartnershipRenderer,
        width: 130,
      },
      {
        field: "activeContracts",
        headerName: "Active Contracts",
        width: 150,
        type: "numericColumn",
      },
      { field: "lastContact", headerName: "Last Contact", width: 130 },
      {
        field: "rating",
        headerName: "Rating",
        cellRenderer: RatingRenderer,
        width: 100,
        minWidth: 80,
      },
      { field: "notes", headerName: "Notes", width: 250, minWidth: 200 },
    ],
    [],
  );

  const handleRowUpdated = (updatedRow) => {
    setFilteredVendors((prev) =>
      prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
  };

  const handleRowDeleted = (id) => {
    setFilteredVendors((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Vendors Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your partner vendors and daily communications
          </p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Vendors
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search by company, contact, email, services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredVendors.length} vendor(s) found
          </p>
        )}
      </div>

      {/* AG Grid Table */}
      <AGGridTable
        rowData={filteredVendors}
        columnDefs={columnDefs}
        title={`All Vendors (${filteredVendors.length})`}
        height="calc(50vh)"
        showSearch={false}
        // onRowClicked={(event) => {
        //   console.log("Row clicked:", event.data);
        // }}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
      />
    </div>
  );
}
