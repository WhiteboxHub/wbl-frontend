// // // whiteboxLearning-wbl/app/avatar/page.tsx
// // "use client";
// // import { AvatarLayout } from "@/components/AvatarLayout";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
// // import {
// //   UsersIcon,
// //   UserCheckIcon,
// //   BuildingIcon,
// //   TrendingUpIcon,
// // } from "lucide-react";

// // export default function Dashboard() {
// //   const stats = [
// //     {
// //       title: "Total Leads",
// //       value: "1,234",
// //       change: "+12%",
// //       icon: UsersIcon,
// //       color: "bg-blue-500",
// //     },
// //     {
// //       title: "Active Candidates",
// //       value: "567",
// //       change: "+8%",
// //       icon: UserCheckIcon,
// //       color: "bg-green-500",
// //     },
// //     {
// //       title: "Partner Vendors",
// //       value: "89",
// //       change: "+5%",
// //       icon: BuildingIcon,
// //       color: "bg-purple-500",
// //     },
// //   ];

// //   return (
// //     <div className="min-h-screen w-full bg-white dark:bg-gray-900">
// //       {/* Welcome Section */}
// //       <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 rounded-3xl p-12 shadow-2xl">
// //         <div className="absolute inset-0 bg-black/20"></div>
// //         <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
// //         <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

// //         <div className="relative z-10 text-center">
// //           <h1 className="text-6xl font-bold text-white mb-6">
// //             Welcome to Avatar
// //           </h1>
// //           <p className="text-2xl text-white/90 max-w-2xl mx-auto">
// //             Your comprehensive admin panel for managing leads, candidates, and
// //             vendor relationships
// //           </p>
// //         </div>
// //       </div>

// //       {/* Stats Grid */}
// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //         {stats.map((stat) => {
// //           const Icon = stat.icon;
// //           return (
// //             <Card key={stat.title}>
// //               <CardContent className="p-6">
// //                 <div className="flex items-center justify-between">
// //                   <div>
// //                     <p className="text-sm font-medium text-gray-600">
// //                       {stat.title}
// //                     </p>
// //                     <p className="text-2xl font-bold text-gray-900">
// //                       {stat.value}
// //                     </p>
// //                     <p className="text-sm text-green-600">
// //                       {stat.change} from last month
// //                     </p>
// //                   </div>
// //                   <div
// //                     className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
// //                   >
// //                     <Icon className="h-6 w-6 text-white" />
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           );
// //         })}
// //       </div>
// //     </div>
// //   );
// // } 


// "use client";
// import { useEffect, useState } from "react";
// import { AvatarLayout } from "@/components/AvatarLayout";
// import { Card, CardContent } from "@/components/admin_ui/card";
// import {
//   UsersIcon,
//   UserCheckIcon,
//   BuildingIcon,
// } from "lucide-react";

// const iconMap = {
//   leads: UsersIcon,
//   candidates: UserCheckIcon,
//   vendors: BuildingIcon,
// };

// export default function Dashboard() {
//   const [stats, setStats] = useState<
//     Array<{
//       key: string;
//       title: string;
//       value: string;
//       change: string;
//       color: string;
//     }>
//   >([]);

//   useEffect(() => {
//     async function fetchStats() {
//       try {
//         const res = await fetch("/api/dashboard-stats");
//         const data = await res.json();
//         setStats(data);
//       } catch (error) {
//         console.error("Failed to fetch dashboard stats", error);
//       }
//     }
//     fetchStats();
//   }, []);

//   return (
//     <div className="min-h-screen w-full bg-white dark:bg-gray-900">
//       {/* Welcome Section */}
//       <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 rounded-3xl p-12 shadow-2xl mb-8">
//         <div className="absolute inset-0 bg-black/20"></div>
//         <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
//         <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

//         <div className="relative z-10 text-center">
//           <h1 className="text-6xl font-bold text-white mb-6">
//             Welcome to Avatar
//           </h1>
//           <p className="text-2xl text-white/90 max-w-2xl mx-auto">
//             Your comprehensive admin panel for managing leads, candidates, and
//             vendor relationships
//           </p>
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {stats.map((stat) => {
//           const Icon = iconMap[stat.key as keyof typeof iconMap];
//           return (
//             <Card key={stat.key}>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">
//                       {stat.title}
//                     </p>
//                     <p className="text-2xl font-bold text-gray-900">
//                       {stat.value}
//                     </p>
//                     <p className="text-sm text-green-600">
//                       {stat.change} from last month
//                     </p>
//                   </div>
//                   <div
//                     className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
//                   >
//                     {Icon && <Icon className="h-6 w-6 text-white" />}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";
import axios from "axios";

// Dynamic AG Grid
const AGGridTable = dynamic(() => import("@/components/AGGridTable"), { ssr: false });

// Badge renderer for moved_to_vendor
const MovedToVendorRenderer = ({ value }: { value?: boolean }) => {
  const status = value ? "Yes" : "No";
  const colorMap: Record<string, string> = {
    yes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    no: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  const badgeClass = colorMap[status.toLowerCase()] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";
  return <Badge className={badgeClass}>{status}</Badge>;
};

// Date formatter
const DateFormatter = ({ value }: { value?: string | Date | null }) =>
  value ? new Date(value).toLocaleDateString() : "-";

export default function VendorContactsGrid() {
  const gridRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);

  const apiEndpoint = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`, []);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiEndpoint}?page=${page}&limit=${pageSize}`);
      setContacts(res.data.data || res.data);
      setFilteredContacts(res.data.data || res.data);
      setTotal(res.data.total || res.data.length);
    } catch (err: any) {
      toast.error(err.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, page, pageSize]);

  // Search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) setFilteredContacts(contacts);
      else {
        const term = searchTerm.toLowerCase();
        setFilteredContacts(
          contacts.filter(c =>
            c.full_name?.toLowerCase().includes(term) ||
            c.source_email?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.phone?.toLowerCase().includes(term) ||
            c.linkedin_id?.toLowerCase().includes(term) ||
            c.company_name?.toLowerCase().includes(term) ||
            c.location?.toLowerCase().includes(term)
          )
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, contacts]);

  // Row update
  const handleRowUpdated = async (updatedData: any) => {
    try {
      await axios.put(`${apiEndpoint}/${updatedData.id}`, updatedData);
      toast.success("Contact updated successfully");
      fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Failed to update contact");
    }
  };

  // Row delete
  const handleRowDeleted = async (contactId: number | string) => {
    try {
      await axios.delete(`${apiEndpoint}/${contactId}`);
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contact");
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Column definitions
  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "id", headerName: "ID", width: 100, pinned: "left", checkboxSelection: true },
    { field: "full_name", headerName: "Full Name", width: 180, editable: true },
    { field: "source_email", headerName: "Source Email", width: 200, editable: true },
    { field: "email", headerName: "Email", width: 200, editable: true },
    { field: "phone", headerName: "Phone", width: 150, editable: true },
    { field: "linkedin_id", headerName: "LinkedIn ID", width: 180, editable: true },
    { field: "company_name", headerName: "Company Name", width: 200, editable: true },
    { field: "location", headerName: "Location", width: 150, editable: true },
    { field: "extraction_date", headerName: "Extraction Date", width: 150, valueFormatter: DateFormatter, editable: true },
    { field: "moved_to_vendor", headerName: "Moved To Vendor", width: 150, cellRenderer: MovedToVendorRenderer },
    { field: "created_at", headerName: "Created At", width: 180, valueFormatter: DateFormatter },
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    flex: 1,
    minWidth: 100,
  }), []);

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vendor Contact Extracts</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse, search, and manage all vendor contacts.</p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Contacts
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search by name, email, company..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <AGGridTable
            // ref={gridRef}
            rowData={filteredContacts}
            columnDefs={columnDefs}
            // defaultColDef={defaultColDef}
            height="600px"
            title={`Vendor Contacts (${filteredContacts.length})`}
            showSearch={false}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={filteredContacts.length < pageSize}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
