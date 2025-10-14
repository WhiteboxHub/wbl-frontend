// "use client";
// import React, {
//   useEffect,
//   useState,
//   useMemo,
//   useRef,
//   useCallback,
// } from "react";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { Button } from "@/components/admin_ui/button";
// import { SearchIcon, UserPlus } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import dynamic from "next/dynamic";
// import { toast, Toaster } from "sonner";
// import axios, { AxiosRequestConfig } from "axios";
// // import axios, { AxiosRequestConfig } from "axios";

// const AGGridTable = dynamic(() => import("@/components/AGGridTable"), {
//   ssr: false,
// });

// const MovedToVendorRenderer = ({ value }: { value?: boolean }) => {
//   const status = value ? "Yes" : "No";
//   const colorMap: Record<string, string> = {
//     yes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
//     no: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
//   };
//   const badgeClass =
//     colorMap[status.toLowerCase()] ??
//     "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";
//   return <Badge className={badgeClass}>{status}</Badge>;
// };

// const DateFormatter = ({ value }: { value?: string | Date | null }) =>
//   value ? new Date(value).toLocaleDateString() : "-";

// const EmailRenderer = ({ value }: { value?: string }) => {
//   if (!value) return null;
//   return (
//     <a
//       href={`mailto:${value}`}
//       className="text-blue-600 hover:underline dark:text-blue-400"
//     >
//       {value}
//     </a>
//   );
// };

// const PhoneRenderer = ({ value }: { value?: string }) => {
//   if (!value) return null;
//   return (
//     <a
//       href={`tel:${value}`}
//       className="text-blue-600 hover:underline dark:text-blue-400"
//     >
//       {value}
//     </a>
//   );
// };

// export default function VendorContactsGrid() {
//   const gridRef = useRef<any>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [contacts, setContacts] = useState<any[]>([]);
//   const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [movingToVendor, setMovingToVendor] = useState(false);

//   const apiEndpoint = useMemo(
//     () => `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`,
//     []
//   );

//   // const fetchContacts = useCallback(async () => {
//   //   try {
//   //     setLoading(true);

//   //     const res = await axios.get(
//   //       `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`
//   //     );

//   //     const data = res.data || [];
//   //     setContacts(data);
//   //     setFilteredContacts(data);
//   //   } catch (err: any) {
//   //     toast.error(err.message || "Failed to load contacts");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // }, [apiEndpoint]);

// const fetchContacts = useCallback(async () => {
//   try {
//     setLoading(true);

//     // SSR-safe token read
//     const token =
//       typeof window !== "undefined" ? localStorage.getItem("token") : null;

//     // Always pass a config object; only include Authorization when token exists
//     const config: AxiosRequestConfig = {
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//     };

//     // debug (optional) — uncomment while debugging
//     // console.log("Fetching contacts with token:", token);

//     const res = await axios.get(
//       `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`,
//       config
//     );

//     const data = res.data || [];
//     setContacts(data);
//     setFilteredContacts(data);
//   } catch (err: any) {
//     // If you want more error info while debugging, uncomment the next line:
//     // console.error("fetchContacts error:", err?.response || err);
//     toast.error(err?.message || "Failed to load contacts");
//   } finally {
//     setLoading(false);
//   }
// }, [apiEndpoint]);


//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (!searchTerm.trim()) setFilteredContacts(contacts);
//       else {
//         const term = searchTerm.toLowerCase();
//         setFilteredContacts(
//           contacts.filter(
//             (c) =>
//               c.full_name?.toLowerCase().includes(term) ||
//               c.source_email?.toLowerCase().includes(term) ||
//               c.email?.toLowerCase().includes(term) ||
//               c.phone?.toLowerCase().includes(term) ||
//               c.linkedin_id?.toLowerCase().includes(term) ||
//               c.internal_linkedin_id?.toLowerCase().includes(term) ||
//               c.company_name?.toLowerCase().includes(term) ||
//               c.location?.toLowerCase().includes(term)
//           )
//         );
//       }
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [searchTerm, contacts]);

//   const handleRowUpdated = async (updatedData: any) => {
//     try {
//       await axios.put(
//         `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact/${updatedData.id}`,
//         updatedData
//       );
//       toast.success("Contact updated successfully");
//       fetchContacts();
//     } catch (err: any) {
//       toast.error(err.message || "Failed to update contact");
//     }
//   };

//   const handleRowDeleted = async (contactId: number | string) => {
//     try {
//       await axios.delete(
//         `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact/${contactId}`
//       );
//       toast.success("Contact deleted successfully");
//       fetchContacts();
//     } catch (err: any) {
//       toast.error(err.message || "Failed to delete contact");
//     }
//   };

//   const handleMoveAllToVendor = async () => {
//     setMovingToVendor(true);
//     try {
//       const toMove = contacts.filter((c) => !c.moved_to_vendor);
//       if (!toMove.length) {
//         toast.info("No contacts to move");
//         return;
//       }

//       let inserted = 0, skipped = 0, failed = 0;
//       for (const c of toMove) {
//         const payload: any = {
//           full_name: c.full_name || c.company_name || c.email || "Unknown",
//           email: c.email || undefined,
//           phone_number: c.phone || undefined,
//         };
//         try {
//           // No Authorization header — public API call
//           await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/vendors`, payload);
//           inserted++;
//           await axios.put(
//             `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact/${c.id}`,
//             { moved_to_vendor: true }
//           );
//         } catch (e: any) {
//           const d = e?.response?.data?.detail || "";
//           if (typeof d === "string" && d.toLowerCase().includes("email already exists")) {
//             skipped++;
//             try {
//               await axios.put(
//                 `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact/${c.id}`,
//                 { moved_to_vendor: true }
//               );
//             } catch {}
//           } else {
//             failed++;
//           }
//         }
//       }

//       if (inserted) {
//         toast.success(`Moved ${inserted} contacts${skipped ? `, ${skipped} skipped` : ""}${failed ? `, ${failed} failed` : ""}`);
//       } else if (skipped && !failed) {
//         toast.info(`${skipped} contacts already existed; marked as moved`);
//       } else if (failed) {
//         toast.error("Failed to move contacts");
//       } else {
//         toast.info("No contacts to move");
//       }

//       await fetchContacts();
//     } catch (err: any) {
//       toast.error(err?.response?.data?.detail || err?.message || "Failed to move contacts to vendor");
//     } finally {
//       setMovingToVendor(false);
//     }
//   };

//   useEffect(() => {
//     fetchContacts();
//     setIsLoading(true);
//   }, [fetchContacts]);

//   const columnDefs: ColDef[] = useMemo<ColDef[]>(
//     () => [
//       { field: "id", headerName: "ID", width: 100, pinned: "left" },
//       {
//         field: "full_name",
//         headerName: "Full Name",
//         width: 180,
//         editable: true,
//       },
//       {
//         field: "phone",
//         headerName: "Phone",
//         width: 150,
//         editable: true,
//         cellRenderer: PhoneRenderer,
//       },
//       {
//         field: "email",
//         headerName: "Email",
//         width: 200,
//         editable: true,
//         cellRenderer: EmailRenderer,
//       },
//       {
//         field: "extraction_date",
//         headerName: "Extraction Date",
//         width: 150,
//         valueFormatter: DateFormatter,
//         editable: true,
//       },
//       {
//         field: "moved_to_vendor",
//         headerName: "Moved To Vendor",
//         width: 150,
//         cellRenderer: MovedToVendorRenderer,
//       },
//       {
//         field: "linkedin_id",
//         headerName: "LinkedIn ID",
//         width: 180,
//         editable: true,
//       },
//       {
//         field: "company_name",
//         headerName: "Company Name",
//         width: 200,
//         editable: true,
//       },
//       {
//         field: "source_email",
//         headerName: "Source Email",
//         width: 200,
//         editable: true,
//       },
//       { field: "location", headerName: "Location", width: 150, editable: true },
//       {
//         field: "created_at",
//         headerName: "Created At",
//         width: 180,
//         valueFormatter: DateFormatter,
//       },
//       {
//         field: "internal_linkedin_id",
//         headerName: "Internal LinkedIn ID",
//         width: 200,
//         editable: true,
//       },
//     ],
//     []
//   );

//   const defaultColDef = useMemo(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       flex: 1,
//       minWidth: 100,
//     }),
//     []
//   );

//   return (
//     <div className="space-y-6">
//       <Toaster position="top-center" richColors />

//       {/* Header Section */}
//       <div className="space-y-4 md:space-y-0">
//         {/* Title */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//               Vendor Contact Extracts
//             </h1>
//             <p className="text-gray-600 dark:text-gray-400">
//               Browse, search, and manage all vendor contacts.
//             </p>
//           </div>
//         </div>

//         {/* Search + Button — responsive layout */}
//         <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
//           {/* Search box */}
//           <div className="w-full sm:max-w-md">
//             <Label
//               htmlFor="search"
//               className="text-sm font-medium text-gray-700 dark:text-gray-300"
//             >
//               Search Contacts
//             </Label>
//             <div className="relative mt-1">
//               <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
//               <Input
//                 id="search"
//                 type="text"
//                 placeholder="Search by name, email, company..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//           </div>

//           {/* Button */}
//           <div className="sm:w-auto">
//             <Button
//               onClick={handleMoveAllToVendor}
//               disabled={movingToVendor}
//               className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
//             >
//               <UserPlus className="mr-2 h-4 w-4" />
//               {movingToVendor ? "Moving..." : "Move All to Vendor"}
//             </Button>
//           </div>
//         </div>
//       </div>

//       <div className="flex w-full justify-center">
//         <div className="w-full max-w-7xl">
//           <AGGridTable
//             rowData={filteredContacts}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             loading={loading}
//             height="600px"
//             title={`Vendor Contacts (${filteredContacts.length})`}
//             showSearch={false}
//             onRowUpdated={handleRowUpdated}
//             onRowDeleted={handleRowDeleted}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
// wbl-frontend\lib\api.js
import { apiFetch } from "@/lib/api.js";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, UserPlus } from "lucide-react";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";
import axios, { AxiosRequestConfig } from "axios";
// import axios, { AxiosRequestConfig } from "axios";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), {
  ssr: false,
});

const MovedToVendorRenderer = ({ value }: { value?: boolean }) => {
  const status = value ? "Yes" : "No";
  const colorMap: Record<string, string> = {
    yes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    no: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  const badgeClass =
    colorMap[status.toLowerCase()] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";
  return <Badge className={badgeClass}>{status}</Badge>;
};

const DateFormatter = ({ value }: { value?: string | Date | null }) =>
  value ? new Date(value).toLocaleDateString() : "-";

const EmailRenderer = ({ value }: { value?: string }) => {
  if (!value) return null;
  return (
    <a
      href={`mailto:${value}`}
      className="text-blue-600 hover:underline dark:text-blue-400"
    >
      {value}
    </a>
  );
};

const PhoneRenderer = ({ value }: { value?: string }) => {
  if (!value) return null;
  return (
    <a
      href={`tel:${value}`}
      className="text-blue-600 hover:underline dark:text-blue-400"
    >
      {value}
    </a>
  );
};

export default function VendorContactsGrid() {
  const gridRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [movingToVendor, setMovingToVendor] = useState(false);

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`,
    []
  );

  // const fetchContacts = useCallback(async () => {
  //   try {
  //     setLoading(true);

  //     const res = await axios.get(
  //       `${process.env.NEXT_PUBLIC_API_URL}/vendor_contact_extracts`
  //     );

  //     const data = res.data || [];
  //     setContacts(data);
  //     setFilteredContacts(data);
  //   } catch (err: any) {
  //     toast.error(err.message || "Failed to load contacts");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [apiEndpoint]);

const fetchContacts = useCallback(async () => {
  try {
    setLoading(true);

    const data = await apiFetch("/vendor_contact_extracts"); // GET by default
    const arr = Array.isArray(data) ? data : data?.data || [];
    setContacts(arr);
    setFilteredContacts(arr);
  } catch (err: any) {
    // err.body contains server response text (if any)
    toast.error(err?.message || err?.body || "Failed to load contacts");
  } finally {
    setLoading(false);
  }
}, [apiEndpoint]);



  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) setFilteredContacts(contacts);
      else {
        const term = searchTerm.toLowerCase();
        setFilteredContacts(
          contacts.filter(
            (c) =>
              c.full_name?.toLowerCase().includes(term) ||
              c.source_email?.toLowerCase().includes(term) ||
              c.email?.toLowerCase().includes(term) ||
              c.phone?.toLowerCase().includes(term) ||
              c.linkedin_id?.toLowerCase().includes(term) ||
              c.internal_linkedin_id?.toLowerCase().includes(term) ||
              c.company_name?.toLowerCase().includes(term) ||
              c.location?.toLowerCase().includes(term)
          )
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, contacts]);

const handleRowUpdated = async (updatedData: any) => {
  try {
    await apiFetch(`/vendor_contact/${updatedData.id}`, {
      method: "PUT",
      body: updatedData,
    });
    toast.success("Contact updated successfully");
    fetchContacts();
  } catch (err: any) {
    toast.error(err?.message || "Failed to update contact");
  }
};

const handleRowDeleted = async (contactId: number | string) => {
  try {
    await apiFetch(`/vendor_contact/${contactId}`, {
      method: "DELETE",
    });
    toast.success("Contact deleted successfully");
    fetchContacts();
  } catch (err: any) {
    toast.error(err?.message || "Failed to delete contact");
  }
};

  const handleMoveAllToVendor = async () => {
    setMovingToVendor(true);
    try {
      const toMove = contacts.filter((c) => !c.moved_to_vendor);
      if (!toMove.length) {
        toast.info("No contacts to move");
        return;
      }

      let inserted = 0, skipped = 0, failed = 0;
for (const c of toMove) {
  const payload: any = {
    full_name: c.full_name || c.company_name || c.email || "Unknown",
    email: c.email || undefined,
    phone_number: c.phone || undefined,
  };
  try {
    // create vendor
    await apiFetch("/vendors", { method: "POST", body: payload });

    // mark moved
    await apiFetch(`/vendor_contact/${c.id}`, {
      method: "PUT",
      body: { moved_to_vendor: true },
    });
    inserted++;
  } catch (e: any) {
    const d = (e?.body || "").toString().toLowerCase();
    if (d.includes("email already exists")) {
      skipped++;
      try {
        await apiFetch(`/vendor_contact/${c.id}`, {
          method: "PUT",
          body: { moved_to_vendor: true },
        });
      } catch {}
    } else {
      failed++;
    }
  }
}

      if (inserted) {
        toast.success(`Moved ${inserted} contacts${skipped ? `, ${skipped} skipped` : ""}${failed ? `, ${failed} failed` : ""}`);
      } else if (skipped && !failed) {
        toast.info(`${skipped} contacts already existed; marked as moved`);
      } else if (failed) {
        toast.error("Failed to move contacts");
      } else {
        toast.info("No contacts to move");
      }

      await fetchContacts();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to move contacts to vendor");
    } finally {
      setMovingToVendor(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    setIsLoading(true);
  }, [fetchContacts]);

  const columnDefs: ColDef[] = useMemo<ColDef[]>(
    () => [
      { field: "id", headerName: "ID", width: 100, pinned: "left" },
      {
        field: "full_name",
        headerName: "Full Name",
        width: 180,
        editable: true,
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        editable: true,
        cellRenderer: PhoneRenderer,
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
        editable: true,
        cellRenderer: EmailRenderer,
      },
      {
        field: "extraction_date",
        headerName: "Extraction Date",
        width: 150,
        valueFormatter: DateFormatter,
        editable: true,
      },
      {
        field: "moved_to_vendor",
        headerName: "Moved To Vendor",
        width: 150,
        cellRenderer: MovedToVendorRenderer,
      },
      {
        field: "linkedin_id",
        headerName: "LinkedIn ID",
        width: 180,
        editable: true,
      },
      {
        field: "company_name",
        headerName: "Company Name",
        width: 200,
        editable: true,
      },
      {
        field: "source_email",
        headerName: "Source Email",
        width: 200,
        editable: true,
      },
      { field: "location", headerName: "Location", width: 150, editable: true },
      {
        field: "created_at",
        headerName: "Created At",
        width: 180,
        valueFormatter: DateFormatter,
      },
      {
        field: "internal_linkedin_id",
        headerName: "Internal LinkedIn ID",
        width: 200,
        editable: true,
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header Section */}
      <div className="space-y-4 md:space-y-0">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Vendor Contact Extracts
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Browse, search, and manage all vendor contacts.
            </p>
          </div>
        </div>

        {/* Search + Button — responsive layout */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {/* Search box */}
          <div className="w-full sm:max-w-md">
            <Label
              htmlFor="search"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Search Contacts
            </Label>
            <div className="relative mt-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Button */}
          <div className="sm:w-auto">
            <Button
              onClick={handleMoveAllToVendor}
              disabled={movingToVendor}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {movingToVendor ? "Moving..." : "Move All to Vendor"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={filteredContacts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            loading={loading}
            height="600px"
            title={`Vendor Contacts (${filteredContacts.length})`}
            showSearch={false}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>
    </div>
  );
}
