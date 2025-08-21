// // whiteboxLearning-wbl/components/ViewModal.tsx
// "use client";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Label } from "@/components/admin_ui/label";
// import { Badge } from "@/components/admin_ui/badge";

// interface ViewModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: any;
//   title: string;
// }

// export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
//   if (!data) return null;

//   const getStatusColor = (status: string) => {
//     if (!status)
//       return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     return status?.toLowerCase() === "active"
//       ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
//       : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
//   };

//   const getVisaColor = (visa: string) => {
//     if (!visa)
//       return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     switch (visa) {
//       case "H1B":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//       case "Green Card":
//         return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
//       case "F1 Student":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
//       case "L1":
//         return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
//       case "OPT":
//         return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
//       case "H4 EAD":
//         return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     }
//   };

//   const getPartnershipColor = (partnership: string) => {
//     if (!partnership)
//       return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     switch (partnership) {
//       case "Premium":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
//       case "Standard":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//       case "Basic":
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     }
//   };

//   const renderField = (label: string, value: any, type?: string) => {
//     if (value === undefined || value === null) return null;

//     return (
//       <div key={label} className="space-y-1">
//         <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//           {label}
//         </Label>
//         {type === "status" && (
//           <div>
//             <Badge className={getStatusColor(value)}>
//               {String(value).toUpperCase()}
//             </Badge>
//           </div>
//         )}
//         {type === "visa" && (
//           <div>
//             <Badge className={getVisaColor(value)}>{value}</Badge>
//           </div>
//         )}
//         {type === "partnership" && (
//           <div>
//             <Badge className={getPartnershipColor(value)}>{value}</Badge>
//           </div>
//         )}
//         {type === "amount" && (
//           <p className="text-sm font-medium dark:text-gray-200">
//             ${Number(value).toLocaleString()}
//           </p>
//         )}
//         {type === "rating" && (
//           <p className="text-sm font-medium dark:text-gray-200">{value} ⭐</p>
//         )}
//         {!type && (
//           <p className="text-sm font-medium dark:text-gray-200">
//             {String(value)}
//           </p>
//         )}
//       </div>
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold dark:text-gray-100">
//             {title} - View Details
//           </DialogTitle>
//         </DialogHeader>

//         {/* <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-4"> */}
//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">

//           {/* Basic Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Basic Information
//             </h3>
//             {/* {renderField("ID", data.id)} */}
//             {renderField("Candidate ID", data.candidateid)}
//             {renderField("Full Name", data.name)}
//             {renderField("Date of Birth", data.dob)}
//             {renderField("Contact", data.contact)}
//             {renderField("Primary Phone", data.phone)}
//             {renderField("Secondary Phone", data.secondaryphone)}
//             {renderField("Email", data.email)}
//             {renderField("Secondary Email", data.secondaryemail)}
//             {renderField("Enrollment Date", data.enrolleddate)}
//             {renderField("Batch Name", data.batchname)}
//             {renderField("Batch ID", data.batchid)}
//             {renderField("Term", data.term)}
//             {renderField("Agreement", data.agreement)}
//             {renderField("Promissory Note", data.promissory)}
//           </div>

//           {/* Professional Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Professional Information
//             </h3>
//             {/* {renderField("Education", data.education)}
//             {renderField("Visa Status", data.workstatus, "visa")}
//             {renderField("Course", data.course)}
//             {renderField("Work Experience", data.workexperience)}
//             {renderField("Status", data.status, "status")}
//             {renderField("Partnership", data.partnership, "partnership")}
//             {renderField("Active Contracts", data.activeContracts)}
//             {renderField("Enrolled Date", data.enrolleddate)}
//             {renderField("Last Contact", data.lastContact)}
//             {renderField("Amount Paid", data.amountPaid, "amount")}
//             {renderField("Rating", data.rating, "rating")} */}
//             {renderField("Course", data.course)}
//             {renderField("Status", data.status)}
//             {renderField("Work Status", data.workstatus)}
//             {renderField("Education", data.education)}
//             {renderField("Work Experience", data.workexperience)}
//             {renderField("Fee Paid", data.feepaid)}
//             {renderField("Fee Due", data.feedue)}
//             {renderField("Initial Salary", data.salary0)}
//             {renderField("6 Month Salary", data.salary6)}
//             {renderField("12 Month Salary", data.salary12)}
//             {renderField("Instructor", data.instructor)}
//             {renderField("Second Instructor", data.second_instructor)}
//             {renderField("Marketing Start Date", data.marketing_startdate)}
//             {renderField("Recruiter Assessment", data.recruiterassesment)}
//             {renderField("Status Change Date", data.statuschangedate)}
//           </div>

//           {/* Contact Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Contact Information
//             </h3>
//             {renderField("Address", data.address)}
//             {renderField("City", data.city)}
//             {renderField("State", data.state)}
//             {renderField("Country", data.country)}
//             {renderField("Zip", data.zip)}
//           </div>

//                     {/* Emergency Contact */}
//           <div className="space-y-4">
//             {/* <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2"> */}
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">

//               Emergency Contact
//             </h3>
//             {renderField("Emergency Name", data.emergcontactname)}
//             {renderField("Emergency Email", data.emergcontactemail)}
//             {renderField("Emergency Phone", data.emergcontactphone)}
//             {renderField("Emergency Address", data.emergcontactaddrs)}
//           </div>

//           {/* Notes Section */}
//           <div className="col-span-full space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Notes
//             </h3>
//             {renderField("Notes", data.notes)}
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }


// // whiteboxLearning-wbl/components/ViewModal.tsx
// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Label } from "@/components/admin_ui/label";
// import { Badge } from "@/components/admin_ui/badge";

// interface ViewModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: any;
//   title: string;
// }

// export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
//   if (!data) return null;

//   const getStatusColor = (status: string) => {
//     if (!status)
//       return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     return status?.toLowerCase() === "active"
//       ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
//       : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
//   };

//   const getVisaColor = (visa: string) => {
//     if (!visa)
//       return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     switch (visa) {
//       case "H1B":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//       case "Green Card":
//         return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
//       case "F1 Student":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
//       case "L1":
//         return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
//       case "OPT":
//         return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
//       case "H4 EAD":
//         return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     }
//   };

//   const getPartnershipColor = (partnership: string) => {
//     if (!partnership)
//       return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     switch (partnership) {
//       case "Premium":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
//       case "Standard":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//       case "Basic":
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     }
//   };

//   const renderField = (label: string, value: any, type?: string) => {
//     if (value === undefined || value === null) return null;

//     return (
//       <div key={label} className="space-y-1">
//         <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//           {label}
//         </Label>
//         {type === "status" && (
//           <div>
//             <Badge className={getStatusColor(value)}>
//               {String(value).toUpperCase()}
//             </Badge>
//           </div>
//         )}
//         {type === "visa" && (
//           <div>
//             <Badge className={getVisaColor(value)}>{value}</Badge>
//           </div>
//         )}
//         {type === "partnership" && (
//           <div>
//             <Badge className={getPartnershipColor(value)}>{value}</Badge>
//           </div>
//         )}
//         {type === "amount" && (
//           <p className="text-sm font-medium dark:text-gray-200">
//             ${Number(value).toLocaleString()}
//           </p>
//         )}
//         {type === "rating" && (
//           <p className="text-sm font-medium dark:text-gray-200">{value} ⭐</p>
//         )}
//         {!type && (
//           <p className="text-sm font-medium dark:text-gray-200">
//             {String(value)}
//           </p>
//         )}
//       </div>
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto p-0">
//         {/* Sticky Header with Close Button */}
//         <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             {title} - View Details
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

//         {/* Grid Content */}
//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
//           {/* Basic Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Basic Information
//             </h3>
//             {renderField("Candidate ID", data.candidateid)}
//             {renderField("Lead ID", data.leadid)}
//             {renderField("Full Name", data.name)}
//             {renderField("Date of Birth", data.dob)}
//             {renderField("Contact", data.contact)}
//             {renderField("Primary Phone", data.phone)}
//             {renderField("Secondary Phone", data.secondaryphone)}
//             {renderField("Email", data.email)}
//             {renderField("Secondary Email", data.secondaryemail)}
//             {renderField("Enrollment Date", data.enrolleddate)}
//             {renderField("Batch Name", data.batchname)}
//             {renderField("Batch ID", data.batchid)}
//             {renderField("Term", data.term)}
//             {renderField("Agreement", data.agreement)}
//             {renderField("Promissory Note", data.promissory)}
//           </div>

//           {/* Professional Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Professional Information
//             </h3>
//             {renderField("Course", data.course)}
//             {renderField("Status", data.status, "status")}
//             {renderField("Work Status", data.workstatus, "visa")}
//             {renderField("Education", data.education)}
//             {renderField("Work Experience", data.workexperience)}
//             {renderField("Fee Paid", data.feepaid, "amount")}
//             {renderField("Fee Due", data.feedue, "amount")}
//             {renderField("Initial Salary", data.salary0, "amount")}
//             {renderField("6 Month Salary", data.salary6, "amount")}
//             {renderField("12 Month Salary", data.salary12, "amount")}
//             {renderField("Instructor", data.instructor)}
//             {renderField("Second Instructor", data.second_instructor)}
//             {renderField("Marketing Start Date", data.marketing_startdate)}
//             {renderField("Recruiter Assessment", data.recruiterassesment)}
//             {renderField("Status Change Date", data.statuschangedate)}
//           </div>

//           {/* Contact Information */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Contact Information
//             </h3>
//             {renderField("Address", data.address)}
//             {renderField("City", data.city)}
//             {renderField("State", data.state)}
//             {renderField("Country", data.country)}
//             {renderField("Zip", data.zip)}
//           </div>

//           {/* Emergency Contact */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Emergency Contact
//             </h3>
//             {renderField("Emergency Name", data.emergcontactname)}
//             {renderField("Emergency Email", data.emergcontactemail)}
//             {renderField("Emergency Phone", data.emergcontactphone)}
//             {renderField("Emergency Address", data.emergcontactaddrs)}
//           </div>

//           {/* Notes Section */}
//           <div className="col-span-full space-y-4">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Notes
//             </h3>
//             {renderField("Notes", data.notes)}
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }



// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Label } from "@/components/admin_ui/label";
// import { Badge } from "@/components/admin_ui/badge";

// interface ViewModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: Record<string, any>;
//   title: string;
// }

// export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
//   if (!data) return null;

//   const getStatusColor = (status: string) => {
//     if (!status)
//       return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     return status?.toLowerCase() === "active"
//       ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
//       : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
//   };

//   const getVisaColor = (visa: string) => {
//     switch (visa) {
//       case "H1B":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//       case "Green Card":
//         return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
//       case "F1 Student":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
//       case "L1":
//         return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
//       case "OPT":
//         return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
//       case "H4 EAD":
//         return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     }
//   };

//   const toLabel = (key: string) => {
//     return key
//       .replace(/([A-Z])/g, " $1") // camelCase to spaced
//       .replace(/_/g, " ") // snake_case to spaced
//       .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
//   };

//   const renderValue = (key: string, value: any) => {
//     const lowerKey = key.toLowerCase();

//     if (value === undefined || value === null || value === "") return null;

//     if (["status"].includes(lowerKey)) {
//       return <Badge className={getStatusColor(value)}>{value}</Badge>;
//     }

//     if (["visa", "workstatus"].includes(lowerKey)) {
//       return <Badge className={getVisaColor(value)}>{value}</Badge>;
//     }

//     if (["feepaid", "feedue", "salary0", "salary6", "salary12"].includes(lowerKey)) {
//       return <p className="text-sm font-medium dark:text-gray-200">${Number(value).toLocaleString()}</p>;
//     }

//     if (lowerKey.includes("rating")) {
//       return <p className="text-sm font-medium dark:text-gray-200">{value} ⭐</p>;
//     }

//     return (
//       <p className="text-sm font-medium dark:text-gray-200">
//         {String(value)}
//       </p>
//     );
//   };

//   const renderAllFields = () => {
//     return Object.entries(data).map(([key, value]) => (
//       <div key={key} className="space-y-1">
//         <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//           {toLabel(key)}
//         </Label>
//         {renderValue(key, value)}
//       </div>
//     ));
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto p-0">
//         <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             {title} - View Details
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

//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
//           {renderAllFields()}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }





// // whiteboxLearning-wbl/components/ViewModal.tsx
// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Label } from "@/components/admin_ui/label";
// import { Badge } from "@/components/admin_ui/badge";

// interface ViewModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: Record<string, any>;
//   title: string;
// }

// // Grouping fields under specific sections
// const fieldSections: Record<string, string> = {
//   // Basic Info
//   id: "Basic Information",
//   candidate_id: "Basic Information",
//   candidate_email: "Basic Information",
//   placement_date: "Basic Information",
//   batch: "Basic Information",
//   id:"Basic information",
//   leadid: "Basic Information",
//   name: "Basic Information",
//   candidate_name: "Basic Information",
//   candidate_role: "Basic Information",
//   dob: "Basic Information",
//   contact: "Basic Information",
//   phone: "Basic Information",
//   secondaryphone: "Basic Information",
//   email: "Basic Information",
//   secondaryemail: "Basic Information",
//   ssn:"Basic Information",
//   priority:"Basic Information",
//   source:"Basic Information",
//   enrolleddate: "Basic Information",
//   batchname: "Basic Information",
//   batchid: "Basic Information",
//   term: "Basic Information",
//   agreement: "Basic Information",
//   promissory: "Basic Information",

//   // Professional
//   course: "Professional Information",
//   company: "Professional Information",
//   client_id: "Professional Information",
//   client_name: "Professional Information",
//   interview_time: "Professional Information",
//   vendor_or_client_name: "Professional Information",
//   vendor_or_client_contact: "Professional Information",
//   // placement_date: "Professional Information",
//   marketing_email_address: "Professional Information",
//   interview_date: "Professional Information",
//   interview_mode: "Professional Information",
//   status: "Professional Information",
//   workstatus: "Professional Information",
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

//   // Contact
//   address: "Contact Information",
//   city: "Contact Information",
//   state: "Contact Information",
//   country: "Contact Information",
//   zip: "Contact Information",

//   // Emergency
//   emergcontactname: "Emergency Contact",
//   emergcontactemail: "Emergency Contact",
//   emergcontactphone: "Emergency Contact",
//   emergcontactaddrs: "Emergency Contact",
//   spousename:"Emergency Contact",
//   spousephone:"Emergency Contact",
//   spouseemail:"Emergency Contact",
//   spouseoccupationinfo:"Emergency Contact",

//   // Notes
//   notes: "Notes",
// };

// export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
//   if (!data) return null;

//   const getStatusColor = (status: string) =>
//     status?.toLowerCase() === "active"
//       ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
//       : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

//   const getVisaColor = (visa: string) => {
//     switch (visa) {
//       case "H1B":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//       case "Green Card":
//         return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
//       case "F1 Student":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
//       case "L1":
//         return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
//       case "OPT":
//         return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
//       case "H4 EAD":
//         return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     }
//   };

//   const toLabel = (key: string) =>
//     key
//       .replace(/([A-Z])/g, " $1")
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (l) => l.toUpperCase());

//   const renderValue = (key: string, value: any) => {
//     const lowerKey = key.toLowerCase();
//     if (!value) return null;

//     if (lowerKey === "status") {
//       return <Badge className={getStatusColor(value)}>{value}</Badge>;
//     }

//     if (["visa", "workstatus"].includes(lowerKey)) {
//       return <Badge className={getVisaColor(value)}>{value}</Badge>;
//     }

//     if (["feepaid", "feedue", "salary0", "salary6", "salary12"].includes(lowerKey)) {
//       return <p className="text-sm font-medium dark:text-gray-200">${Number(value).toLocaleString()}</p>;
//     }

//     if (lowerKey.includes("rating")) {
//       return <p className="text-sm font-medium dark:text-gray-200">{value} ⭐</p>;
//     }

//     return <p className="text-sm font-medium dark:text-gray-200">{String(value)}</p>;
//   };

//   // Split sections into rows
//   const sectionedFields: Record<string, { key: string; value: any }[]> = {
//     "Basic Information": [],
//     "Professional Information": [],
//     "Contact Information": [],
//     "Emergency Contact": [],
//     "Notes": [],
//   };

//   Object.entries(data).forEach(([key, value]) => {
//     const section = fieldSections[key] || "Other";
//     if (sectionedFields[section]) {
//       sectionedFields[section].push({ key, value });
//     }
//   });

//   const sectionOrder = [
//     "Basic Information",
//     "Professional Information",
//     "Contact Information",
//     "Emergency Contact",
//   ];

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto p-0">
//         {/* Header */}
//         <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             {title} - View Details
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
//           {sectionOrder.map((sectionName) => (
//             <div key={sectionName} className="space-y-4">
//               <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//                 {sectionName}
//               </h3>
//               {sectionedFields[sectionName].map(({ key, value }) => (
//                 <div key={key} className="space-y-1">
//                   <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                     {toLabel(key)}
//                   </Label>
//                   {renderValue(key, value)}
//                 </div>
//               ))}
//             </div>
//           ))}
//         </div>

//         {/* Notes Section Full Width */}
//         {sectionedFields["Notes"].length > 0 && (
//           <div className="px-6 pb-6">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Notes
//             </h3>
//             {sectionedFields["Notes"].map(({ key, value }) => (
//               <div key={key} className="space-y-1 mt-2">
//                 <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                   {toLabel(key)}
//                 </Label>
//                 {renderValue(key, value)}
//               </div>
//             ))}
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }







// // whiteboxLearning-wbl/components/ViewModal.tsx
// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
// } from "@/components/admin_ui/dialog";
// import { Label } from "@/components/admin_ui/label";
// import { Badge } from "@/components/admin_ui/badge";

// interface ViewModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: Record<string, any>;
//   title: string;
// }

// const fieldSections: Record<string, string> = {
//   // Basic Info
//   candidateid: "Basic Information",
//   candidate_id: "Basic Information",
//   candidate_email: "Basic Information",
//   placement_date: "Basic Information",
//   batch: "Basic Information",
//   id: "Basic Information",
//   leadid: "Basic Information",
//   name: "Basic Information",
//   candidate_name: "Basic Information",
//   candidate_role: "Basic Information",
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

//   // Professional
//   course: "Professional Information",
//   company: "Professional Information",
//   client_id: "Professional Information",
//   interview_time: "Professional Information",
//   vendor_or_client_name: "Professional Information",
//   vendor_or_client_contact: "Professional Information",
//   marketing_email_address: "Professional Information",
//   interview_date: "Professional Information",
//   interview_mode: "Professional Information",
//   status: "Professional Information",
//   workstatus: "Professional Information",
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

//   // Contact
//   address: "Contact Information",
//   city: "Contact Information",
//   state: "Contact Information",
//   country: "Contact Information",
//   zip: "Contact Information",

//   // Emergency
//   emergcontactname: "Emergency Contact",
//   emergcontactemail: "Emergency Contact",
//   emergcontactphone: "Emergency Contact",
//   emergcontactaddrs: "Emergency Contact",
//   spousename: "Emergency Contact",
//   spousephone: "Emergency Contact",
//   spouseemail: "Emergency Contact",
//   spouseoccupationinfo: "Emergency Contact",

//   // Notes
//   notes: "Notes",
// };

// export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
//   if (!data) return null;

//   const getStatusColor = (status: string) =>
//     status?.toLowerCase() === "active"
//       ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
//       : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

//   const getVisaColor = (visa: string) => {
//     switch (visa) {
//       case "H1B":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
//       case "Green Card":
//         return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
//       case "F1 Student":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
//       case "L1":
//         return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
//       case "OPT":
//         return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
//       case "H4 EAD":
//         return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
//     }
//   };

//   const toLabel = (key: string) =>
//     key
//       .replace(/([A-Z])/g, " $1")
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (l) => l.toUpperCase());

//   const renderValue = (key: string, value: any) => {
//     const lowerKey = key.toLowerCase();
//     if (!value) return null;

//     if (lowerKey === "status") {
//       return <Badge className={getStatusColor(value)}>{value}</Badge>;
//     }

//     if (["visa", "workstatus"].includes(lowerKey)) {
//       return <Badge className={getVisaColor(value)}>{value}</Badge>;
//     }

//     if (["feepaid", "feedue", "salary0", "salary6", "salary12"].includes(lowerKey)) {
//       return <p className="text-sm font-medium dark:text-gray-200">${Number(value).toLocaleString()}</p>;
//     }

//     if (lowerKey.includes("rating")) {
//       return <p className="text-sm font-medium dark:text-gray-200">{value} ⭐</p>;
//     }

//     return <p className="text-sm font-medium dark:text-gray-200">{String(value)}</p>;
//   };

//   const sectionedFields: Record<string, { key: string; value: any }[]> = {
//     "Basic Information": [],
//     "Professional Information": [],
//     "Contact Information": [],
//     "Emergency Contact": [],
//     "Other": [],
//     "Notes": [],
//   };

//   Object.entries(data).forEach(([key, value]) => {
//     const section = fieldSections[key] || "Other";
//     if (!sectionedFields[section]) sectionedFields[section] = [];
//     sectionedFields[section].push({ key, value });
//   });

//   const gridSections = [
//     "Basic Information",
//     "Professional Information",
//     "Contact Information",
//     "Emergency Contact",
//     "Other", // Now rendered inside columns
//   ];

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto p-0">
//         {/* Header */}
//         <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             {title} - View Details
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

//         {/* Column Sections */}
//         <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-6 p-6">
//           {gridSections.map(
//             (sectionName) =>
//               sectionedFields[sectionName]?.length > 0 && (
//                 <div key={sectionName} className="space-y-4">
//                   <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//                     {sectionName}
//                   </h3>
//                   {sectionedFields[sectionName].map(({ key, value }) => (
//                     <div key={key} className="space-y-1">
//                       <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                         {toLabel(key)}
//                       </Label>
//                       {renderValue(key, value)}
//                     </div>
//                   ))}
//                 </div>
//               )
//           )}
//         </div>

//         {/* Notes Section - Full Width */}
//         {sectionedFields["Notes"]?.length > 0 && (
//           <div className="px-6 pb-6">
//             <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
//               Notes
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
//               {sectionedFields["Notes"].map(({ key, value }) => (
//                 <div key={key} className="space-y-1">
//                   <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                     {toLabel(key)}
//                   </Label>
//                   {renderValue(key, value)}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
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
import { Badge } from "@/components/admin_ui/badge";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
}

const fieldSections: Record<string, string> = {
  candidateid: "Basic Information",
  candidate_id: "Basic Information",
  candidate_email: "Basic Information",
  placement_date: "Basic Information",
  batch: "Basic Information",
  id: "Basic Information",
  leadid: "Basic Information",
  name: "Basic Information",
  candidate_name: "Basic Information",
  candidate_role: "Basic Information",
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
  // term: "Basic Information",
  agreement: "Basic Information",
  promissory: "Basic Information",

  course: "Professional Information",
  company: "Professional Information",
  client_id: "Professional Information",
  client_name: "Professional Information",
  interview_time: "Professional Information",
  vendor_or_client_name: "Professional Information",
  vendor_or_client_contact: "Professional Information",
  marketing_email_address: "Professional Information",
  interview_date: "Professional Information",
  interview_mode: "Professional Information",
  status: "Professional Information",
  workstatus: "Professional Information",
  education: "Professional Information",
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

export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
  if (!data) return null;

  const getStatusColor = (status: string) =>
    status?.toLowerCase() === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

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

  const toLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const renderValue = (key: string, value: any) => {
    const lowerKey = key.toLowerCase();
    if (!value) return null;

    if (lowerKey === "status") {
      return <Badge className={getStatusColor(value)}>{value}</Badge>;
    }

    if (["visa", "workstatus"].includes(lowerKey)) {
      return <Badge className={getVisaColor(value)}>{value}</Badge>;
    }

    if (["feepaid", "feedue", "salary0", "salary6", "salary12"].includes(lowerKey)) {
      return <p className="text-sm font-medium dark:text-gray-200">${Number(value).toLocaleString()}</p>;
    }

    if (lowerKey.includes("rating")) {
      return <p className="text-sm font-medium dark:text-gray-200">{value} ⭐</p>;
    }

    return <p className="text-sm font-medium dark:text-gray-200">{String(value)}</p>;
  };

  // Organize data into sections
  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    "Other": [],
    "Notes": [],
  };

  Object.entries(data).forEach(([key, value]) => {
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
            {title} - View Details
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

        {/* Content Grid */}
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
                  {renderValue(key, value)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Notes Section Full Width */}
        {sectionedFields["Notes"].length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {sectionedFields["Notes"].map(({ key, value }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {toLabel(key)}
                  </Label>
                  {renderValue(key, value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



