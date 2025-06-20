"use client";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { ColDef } from "ag-grid-community";
import { useMemo } from "react";

export default function CandidatesMarketing() {
  // Sample data - only candidates with "marketing" status
  const candidates = [
    {
      id: 3,
      fullName: "Carol Davis",
      email: "carol.davis@example.com",
      contact: "+1 (555) 765-4321",
      visaStatus: "F1 Student",
      education: "PhD in Artificial Intelligence",
      status: "marketing",
      enrolledDate: "2024-01-08",
      amountPaid: 8000,
      address: "234 Innovation Drive, Austin, TX 78701",
      referredBy: "University Career Center",
      pincode: "78701",
      primaryEmergencyContact: "+1 (555) 333-4444",
      secondaryEmergencyContact: "+1 (555) 555-6666",
      notes: "Currently in marketing phase. Strong AI background.",
    },
    {
      id: 6,
      fullName: "Frank Lee",
      email: "frank.lee@example.com",
      contact: "+1 (555) 432-1098",
      visaStatus: "H4 EAD",
      education: "Bachelor's in Information Systems",
      status: "marketing",
      enrolledDate: "2024-01-11",
      amountPaid: 13000,
      address: "901 Tech Avenue, Denver, CO 80202",
      referredBy: "Friend Referral",
      pincode: "80202",
      primaryEmergencyContact: "+1 (555) 666-7777",
      secondaryEmergencyContact: "+1 (555) 888-9999",
      notes: "Updated resume. Marketing outreach in progress.",
    },
    {
      id: 9,
      fullName: "Ivy Parker",
      email: "ivy.parker@example.com",
      contact: "+1 (555) 109-8765",
      visaStatus: "F1 Student",
      education: "Master's in Cloud Computing",
      status: "marketing",
      enrolledDate: "2024-01-07",
      amountPaid: 14000,
      address: "789 Cloud Drive, Miami, FL 33101",
      referredBy: "University Job Fair",
      pincode: "33101",
      primaryEmergencyContact: "+1 (555) 999-0000",
      secondaryEmergencyContact: "+1 (555) 111-2222",
      notes: "Cloud architecture skills. Looking for AWS positions.",
    },
    {
      id: 13,
      fullName: "Maya Patel",
      email: "maya.patel@example.com",
      contact: "+1 (555) 765-4321",
      visaStatus: "H1B",
      education: "Master's in Blockchain Technology",
      status: "marketing",
      enrolledDate: "2024-01-03",
      amountPaid: 19000,
      address: "111 Blockchain Avenue, Phoenix, AZ 85001",
      referredBy: "Industry Conference",
      pincode: "85001",
      primaryEmergencyContact: "+1 (555) 333-4444",
      secondaryEmergencyContact: "+1 (555) 555-6666",
      notes: "Blockchain expert. Multiple companies interested.",
    },
    {
      id: 17,
      fullName: "Quinn Miller",
      email: "quinn.miller@example.com",
      contact: "+1 (555) 321-0987",
      visaStatus: "L1",
      education: "Master's in Quantum Computing",
      status: "marketing",
      enrolledDate: "2023-12-27",
      amountPaid: 20000,
      address: "555 Quantum Lane, Boston, MA 02101",
      referredBy: "Research Lab",
      pincode: "02101",
      primaryEmergencyContact: "+1 (555) 777-8888",
      secondaryEmergencyContact: "+1 (555) 999-0000",
      notes: "Quantum computing expertise. High-demand skillset.",
    },
    {
      id: 21,
      fullName: "Victor Chen",
      email: "victor.chen@example.com",
      contact: "+1 (555) 987-6543",
      visaStatus: "F1 Student",
      education: "Master's in Robotics",
      status: "marketing",
      enrolledDate: "2023-12-23",
      amountPaid: 18500,
      address: "999 Robotics Road, Detroit, MI 48201",
      referredBy: "Robotics Lab",
      pincode: "48201",
      primaryEmergencyContact: "+1 (555) 111-2222",
      secondaryEmergencyContact: "+1 (555) 333-4444",
      notes: "Robotics engineering. Automotive industry interest.",
    },
    {
      id: 25,
      fullName: "Zoe Williams",
      email: "zoe.williams@example.com",
      contact: "+1 (555) 543-2109",
      visaStatus: "H1B",
      education: "Master's in Backend Systems",
      status: "marketing",
      enrolledDate: "2023-12-19",
      amountPaid: 19500,
      address: "404 Backend Boulevard, Tampa, FL 33601",
      referredBy: "Backend Community",
      pincode: "33601",
      primaryEmergencyContact: "+1 (555) 555-6666",
      secondaryEmergencyContact: "+1 (555) 777-8888",
      notes: "Backend systems. Scalable architecture experience.",
    },
  ];

  const StatusRenderer = (params: any) => {
    const { value } = params;
    return (
      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
        {value.toUpperCase()}
      </Badge>
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
      { field: "notes", headerName: "Notes", width: 250, minWidth: 200 },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Marketing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates currently in marketing phase
          </p>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={candidates}
            columnDefs={columnDefs}
            title={`Marketing Candidates (${candidates.length})`}
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
