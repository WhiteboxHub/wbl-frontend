"use client";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo } from "react";

export default function VendorsDailyContactPage() {
  // Sample daily contact data - vendors with recent communications
  const dailyContactVendors = [
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
  ];

  const PartnershipRenderer = (params: any) => {
    const { value } = params;
    const getPartnershipColor = (partnership: string) => {
      switch (partnership) {
        case "Premium":
          return "bg-purple-100 text-purple-800";
        case "Standard":
          return "bg-blue-100 text-blue-800";
        case "Basic":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
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
      { field: "id", headerName: "ID", width: 80, pinned: "left" },
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
        type: "numericColumn",
      },
    ],
    [],
  );

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Contact</h1>
            <p className="text-gray-600">
              Daily communication tracking with vendor partners
            </p>
          </div>
        <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Log Contact
          </Button>
        </div>

        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={dailyContactVendors}
              columnDefs={columnDefs}
              title={`Daily Contact (${dailyContactVendors.length})`}
              height="calc(60vh)"
              onRowClicked={(event) => {
                console.log("Row clicked:", event.data);
              }}
            />
          </div>
        </div>
      </div>
  );
}
