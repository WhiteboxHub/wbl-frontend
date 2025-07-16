// // "use client";
// // import { AGGridTable } from "@/components/AGGridTable";
// // import { Button } from "@/components/admin_ui/button";
// // import { Badge } from "@/components/admin_ui/badge";
// // import { Input } from "@/components/admin_ui/input";
// // import { Label } from "@/components/admin_ui/label";
// // import { SearchIcon, PlusIcon } from "lucide-react";
// // import { ColDef } from "ag-grid-community";
// // import { useMemo, useState, useEffect, useCallback } from "react";

// // export default function VendorsDailyContactPage() {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredVendors, setFilteredVendors] = useState([]);

// //   // Sample daily contact data - vendors with recent communications
// //   const dailyContactVendors = [
// //     {
// //       id: 1,
// //       company: "TechStaff Solutions",
// //       contact: "Maria Rodriguez",
// //       email: "maria@techstaff.com",
// //       phone: "+1 (555) 456-7890",
// //       services: "IT Recruitment, Contract Staffing",
// //       location: "San Francisco, CA",
// //       partnership: "Premium",
// //       activeContracts: 12,
// //       lastContact: "2024-01-15",
// //       rating: 4.8,
// //     },
// //     {
// //       id: 3,
// //       company: "Talent Bridge Inc",
// //       contact: "Lisa Chen",
// //       email: "lisa@talentbridge.com",
// //       phone: "+1 (555) 678-9012",
// //       services: "Permanent Placement, Temporary Staffing",
// //       location: "Austin, TX",
// //       partnership: "Premium",
// //       activeContracts: 15,
// //       lastContact: "2024-01-14",
// //       rating: 4.9,
// //     },
// //   ];

// //   // All vendors data (daily contact)
// //   const allVendors = [
// //     {
// //       id: 1,
// //       company: "TechStaff Solutions",
// //       contact: "Maria Rodriguez",
// //       email: "maria@techstaff.com",
// //       phone: "+1 (555) 456-7890",
// //       services: "IT Recruitment, Contract Staffing",
// //       location: "San Francisco, CA",
// //       partnership: "Premium",
// //       activeContracts: 12,
// //       lastContact: "2024-01-15",
// //       rating: 4.8,
// //     },
// //     {
// //       id: 3,
// //       company: "Talent Bridge Inc",
// //       contact: "Lisa Chen",
// //       email: "lisa@talentbridge.com",
// //       phone: "+1 (555) 678-9012",
// //       services: "Permanent Placement, Temporary Staffing",
// //       location: "Austin, TX",
// //       partnership: "Premium",
// //       activeContracts: 15,
// //       lastContact: "2024-01-14",
// //       rating: 4.9,
// //     },
// //   ];

// //   // Auto-search functionality
// //   const filterVendors = useCallback((searchTerm: string) => {
// //     if (searchTerm.trim() === "") {
// //       return allVendors;
// //     } else {
// //       return allVendors.filter((vendor) => {
// //         const searchLower = searchTerm.toLowerCase();
// //         return (
// //           vendor.company.toLowerCase().includes(searchLower) ||
// //           vendor.contact.toLowerCase().includes(searchLower) ||
// //           vendor.email.toLowerCase().includes(searchLower) ||
// //           vendor.phone.includes(searchTerm) ||
// //           vendor.services.toLowerCase().includes(searchLower) ||
// //           vendor.location.toLowerCase().includes(searchLower) ||
// //           vendor.partnership.toLowerCase().includes(searchLower)
// //         );
// //       });
// //     }
// //   }, []);

// //   useEffect(() => {
// //     const filtered = filterVendors(searchTerm);
// //     setFilteredVendors(filtered);
// //   }, [searchTerm, filterVendors]);

// //   const PartnershipRenderer = (params: any) => {
// //     const { value } = params;
// //     const getPartnershipColor = (partnership: string) => {
// //       switch (partnership) {
// //         case "Premium":
// //           return "bg-purple-100 text-purple-800";
// //         case "Standard":
// //           return "bg-blue-100 text-blue-800";
// //         case "Basic":
// //           return "bg-gray-100 text-gray-800";
// //         default:
// //           return "bg-gray-100 text-gray-800";
// //       }
// //     };
// //     return (
// //       <Badge className={getPartnershipColor(value)}>
// //         {value.toUpperCase()}
// //       </Badge>
// //     );
// //   };

// //   const RatingRenderer = (params: any) => {
// //     const { value } = params;
// //     return (
// //       <div className="flex items-center space-x-1">
// //         <span className="text-yellow-500">★</span>
// //         <span>{value}</span>
// //       </div>
// //     );
// //   };

// //   const columnDefs: ColDef[] = useMemo(
// //     () => [
// //       { field: "id", headerName: "ID", width: 80, pinned: "left" },
// //       { field: "company", headerName: "Company", flex: 1, minWidth: 200 },
// //       {
// //         field: "contact",
// //         headerName: "Contact Person",
// //         flex: 1,
// //         minWidth: 150,
// //       },
// //       { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
// //       { field: "phone", headerName: "Phone", flex: 1, minWidth: 150 },
// //       { field: "services", headerName: "Services", flex: 1, minWidth: 200 },
// //       { field: "location", headerName: "Location", flex: 1, minWidth: 150 },
// //       {
// //         field: "partnership",
// //         headerName: "Partnership",
// //         cellRenderer: PartnershipRenderer,
// //         width: 130,
// //       },
// //       {
// //         field: "activeContracts",
// //         headerName: "Active Contracts",
// //         width: 150,
// //         type: "numericColumn",
// //       },
// //       { field: "lastContact", headerName: "Last Contact", width: 130 },
// //       {
// //         field: "rating",
// //         headerName: "Rating",
// //         cellRenderer: RatingRenderer,
// //         width: 100,
// //         type: "numericColumn",
// //       },
// //     ],
// //     [],
// //   );

// //   const handleRowUpdated = (updatedRow) => {
// //     setFilteredVendors((prev) =>
// //       prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
// //     );
// //   };
// //   const handleRowDeleted = (id) => {
// //     setFilteredVendors((prev) => prev.filter((row) => row.id !== id));
// //   };

// //   return (
// //       <div className="space-y-6">
// //         <div className="flex items-center justify-between">
// //           <div>
// //             <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Daily Contact</h1>
// //             <p className="text-gray-600 dark:text-gray-400">
// //               Daily communication tracking with vendor partners
// //             </p>
// //           </div>
// //         <Button className="bg-whitebox-600 hover:bg-whitebox-700">
// //             <PlusIcon className="h-4 w-4 mr-2" />
// //             Log Contact
// //           </Button>
// //         </div>

// //         {/* Search Input */}
// //         <div className="max-w-md">
// //           <Label
// //             htmlFor="search"
// //             className="text-sm font-medium text-gray-700 dark:text-gray-300"
// //           >
// //             Search Vendors
// //           </Label>
// //           <div className="relative mt-1">
// //             <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //             <Input
// //               id="search"
// //               type="text"
// //               placeholder="Search by company, contact, email, services..."
// //               value={searchTerm}
// //               onChange={(e) => setSearchTerm(e.target.value)}
// //               className="pl-10"
// //             />
// //           </div>
// //           {searchTerm && (
// //             <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
// //               {filteredVendors.length} vendor(s) found
// //             </p>
// //           )}
// //         </div>

// //         <div className="flex justify-center w-full">
// //           <div className="w-full max-w-7xl">
// //             <AGGridTable
// //               rowData={filteredVendors}
// //               columnDefs={columnDefs}
// //               title={`Daily Contact (${filteredVendors.length})`}
// //               height="calc(60vh)"
// //               showSearch={false}
// //               onRowClicked={(event) => {
// //                 console.log("Row clicked:", event.data);
// //               }}
// //               onRowUpdated={handleRowUpdated}
// //               onRowDeleted={handleRowDeleted}
// //             />
// //           </div>
// //         </div>
// //       </div>
// //   );
// // }





// // "use client";

// // import { AGGridTable } from "@/components/AGGridTable";
// // import { Input } from "@/components/admin_ui/input";
// // import { Label } from "@/components/admin_ui/label";
// // import { SearchIcon } from "lucide-react";
// // import { useMemo, useState, useEffect, useCallback } from "react";
// // import { ColDef } from "ag-grid-community";

// // export default function VendorsDailyContactPage() {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredVendors, setFilteredVendors] = useState([]);
// //   const [allVendors, setAllVendors] = useState([]);

// //   // ✅ Fetch vendor data from backend
// //   useEffect(() => {
// //     const fetchVendors = async () => {
// //       try {
// //         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors/daily-contact`);
// //         if (!res.ok) throw new Error("Failed to fetch vendors");
// //         const data = await res.json();
// //         setAllVendors(data);
// //         setFilteredVendors(data);
// //       } catch (err) {
// //         console.error("Error fetching vendors:", err);
// //       }
// //     };

// //     fetchVendors();
// //   }, []);

// //   // 🔍 Filter vendors on search
// //   const filterVendors = useCallback(
// //     (searchTerm: string) => {
// //       if (searchTerm.trim() === "") return allVendors;
// //       const searchLower = searchTerm.toLowerCase();

// //       return allVendors.filter((vendor) =>
// //         [
// //           "full_name",
// //           "email",
// //           "phone_number",
// //           "city",
// //           "postal_code",
// //           "country",
// //           "type",
// //           "note",
// //         ].some((field) => vendor[field]?.toLowerCase().includes(searchLower))
// //       );
// //     },
// //     [allVendors]
// //   );

// //   useEffect(() => {
// //     setFilteredVendors(filterVendors(searchTerm));
// //   }, [searchTerm, filterVendors]);

// //   // 🧱 AG Grid Column Definitions
// //   const columnDefs: ColDef[] = useMemo(
// //     () => [
// //       { field: "id", headerName: "ID", width: 80, pinned: "left" },
// //       { field: "full_name", headerName: "Full Name", flex: 1, minWidth: 150 },
// //       { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
// //       { field: "phone_number", headerName: "Phone", flex: 1, minWidth: 150 },
// //       { field: "city", headerName: "City", flex: 1, minWidth: 150 },
// //       { field: "postal_code", headerName: "Postal Code", flex: 1, minWidth: 120 },
// //       { field: "country", headerName: "Country", flex: 1, minWidth: 120 },
// //       { field: "address", headerName: "Address", flex: 2, minWidth: 200 },
// //       { field: "type", headerName: "Type", flex: 1, minWidth: 120 },
// //       { field: "note", headerName: "Note", flex: 2, minWidth: 200 },
// //     ],
// //     []
// //   );

// //   return (
// //     <div className="space-y-6 p-4">
// //       <div>
// //         <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
// //           Vendor Daily Contact
// //         </h1>
// //         <p className="text-gray-600 dark:text-gray-400">
// //           List of vendors contacted today
// //         </p>
// //       </div>

// //       {/* 🔍 Search */}
// //       <div className="max-w-md">
// //         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
// //           Search Vendors
// //         </Label>
// //         <div className="relative mt-1">
// //           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //           <Input
// //             id="search"
// //             type="text"
// //             placeholder="Search by name, email, phone, city..."
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //             className="pl-10"
// //           />
// //         </div>
// //         {searchTerm && (
// //           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
// //             {filteredVendors.length} vendor(s) found
// //           </p>
// //         )}
// //       </div>

// //       {/* 📊 Table */}
// //       <div className="w-full max-w-7xl mx-auto">
// //         <AGGridTable
// //           rowData={filteredVendors}
// //           columnDefs={columnDefs}
// //           title={`Daily Contact (${filteredVendors.length})`}
// //           height="calc(60vh)"
// //           showSearch={false}
// //           onRowClicked={(event) => console.log("Row clicked:", event.data)}
// //         />
// //       </div>
// //     </div>
// //   );
// // }





// "use client";

// import { AGGridTable } from "@/components/AGGridTable";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon } from "lucide-react";
// import { useMemo, useState, useEffect, useCallback } from "react";
// import { ColDef } from "ag-grid-community";

// export default function VendorsDailyContactPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredVendors, setFilteredVendors] = useState([]);
//   const [allVendors, setAllVendors] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // ✅ Fetch vendor data from FastAPI
//   useEffect(() => {
//     const fetchVendors = async () => {
//       try {
//         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors/daily-contact`);
//         if (!res.ok) throw new Error("Failed to fetch vendors");
//         const data = await res.json();
//         setAllVendors(data);
//         setFilteredVendors(data);
//       } catch (err) {
//         console.error("❌ Error fetching vendors:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVendors();
//   }, []);

//   // 🔍 Filter logic
//   const filterVendors = useCallback(
//     (searchTerm: string) => {
//       if (searchTerm.trim() === "") return allVendors;
//       const searchLower = searchTerm.toLowerCase();

//       return allVendors.filter((vendor) =>
//         [
//           "full_name",
//           "email",
//           "phone_number",
//           "city",
//           "postal_code",
//           "country",
//           "type",
//           "note",
//         ].some((field) => vendor[field]?.toLowerCase().includes(searchLower))
//       );
//     },
//     [allVendors]
//   );

//   useEffect(() => {
//     setFilteredVendors(filterVendors(searchTerm));
//   }, [searchTerm, filterVendors]);

//   // 💡 Column Definitions
//   const columnDefs: ColDef[] = useMemo(
//     () => [
//       { field: "id", headerName: "ID", width: 80, pinned: "left" },
//       { field: "full_name", headerName: "Full Name", flex: 1, minWidth: 150 },
//       { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
//       { field: "phone_number", headerName: "Phone", flex: 1, minWidth: 150 },
//       { field: "city", headerName: "City", flex: 1, minWidth: 150 },
//       { field: "postal_code", headerName: "Postal Code", flex: 1, minWidth: 120 },
//       { field: "country", headerName: "Country", flex: 1, minWidth: 120 },
//       { field: "address", headerName: "Address", flex: 2, minWidth: 200 },
//       { field: "type", headerName: "Type", flex: 1, minWidth: 120 },
//       { field: "note", headerName: "Note", flex: 2, minWidth: 200 },
//     ],
//     []
//   );

//   return (
//     <div className="space-y-6 p-4">
//       {/* Title */}
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//           Vendor Daily Contact
//         </h1>
//         <p className="text-gray-600 dark:text-gray-400">
//           List of vendors contacted today
//         </p>
//       </div>

//       {/* Search Box */}
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Search Vendors
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             placeholder="Search by name, email, phone, city..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         {searchTerm && (
//           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {filteredVendors.length} vendor(s) found
//           </p>
//         )}
//       </div>

//       {/* Table */}
//       <div className="w-full max-w-7xl mx-auto">
//         <AGGridTable
//           rowData={filteredVendors}
//           columnDefs={columnDefs}
//           title={`Daily Contact (${filteredVendors.length})`}
//           height="calc(65vh)"
//           // loading={loading}
//           showSearch={false}
//           onRowClicked={(event) => console.log("🧾 Row clicked:", event.data)}
//         />
//       </div>
//     </div>
//   );
// }
