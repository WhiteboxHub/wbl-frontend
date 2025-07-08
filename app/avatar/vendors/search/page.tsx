"use client";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";

export default function VendorsSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);

  // All vendors data (same as main vendors page)
  const allVendors = [
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
      company: "Elite Tech Recruiters",
      contact: "Michael Brown",
      email: "michael@elitetechrecruiters.com",
      phone: "+1 (555) 789-0123",
      services: "Senior Developer Placement, CTO Search",
      location: "Seattle, WA",
      partnership: "Basic",
      activeContracts: 5,
      lastContact: "2024-01-13",
      rating: 4.2,
    },
    {
      id: 5,
      company: "Innovation Staffing",
      contact: "Sarah Wilson",
      email: "sarah@innovationstaffing.com",
      phone: "+1 (555) 890-1234",
      services: "Startup Recruitment, Product Manager Search",
      location: "Boston, MA",
      partnership: "Standard",
      activeContracts: 9,
      lastContact: "2024-01-11",
      rating: 4.6,
    },
  ];

  // Auto-search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredVendors([]);
    } else {
      const filtered = allVendors.filter((vendor) => {
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
      setFilteredVendors(filtered);
    }
  }, [searchTerm]);

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
        <span className="font-semibold dark:text-gray-200">{value}</span>
        <span className="text-yellow-500">⭐</span>
      </div>
    );
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80, pinned: "left" },
      {
        field: "company",
        headerName: "Company",
        width: 200,
        minWidth: 150,
      },
      {
        field: "contact",
        headerName: "Contact Person",
        width: 150,
        minWidth: 120,
      },
      { field: "email", headerName: "Email", width: 220, minWidth: 180 },
      { field: "phone", headerName: "Phone", width: 150, minWidth: 120 },
      {
        field: "services",
        headerName: "Services",
        width: 250,
        minWidth: 200,
      },
      {
        field: "location",
        headerName: "Location",
        width: 150,
        minWidth: 120,
      },
      {
        field: "partnership",
        headerName: "Partnership",
        cellRenderer: PartnershipRenderer,
        width: 130,
        minWidth: 100,
      },
      {
        field: "activeContracts",
        headerName: "Active Contracts",
        width: 140,
        minWidth: 120,
        type: "numericColumn",
      },
      {
        field: "lastContact",
        headerName: "Last Contact",
        width: 130,
        minWidth: 120,
      },
      {
        field: "rating",
        headerName: "Rating",
        cellRenderer: RatingRenderer,
        width: 100,
        minWidth: 80,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Search Vendors
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search through all vendors with real-time results
          </p>
        </div>
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

      {/* Results Table */}
      {searchTerm && (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredVendors}
              columnDefs={columnDefs}
              title={`Search Results (${filteredVendors.length})`}
              height="calc(50vh)"
              showSearch={false} // Disable built-in search since we have custom search
              onRowClicked={(event) => {
                console.log("Row clicked:", event.data);
              }}
            />
          </div>
        </div>
      )}

      {!searchTerm && (
        <div className="text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Start typing to search
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter a company name, contact, or any other vendor information to
            see results
          </p>
        </div>
      )}
    </div>
  );
}
