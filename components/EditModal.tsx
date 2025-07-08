// // whiteboxLearning-wbl/components/EditModal.tsx
// "use client";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/admin_ui/dialog";
// import { Button } from "@/components/admin_ui/button";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { Textarea } from "@/components/admin_ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/admin_ui/select";
// import { useState, useEffect } from "react";

// interface EditModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (data: any) => void;
//   data: any;
//   title: string;
// }

// export function EditModal({
//   isOpen,
//   onClose,
//   onSave,
//   data,
//   title,
// }: EditModalProps) {
//   const [formData, setFormData] = useState({});
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (data && isOpen) {
//       setFormData({ ...data });
//     }
//   }, [data, isOpen]);

//   if (!data) return null;

//   const handleSave = async () => {
//     setIsLoading(true);
//     try {
//       await onSave(formData);
//     } catch (error) {
//       console.error("Save error:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (field: string, value: string | number) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const renderField = (
//     label: string,
//     field: string,
//     type: string = "text",
//     options?: string[],
//   ) => {
//     const value = formData[field] || "";

//     return (
//       <div key={field} className="space-y-1">
//         <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//           {label}
//         </Label>
//         {type === "select" && options ? (
//           <Select
//             value={String(value)}
//             onValueChange={(newValue) => handleChange(field, newValue)}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder={`Select ${label}`} />
//             </SelectTrigger>
//             <SelectContent>
//               {options.map((option) => (
//                 <SelectItem key={option} value={option}>
//                   {option}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         ) : type === "number" ? (
//           <Input
//             type="number"
//             value={String(value)}
//             onChange={(e) => handleChange(field, Number(e.target.value))}
//             disabled={isLoading}
//           />
//         ) : type === "email" ? (
//           <Input
//             type="email"
//             value={String(value)}
//             onChange={(e) => handleChange(field, e.target.value)}
//             disabled={isLoading}
//           />
//         ) : type === "date" ? (
//           <Input
//             type="date"
//             value={String(value)}
//             onChange={(e) => handleChange(field, e.target.value)}
//             disabled={isLoading}
//           />
//         ) : type === "textarea" ? (
//           <Textarea
//             value={String(value)}
//             onChange={(e) => handleChange(field, e.target.value)}
//             disabled={isLoading}
//             rows={3}
//             placeholder="Add your notes here..."
//           />
//         ) : (
//           <Input
//             type="text"
//             value={String(value)}
//             onChange={(e) => handleChange(field, e.target.value)}
//             disabled={isLoading}
//           />
//         )}
//       </div>
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold dark:text-gray-100">
//             Edit {title}
//           </DialogTitle>
//         </DialogHeader>

//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
//           {/* Basic Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Basic Information
//             </h3>
//             {renderField("ID", "candidateid")}
//             {renderField("Name", "name")}
//             {renderField("DOB", "dob", "date")}
//             {renderField("Email", "email", "email")}
//             {renderField("Secondary Email", "secondaryemail", "email")}
//             {renderField("Phone", "phone")}
//             {renderField("Secondary Phone", "secondaryphone")}
//             {renderField("Course", "course")}
//             {renderField("Batch Name", "batchname")}
//             {renderField("Batch ID", "batchid", "number")}
//             {renderField("Enrolled Date", "enrolleddate", "date")}
//             {renderField("Status", "status")}
//             {renderField("Status Change Date", "statuschangedate", "date")}
//             {renderField("Work Status", "workstatus")}
//             {renderField("SSN", "ssn")}
//             {renderField("SSN Validated", "ssnvalidated")}
//             {renderField("Avatar ID", "avatarid")}
//             {renderField("Original Resume", "originalresume")}
//           </div>

//           {/* Professional Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Professional Information
//             </h3>
//             {renderField("Education", "education")}
//             {renderField("Work Experience", "workexperience")}
//             {renderField("Promissory", "promissory")}
//             {renderField("Agreement", "agreement")}
//             {renderField("Driver's License", "driverslicense")}
//             {renderField("DL URL", "dlurl")}
//             {renderField("Work Permit", "workpermit")}
//             {renderField("WP Expiration Date", "wpexpirationdate", "date")}
//             {renderField("WP URL", "workpermiturl")}
//             {renderField("SSN URL", "ssnurl")}
//             {renderField("Employment Agreement URL", "empagreementurl")}
//             {renderField("Offer Letter", "offerletter")}
//             {renderField("Offer Letter URL", "offerletterurl")}
//             {renderField("Contract URL", "contracturl")}
//             {renderField("Guarantor Name", "guarantorname")}
//             {renderField("Guarantor Designation", "guarantordesignation")}
//             {renderField("Guarantor Company", "guarantorcompany")}
//             {renderField("Salary at Joining", "salary0")}
//             {renderField("Salary at 6 Months", "salary6")}
//             {renderField("Salary at 12 Months", "salary12")}
//             {renderField("Fee Paid", "feepaid", "number")}
//             {renderField("Fee Due", "feedue", "number")}
//             {renderField("Guidelines", "guidelines")}
//             {renderField("BGV", "bgv")}
//             {renderField("Term", "term")}
//             {renderField("Recruiter Assessment", "recruiterassesment", "textarea")}
//             {renderField("Background", "background", "textarea")}
//             {renderField("Process Flag", "processflag")}
//             {renderField("Default Process Flag", "defaultprocessflag")}
//             {renderField("Dice Flag", "diceflag")}
//             {renderField("Marketing Start Date", "marketing_startdate", "date")}
//             {renderField("Instructor", "instructor")}
//             {renderField("Second Instructor", "second_instructor")}
//           </div>

//           {/* Contact Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Contact Information
//             </h3>
//             {renderField("Address", "address")}
//             {renderField("City", "city")}
//             {renderField("State", "state")}
//             {renderField("Zip", "zip")}
//             {renderField("Country", "country")}
//             {renderField("LinkedIn", "linkedin")}
//             {renderField("Referral ID", "referralid")}
//             {renderField("Portal ID", "portalid")}
//             {renderField("Email List", "emaillist")}
//           </div>
//           {/* Emergency Contact */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Emergency Contact
//             </h3>
//             {renderField("Name", "emergcontactname")}
//             {renderField("Email", "emergcontactemail", "email")}
//             {renderField("Phone", "emergcontactphone")}
//             {renderField("Address", "emergcontactaddrs")}
//           </div>
//           {/* Notes Section - Always shown at the end */}
//           <div className="col-span-full space-y-4">
//             {/* <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2"> */}
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">

//               Notes
//             </h3>
//             {renderField("Edit Notes", "notes", "textarea")}
//           </div>
//         </div>

//         <DialogFooter className="flex items-center justify-end space-x-2 pt-4">
//           <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
//             Cancel
//           </Button>
//           <Button size="lg" onClick={handleSave} disabled={isLoading}>
//             {isLoading ? "Saving..." : "Save Changes"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// "use client";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Button } from "@/components/admin_ui/button";
// import { Input } from "@/components/admin_ui/input";
// import { Label } from "@/components/admin_ui/label";
// import { Textarea } from "@/components/admin_ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/admin_ui/select";
// import { useState, useEffect } from "react";

// interface EditModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (data: any) => void;
//   data: any;
//   title: string;
// }

// export function EditModal({
//   isOpen,
//   onClose,
//   onSave,
//   data,
//   title,
// }: EditModalProps) {
//   const [formData, setFormData] = useState({});
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (data && isOpen) {
//       setFormData({ ...data });
//     }
//   }, [data, isOpen]);

//   if (!data) return null;

//   const handleSave = async () => {
//     setIsLoading(true);
//     try {
//       await onSave(formData);
//     } catch (error) {
//       console.error("Save error:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (field: string, value: string | number) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const renderField = (
//     label: string,
//     field: string,
//     type: string = "text",
//     options?: string[],
//   ) => {
//     const value = formData[field] || "";

//     return (
//       <div key={field} className="space-y-1">
//         <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//           {label}
//         </Label>
//         {type === "select" && options ? (
//           <Select
//             value={String(value)}
//             onValueChange={(newValue) => handleChange(field, newValue)}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder={`Select ${label}`} />
//             </SelectTrigger>
//             <SelectContent>
//               {options.map((option) => (
//                 <SelectItem key={option} value={option}>
//                   {option}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         ) : type === "number" ? (
//           <Input
//             type="number"
//             value={String(value)}
//             onChange={(e) => handleChange(field, Number(e.target.value))}
//             disabled={isLoading}
//           />
//         ) : type === "email" ? (
//           <Input
//             type="email"
//             value={String(value)}
//             onChange={(e) => handleChange(field, e.target.value)}
//             disabled={isLoading}
//           />
//         ) : type === "date" ? (
//           <Input
//             type="date"
//             value={String(value)}
//             onChange={(e) => handleChange(field, e.target.value)}
//             disabled={isLoading}
//           />
//         ) : type === "textarea" ? (
//           <Textarea
//             value={String(value)}
//             onChange={(e) => handleChange(field, e.target.value)}
//             disabled={isLoading}
//             rows={3}
//             placeholder="Add your notes here..."
//           />
//         ) : (
//           <Input
//             type="text"
//             value={String(value)}
//             onChange={(e) => handleChange(field, e.target.value)}
//             disabled={isLoading}
//           />
//         )}
//       </div>
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto p-0">
//         {/* Sticky Header with Close Icon */}
//         <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             Edit {title}
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

//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
//           {/* Basic Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Basic Information
//             </h3>
//             {renderField("ID", "candidateid")}
//             {renderField("ID", "leadid")}
//             {renderField("Name", "name")}
//             {renderField("DOB", "dob", "date")}
//             {renderField("Email", "email", "email")}
//             {renderField("Secondary Email", "secondaryemail", "email")}
//             {renderField("Phone", "phone")}
//             {renderField("Secondary Phone", "secondaryphone")}
//             {renderField("Course", "course")}
//             {renderField("Batch Name", "batchname")}
//             {renderField("Batch ID", "batchid", "number")}
//             {renderField("Enrolled Date", "enrolleddate", "date")}
//             {renderField("Status", "status")}
//             {renderField("Status Change Date", "statuschangedate", "date")}
//             {renderField("Work Status", "workstatus")}
//             {renderField("SSN", "ssn")}
//             {renderField("SSN Validated", "ssnvalidated")}
//             {renderField("Avatar ID", "avatarid")}
//             {renderField("Original Resume", "originalresume")}
//           </div>

//           {/* Professional Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Professional Information
//             </h3>
//             {renderField("Education", "education")}
//             {renderField("Work Experience", "workexperience")}
//             {renderField("Promissory", "promissory")}
//             {renderField("Agreement", "agreement")}
//             {renderField("Driver's License", "driverslicense")}
//             {renderField("DL URL", "dlurl")}
//             {renderField("Work Permit", "workpermit")}
//             {renderField("WP Expiration Date", "wpexpirationdate", "date")}
//             {renderField("WP URL", "workpermiturl")}
//             {renderField("SSN URL", "ssnurl")}
//             {renderField("Employment Agreement URL", "empagreementurl")}
//             {renderField("Offer Letter", "offerletter")}
//             {renderField("Offer Letter URL", "offerletterurl")}
//             {renderField("Contract URL", "contracturl")}
//             {renderField("Guarantor Name", "guarantorname")}
//             {renderField("Guarantor Designation", "guarantordesignation")}
//             {renderField("Guarantor Company", "guarantorcompany")}
//             {renderField("Salary at Joining", "salary0")}
//             {renderField("Salary at 6 Months", "salary6")}
//             {renderField("Salary at 12 Months", "salary12")}
//             {renderField("Fee Paid", "feepaid", "number")}
//             {renderField("Fee Due", "feedue", "number")}
//             {renderField("Guidelines", "guidelines")}
//             {renderField("BGV", "bgv")}
//             {renderField("Term", "term")}
//             {renderField("Recruiter Assessment", "recruiterassesment", "textarea")}
//             {renderField("Background", "background", "textarea")}
//             {renderField("Process Flag", "processflag")}
//             {renderField("Default Process Flag", "defaultprocessflag")}
//             {renderField("Dice Flag", "diceflag")}
//             {renderField("Marketing Start Date", "marketing_startdate", "date")}
//             {renderField("Instructor", "instructor")}
//             {renderField("Second Instructor", "second_instructor")}
//           </div>

//           {/* Contact Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Contact Information
//             </h3>
//             {renderField("Address", "address")}
//             {renderField("City", "city")}
//             {renderField("State", "state")}
//             {renderField("Zip", "zip")}
//             {renderField("Country", "country")}
//             {renderField("LinkedIn", "linkedin")}
//             {renderField("Referral ID", "referralid")}
//             {renderField("Portal ID", "portalid")}
//             {renderField("Email List", "emaillist")}
//           </div>

//           {/* Emergency Contact */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Emergency Contact
//             </h3>
//             {renderField("Name", "emergcontactname")}
//             {renderField("Email", "emergcontactemail", "email")}
//             {renderField("Phone", "emergcontactphone")}
//             {renderField("Address", "emergcontactaddrs")}
//           </div>

//           {/* Notes Section */}
//           <div className="col-span-full space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Notes
//             </h3>
//             {renderField("Edit Notes", "notes", "textarea")}
//           </div>
//         </div>

//         <DialogFooter className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
//           <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
//             Cancel
//           </Button>
//           <Button size="lg" onClick={handleSave} disabled={isLoading}>
//             {isLoading ? "Saving..." : "Save Changes"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }


// // whiteboxLearning-wbl/components/EditModal.tsx
// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Input } from "@/components/admin_ui/input";
// import { Textarea } from "@/components/admin_ui/textarea";
// import { Label } from "@/components/admin_ui/label";
// import { Button } from "@/components/admin_ui/button";
// import { useState, useEffect } from "react";

// // Reuse same field-to-section mapping
// const fieldSections: Record<string, string> = {
//   candidateid: "Basic Information",  //for candidate table
//   candidate_id: "Basic Information", //for placement table
//   candidate_name: "Basic Information",
//   candidate_email: "Basic Information",
//   candidate_role: "Basic Information",
//   id: "Basic Information",
//   start_date: "Basic Information",
//   startdate: "Basic Information",
//   leadid: "Basic Information",
//   // id: "Basic Information",
//   batch: "Basic Information",
//   name: "Basic Information",
//   dob: "Basic Information",
//   contact: "Basic Information",
//   phone: "Basic Information",
//   secondaryphone: "Basic Information",
//   email: "Basic Information",
//   secondaryemail: "Basic Information",
//   ssn: "Basic Information",
//   priority: "Basic Information",
//   source: "Basic Information",
//   enrolleddate: "Basic Information",
//   batchname: "Basic Information",
//   batchid: "Basic Information",
//   term: "Basic Information",
//   agreement: "Basic Information",
//   promissory: "Basic Information",

//   course: "Professional Information",
//   role: "Professional Information",
//   job_location: "Professional Information",
//   interview_time: "Professional Information",
//   interview_date: "Professional Information",
//   status: "Professional Information",
//   workstatus: "Professional Information",
//   work_authorization: "Professional Information",
//   marketing_email_address: "Professional Information",
//   company: "Professional Information",
//   client_id: "Professional Information",
//   education: "Professional Information",
//   placement_date: "Professional Information",
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

// function toLabel(key: string) {
//   return key
//     .replace(/([A-Z])/g, " $1")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (l) => l.toUpperCase());
// }

// function getFieldType(key: string): string {
//   const lower = key.toLowerCase();
//     const exactDateFields = ["start_date", "startdate", "enrolleddate", "placement_date", "marketing_startdate", "statuschangedate"];
//   if (exactDateFields.includes(lower)) return "date";
//   if (lower.includes("email")) return "email";
//   // if (lower.includes("date")) return "date";
//   if (lower.includes("phone")) return "tel";
//   if (lower.includes("ssn")) return "text";
//   if (lower.includes("amount") || lower.includes("salary") || lower.includes("fee"))
//     return "number";
//   if (lower.includes("notes") || lower.includes("faq") || lower.includes("address"))
//     return "textarea";
//   return "text";
// }

// export function EditModal({
//   isOpen,
//   onClose,
//   onSave,
//   data,
//   title,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (data: any) => void;
//   data: Record<string, any>;
//   title: string;
// }) {
//   const [formData, setFormData] = useState<Record<string, any>>({});
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (data && isOpen) setFormData({ ...data });
//   }, [data, isOpen]);

//   const handleChange = (key: string, value: string | number) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSave = async () => {
//     setIsLoading(true);
//     try {
//       await onSave(formData);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Organize fields into sections
//   const sectionedFields: Record<string, { key: string; value: any }[]> = {};
//   Object.entries(formData).forEach(([key, value]) => {
//     const section = fieldSections[key] || "Other";
//     if (!sectionedFields[section]) sectionedFields[section] = [];
//     sectionedFields[section].push({ key, value });
//   });

//   const sectionOrder = [
//     "Basic Information",
//     "Professional Information",
//     "Contact Information",
//     "Emergency Contact",
//     "Other",
//   ];

//   const renderField = (key: string, value: any) => {
//     const type = getFieldType(key);
//     const label = toLabel(key);

//     return (
//       <div key={key} className="space-y-1">
//         <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//           {label}
//         </Label>
//         {type === "textarea" ? (
//           <Textarea
//             value={value || ""}
//             rows={3}
//             onChange={(e) => handleChange(key, e.target.value)}
//             disabled={isLoading}
//           />
//         ) : (
//           <Input
//             type={type}
//             value={value || ""}
//             onChange={(e) => handleChange(key, e.target.value)}
//             disabled={isLoading}
//           />
//         )}
//       </div>
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto p-0">
//         {/* Header */}
//         <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             Edit {title}
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
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         {/* Grid Sections */}
//         <div className="grid lg:grid-cols-4 gap-6 p-6">
//           {/* {sectionOrder.map(
//             (sectionName) =>
//               sectionedFields[sectionName]?.length > 0 && (
//                 <div key={sectionName} className="space-y-4">
//                   <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//                     {sectionName}
//                   </h3>
//                   {sectionedFields[sectionName].map(({ key, value }) => renderField(key, value))}
//                 </div>
//               )
//           )} */}
//           {sectionOrder
//             .filter((sectionName) => sectionName !== "Notes")
//             .map(
//               (sectionName) =>
//                 sectionedFields[sectionName]?.length > 0 && (
//                   <div key={sectionName} className="space-y-4">
//                     <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//                       {sectionName}
//                     </h3>
//                     {sectionedFields[sectionName].map(({ key, value }) => renderField(key, value))}
//                   </div>
//                )
//           )}

//         </div>
//         {sectionedFields["Notes"]?.length > 0 && (
//           <div className="px-6 mt-6 space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Notes
//             </h3>
//             {sectionedFields["Notes"].map(({ key, value }) => renderField(key, value))}
//           </div>
//         )}

//         {/* Footer */}
//         <DialogFooter className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
//           <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
//             Cancel
//           </Button>
//           <Button size="lg" onClick={handleSave} disabled={isLoading}>
//             {isLoading ? "Saving..." : "Save Changes"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }


"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/admin_ui/dialog";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Textarea } from "@/components/admin_ui/textarea";
import { useState } from "react";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
  onSave: (updatedData: Record<string, any>) => void;
}

const fieldSections: Record<string, string> = {
  candidateid: "Basic Information",
  candidate_id: "Basic Information",
  candidate_name: "Basic Information",
  candidate_email: "Basic Information",
  candidate_role: "Basic Information",
  id: "Basic Information",
  start_date: "Basic Information",
  startdate: "Basic Information",
  leadid: "Basic Information",
  batch: "Basic Information",
  name: "Basic Information",
  dob: "Basic Information",
  contact: "Basic Information",
  phone: "Basic Information",
  secondaryphone: "Basic Information",
  email: "Basic Information",
  secondaryemail: "Basic Information",
  ssn: "Basic Information",
  priority: "Basic Information",
  source: "Basic Information",
  enrolleddate: "Basic Information",
  batchname: "Basic Information",
  batchid: "Basic Information",
  term: "Basic Information",
  agreement: "Basic Information",
  promissory: "Basic Information",

  course: "Professional Information",
  role: "Professional Information",
  job_location: "Professional Information",
  interview_time: "Professional Information",
  interview_date: "Professional Information",
  status: "Professional Information",
  workstatus: "Professional Information",
  work_authorization: "Professional Information",
  marketing_email_address: "Professional Information",
  company: "Professional Information",
  client_id: "Professional Information",
  education: "Professional Information",
  placement_date: "Professional Information",
  workexperience: "Professional Information",
  faq: "Professional Information",
  callsmade: "Professional Information",
  feepaid: "Professional Information",
  feedue: "Professional Information",
  salary0: "Professional Information",
  salary6: "Professional Information",
  salary12: "Professional Information",
  instructor: "Professional Information",
  second_instructor: "Professional Information",
  marketing_startdate: "Professional Information",
  recruiterassesment: "Professional Information",
  statuschangedate: "Professional Information",
  closed: "Professional Information",

  address: "Contact Information",
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
};

export function EditModal({ isOpen, onClose, data, title, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(data || {});

  if (!data) return null;

  const toLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
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
    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  const visibleSections = Object.keys(sectionedFields).filter(
    (section) => section !== "Notes" && sectionedFields[section]?.length > 0
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${modalWidthClass} max-h-[80vh] overflow-y-auto p-0`}>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
            onClose();
          }}
        >
          <div className={`grid ${gridColsClass} gap-6 p-6`}>
            {visibleSections.map((section) => (
              <div key={section} className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  {section}
                </h3>
                {sectionedFields[section].map(({ key, value }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {toLabel(key)}
                    </Label>
                    {typeof value === "string" && value.length > 100 ? (
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
                ))}
              </div>
            ))}
          </div>

          {/* Notes Section */}
          {sectionedFields["Notes"].length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Notes
              </h3>
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
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
