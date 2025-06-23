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

export default function CandidatesPrepPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState([]);

  // All candidates data (prep status)
  const allCandidates = [
    {
      id: 2,
      fullName: "Bob Smith",
      email: "bob.smith@example.com",
      contact: "+1 (555) 876-5432",
      visaStatus: "Green Card",
      education: "Bachelor's in Computer Science",
      status: "preparation",
      enrolledDate: "2024-01-12",
      amountPaid: 15000,
      address: "890 Silicon Valley Blvd, San Jose, CA 95110",
      referredBy: "LinkedIn Connection",
      pincode: "95110",
      primaryEmergencyContact: "+1 (555) 222-3333",
      secondaryEmergencyContact: "+1 (555) 444-5555",
      notes: "Moved to preparation phase. Needs technical assessment.",
    },
    {
      id: 5,
      fullName: "Eva Martinez",
      email: "eva.martinez@example.com",
      contact: "+1 (555) 543-2109",
      visaStatus: "OPT",
      education: "Master's in Data Analytics",
      status: "preparation",
      enrolledDate: "2024-01-09",
      amountPaid: 10000,
      address: "678 Research Blvd, Boston, MA 02139",
      referredBy: "Career Fair",
      pincode: "02139",
      primaryEmergencyContact: "+1 (555) 555-6666",
      secondaryEmergencyContact: "+1 (555) 777-8888",
    },
    {
      id: 8,
      fullName: "Henry Brown",
      email: "henry.brown@example.com",
      contact: "+1 (555) 210-9876",
      visaStatus: "Green Card",
      education: "Bachelor's in Software Development",
      status: "preparation",
      enrolledDate: "2024-01-13",
      amountPaid: 11000,
      address: "456 Code Lane, Portland, OR 97201",
      referredBy: "Online Platform",
      pincode: "97201",
      primaryEmergencyContact: "+1 (555) 888-9999",
      secondaryEmergencyContact: "+1 (555) 000-1111",
    },
    {
      id: 12,
      fullName: "Liam Garcia",
      email: "liam.garcia@example.com",
      contact: "+1 (555) 876-5432",
      visaStatus: "H4 EAD",
      education: "Bachelor's in Mobile Development",
      status: "preparation",
      enrolledDate: "2024-01-04",
      amountPaid: 12500,
      address: "987 Mobile Way, Houston, TX 77001",
      referredBy: "Tech Meetup",
      pincode: "77001",
      primaryEmergencyContact: "+1 (555) 222-3333",
      secondaryEmergencyContact: "+1 (555) 444-5555",
    },
    {
      id: 16,
      fullName: "Peter Zhang",
      email: "peter.zhang@example.com",
      contact: "+1 (555) 432-1098",
      visaStatus: "OPT",
      education: "Bachelor's in AR/VR Development",
      status: "preparation",
      enrolledDate: "2023-12-28",
      amountPaid: 11500,
      address: "444 VR Street, Las Vegas, NV 89101",
      referredBy: "Tech Blog",
      pincode: "89101",
      primaryEmergencyContact: "+1 (555) 666-7777",
      secondaryEmergencyContact: "+1 (555) 888-9999",
    },
    {
      id: 20,
      fullName: "Tina Liu",
      email: "tina.liu@example.com",
      contact: "+1 (555) 098-7654",
      visaStatus: "Green Card",
      education: "Bachelor's in Database Administration",
      status: "preparation",
      enrolledDate: "2023-12-24",
      amountPaid: 12000,
      address: "888 Database Drive, Minneapolis, MN 55401",
      referredBy: "Database User Group",
      pincode: "55401",
      primaryEmergencyContact: "+1 (555) 000-1111",
      secondaryEmergencyContact: "+1 (555) 222-3333",
    },
    {
      id: 24,
      fullName: "Yuki Tanaka",
      email: "yuki.tanaka@example.com",
      contact: "+1 (555) 654-3210",
      visaStatus: "H4 EAD",
      education: "Bachelor's in Frontend Development",
      status: "preparation",
      enrolledDate: "2023-12-20",
      amountPaid: 11000,
      address: "303 Frontend Way, Sacramento, CA 95814",
      referredBy: "Frontend Guild",
      pincode: "95814",
      primaryEmergencyContact: "+1 (555) 444-5555",
      secondaryEmergencyContact: "+1 (555) 666-7777",
    },
  ];

  // Auto-search functionality
  const filterCandidates = useCallback((searchTerm: string) => {
    if (searchTerm.trim() === "") {
      return allCandidates;
    } else {
      return allCandidates.filter((candidate) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          candidate.fullName.toLowerCase().includes(searchLower) ||
          candidate.email.toLowerCase().includes(searchLower) ||
          candidate.contact.includes(searchTerm) ||
          candidate.visaStatus.toLowerCase().includes(searchLower) ||
          candidate.education.toLowerCase().includes(searchLower) ||
          candidate.status.toLowerCase().includes(searchLower) ||
          candidate.address.toLowerCase().includes(searchLower) ||
          candidate.referredBy.toLowerCase().includes(searchLower) ||
          candidate.pincode.includes(searchTerm)
        );
      });
    }
  }, []);

  useEffect(() => {
    const filtered = filterCandidates(searchTerm);
    setFilteredCandidates(filtered);
  }, [searchTerm, filterCandidates]);

  const StatusRenderer = (params: any) => {
    const { value } = params;
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
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
      { field: "notes", headerName: "Notes", width: 250, minWidth: 200 },
    ],
    [],
  );

  const handleRowUpdated = (updatedRow) => {
    setFilteredCandidates((prev) =>
      prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
  };

  const handleRowDeleted = (id) => {
    setFilteredCandidates((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Preparation Phase
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates in preparation and training phase
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Candidates
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
            {filteredCandidates.length} candidate(s) found
          </p>
        )}
      </div>

      {/* AG Grid Table */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={filteredCandidates}
            columnDefs={columnDefs}
            title={`Preparation Phase (${filteredCandidates.length})`}
            height="calc(70vh)"
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
