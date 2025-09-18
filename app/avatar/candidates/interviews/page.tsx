
// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Button } from "@/components/admin_ui/button";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, PlusIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useCallback } from "react";
// import axios from "axios";

// export default function CandidatesInterviews() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [interviews, setInterviews] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);
//   const [perPage, setPerPage] = useState(50);
//   const [total, setTotal] = useState(0);

//   // --- Add Interview Modal State ---
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newInterview, setNewInterview] = useState<any>({
//     candidate_id: "",
//     company: "",
//     mode_of_interview: "",
//     type_of_interview: "",
//     interview_date: "",
//     // status: "",
//     feedback: "",
//     interviewer_emails: "",
//     interviewer_contact: "",
//     notes: "",
//     recording_link: "",
//     backup_url: "",
//     url: "", // new field added
//   });

//   // Fetch interviews
//   const fetchInterviews = async (page: number, perPage: number) => {
//     try {
//       setLoading(true);
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/interviews?page=${page}&per_page=${perPage}`
//       );
//       if (!res.ok) throw new Error("Failed to load interviews");
//       const data = await res.json();
//       setInterviews(data);
//       setTotal(data.total);
//     } catch (err) {
//       setError("Failed to load interviews.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchInterviews(page, perPage);
//   }, [page, perPage]);

//   // Search/filter
//   const filterData = useCallback(
//     (term: string) => {
//       if (!term.trim()) return interviews;
//       const lower = term.toLowerCase();
//       return interviews.filter((item) => {
//         if (item.candidate?.full_name?.toLowerCase().includes(lower)) return true;
//         return Object.values(item).some((val) =>
//           val?.toString().toLowerCase().includes(lower)
//         );
//       });
//     },
//     [interviews]
//   );

//   const filteredInterviews = filterData(searchTerm);

//   // Status renderer
//   const StatusRenderer = (params: any) => {
//     const v = params.value?.toLowerCase() ?? "";
//     const classes =
//       v === "cleared"
//         ? "bg-green-100 text-green-800"
//         : v === "rejected"
//         ? "bg-red-100 text-red-800"
//         : "bg-gray-100 text-gray-800";
//     return <Badge className={classes}>{params.value}</Badge>;
//   };

//   // Feedback renderer
//   const FeedbackRenderer = (params: any) => {
//     const value = params.value?.toLowerCase() ?? "";
//     if (!value || value === "no response")
//       return <Badge className="bg-gray-100 text-gray-800">No Response</Badge>;
//     if (value === "positive")
//       return <Badge className="bg-green-300 text-green-800">Positive</Badge>;
//     if (value === "failure" || value === "negative")
//       return <Badge className="bg-red-100 text-red-800">Failure</Badge>;
//     return <Badge className="bg-gray-100 text-gray-800">{params.value}</Badge>;
//   };

//   // Link renderer for recording_link, backup_url, url
//   const LinkRenderer = (params: any) => {
//     const value = params.value;
//     if (!value) return <span className="text-gray-500">Not Available</span>;
//     const links = value
//       .split(/[,​\s]+/)
//       .map((link: string) => link.trim())
//       .filter((link: string) => link.length > 0);
//     if (links.length === 0) return <span className="text-gray-500">Not Available</span>;
//     return (
//       <div className="flex flex-col space-y-1">
//         {links.map((link: string, idx: number) => (
//           <a
//             key={idx}
//             href={link}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-blue-600 underline hover:text-blue-800"
//           >
//             {link}
//           </a>
//         ))}
//       </div>
//     );
//   };

//   // Columns
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", sortable: true, minWidth: 140 },
//       { field: "company", headerName: "Company", sortable: true, minWidth: 110, editable: true },
//       { field: "mode_of_interview", headerName: "Mode", maxWidth: 130, editable: true },
//       { field: "type_of_interview", headerName: "Type", maxWidth: 150, editable: true },
//       { field: "interview_date", headerName: "Date", maxWidth: 120, editable: true },
//       { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
//       { field: "backup_url", headerName: "Backup URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
//       { field: "url", headerName: "URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true }, // new URL column
//       // { field: "status", headerName: "Status", cellRenderer: StatusRenderer, maxWidth: 150, editable: true },
//       { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, maxWidth: 130, editable: true },
//       { field: "interviewer_emails", headerName: "Emails", minWidth: 180, editable: true },
//       { field: "interviewer_contact", headerName: "Contact", minWidth: 140, editable: true },
//       { field: "notes", headerName: "Notes", minWidth: 120, editable: true },
//     ],
//     []
//   );

//   // Update existing row
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       const payload = {
//         candidate_id: updatedRow.candidate_id,
//         company: updatedRow.company,
//         mode_of_interview: updatedRow.mode_of_interview,
//         type_of_interview: updatedRow.type_of_interview,
//         interview_date: updatedRow.interview_date,
//         status: updatedRow.status,
//         feedback: updatedRow.feedback,
//         interviewer_emails: updatedRow.interviewer_emails,
//         interviewer_contact: updatedRow.interviewer_contact,
//         notes: updatedRow.notes,
//         recording_link: updatedRow.recording_link,
//         backup_url: updatedRow.backup_url,
//         url: updatedRow.url, // include new field
//       };
//       if (updatedRow.id) {
//         await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${updatedRow.id}`, payload);
//         fetchInterviews(page, perPage);
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update interview.");
//     }
//   };

//   // Delete row
//   const handleRowDeleted = async (row: any) => {
//     try {
//       if (row.id)
//         await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${row.id}`);
//       setInterviews((prev) => prev.filter((r) => r !== row));
//     } catch (err) {
//       alert("Failed to delete interview.");
//     }
//   };

//   // Add new interview
//   const handleAddInterview = async () => {
//     if (!newInterview.candidate_id || !newInterview.company) {
//       alert("Candidate ID and Company are required!");
//       return;
//     }

//     try {
//       const payload = {
//         ...newInterview,
//         candidate_id: Number(newInterview.candidate_id),
//       };
//       const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/interviews`, payload);

//       setInterviews((prev) => [res.data, ...prev]);
//       setShowAddForm(false);
//       setNewInterview({
//         candidate_id: "",
//         company: "",
//         mode_of_interview: "",
//         type_of_interview: "",
//         interview_date: "",
//         status: "",
//         feedback: "",
//         interviewer_emails: "",
//         interviewer_contact: "",
//         notes: "",
//         recording_link: "",
//         backup_url: "",
//         url: "", // reset new field
//       });
//     } catch (err: any) {
//       console.error("Failed to add interview:", err.response?.data || err);
//       alert("Failed to add interview. Make sure all fields are valid.");
//     }
//   };

//   const totalPages = Math.ceil(total / perPage);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
//           <p className="text-gray-600 dark:text-gray-400">Candidates scheduled for interviews</p>
//         </div>
//         <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center" onClick={() => setShowAddForm(true)}>
//           <PlusIcon className="h-4 w-4 mr-2" /> Add Interview
//         </Button>
//       </div>

//       {/* Search */}
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             value={searchTerm}
//             placeholder="Search..."
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>

//       {/* Table */}
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">Loading...</p>
//       ) : error ? (
//         <p className="text-center mt-8 text-red-500">{error}</p>
//       ) : (
//         <div className="flex flex-col items-center w-full space-y-4">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredInterviews}
//               columnDefs={columnDefs}
//               // title={`Interviews (Page ${page} of ${totalPages})`}
//               title={`Interviews (${filteredInterviews.length})`}
//               height="500px"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}

//       {/* Add Interview Modal */}
//       {showAddForm && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Add Interview</h2>
//             <div className="space-y-3">
//               <Input
//                 placeholder="Candidate ID"
//                 value={newInterview.candidate_id}
//                 onChange={(e) => setNewInterview({ ...newInterview, candidate_id: e.target.value })}
//               />
//               <Input
//                 placeholder="Company"
//                 value={newInterview.company}
//                 onChange={(e) => setNewInterview({ ...newInterview, company: e.target.value })}
//               />

//               {/* Mode of Interview */}
//               <select
//                 value={newInterview.mode_of_interview}
//                 onChange={(e) => setNewInterview({ ...newInterview, mode_of_interview: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Mode of Interview</option>
//                 <option value="Virtual">Virtual</option>
//                 <option value="In Person">In Person</option>
//                 <option value="Phone">Phone</option>
//                 <option value="Assessment">Assessment</option>
//               </select>

//               {/* Type of Interview */}
//               <select
//                 value={newInterview.type_of_interview}
//                 onChange={(e) => setNewInterview({ ...newInterview, type_of_interview: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Type of Interview</option>
//                 <option value="Assessment">Assessment</option>
//                 <option value="Recruiter Call">Recruiter Call</option>
//                 <option value="Technical">Technical</option>
//                 <option value="HR Round">HR Round</option>
//                 <option value="In Person">In Person</option>
//                 <option value="Prep Call">Prep Call</option>
//               </select>

//               <Input
//                 placeholder="Interview Date"
//                 type="date"
//                 value={newInterview.interview_date}
//                 onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
//               />
//               <Input
//                 placeholder="Interviewer Emails"
//                 value={newInterview.interviewer_emails}
//                 onChange={(e) => setNewInterview({ ...newInterview, interviewer_emails: e.target.value })}
//               />
//               <Input
//                 placeholder="Interviewer Contact"
//                 value={newInterview.interviewer_contact}
//                 onChange={(e) => setNewInterview({ ...newInterview, interviewer_contact: e.target.value })}
//               />
//               <Input
//                 placeholder="Notes"
//                 value={newInterview.notes}
//                 onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
//               />
//               <Input
//                 placeholder="Recording Link"
//                 value={newInterview.recording_link}
//                 onChange={(e) => setNewInterview({ ...newInterview, recording_link: e.target.value })}
//               />
//               <Input
//                 placeholder="Backup URL"
//                 value={newInterview.backup_url}
//                 onChange={(e) => setNewInterview({ ...newInterview, backup_url: e.target.value })}
//               />
//               <Input
//                 placeholder="URL" // new field
//                 value={newInterview.url}
//                 onChange={(e) => setNewInterview({ ...newInterview, url: e.target.value })}
//               />

//               {/* Status Dropdown */}
//               <select
//                 value={newInterview.status}
//                 onChange={(e) => setNewInterview({ ...newInterview, status: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Status</option>
//                 <option value="No Update">No Update</option>
//                 <option value="Cleared">Cleared</option>
//                 <option value="Rejected">Rejected</option>
//               </select>

//               {/* Feedback Dropdown */}
//               <select
//                 value={newInterview.feedback}
//                 onChange={(e) => setNewInterview({ ...newInterview, feedback: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Feedback</option>
//                 <option value="Pending">Pending</option>
//                 <option value="Positive">Positive</option>
//                 <option value="Negative">Negative</option>
//               </select>
//             </div>
//             <div className="flex justify-end mt-6 space-x-3">
//               <button
//                 onClick={() => setShowAddForm(false)}
//                 className="px-4 py-2 bg-gray-300 rounded"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddInterview}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Button } from "@/components/admin_ui/button";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, PlusIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useCallback } from "react";
// import axios from "axios";

// export default function CandidatesInterviews() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [interviews, setInterviews] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);
//   const [perPage, setPerPage] = useState(50);
//   const [total, setTotal] = useState(0);

//   // --- Add Interview Modal State ---
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newInterview, setNewInterview] = useState<any>({
//     candidate_id: "",
//     company: "",
//     mode_of_interview: "",
//     type_of_interview: "",
//     interview_date: "",
//     feedback: "",
//     interviewer_emails: "",
//     interviewer_contact: "",
//     notes: "",
//     recording_link: "",
//     backup_url: "",
//     url: "",
//   });


//  // --- Marketing candidates ---
// const [marketingCandidates, setMarketingCandidates] = useState<any[]>([]);

// useEffect(() => {
//   const fetchMarketingCandidates = async () => {
//     try {
//       //Call your new backend endpoint
//       const res = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/candidates/marketing/active`
//       );

//       // Response is already a list of candidates
//       setMarketingCandidates(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Failed to fetch marketing candidates", err);
//       setMarketingCandidates([]);
//     }
//   };
//   fetchMarketingCandidates();
// }, []);


//   // Fetch interviews
//   const fetchInterviews = async (page: number, perPage: number) => {
//     try {
//       setLoading(true);
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/interviews?page=${page}&per_page=${perPage}`
//       );
//       if (!res.ok) throw new Error("Failed to load interviews");
//       const data = await res.json();
//       setInterviews(data.items ?? data); // handle paginated or simple array
//       setTotal(data.total ?? data.length);
//     } catch (err) {
//       setError("Failed to load interviews.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchInterviews(page, perPage);
//   }, [page, perPage]);

//   // Search/filter
//   const filterData = useCallback(
//     (term: string) => {
//       if (!term.trim()) return interviews;
//       const lower = term.toLowerCase();
//       return interviews.filter((item) => {
//         if (item.candidate?.full_name?.toLowerCase().includes(lower)) return true;
//         return Object.values(item).some((val) =>
//           val?.toString().toLowerCase().includes(lower)
//         );
//       });
//     },
//     [interviews]
//   );

//   const filteredInterviews = filterData(searchTerm);

//   // Status renderer
//   const StatusRenderer = (params: any) => {
//     const v = params.value?.toLowerCase() ?? "";
//     const classes =
//       v === "cleared"
//         ? "bg-green-100 text-green-800"
//         : v === "rejected"
//         ? "bg-red-100 text-red-800"
//         : "bg-gray-100 text-gray-800";
//     return <Badge className={classes}>{params.value}</Badge>;
//   };

//   // Feedback renderer
//   const FeedbackRenderer = (params: any) => {
//     const value = params.value?.toLowerCase() ?? "";
//     if (!value || value === "no response")
//       return <Badge className="bg-gray-100 text-gray-800">No Response</Badge>;
//     if (value === "positive")
//       return <Badge className="bg-green-300 text-green-800">Positive</Badge>;
//     if (value === "failure" || value === "negative")
//       return <Badge className="bg-red-100 text-red-800">Failure</Badge>;
//     return <Badge className="bg-gray-100 text-gray-800">{params.value}</Badge>;
//   };

//   // Link renderer
//   const LinkRenderer = (params: any) => {
//     const value = params.value;
//     if (!value) return <span className="text-gray-500">Not Available</span>;
//     const links = value
//       .split(/[,​\s]+/)
//       .map((link: string) => link.trim())
//       .filter((link: string) => link.length > 0);
//     if (links.length === 0) return <span className="text-gray-500">Not Available</span>;
//     return (
//       <div className="flex flex-col space-y-1">
//         {links.map((link: string, idx: number) => (
//           <a
//             key={idx}
//             href={link}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-blue-600 underline hover:text-blue-800"
//           >
//             {link}
//           </a>
//         ))}
//       </div>
//     );
//   };

//   // Columns
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", sortable: true, minWidth: 140 },
//       { field: "company", headerName: "Company", sortable: true, minWidth: 110, editable: true },
//       { field: "mode_of_interview", headerName: "Mode", maxWidth: 130, editable: true },
//       { field: "type_of_interview", headerName: "Type", maxWidth: 150, editable: true },
//       { field: "interview_date", headerName: "Date", maxWidth: 120, editable: true },
//       { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
//       { field: "backup_url", headerName: "Backup URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
//       { field: "url", headerName: "URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
//       { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, maxWidth: 130, editable: true },
//       { field: "interviewer_emails", headerName: "Emails", minWidth: 180, editable: true },
//       { field: "interviewer_contact", headerName: "Contact", minWidth: 140, editable: true },
//       { field: "notes", headerName: "Notes", minWidth: 120, editable: true },
//     ],
//     []
//   );

//   // Update existing row
//   const handleRowUpdated = async (updatedRow: any) => {
//     try {
//       const payload = {
//         candidate_id: updatedRow.candidate_id,
//         company: updatedRow.company,
//         mode_of_interview: updatedRow.mode_of_interview,
//         type_of_interview: updatedRow.type_of_interview,
//         interview_date: updatedRow.interview_date,
//         status: updatedRow.status,
//         feedback: updatedRow.feedback,
//         interviewer_emails: updatedRow.interviewer_emails,
//         interviewer_contact: updatedRow.interviewer_contact,
//         notes: updatedRow.notes,
//         recording_link: updatedRow.recording_link,
//         backup_url: updatedRow.backup_url,
//         url: updatedRow.url,
//       };
//       if (updatedRow.id) {
//         await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${updatedRow.id}`, payload);
//         fetchInterviews(page, perPage);
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update interview.");
//     }
//   };

//   // Delete row
//   const handleRowDeleted = async (row: any) => {
//     try {
//       if (row.id) await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${row.id}`);
//       setInterviews((prev) => prev.filter((r) => r !== row));
//     } catch (err) {
//       alert("Failed to delete interview.");
//     }
//   };

//   // Add new interview
//   const handleAddInterview = async () => {
//     if (!newInterview.candidate_id || !newInterview.company) {
//       alert("Candidate and Company are required!");
//       return;
//     }
//     try {
//           const payload: any = {
//         candidate_id: Number(newInterview.candidate_id),
//         company: newInterview.company,
//         interview_date: newInterview.interview_date, // yyyy-mm-dd format
//       };

//       // Only add optional fields if they have a value
//       if (newInterview.mode_of_interview) payload.mode_of_interview = newInterview.mode_of_interview;
//       if (newInterview.type_of_interview) payload.type_of_interview = newInterview.type_of_interview;
//       if (newInterview.interviewer_emails) payload.interviewer_emails = newInterview.interviewer_emails;
//       if (newInterview.interviewer_contact) payload.interviewer_contact = newInterview.interviewer_contact;
//       if (newInterview.notes) payload.notes = newInterview.notes;
//       if (newInterview.recording_link) payload.recording_link = newInterview.recording_link;
//       if (newInterview.backup_url) payload.backup_url = newInterview.backup_url;
//       if (newInterview.url) payload.url = newInterview.url;
//       if (newInterview.feedback) payload.feedback = newInterview.feedback;

//       const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/interviews`, payload);
//       setInterviews((prev) => [res.data, ...prev]);
//       setShowAddForm(false);
//       setNewInterview({
//         candidate_id: "",
//         company: "",
//         mode_of_interview: "",
//         type_of_interview: "",
//         interview_date: "",
//         feedback: "",
//         interviewer_emails: "",
//         interviewer_contact: "",
//         notes: "",
//         recording_link: "",
//         backup_url: "",
//         url: "",
//       });

//     } catch (err: any) {
//       console.error("Failed to add interview:", err.response?.data || err);
//       alert("Failed to add interview. Make sure all fields are valid.");
//     }
//   };

//   const totalPages = Math.ceil(total / perPage);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
//           <p className="text-gray-600 dark:text-gray-400">Candidates scheduled for interviews</p>
//         </div>
//         <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center" onClick={() => setShowAddForm(true)}>
//           <PlusIcon className="h-4 w-4 mr-2" /> Add Interview
//         </Button>
//       </div>

//       {/* Search */}
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             value={searchTerm}
//             placeholder="Search..."
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>

//       {/* Table */}
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">Loading...</p>
//       ) : error ? (
//         <p className="text-center mt-8 text-red-500">{error}</p>
//       ) : (
//         <div className="flex flex-col items-center w-full space-y-4">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredInterviews}
//               columnDefs={columnDefs}
//               title={`Interviews (${filteredInterviews.length})`}
//               height="500px"
//               showSearch={false}
//               onRowUpdated={handleRowUpdated}
//               onRowDeleted={handleRowDeleted}
//             />
//           </div>
//         </div>
//       )}

//       {/* Add Interview Modal */}
//       {/* {showAddForm && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Add Interview</h2>
//             <div className="space-y-3">
//               Candidate Dropdown
//               <select
//                 value={newInterview.candidate_id}
//                 onChange={(e) => setNewInterview({ ...newInterview, candidate_id: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Select Candidate (Marketing)</option>
//                 {marketingCandidates.map((candidate) => (
//                   <option key={candidate.id} value={candidate.id}>
//                     {candidate.full_name}
//                   </option>
//                 ))}
//               </select>

//               <Input
//                 placeholder="Company"
//                 value={newInterview.company}
//                 onChange={(e) => setNewInterview({ ...newInterview, company: e.target.value })}
//               />
//               <select
//                 value={newInterview.mode_of_interview}
//                 onChange={(e) => setNewInterview({ ...newInterview, mode_of_interview: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Mode of Interview</option>
//                 <option value="Virtual">Virtual</option>
//                 <option value="In Person">In Person</option>
//                 <option value="Phone">Phone</option>
//                 <option value="Assessment">Assessment</option>
//               </select>

//               <select
//                 value={newInterview.type_of_interview}
//                 onChange={(e) => setNewInterview({ ...newInterview, type_of_interview: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Type of Interview</option>
//                 <option value="Assessment">Assessment</option>
//                 <option value="Recruiter Call">Recruiter Call</option>
//                 <option value="Technical">Technical</option>
//                 <option value="HR Round">HR Round</option>
//                 <option value="In Person">In Person</option>
//                 <option value="Prep Call">Prep Call</option>
//               </select>

//               <Input
//                 placeholder="Interview Date"
//                 type="date"
//                 value={newInterview.interview_date}
//                 onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
//               />
//               <Input
//                 placeholder="Interviewer Emails"
//                 value={newInterview.interviewer_emails}
//                 onChange={(e) => setNewInterview({ ...newInterview, interviewer_emails: e.target.value })}
//               />
//               <Input
//                 placeholder="Interviewer Contact"
//                 value={newInterview.interviewer_contact}
//                 onChange={(e) => setNewInterview({ ...newInterview, interviewer_contact: e.target.value })}
//               />
//               <Input
//                 placeholder="Notes"
//                 value={newInterview.notes}
//                 onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
//               />
//               <Input
//                 placeholder="Recording Link"
//                 value={newInterview.recording_link}
//                 onChange={(e) => setNewInterview({ ...newInterview, recording_link: e.target.value })}
//               />
//               <Input
//                 placeholder="Backup URL"
//                 value={newInterview.backup_url}
//                 onChange={(e) => setNewInterview({ ...newInterview, backup_url: e.target.value })}
//               />
//               <Input
//                 placeholder="URL"
//                 value={newInterview.url}
//                 onChange={(e) => setNewInterview({ ...newInterview, url: e.target.value })}
//               />

//               <select
//                 value={newInterview.feedback}
//                 onChange={(e) => setNewInterview({ ...newInterview, feedback: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Feedback</option>
//                 <option value="Pending">Pending</option>
//                 <option value="Positive">Positive</option>
//                 <option value="Negative">Negative</option>
//               </select>
//             </div>
//             <div className="flex justify-end mt-6 space-x-3">
//               <button
//                 onClick={() => setShowAddForm(false)}
//                 className="px-4 py-2 bg-gray-300 rounded"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddInterview}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )} */}
//       {showAddForm && (
//   <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
//       <h2 className="text-xl font-bold mb-4">Add Interview</h2>
//       <div className="space-y-3">
//         {/* Candidate Dropdown */}
//         <select
//           value={newInterview.candidate_id}
//           onChange={(e) => setNewInterview({ ...newInterview, candidate_id: e.target.value })}
//           className="w-full p-2 border rounded"
//         >
//           <option value="">Select Candidate (Marketing)</option>
//           {marketingCandidates.map((candidate) => (
//             <option key={candidate.id} value={candidate.id}>
//               {candidate.full_name}
//             </option>
//           ))}
//         </select>

//         {/* Company */}
//         <Input
//           placeholder="Company"
//           value={newInterview.company}
//           onChange={(e) => setNewInterview({ ...newInterview, company: e.target.value })}
//         />

//         {/* Interview Date */}
//         <Input
//           placeholder="Interview Date"
//           type="date"
//           value={newInterview.interview_date}
//           onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
//         />
//       </div>

//       <div className="flex justify-end mt-6 space-x-3">
//         <button
//           onClick={() => setShowAddForm(false)}
//           className="px-4 py-2 bg-gray-300 rounded"
//         >
//           Cancel
//         </button>
//         <button
//           onClick={handleAddInterview}
//           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//         >
//           Save
//         </button>
//       </div>
//     </div>
//   </div>
// )}
//     </div>
//   );
// }





// "use client";
// import "@/styles/admin.css";
// import "@/styles/App.css";
// import { AGGridTable } from "@/components/AGGridTable";
// import { Button } from "@/components/admin_ui/button";
// import { Badge } from "@/components/admin_ui/badge";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { SearchIcon, PlusIcon } from "lucide-react";
// import { ColDef } from "ag-grid-community";
// import { useMemo, useState, useEffect, useCallback } from "react";
// import axios from "axios";

// export default function CandidatesInterviews() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [interviews, setInterviews] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);
//   const [perPage, setPerPage] = useState(50);
//   const [total, setTotal] = useState(0);

//   // Add Interview Modal State
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newInterview, setNewInterview] = useState<any>({
//     candidate_id: "",
//     company: "",
//     mode_of_interview: "",
//     type_of_interview: "",
//     interview_date: "",
//     feedback: "",
//     interviewer_emails: "",
//     interviewer_contact: "",
//     notes: "",
//     recording_link: "",
//     backup_url: "",
//     url: "",
//   });

//   // Marketing candidates
//   const [marketingCandidates, setMarketingCandidates] = useState<any[]>([]);
//   useEffect(() => {
//     const fetchMarketingCandidates = async () => {
//       try {
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_API_URL}/candidates/marketing/active`
//         );
//         setMarketingCandidates(Array.isArray(res.data) ? res.data : []);
//       } catch (err) {
//         console.error("Failed to fetch marketing candidates", err);
//         setMarketingCandidates([]);
//       }
//     };
//     fetchMarketingCandidates();
//   }, []);

//   // Fetch interviews
//   const fetchInterviews = async (page: number, perPage: number) => {
//     try {
//       setLoading(true);
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/interviews?page=${page}&per_page=${perPage}`
//       );
//       if (!res.ok) throw new Error("Failed to load interviews");
//       const data = await res.json();
//       setInterviews(data.items ?? data);
//       setTotal(data.total ?? data.length);
//     } catch (err) {
//       setError("Failed to load interviews.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchInterviews(page, perPage);
//   }, [page, perPage]);

//   // Search/filter
//   const filterData = useCallback(
//     (term: string) => {
//       if (!term.trim()) return interviews;
//       const lower = term.toLowerCase();
//       return interviews.filter((item) => {
//         if (item.candidate?.full_name?.toLowerCase().includes(lower)) return true;
//         return Object.values(item).some((val) =>
//           val?.toString().toLowerCase().includes(lower)
//         );
//       });
//     },
//     [interviews]
//   );
//   const filteredInterviews = filterData(searchTerm);

//   // Status renderer
//   const StatusRenderer = (params: any) => {
//     const v = params.value?.toLowerCase() ?? "";
//     const classes =
//       v === "cleared"
//         ? "bg-green-100 text-green-800"
//         : v === "rejected"
//         ? "bg-red-100 text-red-800"
//         : "bg-gray-100 text-gray-800";
//     return <Badge className={classes}>{params.value}</Badge>;
//   };

//   // Feedback renderer
//   const FeedbackRenderer = (params: any) => {
//     const value = params.value?.toLowerCase() ?? "";
//     if (!value || value === "no response")
//       return <Badge className="bg-gray-100 text-gray-800">No Response</Badge>;
//     if (value === "positive")
//       return <Badge className="bg-green-300 text-green-800">Positive</Badge>;
//     if (value === "failure" || value === "negative")
//       return <Badge className="bg-red-100 text-red-800">Failure</Badge>;
//     return <Badge className="bg-gray-100 text-gray-800">{params.value}</Badge>;
//   };

//   // Link renderer
//   const LinkRenderer = (params: any) => {
//     const value = params.value;
//     if (!value) return <span className="text-gray-500">Not Available</span>;
//     const links = value
//       .split(/[,​\s]+/)
//       .map((link: string) => link.trim())
//       .filter((link: string) => link.length > 0);
//     if (links.length === 0) return <span className="text-gray-500">Not Available</span>;
//     return (
//       <div className="flex flex-col space-y-1">
//         {links.map((link: string, idx: number) => (
//           <a
//             key={idx}
//             href={link}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-blue-600 underline hover:text-blue-800"
//           >
//             {link}
//           </a>
//         ))}
//       </div>
//     );
//   };

//   // Columns
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { field: "id", headerName: "ID", pinned: "left", width: 80 },
//       { field: "candidate.full_name", headerName: "Full Name", sortable: true, minWidth: 140 },
//       { field: "company", headerName: "Company", sortable: true, minWidth: 110, editable: true },
//       { field: "mode_of_interview", headerName: "Mode", maxWidth: 130, editable: true },
//       { field: "type_of_interview", headerName: "Type", maxWidth: 150, editable: true },
//       { field: "interview_date", headerName: "Date", maxWidth: 120, editable: true },
//       { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
//       { field: "backup_url", headerName: "Backup URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
//       // { field: "url", headerName: "URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
//       { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, maxWidth: 130, editable: true },
//       { field: "interviewer_emails", headerName: "Emails", minWidth: 180, editable: true },
//       { field: "interviewer_contact", headerName: "Contact", minWidth: 140, editable: true },
//       { field: "notes", headerName: "Notes", minWidth: 120, editable: true },
//     ],
//     []
//   );

//   // Add new interview
//   const handleAddInterview = async () => {
//     if (!newInterview.candidate_id || !newInterview.company || !newInterview.interview_date) {
//       alert("Candidate, Company, and Interview Date are required!");
//       return;
//     }
//     if (!newInterview.candidate_id || isNaN(newInterview.candidate_id)) {
//   alert("Please select a valid candidate!");
//   return;
// }

// if (!newInterview.company.trim()) {
//   alert("Company is required!");
//   return;
// }

// if (!newInterview.interview_date) {
//   alert("Interview Date is required!");
//   return;
// }


//     try {
//       const payload: any = {
//         candidate_id: Number(newInterview.candidate_id),
//         company: newInterview.company,
//         interview_date: newInterview.interview_date,
//         mode_of_interview: newInterview.mode_of_interview || null,
//         type_of_interview: newInterview.type_of_interview || null,
//         feedback: newInterview.feedback || null,
//         interviewer_emails: newInterview.interviewer_emails || null,
//         interviewer_contact: newInterview.interviewer_contact || null,
//         notes: newInterview.notes || null,
//         recording_link: newInterview.recording_link || null,
//         backup_url: newInterview.backup_url || null,
//         url: newInterview.url || null,
//       };

//       const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/interviews`, payload);
//       setInterviews((prev) => [res.data, ...prev]);
//       setShowAddForm(false);
//       setNewInterview({
//         candidate_id: "",
//         company: "",
//         mode_of_interview: "",
//         type_of_interview: "",
//         interview_date: "",
//         feedback: "",
//         interviewer_emails: "",
//         interviewer_contact: "",
//         notes: "",
//         recording_link: "",
//         backup_url: "",
//         url: "",
//       });
//     } catch (err: any) {
//       console.error("Failed to add interview:", err.response?.data || err);
//       alert(`Failed to add interview. ${JSON.stringify(err.response?.data)}`);
//     }
//   };

//   const totalPages = Math.ceil(total / perPage);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
//           <p className="text-gray-600 dark:text-gray-400">Candidates scheduled for interviews</p>
//         </div>
//         <Button
//           className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
//           onClick={() => setShowAddForm(true)}
//         >
//           <PlusIcon className="h-4 w-4 mr-2" /> Add Interview
//         </Button>
//       </div>

//       {/* Search */}
//       <div className="max-w-md">
//         <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Search
//         </Label>
//         <div className="relative mt-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             id="search"
//             type="text"
//             value={searchTerm}
//             placeholder="Search..."
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>

//       {/* Table */}
//       {loading ? (
//         <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">Loading...</p>
//       ) : error ? (
//         <p className="text-center mt-8 text-red-500">{error}</p>
//       ) : (
//         <div className="flex flex-col items-center w-full space-y-4">
//           <div className="w-full max-w-7xl">
//             <AGGridTable
//               rowData={filteredInterviews}
//               columnDefs={columnDefs}
//               title={`Interviews (${filteredInterviews.length})`}
//               height="500px"
//             />
//           </div>
//         </div>
//       )}

//       {/* Add Interview Modal */}
//       {showAddForm && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">Add Interview</h2>
//             <div className="space-y-3">
// <select
//   value={newInterview.candidate_id}
//   onChange={(e) =>
//     setNewInterview({ ...newInterview, candidate_id: Number(e.target.value) || null })
//   }
//   className="w-full p-2 border rounded"
// >
//   <option value="">Select Candidate (Marketing)</option>
//   {marketingCandidates.map((candidate) => (
//     <option key={candidate.id} value={candidate.id}>
//       {candidate.full_name}
//     </option>
//   ))}
// </select>


//               <Input
//                 placeholder="Company"
//                 value={newInterview.company}
//                 onChange={(e) => setNewInterview({ ...newInterview, company: e.target.value })}
//               />

//               <Input
//                 placeholder="Interview Date"
//                 type="date"
//                 value={newInterview.interview_date}
//                 onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
//               />

//               <select
//                 value={newInterview.mode_of_interview}
//                 onChange={(e) => setNewInterview({ ...newInterview, mode_of_interview: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Mode of Interview</option>
//                 <option value="Virtual">Virtual</option>
//                 <option value="In Person">In Person</option>
//                 <option value="Phone">Phone</option>
//                 <option value="Assessment">Assessment</option>
//               </select>

//               <select
//                 value={newInterview.type_of_interview}
//                 onChange={(e) => setNewInterview({ ...newInterview, type_of_interview: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Type of Interview</option>
//                 <option value="Assessment">Assessment</option>
//                 <option value="Recruiter Call">Recruiter Call</option>
//                 <option value="Technical">Technical</option>
//                 <option value="HR Round">HR Round</option>
//                 <option value="In Person">In Person</option>
//                 <option value="Prep Call">Prep Call</option>
//               </select>

//               <Input
//                 placeholder="Interviewer Emails"
//                 value={newInterview.interviewer_emails}
//                 onChange={(e) => setNewInterview({ ...newInterview, interviewer_emails: e.target.value })}
//               />

//               <Input
//                 placeholder="Interviewer Contact"
//                 value={newInterview.interviewer_contact}
//                 onChange={(e) => setNewInterview({ ...newInterview, interviewer_contact: e.target.value })}
//               />

//               <Input
//                 placeholder="Notes"
//                 value={newInterview.notes}
//                 onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
//               />

//               <Input
//                 placeholder="Recording Link"
//                 value={newInterview.recording_link}
//                 onChange={(e) => setNewInterview({ ...newInterview, recording_link: e.target.value })}
//               />

//               <Input
//                 placeholder="Backup URL"
//                 value={newInterview.backup_url}
//                 onChange={(e) => setNewInterview({ ...newInterview, backup_url: e.target.value })}
//               />

//               <Input
//                 placeholder="URL"
//                 value={newInterview.url}
//                 onChange={(e) => setNewInterview({ ...newInterview, url: e.target.value })}
//               />

//               <select
//                 value={newInterview.feedback}
//                 onChange={(e) => setNewInterview({ ...newInterview, feedback: e.target.value })}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="">Feedback</option>
//                 <option value="Pending">Pending</option>
//                 <option value="Positive">Positive</option>
//                 <option value="Negative">Negative</option>
//               </select>
//             </div>

//             <div className="flex justify-end mt-6 space-x-3">
//               <button
//                 onClick={() => setShowAddForm(false)}
//                 className="px-4 py-2 bg-gray-300 rounded"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddInterview}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }







"use client";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function CandidatesInterviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // Add Interview Modal State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInterview, setNewInterview] = useState<any>({
    candidate_id: "",
    company: "",
    interview_date: "",
  });

  // Marketing candidates
  const [marketingCandidates, setMarketingCandidates] = useState<any[]>([]);
  useEffect(() => {
    const fetchMarketingCandidates = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/candidates/marketing/active`
        );
        setMarketingCandidates(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch marketing candidates", err);
        setMarketingCandidates([]);
      }
    };
    fetchMarketingCandidates();
  }, []);

  // Fetch interviews
  const fetchInterviews = async (page: number, perPage: number) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/interviews?page=${page}&per_page=${perPage}`
      );
      if (!res.ok) throw new Error("Failed to load interviews");
      const data = await res.json();
      setInterviews(data.items ?? data);
      setTotal(data.total ?? data.length);
    } catch (err) {
      setError("Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews(page, perPage);
  }, [page, perPage]);

  // Search/filter
  const filterData = useCallback(
    (term: string) => {
      if (!term.trim()) return interviews;
      const lower = term.toLowerCase();
      return interviews.filter((item) => {
        if (item.candidate?.full_name?.toLowerCase().includes(lower)) return true;
        return Object.values(item).some((val) =>
          val?.toString().toLowerCase().includes(lower)
        );
      });
    },
    [interviews]
  );
  const filteredInterviews = filterData(searchTerm);

  // Status renderer
  const StatusRenderer = (params: any) => {
    const v = params.value?.toLowerCase() ?? "";
    const classes =
      v === "cleared"
        ? "bg-green-100 text-green-800"
        : v === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";
    return <Badge className={classes}>{params.value}</Badge>;
  };

  // Feedback renderer
  const FeedbackRenderer = (params: any) => {
    const value = params.value?.toLowerCase() ?? "";
    if (!value || value === "no response")
      return <Badge className="bg-gray-100 text-gray-800">No Response</Badge>;
    if (value === "positive")
      return <Badge className="bg-green-300 text-green-800">Positive</Badge>;
    if (value === "failure" || value === "negative")
      return <Badge className="bg-red-100 text-red-800">Failure</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{params.value}</Badge>;
  };

  // Link renderer
  const LinkRenderer = (params: any) => {
    const value = params.value;
    if (!value) return <span className="text-gray-500">Not Available</span>;
    const links = value
      .split(/[,​\s]+/)
      .map((link: string) => link.trim())
      .filter((link: string) => link.length > 0);
    if (links.length === 0) return <span className="text-gray-500">Not Available</span>;
    return (
      <div className="flex flex-col space-y-1">
        {links.map((link: string, idx: number) => (
          <a
            key={idx}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {link}
          </a>
        ))}
      </div>
    );
  };

  // Columns
  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "id", headerName: "ID", pinned: "left", width: 80 },
    { field: "candidate.full_name", headerName: "Full Name", sortable: true, minWidth: 140 },
    { field: "company", headerName: "Company", sortable: true, minWidth: 110, editable: true },
    { field: "mode_of_interview", headerName: "Mode", maxWidth: 130, editable: true },
    { field: "type_of_interview", headerName: "Type", maxWidth: 150, editable: true },
    { field: "interview_date", headerName: "Date", maxWidth: 120, editable: true },
    { field: "recording_link", headerName: "Recording", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
    { field: "backup_url", headerName: "Backup URL", cellRenderer: LinkRenderer, minWidth: 200, editable: true },
    { field: "feedback", headerName: "Feedback", cellRenderer: FeedbackRenderer, maxWidth: 130, editable: true },
    { field: "interviewer_emails", headerName: "Emails", minWidth: 180, editable: true },
    { field: "interviewer_contact", headerName: "Contact", minWidth: 140, editable: true },
    { field: "notes", headerName: "Notes", minWidth: 120, editable: true },
  ], []);

  // Add new interview
  const handleAddInterview = async () => {
    if (!newInterview.candidate_id || !newInterview.company || !newInterview.interview_date) {
      alert("Candidate, Company, and Interview Date are required!");
      return;
    }

    try {
      const payload = {
        candidate_id: Number(newInterview.candidate_id),
        company: newInterview.company,
        interview_date: newInterview.interview_date,
        mode_of_interview:newInterview.mode_of_interview
      };

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/interviews`, payload);
      setInterviews((prev) => [res.data, ...prev]);
      setShowAddForm(false);
      setNewInterview({ candidate_id: "", company: "", interview_date: "" });
    } catch (err: any) {
      console.error("Failed to add interview:", err.response?.data || err);
      alert(`Failed to add interview. ${JSON.stringify(err.response?.data)}`);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
          <p className="text-gray-600 dark:text-gray-400">Candidates scheduled for interviews</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          onClick={() => setShowAddForm(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" /> Add Interview
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Search..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">Loading...</p>
      ) : error ? (
        <p className="text-center mt-8 text-red-500">{error}</p>
      ) : (
        <div className="flex flex-col items-center w-full space-y-4">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredInterviews}
              columnDefs={columnDefs}
              title={`Interviews (${filteredInterviews.length})`}
              height="500px"
            />
          </div>
        </div>
      )}

      {/* Add Interview Modal - Required Fields Only */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Interview</h2>
            <div className="space-y-3">
              {/* Candidate Selection */}
              <select
                value={newInterview.candidate_id}
                onChange={(e) =>
                  setNewInterview({ ...newInterview, candidate_id: Number(e.target.value) || null })
                }
                className="w-full p-2 border rounded"
              >
                <option value="">Select Candidate (Marketing)</option>
                {marketingCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.full_name}
                  </option>
                ))}
              </select>

              {/* Company */}
              <Input
                placeholder="Company"
                value={newInterview.company}
                onChange={(e) => setNewInterview({ ...newInterview, company: e.target.value })}
              />

              {/* Interview Date */}
              <Input
                placeholder="Interview Date"
                type="date"
                value={newInterview.interview_date}
                onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInterview}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
