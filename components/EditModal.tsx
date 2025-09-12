// "use client";
// import React from "react";

// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Label } from "@/components/admin_ui/label";
// import { Input } from "@/components/admin_ui/input";
// import { Textarea } from "@/components/admin_ui/textarea";

// interface EditModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: Record<string, any>;
//   title: string;
//   onSave: (updatedData: Record<string, any>) => void;
// }

// const excludedFields = [
//   "id",
//   "sessionid",
//   "vendor_type",
//   "lastmoddatetime",
//   "last_modified",
//   "logincount",
//   "googleId",
// ];

// const fieldSections: Record<string, string> = {
//   id: "Basic Information",
//   alias: "Basic Information",
//   Fundamentals: "Basic Information",
//   AIML: "Basic Information",
//   full_name: "Basic Information",
//   extraction_date: "Basic Information",
//   filename: "Basic Information",
//   type: "Professional Information",
//   email: "Contact Information",
//   company_name: "Basic Information",
//   linkedin_id: "Contact Information",
//   status: "Basic Information",
//   linkedin_connected: "Professional Information",
//   intro_email_sent: "Professional Information",
//   intro_call: "Professional Information",
//   moved_to_vendor: "Professional Information",
//   phone_number: "Contact Information",
//   secondary_phone: "Contact Information",
//   location: "Contact Information",
//   agreement: "Professional Information",
//   sessionid: "Basic Information",
//   subject_id: "Basic Information",
//   subjectid: "Professional Information",
//   courseid: "Professional Information",
//   candidateid: "Basic Information",
//   uname: "Basic Information",
//   fullname: "Basic Information",
//   candidate_id: "Basic Information",
//   candidate_email: "Basic Information",
//   placement_date: "Basic Information",
//   batch: "Basic Information",
//   leadid: "Basic Information",
//   name: "Basic Information",
//   candidate_name: "Basic Information",
//   candidate_role: "Basic Information",
//   dob: "Basic Information",
//   contact: "Basic Information",
//   secondaryphone: "Contact Information",
//   phone: "Contact Information",
//   secondaryemail: "Contact Information",
//   ssn: "Professional Information",
//   priority: "Basic Information",
//   source: "Basic Information",
//   subject: "Basic Information",
//   title: "Basic Information",
//   enrolleddate: "Basic Information",
//   orientationdate: "Basic Information",
//   batchname: "Basic Information",
//   batchid: "Professional Information",
//   promissory: "Basic Information",
//   lastlogin: "Professional Information",
//   logincount: "Professional Information",
//   course: "Professional Information",
//   course_id: "Professional Information",
//   registereddate: "Professional Information",
//   company: "Professional Information",
//   client_id: "Professional Information",
//   client_name: "Professional Information",
//   interview_time: "Professional Information",
//   vendor_or_client_name: "Professional Information",
//   vendor_or_client_contact: "Professional Information",
//   marketing_email_address: "Professional Information",
//   interview_date: "Professional Information",
//   interview_mode: "Professional Information",
//   visa_status: "Professional Information",
//   work_status: "Professional Information",
//   workstatus: "Professional Information",
//   message: "Professional Information",
//   education: "Professional Information",
//   workexperience: "Professional Information",
//   faq: "Professional Information",
//   callsmade: "Professional Information",
//   feepaid: "Professional Information",
//   feedue: "Professional Information",
//   salary0: "Professional Information",
//   salary6: "Professional Information",
//   salary12: "Professional Information",
//   instructor: "Professional Information",
//   second_instructor: "Professional Information",
//   marketing_startdate: "Professional Information",
//   recruiterassesment: "Professional Information",
//   statuschangedate: "Professional Information",
//   closed: "Professional Information",
//   aadhaar: "Basic Information",
//   secondary_email: "Contact Information",
//   massemail_email_sent: "Professional Information",
//   massemail_unsubscribe: "Professional Information",
//   moved_to_candidate: "Professional Information",
//   link: "Professional Information",
//   videoid: "Professional Information",
//   address: "Contact Information",
//   city: "Contact Information",
//   state: "Contact Information",
//   country: "Contact Information",
//   zip: "Contact Information",
//   emergcontactname: "Emergency Contact",
//   emergcontactemail: "Emergency Contact",
//   emergcontactphone: "Emergency Contact",
//   emergcontactaddrs: "Emergency Contact",
//   spousename: "Emergency Contact",
//   spousephone: "Emergency Contact",
//   spouseemail: "Emergency Contact",
//   spouseoccupationinfo: "Emergency Contact",
//   notes: "Notes",
// };

// const workVisaStatusOptions = [
//   { value: "citizen", label: "Citizen" },
//   { value: "visa", label: "Visa" },
//   { value: "f1", label: "F1" },
//   { value: "other", label: "Other" },
//   { value: "green card", label: "Green Card" },
//   { value: "permanent resident", label: "Permanent Resident" },
//   { value: "h1b", label: "H1B" },
//   { value: "ead", label: "EAD" },
//   { value: "waiting for status", label: "Waiting for Status" },
// ];

// const vendorStatuses = [
//   { value: "active", label: "Active" },
//   { value: "working", label: "Working" },
//   { value: "not_useful", label: "Not Useful" },
//   { value: "do_not_contact", label: "Do Not Contact" },
//   { value: "inactive", label: "Inactive" },
//   { value: "prospect", label: "Prospect" },
// ];

// // Enum dropdown options
// const enumOptions: Record<string, { value: string; label: string }[]> = {
//   type: [
//     { value: "client", label: "Client" },
//     { value: "third-party-vendor", label: "Third Party Vendor" },
//     { value: "implementation-partner", label: "Implementation Partner" },
//     { value: "sourcer", label: "Sourcer" },
//     { value: "contact-from-ip", label: "Contact from IP" },
//   ],
//   linkedin_connected: [
//     { value: "yes", label: "Yes" },
//     { value: "no", label: "No" },
//   ],
//   intro_email_sent: [
//     { value: "yes", label: "Yes" },
//     { value: "no", label: "No" },
//   ],
//   intro_call: [
//     { value: "yes", label: "Yes" },
//     { value: "no", label: "No" },
//   ],
//   moved_to_vendor: [
//     { value: "true", label: "Yes" },
//     { value: "false", label: "No" },
//   ],
//   moved_to_candidate: [
//     { value: "true", label: "Yes" },
//     { value: "false", label: "No" },
//   ],
//   mass_email_sent: [
//     { value: "true", label: "Yes" },
//     { value: "false", label: "No" },
//   ],
//   massemail_unsubscribe: [
//     { value: "true", label: "Yes" },
//     { value: "false", label: "No" },
//   ],
//   status: [
//     { value: "active", label: "Active" },
//     { value: "inactive", label: "Inactive" },
//     { value: "break", label: "Break" },
//     { value: "discontinued", label: "Discontinued" },
//     { value: "closed", label: "Closed" },
//   ],
//   work_status: workVisaStatusOptions,
//   workstatus: workVisaStatusOptions,
//   visa_status: workVisaStatusOptions,
// };

// // Custom label overrides
// const labelOverrides: Record<string, string> = {
//   id: "ID",
//   subject_id: "Subject ID",
//   subjectid: "Subject ID",
//   new_subject_id: "New Subject ID",
//   sessionid: "ID",
//   courseid: "Course ID",
//   course_id: "Course ID",
//   candidateid: "Candidate ID",
//   batchid: "Batch ID",
//   candidate_id: "Candidate ID",
//   candidate_email: "Candidate Email",
//   uname: "Email",
//   fullname: "Full Name",
//   ssn: "SSN",
//   dob: "Date of Birth",
//   phone: "Phone",
//   batchname: "Batch Name",
//   secondaryphone: "Secondary Phone",
//   email: "Email",
//   videoid: "Video ID",
//   secondaryemail: "Secondary Email",
//   classdate: "Class Date",
//   filename: "File Name",
//   visa_status: "Visa Status",
//   work_status: "Work Status",
//   workstatus: "Work Status",
//   lastlogin: "Last Login",
//   logincount: "Login Count",
//   level3date: "Level 3 Date",
//   orientationdate: "Orientation Date",
//   enddate: "End Date",
//   startdate: "Start Date",
//   sessiondate: "Session Date",
//   lastmoddatetime: "Last Mod DateTime",
//   registereddate: "Registered Date",
// };

// // Fields that should use a date picker
// const dateFields = [
//   "orientationdate",
//   "startdate",
//   "enddate",
//   "closed_date",
//   "entry_date",
//   "created_at",
//   "classdate",
//   "sessiondate",
// ];

// export function EditModal({
//   isOpen,
//   onClose,
//   data,
//   title,
//   onSave,
// }: EditModalProps) {
//   if (!data) return null;

//   const [formData, setFormData] = React.useState<Record<string, any>>(data);

//   React.useEffect(() => {
//     setFormData(data);
//   }, [data]);

//   const handleChange = (key: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const toLabel = (key: string) => {
//     if (labelOverrides[key]) return labelOverrides[key];

//     return key
//       .replace(/([A-Z])/g, " $1")
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (l) => l.toUpperCase());
//   };

//   // Organize fields into sections
//   const sectionedFields: Record<string, { key: string; value: any }[]> = {
//     "Basic Information": [],
//     "Professional Information": [],
//     "Contact Information": [],
//     "Emergency Contact": [],
//     "Other": [],
//     "Notes": [],
//   };

//   Object.entries(formData).forEach(([key, value]) => {
//     if (excludedFields.includes(key)) return;
//     if (key === "id") return;
//     const section = fieldSections[key] || "Other";
//     if (!sectionedFields[section]) sectionedFields[section] = [];
//     sectionedFields[section].push({ key, value });
//   });

//   const visibleSections = Object.keys(sectionedFields).filter(
//     (section) => sectionedFields[section]?.length > 0
//   );

//   const columnCount = Math.min(visibleSections.length, 4);

//   const modalWidthClass = {
//     1: "max-w-xl",
//     2: "max-w-3xl",
//     3: "max-w-5xl",
//     4: "max-w-6xl",
//   }[columnCount] || "max-w-6xl";

//   const gridColsClass = {
//     1: "grid-cols-1",
//     2: "md:grid-cols-2",
//     3: "md:grid-cols-3",
//     4: "lg:grid-cols-4 md:grid-cols-2",
//   }[columnCount] || "lg:grid-cols-4 md:grid-cols-2";

//   const isVendorModal = title.toLowerCase().includes("vendor");
//   const isVendorTable = title.toLowerCase().includes("vendor"); 

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent
//         className={`${modalWidthClass} max-h-[80vh] overflow-y-auto p-0`}
//       >
//         {/* Header */}
//         <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             {title} - Edit Details
//           </DialogTitle>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 dark:hover:text-white focus:outline-none"
//             aria-label="Close"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-5 w-5"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>
//         </div>

//         {/* Content */}
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             onSave(formData);
//             onClose();
//           }}
//         >
//           {/* Grid Sections except Notes */}
//           <div className={`grid ${gridColsClass} gap-6 p-6`}>
//             {visibleSections
//               .filter((section) => section !== "Notes")
//               .map((section) => (
//                 <div key={section} className="space-y-4">
//                   <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//                     {section}
//                   </h3>
//                   {sectionedFields[section].map(({ key, value }) => {
//                     const isTypeField = key.toLowerCase() === "type";

//                     return (
//                       <div key={key} className="space-y-1">
//                         <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                           {toLabel(key)}
//                         </Label>

//                         {dateFields.includes(key.toLowerCase()) ? (
//                           <input
//                             type="date"
//                             value={
//                               formData[key] &&
//                               !isNaN(new Date(formData[key]).getTime())
//                                 ? new Date(formData[key])
//                                     .toISOString()
//                                     .split("T")[0]
//                                 : new Date().toISOString().split("T")[0]
//                             }
//                             onChange={(e) => handleChange(key, e.target.value)}
//                             className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                           />
//                                                 ) : key.toLowerCase() === "status" && isVendorTable ? (
//                         <select
//                           value={String(formData[key] ?? "")}
//                           onChange={(e) => handleChange(key, e.target.value)}
//                           className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                         >
//                           {vendorStatuses.map((opt) => (
//                             <option key={opt.value} value={opt.value}>
//                               {opt.label}
//                             </option>
//                           ))}
//                         </select>
                        
//                         ) : isTypeField && isVendorModal ? (
//                           // Vendor modal → type is dropdown
//                           <select
//                             value={String(formData[key] ?? "")}
//                             onChange={(e) => handleChange(key, e.target.value)}
//                             className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                           >
//                             {enumOptions["type"].map((opt) => (
//                               <option key={opt.value} value={opt.value}>
//                                 {opt.label}
//                               </option>
//                             ))}
//                           </select>
//                         ) : isTypeField && !isVendorModal ? (
//                           // Non-vendor modal → type is input
//                           <Input
//                             value={formData[key] ?? ""}
//                             onChange={(e) => handleChange(key, e.target.value)}
//                           />
//                         ) : enumOptions[key.toLowerCase()] ? (
//                           <select
//                             value={String(formData[key] ?? "")}
//                             onChange={(e) =>
//                               handleChange(
//                                 key,
//                                 e.target.value === "true"
//                                   ? true
//                                   : e.target.value === "false"
//                                   ? false
//                                   : e.target.value
//                               )
//                             }
//                             className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                           >
//                             {enumOptions[key.toLowerCase()].map((opt) => (
//                               <option key={opt.value} value={opt.value}>
//                                 {opt.label}
//                               </option>
//                             ))}
//                           </select>
//                         ) : typeof value === "string" && value.length > 100 ? (
//                           <Textarea
//                             value={formData[key] || ""}
//                             onChange={(e) => handleChange(key, e.target.value)}
//                           />
//                         ) : (
//                           <Input
//                             value={formData[key] ?? ""}
//                             onChange={(e) => handleChange(key, e.target.value)}
//                           />
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               ))}
//           </div>

//           {/* Notes Section */}
//           {sectionedFields["Notes"].length > 0 && (
//             <div className="px-6 pb-6">
//               <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//                 Notes
//               </h3>
//               <div className="space-y-6 mt-4">
//                 {sectionedFields["Notes"].map(({ key, value }) => (
//                   <div key={key} className="space-y-1">
//                     <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                       {toLabel(key)}
//                     </Label>
//                     <Textarea
//                       value={formData[key] || ""}
//                       onChange={(e) => handleChange(key, e.target.value)}
//                       className="w-full"
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Footer */}
//           <div className="flex justify-end px-6 pb-6">
//             <button
//               type="submit"
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }
//---------updated editmodal-----11/9/25
// "use client";
// import React from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Label } from "@/components/admin_ui/label";
// import { Input } from "@/components/admin_ui/input";
// import { Textarea } from "@/components/admin_ui/textarea";
// import axios from "axios";

// interface EditModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: Record<string, any>;
//   title: string;
//   onSave: (updatedData: Record<string, any>) => void;
// }

// const excludedFields = [
//   "id",
//   "sessionid",
//   "vendor_type",
//   "lastmoddatetime",
//   "last_modified",
//   "logincount",
//   "googleId",
//   "subject_id",
//   "course_id",
//   "new_subject_id",
// ];

// const fieldSections: Record<string, string> = {
//   id: "Basic Information",
//   alias: "Basic Information",
//   Fundamentals: "Basic Information",
//   AIML: "Basic Information",
//   full_name: "Basic Information",
//   extraction_date: "Basic Information",
//   filename: "Basic Information",
//   type: "Professional Information",
//   email: "Basic Information",
//   company_name: "Basic Information",
//   linkedin_id: "Contact Information",
//   enrolled_date: "Professional Information",
//   startdate: "Professional Information",
//   status: "Basic Information",
//   linkedin_connected: "Professional Information",
//   intro_email_sent: "Professional Information",
//   intro_call: "Professional Information",
//   moved_to_vendor: "Professional Information",
//   phone_number: "Basic Information",
//   secondary_phone: "Contact Information",
//   location: "Contact Information",
//   agreement: "Professional Information",
//   sessionid: "Basic Information",
//   subject_id: "Basic Information",
//   subjectid: "Professional Information",
//   courseid: "Professional Information",
//   candidateid: "Basic Information",
//   uname: "Basic Information",
//   fullname: "Basic Information",
//   candidate_id: "Basic Information",
//   candidate_email: "Basic Information",
//   placement_date: "Basic Information",
//   batch: "Basic Information",
//   leadid: "Basic Information",
//   name: "Basic Information",
//   enddate: "Professional Information",
//   candidate_name: "Basic Information",
//   candidate_role: "Basic Information",
//   dob: "Basic Information",
//   contact: "Basic Information",
//   end_date: "Professional Information",
//   secondaryphone: "Contact Information",
//   phone: "Basic Information",
//   secondaryemail: "Contact Information",
//   ssn: "Professional Information",
//   priority: "Basic Information",
//   source: "Basic Information",
//   subject: "Basic Information",
//   title: "Basic Information",
//   enrolleddate: "Basic Information",
//   orientationdate: "Basic Information",
//   batchname: "Basic Information",
//   batchid: "Contact Information",
//   promissory: "Basic Information",
//   lastlogin: "Professional Information",
//   logincount: "Professional Information",
//   course: "Professional Information",
//   course_id: "Professional Information",
//   registereddate: "Professional Information",
//   company: "Professional Information",
//   client_id: "Professional Information",
//   client_name: "Professional Information",
//   interview_time: "Professional Information",
//   vendor_or_client_name: "Professional Information",
//   vendor_or_client_contact: "Professional Information",
//   marketing_email_address: "Professional Information",
//   interview_date: "Professional Information",
//   interview_mode: "Professional Information",
//   visa_status: "Professional Information",
//   workstatus: "Basic Information",
//   message: "Professional Information",
//   education: "Professional Information",
//   workexperience: "Professional Information",
//   faq: "Professional Information",
//   callsmade: "Professional Information",
//   fee_paid: "Basic Information",
//   feedue: "Professional Information",
//   salary0: "Professional Information",
//   salary6: "Professional Information",
//   salary12: "Professional Information",
//   instructor: "Professional Information",
//   second_instructor: "Professional Information",
//   marketing_startdate: "Professional Information",
//   recruiterassesment: "Professional Information",
//   statuschangedate: "Professional Information",
//   aadhaar: "Basic Information",
//   entry_date: "Professional Information",
//   closed_date: "Professional Information",
//   closed: "Professional Information",
//   secondary_email: "Contact Information",
//   massemail_email_sent: "Contact Information",
//   massemail_unsubscribe: "Contact Information",
//   moved_to_candidate: "Contact Information",
//   link: "Professional Information",
//   videoid: "Professional Information",
//   address: "Professional Information",
//   candidate_folder: "Professional Information",
//   city: "Contact Information",
//   state: "Contact Information",
//   country: "Contact Information",
//   zip: "Contact Information",
//   emergcontactname: "Emergency Contact",
//   emergcontactemail: "Emergency Contact",
//   emergcontactphone: "Emergency Contact",
//   emergcontactaddrs: "Emergency Contact",
//   spousename: "Emergency Contact",
//   spousephone: "Emergency Contact",
//   spouseemail: "Emergency Contact",
//   spouseoccupationinfo: "Emergency Contact",
//   notes: "Notes",
//   course_name: "Professional Information",
//   subject_name: "Basic Information",
// };

// const workVisaStatusOptions = [
//   { value: "waiting for status", label: "Waiting for Status" },
//   { value: "citizen", label: "Citizen" },
//   { value: "f1", label: "F1" },
//   { value: "other", label: "Other" },
//   { value: "permanent resident", label: "Permanent Resident" },
//   { value: "h4", label: "H4" },
//   { value: "ead", label: "EAD" },

// ];
// const vendorStatuses = [
//   { value: "active", label: "Active" },
//   { value: "working", label: "Working" },
//   { value: "not_useful", label: "Not Useful" },
//   { value: "do_not_contact", label: "Do Not Contact" },
//   { value: "inactive", label: "Inactive" },
//   { value: "prospect", label: "Prospect" },
// ];

// const enumOptions: Record<string, { value: string; label: string }[]> = {
//   type: [
//     { value: "client", label: "Client" },
//     { value: "third-party-vendor", label: "Third Party Vendor" },
//     { value: "implementation-partner", label: "Implementation Partner" },
//     { value: "sourcer", label: "Sourcer" },
//     { value: "contact-from-ip", label: "Contact from IP" },
//   ],
//   linkedin_connected: [
//     { value: "no", label: "No" },
//     { value: "yes", label: "Yes" },

//   ],
//   intro_email_sent: [
//     { value: "no", label: "No" },
//     { value: "yes", label: "Yes" },

//   ],
//   intro_call: [
//     { value: "no", label: "No" },
//     { value: "yes", label: "Yes" },

//   ],
//   moved_to_vendor: [
//     { value: "true", label: "Yes" },
//     { value: "false", label: "No" },
//   ],
//   moved_to_candidate: [
//     { value: "false", label: "No" },
//     { value: "true", label: "Yes" },

//   ],
//   massemail_email_sent: [
//     { value: "false", label: "No" },
//     { value: "true", label: "Yes" },

//   ],
//   mass_email_sent: [
//     { value: "false", label: "No" },
//     { value: "true", label: "Yes" },
//   ],
//   massemail_unsubscribe: [
//     { value: "false", label: "No" },
//     { value: "true", label: "Yes" },

//   ],

//   agreement: [
//     { value: "false", label: "No" },
//     { value: "true", label: "Yes" },

//   ],
//   status: [
//     { value: "active", label: "Active" },
//     { value: "inactive", label: "Inactive" },
//     { value: "break", label: "Break" },
//     { value: "discontinued", label: "Discontinued" },
//     { value: "closed", label: "Closed" },
//   ],
//   work_status: workVisaStatusOptions,
//   workstatus: workVisaStatusOptions,
//   visa_status: workVisaStatusOptions,
// };

// const labelOverrides: Record<string, string> = {
//   id: "ID",
//   subject_id: "Subject ID",
//   subjectid: "Subject ID",
//   new_subject_id: "New Subject ID",
//   sessionid: "ID",
//   courseid: "Course ID",
//   course_id: "Course ID",
//   candidateid: "Candidate ID",
//   batchid: "Batch",
//   candidate_id: "Candidate ID",
//   candidate_email: "Candidate Email",
//   uname: "Email",
//   fullname: "Full Name",
//   ssn: "SSN",
//   dob: "Date of Birth",
//   phone: "Phone",
//   batchname: "Batch Name",
//   secondaryphone: "Secondary Phone",
//   email: "Email",
//   videoid: "Video ID",
//   secondaryemail: "Secondary Email",
//   classdate: "Class Date",
//   filename: "File Name",
//   visa_status: "Visa Status",
//   work_status: "Work Status",
//   workstatus: "Work Status",
//   lastlogin: "Last Login",
//   logincount: "Login Count",
//   level3date: "Level 3 Date",
//   orientationdate: "Orientation Date",
//   enddate: "End Date",
//   startdate: "Start Date",
//   sessiondate: "Session Date",
//   lastmoddatetime: "Last Mod DateTime",
//   registereddate: "Registered Date",
//   massemail_email_sent: "Massemail Email Sent",
//   massemail_unsubscribe: "Massemail Unsubscribe",
//   moved_to_candidate: "Moved To Candidate",
//   emergcontactname: "Contact Name",
//   candidate_folder: "Candidate Folder Link",
//   emergcontactphone: "Contact Phone",
//   emergcontactemail: "Contact Email",
//   emergcontactaddrs: "Contact Address",
//   course_name:"Course Name",
//   subject_name:"Subject Name ",
// };

// const dateFields = [
//   "orientationdate",
//   "startdate",
//   "enddate",
//   "closed_date",
//   "entry_date",
//   "created_at",
//   "classdate",
//   "sessiondate",
//   "enrolled_date"
// ];

// export function EditModal({
//   isOpen,
//   onClose,
//   data,
//   title,
//   onSave,
  
// }: EditModalProps) {
  
//   const [formData, setFormData] = React.useState<Record<string, any>>(data);
//   const [batches, setBatches] = React.useState<any[]>([]);
//   const [courses, setCourses] = React.useState<any[]>([]); 
//   const [batchLoading, setBatchLoading] = React.useState(false);
//   const [courseLoading, setCourseLoading] = React.useState(false);
//   const [batchError, setBatchError] = React.useState<string | null>(null);
//   const [courseError, setCourseError] = React.useState<string | null>(null);

//   React.useEffect(() => {
//     if (data) { 
//       setFormData(data); 
//     }
//   }, [data]);


//   React.useEffect(() => {
//     if (isOpen) {
//       const fetchBatches = async () => {
//         setBatchLoading(true);
//         setBatchError(null);
//         try {
//           const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/batches`);
//           console.log("Fetched batches:", res.data?.data);
//           setBatches(res.data?.data || []);
//         } catch (e: any) {
//           console.error("Failed to fetch batches:", e);
//           setBatchError(e.response?.data?.message || "Failed to load batches");
//         } finally {
//           setBatchLoading(false);
//         }
//       };
       
//       const fetchCourses = async () => {
//         setCourseLoading(true);
//         setCourseError(null);
//         try {
//           const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`);
//           console.log("Fetched courses:", res.data);
//           setCourses(res.data || []);
//         } catch (e: any) {
//           console.error("Failed to fetch courses:", e);
//           setCourseError(e.response?.data?.message || "Failed to load courses");
//         } finally {
//           setCourseLoading(false);
//         }
//       };

     
//       fetchCourses();



//       fetchBatches();
//     }
//   }, [isOpen]);

//   if (!data) return null;



//   const handleChange = (key: string, value: any) => {
//     setFormData((prev) => {
//       const newData = { ...prev, [key]: value };
//       // If status is set to "closed" and closed_date is not set, set it to current date
//       if (key === "status" && value === "closed" && !prev.closed_date) {
//         newData["closed_date"] = new Date().toISOString().split("T")[0];
//       }
//       return newData;
//     });
//   };

//   const handleSave = (updatedData: Record<string, any>) => {
//     // Ensure closed_date is included in the saved data
//     console.log("Saving:", updatedData);
//     // Call your API to save updatedData
//   };


//   const toLabel = (key: string) => {
//     if (labelOverrides[key]) return labelOverrides[key];
//     return key
//       .replace(/([A-Z])/g, " $1")
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (l) => l.toUpperCase());
//   };

//   const sectionedFields: Record<string, { key: string; value: any }[]> = {
//     "Basic Information": [],
//     "Professional Information": [],
//     "Contact Information": [],
//     "Emergency Contact": [],
//     "Other": [],
//     "Notes": [],
//   };

//   Object.entries(formData).forEach(([key, value]) => {
//     if (excludedFields.includes(key)) return;
//     if (key === "id") return;
//     const section = fieldSections[key] || "Other";
//     if (!sectionedFields[section]) sectionedFields[section] = [];
//     sectionedFields[section].push({ key, value });
//   });

//   const visibleSections = Object.keys(sectionedFields).filter(
//     (section) => sectionedFields[section]?.length > 0 && section !== "Notes"
//   );


//   const columnCount = Math.min(visibleSections.length, 4);
//   const modalWidthClass = {
//     1: "max-w-xl",
//     2: "max-w-3xl",
//     3: "max-w-5xl",
//     4: "max-w-6xl",
//   }[columnCount] || "max-w-6xl";

//   const gridColsClass = {
//     1: "grid-cols-1",
//     2: "md:grid-cols-2",
//     3: "md:grid-cols-3",
//     4: "lg:grid-cols-4 md:grid-cols-2",
//   }[columnCount] || "lg:grid-cols-4 md:grid-cols-2";

//   const isVendorModal = title.toLowerCase().includes("vendor");
//   const isVendorTable = title.toLowerCase().includes("vendor");

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent
//         className={`${modalWidthClass} max-h-[80vh] overflow-y-auto p-0`}
//       >
//         {/* Header */}
//         <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             {title} - Edit Details
//           </DialogTitle>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 dark:hover:text-white focus:outline-none"
//             aria-label="Close"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-5 w-5"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>
//         </div>

//         {/* Form */}
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             onSave(formData);
//             onClose();
//           }}
//         >
//           {/* Grid for all sections except Notes */}
//           <div className={`grid ${gridColsClass} gap-6 p-6`}>
//             {visibleSections
//               .filter((section) => section !== "Notes")
//               .map((section) => (
//                 <div key={section} className="space-y-4">
//                   <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//                     {section}
//                   </h3>

//                   {sectionedFields[section].map(({ key, value }) => {
//                     const isTypeField = key.toLowerCase() === "type";
//                     const isBatchField = key.toLowerCase() === "batchid";
//                     const isCourseField = key.toLowerCase() === "courseid" || key.toLowerCase() === "course_id";
//                     const isIdField = key.toLowerCase() === "id"; 
//                     const isNameField = key.toLowerCase() === "name";

//                     return (
//                       <div key={key} className="space-y-1">
//                         <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                           {toLabel(key)}
//                         </Label>

//                         {/* Batch field special handling */}
//                         {isBatchField ? (
//                           batchLoading ? (
//                             <p className="text-sm text-gray-500">
//                               Loading batches...
//                             </p>
//                           ) : batchError ? (
//                             <p className="text-sm text-red-500">{batchError}</p>
//                           ) : (
//                             <select
//                               value={String(formData["batchid"] ?? "")}
//                               onChange={(e) =>
//                                 handleChange("batchid", e.target.value)
//                               }
//                               className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                             >
//                               <option value="">Select Batch</option>
//                               {batches.map((batch) => (
//                                 <option
//                                   key={batch.batchid}
//                                   value={String(batch.batchid)}
//                                 >
//                                   {batch.batchname}
//                                 </option>
//                                 ))}
//                             </select>
//                           )
//                         ) :isCourseField ? (
//                           courseLoading ? (
//                             <p className="text-sm text-gray-500">
//                               Loading courses...
//                             </p>
//                           ) : courseError ? (
//                             <p className="text-sm text-red-500">{courseError}</p>
//                           ) : (
//                             <select
//                               value={String(formData[key] ?? "")}
//                               onChange={(e) => handleChange(key, e.target.value)}
//                               className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                             >
//                               <option value="">Select Course</option>
//                               {courses.map((course) => (
//                                 <option
//                                   key={course.id}
//                                   value={String(course.id)}
//                                 >
//                                   {course.name}
//                                 </option>
//                               ))}
//                             </select>
//                           )
//                         ) : 
                        
//                         {/* NEW: ID field dropdown */}
//                         {isIdField ? (
//                           courseLoading ? (
//                             <p className="text-sm text-gray-500">
//                               Loading IDs...
//                             </p>
//                           ) : courseError ? (
//                             <p className="text-sm text-red-500">{courseError}</p>
//                           ) : (
//                             <select
//                               value={String(formData[key] ?? "")}
//                               onChange={(e) => handleChange(key, e.target.value)}
//                               className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                             >
//                               <option value="">Select ID</option>
//                               {courses.map((course) => (
//                                 <option
//                                   key={course.id}
//                                   value={String(course.id)}
//                                 >
//                                   {course.id}
//                                 </option>
//                               ))}
//                             </select>
//                           )
//                         ) : 
                        
//                         {/* NEW: Name field dropdown */}
//                         {isNameField ? (
//                           courseLoading ? (
//                             <p className="text-sm text-gray-500">
//                               Loading names...
//                             </p>
//                           ) : courseError ? (
//                             <p className="text-sm text-red-500">{courseError}</p>
//                           ) : (
//                             <select
//                               value={String(formData[key] ?? "")}
//                               onChange={(e) => handleChange(key, e.target.value)}
//                               className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                             >
//                               <option value="">Select Name</option>
//                               {courses.map((course) => (
//                                 <option
//                                   key={course.id}
//                                   value={course.name}
//                                 >
//                                   {course.name}
//                                 </option>

//                               ))}
//                             </select>
//                           )
//                         ) : dateFields.includes(key.toLowerCase()) ? (
//                           <input
//                             type="date"
//                             value={
//                               formData[key] && !isNaN(new Date(formData[key]).getTime())
//                                 ? new Date(formData[key]).toISOString().split("T")[0]
//                                 : ""
//                             }
//                             onChange={(e) => handleChange(key, e.target.value)}
//                             className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                           />
//                         ) :



//                           isTypeField && isVendorModal ? (
//                             <select
//                               value={String(formData[key] ?? "")}
//                               onChange={(e) => handleChange(key, e.target.value)}
//                               className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                             >
//                               {enumOptions["type"].map((opt) => (
//                                 <option key={opt.value} value={opt.value}>
//                                   {opt.label}
//                                 </option>
//                               ))}
//                             </select>
//                           ) : isTypeField && !isVendorModal ? (
//                             <Input
//                               value={formData[key] ?? ""}
//                               onChange={(e) => handleChange(key, e.target.value)}
//                             />
//                           ) : key.toLowerCase() === "status" && isVendorTable ? (
//                             <select
//                               value={String(formData[key] ?? "")}
//                               onChange={(e) => handleChange(key, e.target.value)}
//                               className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                             >
//                               {vendorStatuses.map((opt) => (
//                                 <option key={opt.value} value={opt.value}>
//                                   {opt.label}
//                                 </option>
//                               ))}
//                             </select>
//                           ) : enumOptions[key.toLowerCase()] ? (
//                             <select
//                               value={String(formData[key] ?? "")}
//                               onChange={(e) =>
//                                 handleChange(
//                                   key,
//                                   e.target.value === "true"
//                                     ? true
//                                     : e.target.value === "false"
//                                       ? false
//                                       : e.target.value
//                                 )
//                               }
//                               className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
//                             >
//                               {enumOptions[key.toLowerCase()].map((opt) => (
//                                 <option key={opt.value} value={opt.value}>
//                                   {opt.label}
//                                 </option>
//                               ))}
//                             </select>
//                           ) : typeof value === "string" && value.length > 100 ? (
//                             <Textarea
//                               value={formData[key] || ""}
//                               onChange={(e) => handleChange(key, e.target.value)}
//                             />
//                           ) : (
//                             <Input
//                               value={formData[key] ?? ""}
//                               onChange={(e) => handleChange(key, e.target.value)}
//                             />
//                           )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               ))}
//           </div>

//           {sectionedFields["Notes"].length > 0 && (
//             <div className="px-6 pb-6">

//               <div className="space-y-6 mt-4">
//                 {sectionedFields["Notes"].map(({ key, value }) => (
//                   <div key={key} className="space-y-1">
//                     <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                       {toLabel(key)}
//                     </Label>
//                     <Textarea
//                       value={formData[key] || ""}
//                       onChange={(e) => handleChange(key, e.target.value)}
//                       className="w-full"
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Footer */}
//           <div className="flex justify-end px-6 pb-6">
//             <button
//               type="submit"
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }
//updated 12/9/25
"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/admin_ui/dialog";
import { Label } from "@/components/admin_ui/label";
import { Input } from "@/components/admin_ui/input";
import { Textarea } from "@/components/admin_ui/textarea";
import axios from "axios";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
  onSave: (updatedData: Record<string, any>) => void;
}

const excludedFields = [
  "id",
  "sessionid",
  "vendor_type",
  "lastmoddatetime",
  "last_modified",
  "logincount",
  "googleId",
  "subject_id",
  "new_subject_id",
];

const fieldSections: Record<string, string> = {
  id: "Basic Information",
  alias: "Basic Information",
  Fundamentals: "Basic Information",
  AIML: "Basic Information",
  full_name: "Basic Information",
  extraction_date: "Basic Information",
  filename: "Basic Information",
  type: "Professional Information",
  email: "Basic Information",
  company_name: "Basic Information",
  linkedin_id: "Contact Information",
  enrolled_date: "Professional Information",
  startdate: "Professional Information",
  status: "Basic Information",
  linkedin_connected: "Professional Information",
  intro_email_sent: "Professional Information",
  intro_call: "Professional Information",
  moved_to_vendor: "Professional Information",
  phone_number: "Basic Information",
  secondary_phone: "Contact Information",
  location: "Contact Information",
  agreement: "Professional Information",
  sessionid: "Basic Information",
  subject_id: "Basic Information",
  subjectid: "Professional Information",
  courseid: "Professional Information",
  candidateid: "Basic Information",
  uname: "Basic Information",
  fullname: "Basic Information",
  candidate_id: "Basic Information",
  candidate_email: "Basic Information",
  placement_date: "Basic Information",
  batch: "Basic Information",
  leadid: "Basic Information",
  name: "Basic Information",
  enddate: "Professional Information",
  candidate_name: "Basic Information",
  candidate_role: "Basic Information",
  dob: "Basic Information",
  contact: "Basic Information",
  end_date: "Professional Information",
  secondaryphone: "Contact Information",
  phone: "Basic Information",
  secondaryemail: "Contact Information",
  ssn: "Professional Information",
  priority: "Basic Information",
  source: "Basic Information",
  subject: "Basic Information",
  title: "Basic Information",
  enrolleddate: "Basic Information",
  orientationdate: "Basic Information",
  batchname: "Basic Information",
  batchid: "Contact Information",
  promissory: "Basic Information",
  lastlogin: "Professional Information",
  logincount: "Professional Information",
  course: "Professional Information",
  course_id: "Professional Information",
  registereddate: "Professional Information",
  company: "Professional Information",
  client_id: "Professional Information",
  client_name: "Professional Information",
  interview_time: "Professional Information",
  vendor_or_client_name: "Professional Information",
  vendor_or_client_contact: "Professional Information",
  marketing_email_address: "Professional Information",
  interview_date: "Professional Information",
  interview_mode: "Professional Information",
  visa_status: "Professional Information",
  workstatus: "Basic Information",
  message: "Professional Information",
  education: "Professional Information",
  workexperience: "Professional Information",
  faq: "Professional Information",
  callsmade: "Professional Information",
  fee_paid: "Basic Information",
  feedue: "Professional Information",
  salary0: "Professional Information",
  salary6: "Professional Information",
  salary12: "Professional Information",
  instructor: "Professional Information",
  second_instructor: "Professional Information",
  marketing_startdate: "Professional Information",
  recruiterassesment: "Professional Information",
  statuschangedate: "Professional Information",
  aadhaar: "Basic Information",
  entry_date: "Professional Information",
  closed_date: "Professional Information",
  closed: "Professional Information",
  secondary_email: "Contact Information",
  massemail_email_sent: "Contact Information",
  massemail_unsubscribe: "Contact Information",
  moved_to_candidate: "Contact Information",
  link: "Professional Information",
  videoid: "Professional Information",
  address: "Professional Information",
  candidate_folder: "Professional Information",
  city: "Contact Information",
  state: "Contact Information",
  country: "Contact Information",
  zip: "Contact Information",
  emergcontactname: "Emergency Contact",
  emergcontactemail: "Emergency Contact",
  emergcontactphone: "Emergency Contact",
  emergcontactaddrs: "Emergency Contact",
  spousename: "Emergency Contact",
  spousephone: "Emergency Contact",
  spouseemail: "Emergency Contact",
  spouseoccupationinfo: "Emergency Contact",
  notes: "Notes",
  course_name: "Professional Information",
  subject_name: "Basic Information",
};

const workVisaStatusOptions = [
  { value: "waiting for status", label: "Waiting for Status" },
  { value: "citizen", label: "Citizen" },
  { value: "f1", label: "F1" },
  { value: "other", label: "Other" },
  { value: "permanent resident", label: "Permanent Resident" },
  { value: "h4", label: "H4" },
  { value: "ead", label: "EAD" },
];

const vendorStatuses = [
  { value: "active", label: "Active" },
  { value: "working", label: "Working" },
  { value: "not_useful", label: "Not Useful" },
  { value: "do_not_contact", label: "Do Not Contact" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
];

const enumOptions: Record<string, { value: string; label: string }[]> = {
  type: [
    { value: "client", label: "Client" },
    { value: "third-party-vendor", label: "Third Party Vendor" },
    { value: "implementation-partner", label: "Implementation Partner" },
    { value: "sourcer", label: "Sourcer" },
    { value: "contact-from-ip", label: "Contact from IP" },
  ],
  linkedin_connected: [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes" },
  ],
  intro_email_sent: [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes" },
  ],
  intro_call: [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes" },
  ],
  moved_to_vendor: [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ],
  moved_to_candidate: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  massemail_email_sent: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  mass_email_sent: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  massemail_unsubscribe: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  agreement: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  status: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "break", label: "Break" },
    { value: "discontinued", label: "Discontinued" },
    { value: "closed", label: "Closed" },
  ],
  work_status: workVisaStatusOptions,
  workstatus: workVisaStatusOptions,
  visa_status: workVisaStatusOptions,
};

const labelOverrides: Record<string, string> = {
  id: "ID",
  subject_id: "Subject ID",
  subjectid: "Subject ID",
  new_subject_id: "New Subject ID",
  sessionid: "ID",
  courseid: "Course ID",
  course_id: "Course ID",
  candidateid: "Candidate ID",
  batchid: "Batch",
  candidate_id: "Candidate ID",
  candidate_email: "Candidate Email",
  uname: "Email",
  fullname: "Full Name",
  ssn: "SSN",
  dob: "Date of Birth",
  phone: "Phone",
  batchname: "Batch Name",
  secondaryphone: "Secondary Phone",
  email: "Email",
  videoid: "Video ID",
  secondaryemail: "Secondary Email",
  classdate: "Class Date",
  filename: "File Name",
  visa_status: "Visa Status",
  work_status: "Work Status",
  workstatus: "Work Status",
  lastlogin: "Last Login",
  logincount: "Login Count",
  level3date: "Level 3 Date",
  orientationdate: "Orientation Date",
  enddate: "End Date",
  startdate: "Start Date",
  sessiondate: "Session Date",
  lastmoddatetime: "Last Mod DateTime",
  registereddate: "Registered Date",
  massemail_email_sent: "Massemail Email Sent",
  massemail_unsubscribe: "Massemail Unsubscribe",
  moved_to_candidate: "Moved To Candidate",
  emergcontactname: "Contact Name",
  candidate_folder: "Candidate Folder Link",
  emergcontactphone: "Contact Phone",
  emergcontactemail: "Contact Email",
  emergcontactaddrs: "Contact Address",
};

const dateFields = [
  "orientationdate",
  "startdate",
  "enddate",
  "closed_date",
  "entry_date",
  "created_at",
  "classdate",
  "sessiondate",
  "enrolled_date"
];
export function EditModal({
  isOpen,
  onClose,
  data,
  title,
  onSave,
}: EditModalProps) {
  if (!data) return null;
  const [formData, setFormData] = React.useState<Record<string, any>>(data);

  React.useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  React.useEffect(() => {
    if (isOpen) {
      const fetchBatches = async () => {
        setBatchLoading(true);
        setBatchError(null);
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/batches`);
          const batchesData = res.data?.data || res.data || [];
          setBatches(batchesData);
        } catch (e: any) {
          console.error("Batch fetch error:", e);
          setBatchError(e.response?.data?.message || "Failed to load batches");
        } finally {
          setBatchLoading(false);
        }
      };

      const fetchCourses = async () => {
        setCourseLoading(true);
        setCourseError(null);
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`);
          const coursesData = res.data?.data || res.data || [];
          setCourses(coursesData);
        } catch (e: any) {
          console.error("Course fetch error:", e);
          setCourseError(e.response?.data?.message || "Failed to load courses");
        } finally {
          setCourseLoading(false);
        }
      };

      fetchCourses();
      fetchBatches();
    }
  }, [isOpen]);

  if (!data) return null;

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: value };
      if (key === "status" && value === "closed" && !prev.closed_date) {
        newData["closed_date"] = new Date().toISOString().split("T")[0];
      }
      return newData;
    });
  };

  const toLabel = (key: string) => {
    if (labelOverrides[key]) return labelOverrides[key];
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    "Other": [],
    "Notes": [],
  };

  Object.entries(formData).forEach(([key, value]) => {
    if (excludedFields.includes(key)) return;
    if (key === "id") return;
    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  const visibleSections = Object.keys(sectionedFields).filter(
    (section) => sectionedFields[section]?.length > 0 && section !== "Notes"
  );

  const columnCount = Math.min(visibleSections.length, 4);
  const modalWidthClass = {
    1: "max-w-xl",
    2: "max-w-3xl",
    3: "max-w-5xl",
    4: "max-w-6xl",
  }[columnCount] || "max-w-6xl";

  const gridColsClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "lg:grid-cols-4 md:grid-cols-2",
  }[columnCount] || "lg:grid-cols-4 md:grid-cols-2";

  const isVendorModal = title.toLowerCase().includes("vendor");
  const isVendorTable = title.toLowerCase().includes("vendor");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${modalWidthClass} max-h-[80vh] overflow-y-auto p-0`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title} - Edit Details
          </DialogTitle>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-white focus:outline-none"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
            onClose();
          }}
        >
          {/* Grid for all sections except Notes */}
          <div className={`grid ${gridColsClass} gap-6 p-6`}>
            {visibleSections
              .filter((section) => section !== "Notes")
              .map((section) => (
                <div key={section} className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {section}
                  </h3>
                  {sectionedFields[section].map(({ key, value }) => {
                    const isTypeField = key.toLowerCase() === "type";
                    const isBatchField = key.toLowerCase() === "batchid";
                    return (
                      <div key={key} className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {toLabel(key)}
                        </Label>
                        {isBatchField ? (
                          <Input
                            value={formData["batchid"] ?? ""}
                            onChange={(e) => handleChange("batchid", e.target.value)}
                          />
                        ) : dateFields.includes(key.toLowerCase()) ? (
                          <input
                            type="date"
                            value={
                              formData[key] && !isNaN(new Date(formData[key]).getTime())
                                ? new Date(formData[key]).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                          />
                        ) : isTypeField && isVendorModal ? (
                          <select
                            value={String(formData[key] ?? "")}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                          >
                            {enumOptions["type"].map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : isTypeField && !isVendorModal ? (
                          <Input
                            value={formData[key] ?? ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                          />
                        ) : key.toLowerCase() === "status" && isVendorTable ? (
                          <select
                            value={String(formData[key] ?? "")}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                          >
                            {vendorStatuses.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : enumOptions[key.toLowerCase()] ? (
                          <select
                            value={String(formData[key] ?? "")}
                            onChange={(e) =>
                              handleChange(
                                key,
                                e.target.value === "true"
                                  ? true
                                  : e.target.value === "false"
                                    ? false
                                    : e.target.value
                              )
                            }
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                          >
                            {enumOptions[key.toLowerCase()].map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : typeof value === "string" && value.length > 100 ? (
                          <Textarea
                            value={formData[key] || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                          />
                        ) : (
                          <Input
                            value={formData[key] ?? ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
          {sectionedFields["Notes"].length > 0 && (
            <div className="px-6 pb-6">
              <div className="space-y-6 mt-4">
                {sectionedFields["Notes"].map(({ key, value }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {toLabel(key)}
                    </Label>
                    <Textarea
                      value={formData[key] || ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Footer */}
          <div className="flex justify-end px-6 pb-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
