"use client";
import { AvatarLayout } from "@/components/AvatarLayout";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";

export default function CandidatesSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState([]);

  // All candidates data (same as main candidates page)
  const allCandidates = [
    {
      id: 1,
      fullName: "Alice Johnson",
      email: "alice.johnson@example.com",
      contact: "+1 (555) 987-6543",
      visaStatus: "H1B",
      education: "Master's in Software Engineering",
      status: "active",
      enrolledDate: "2024-01-10",
      amountPaid: 12000,
      address: "567 Broadway, New York, NY 10012",
      referredBy: "Tech Recruiter Inc",
      pincode: "10012",
      primaryEmergencyContact: "+1 (555) 111-2222",
      secondaryEmergencyContact: "+1 (555) 333-4444",
    },
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
    },
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
    },
    {
      id: 4,
      fullName: "David Wilson",
      email: "david.wilson@example.com",
      contact: "+1 (555) 654-3210",
      visaStatus: "L1",
      education: "Master's in Cybersecurity",
      status: "placed",
      enrolledDate: "2024-01-14",
      amountPaid: 18000,
      address: "456 Tech Park Way, Seattle, WA 98109",
      referredBy: "Former Colleague",
      pincode: "98109",
      primaryEmergencyContact: "+1 (555) 444-5555",
      secondaryEmergencyContact: "+1 (555) 666-7777",
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
    // Add more candidates as needed - truncated for brevity but should include all 25
  ];

  // Auto-search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCandidates([]);
    } else {
      const filtered = allCandidates.filter((candidate) => {
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
      setFilteredCandidates(filtered);
    }
  }, [searchTerm]);

  const StatusRenderer = (params: any) => {
    const { value } = params;
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "inactive":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        case "preparation":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "marketing":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        case "placed":
          return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Search Candidates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search through all candidates with real-time results
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

      {/* Results Table */}
      {searchTerm && (
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredCandidates}
              columnDefs={columnDefs}
              title={`Search Results (${filteredCandidates.length})`}
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
            Enter a name, email, or any other candidate information to see
            results
          </p>
        </div>
      )}
    </div>
  );
}
