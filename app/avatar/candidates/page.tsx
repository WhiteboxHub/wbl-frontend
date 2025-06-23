// wbl\app\avatar\candidates\page.tsx
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

export default function CandidatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState([]);

  // All candidates data
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
      notes: "Initial enrollment completed. Ready for next phase.",
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
      notes: "Moved to preparation phase. Needs technical assessment.",
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
      notes: "Currently in marketing phase. Strong AI background.",
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
      notes: "Successfully placed at Microsoft. Excellent performance.",
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
      notes: "Data analytics expertise. Preparing for interviews.",
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
      id: 7,
      fullName: "Grace Chen",
      email: "grace.chen@example.com",
      contact: "+1 (555) 321-0987",
      visaStatus: "H1B",
      education: "Master's in Machine Learning",
      status: "placed",
      enrolledDate: "2024-01-05",
      amountPaid: 16000,
      address: "123 AI Street, San Francisco, CA 94105",
      referredBy: "Company Alumni",
      pincode: "94105",
      primaryEmergencyContact: "+1 (555) 777-8888",
      secondaryEmergencyContact: "+1 (555) 999-0000",
      notes: "Placed at Google AI team. Outstanding candidate.",
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
      notes: "Needs algorithm practice. Mock interviews scheduled.",
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
      id: 10,
      fullName: "Jack Thompson",
      email: "jack.thompson@example.com",
      contact: "+1 (555) 098-7654",
      visaStatus: "OPT",
      education: "Bachelor's in Data Science",
      status: "active",
      enrolledDate: "2024-01-15",
      amountPaid: 9000,
      address: "321 Data Boulevard, Chicago, IL 60601",
      referredBy: "Social Media",
      pincode: "60601",
      primaryEmergencyContact: "+1 (555) 000-1111",
      secondaryEmergencyContact: "+1 (555) 222-3333",
      notes: "Recently enrolled. Starting preparation materials.",
    },
    {
      id: 11,
      fullName: "Kelly Wong",
      email: "kelly.wong@example.com",
      contact: "+1 (555) 987-6543",
      visaStatus: "L1",
      education: "Master's in DevOps",
      status: "placed",
      enrolledDate: "2024-01-06",
      amountPaid: 17000,
      address: "654 DevOps Street, Los Angeles, CA 90210",
      referredBy: "Professional Network",
      pincode: "90210",
      primaryEmergencyContact: "+1 (555) 111-2222",
      secondaryEmergencyContact: "+1 (555) 333-4444",
      notes: "Placed at Netflix DevOps team. Quick turnaround.",
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
      notes: "Mobile development focus. iOS and Android experience.",
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
      id: 14,
      fullName: "Nathan Kim",
      email: "nathan.kim@example.com",
      contact: "+1 (555) 654-3210",
      visaStatus: "Green Card",
      education: "Bachelor's in Game Development",
      status: "placed",
      enrolledDate: "2024-01-02",
      amountPaid: 15500,
      address: "222 Gaming Plaza, San Diego, CA 92101",
      referredBy: "Gaming Community",
      pincode: "92101",
      primaryEmergencyContact: "+1 (555) 444-5555",
      secondaryEmergencyContact: "+1 (555) 666-7777",
      notes: "Placed at Unity Technologies. Game development role.",
    },
    {
      id: 15,
      fullName: "Olivia Rodriguez",
      email: "olivia.rodriguez@example.com",
      contact: "+1 (555) 543-2109",
      visaStatus: "F1 Student",
      education: "Master's in IoT Systems",
      status: "active",
      enrolledDate: "2024-01-01",
      amountPaid: 13500,
      address: "333 IoT Circle, Nashville, TN 37201",
      referredBy: "Academic Advisor",
      pincode: "37201",
      primaryEmergencyContact: "+1 (555) 555-6666",
      secondaryEmergencyContact: "+1 (555) 777-8888",
      notes: "IoT specialization. Hardware and software integration.",
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
      notes: "AR/VR development. Working on portfolio projects.",
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
      id: 18,
      fullName: "Rachel Adams",
      email: "rachel.adams@example.com",
      contact: "+1 (555) 210-9876",
      visaStatus: "H4 EAD",
      education: "Bachelor's in UI/UX Design",
      status: "placed",
      enrolledDate: "2023-12-26",
      amountPaid: 14500,
      address: "666 Design Drive, Atlanta, GA 30301",
      referredBy: "Design Community",
      pincode: "30301",
      primaryEmergencyContact: "+1 (555) 888-9999",
      secondaryEmergencyContact: "+1 (555) 000-1111",
      notes: "Placed at Adobe design team. Excellent design portfolio.",
    },
    {
      id: 19,
      fullName: "Samuel Jones",
      email: "samuel.jones@example.com",
      contact: "+1 (555) 109-8765",
      visaStatus: "H1B",
      education: "Master's in Network Security",
      status: "active",
      enrolledDate: "2023-12-25",
      amountPaid: 16500,
      address: "777 Security Boulevard, Dallas, TX 75201",
      referredBy: "Security Conference",
      pincode: "75201",
      primaryEmergencyContact: "+1 (555) 999-0000",
      secondaryEmergencyContact: "+1 (555) 111-2222",
      notes: "Network security specialist. Government clearance eligible.",
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
      notes: "Database administration focus. Oracle and MySQL certified.",
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
      id: 22,
      fullName: "Wendy Taylor",
      email: "wendy.taylor@example.com",
      contact: "+1 (555) 876-5432",
      visaStatus: "OPT",
      education: "Bachelor's in API Development",
      status: "placed",
      enrolledDate: "2023-12-22",
      amountPaid: 13000,
      address: "101 API Avenue, Salt Lake City, UT 84101",
      referredBy: "Developer Meetup",
      pincode: "84101",
      primaryEmergencyContact: "+1 (555) 222-3333",
      secondaryEmergencyContact: "+1 (555) 444-5555",
      notes: "Placed at Stripe API team. RESTful API expertise.",
    },
    {
      id: 23,
      fullName: "Xavier Lopez",
      email: "xavier.lopez@example.com",
      contact: "+1 (555) 765-4321",
      visaStatus: "L1",
      education: "Master's in Microservices",
      status: "active",
      enrolledDate: "2023-12-21",
      amountPaid: 17500,
      address: "202 Microservices Mall, Portland, OR 97205",
      referredBy: "Architecture Forum",
      pincode: "97205",
      primaryEmergencyContact: "+1 (555) 333-4444",
      secondaryEmergencyContact: "+1 (555) 555-6666",
      notes: "Microservices architecture. Cloud-native development.",
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
      notes: "Frontend development. React and Vue.js expertise.",
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
    {
      id: 26,
      fullName: "Zoe Taylor",
      email: "zoe.taylor@example.com",
      contact: "+1 (555) 987-6543",
      visaStatus: "H1B",
      education: "Bachelor's in AI and Robotics",
      status: "marketing",
      enrolledDate: "2024-01-20",
      amountPaid: 13500,
      address: "111 Robot Row, Philadelphia, PA 19101",
      referredBy: "AI Conference",
      pincode: "19101",
      primaryEmergencyContact: "+1 (555) 000-1111",
      secondaryEmergencyContact: "+1 (555) 222-3333",
      notes: "Expertise in robotics. Strong marketing potential.",
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
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "preparation":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "marketing":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "placed":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
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
      { field: "notes", headerName: "Notes", width: 250, minWidth: 200 },
    ],
    []
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidates Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse, search, and manage all candidates in the pipeline.
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

      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={filteredCandidates}
            columnDefs={columnDefs}
            title={`All Candidates (${filteredCandidates.length})`}
            height="calc(70vh)"
            showSearch={false}
            onRowClicked={(event) => console.log("Row clicked:", event.data)}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>
    </div>
  );
}
