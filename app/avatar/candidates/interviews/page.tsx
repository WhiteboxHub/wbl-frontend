"use client";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo } from "react";

export default function CandidatesInterviews() {
  // Sample interview data - candidates in interview stage
  const interviewCandidates = [
    {
      id: 3,
      fullName: "Carol Davis",
      email: "carol.davis@example.com",
      contact: "+1 (555) 765-4321",
      visaStatus: "F1 Student",
      education: "PhD in Artificial Intelligence",
      status: "active",
      enrolledDate: "2024-01-08",
      amountPaid: 8000,
      address: "234 Innovation Drive, Austin, TX 78701",
      referredBy: "University Career Center",
      pincode: "78701",
      primaryEmergencyContact: "+1 (555) 333-4444",
      secondaryEmergencyContact: "+1 (555) 555-6666",
    },
    {
      id: 4,
      fullName: "David Wilson",
      email: "david.wilson@example.com",
      contact: "+1 (555) 654-3210",
      visaStatus: "L1",
      education: "Master's in Cybersecurity",
      status: "active",
      enrolledDate: "2024-01-14",
      amountPaid: 18000,
      address: "456 Tech Park Way, Seattle, WA 98109",
      referredBy: "Former Colleague",
      pincode: "98109",
      primaryEmergencyContact: "+1 (555) 444-5555",
      secondaryEmergencyContact: "+1 (555) 666-7777",
    },
  ];

  const StatusRenderer = (params: any) => {
    const { value } = params;
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-800";
        case "inactive":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
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
          return "bg-blue-100 text-blue-800";
        case "Green Card":
          return "bg-emerald-100 text-emerald-800";
        case "F1 Student":
          return "bg-purple-100 text-purple-800";
        case "L1":
          return "bg-orange-100 text-orange-800";
        case "OPT":
          return "bg-indigo-100 text-indigo-800";
        case "H4 EAD":
          return "bg-pink-100 text-pink-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };
    return <Badge className={getVisaColor(value)}>{value}</Badge>;
  };

  const AmountRenderer = (params: any) => {
    return `$${params.value.toLocaleString()}`;
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80, pinned: "left" },
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
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-600">
            Candidates scheduled for interviews and assessment sessions
          </p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>
      {/* AG Grid Table - Centered and expandable */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={interviewCandidates}
            columnDefs={columnDefs}
            title={`Interviews (${interviewCandidates.length})`}
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
