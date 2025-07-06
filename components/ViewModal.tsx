// whiteboxLearning-wbl/components/ViewModal.tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin_ui/dialog";
import { Label } from "@/components/admin_ui/label";
import { Badge } from "@/components/admin_ui/badge";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title: string;
}

export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
  if (!data) return null;

  const getStatusColor = (status: string) => {
    if (!status)
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    return status?.toLowerCase() === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  const getVisaColor = (visa: string) => {
    if (!visa)
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
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

  const getPartnershipColor = (partnership: string) => {
    if (!partnership)
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    switch (partnership) {
      case "Premium":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "Standard":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "Basic":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const renderField = (label: string, value: any, type?: string) => {
    if (value === undefined || value === null) return null;

    return (
      <div key={label} className="space-y-1">
        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </Label>
        {type === "status" && (
          <div>
            <Badge className={getStatusColor(value)}>
              {String(value).toUpperCase()}
            </Badge>
          </div>
        )}
        {type === "visa" && (
          <div>
            <Badge className={getVisaColor(value)}>{value}</Badge>
          </div>
        )}
        {type === "partnership" && (
          <div>
            <Badge className={getPartnershipColor(value)}>{value}</Badge>
          </div>
        )}
        {type === "amount" && (
          <p className="text-sm font-medium dark:text-gray-200">
            ${Number(value).toLocaleString()}
          </p>
        )}
        {type === "rating" && (
          <p className="text-sm font-medium dark:text-gray-200">{value} ⭐</p>
        )}
        {!type && (
          <p className="text-sm font-medium dark:text-gray-200">
            {String(value)}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold dark:text-gray-100">
            {title} - View Details
          </DialogTitle>
        </DialogHeader>

        {/* <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-4"> */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Basic Information
            </h3>
            {/* {renderField("ID", data.id)} */}
            {renderField("Candidate ID", data.candidateid)}
            {renderField("Full Name", data.name)}
            {renderField("Date of Birth", data.dob)}
            {renderField("Contact", data.contact)}
            {renderField("Primary Phone", data.phone)}
            {renderField("Secondary Phone", data.secondaryphone)}
            {renderField("Email", data.email)}
            {renderField("Secondary Email", data.secondaryemail)}
            {renderField("Enrollment Date", data.enrolleddate)}
            {renderField("Batch Name", data.batchname)}
            {renderField("Batch ID", data.batchid)}
            {renderField("Term", data.term)}
            {renderField("Agreement", data.agreement)}
            {renderField("Promissory Note", data.promissory)}
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Professional Information
            </h3>
            {/* {renderField("Education", data.education)}
            {renderField("Visa Status", data.workstatus, "visa")}
            {renderField("Course", data.course)}
            {renderField("Work Experience", data.workexperience)}
            {renderField("Status", data.status, "status")}
            {renderField("Partnership", data.partnership, "partnership")}
            {renderField("Active Contracts", data.activeContracts)}
            {renderField("Enrolled Date", data.enrolleddate)}
            {renderField("Last Contact", data.lastContact)}
            {renderField("Amount Paid", data.amountPaid, "amount")}
            {renderField("Rating", data.rating, "rating")} */}
            {renderField("Course", data.course)}
            {renderField("Status", data.status)}
            {renderField("Work Status", data.workstatus)}
            {renderField("Education", data.education)}
            {renderField("Work Experience", data.workexperience)}
            {renderField("Fee Paid", data.feepaid)}
            {renderField("Fee Due", data.feedue)}
            {renderField("Initial Salary", data.salary0)}
            {renderField("6 Month Salary", data.salary6)}
            {renderField("12 Month Salary", data.salary12)}
            {renderField("Instructor", data.instructor)}
            {renderField("Second Instructor", data.second_instructor)}
            {renderField("Marketing Start Date", data.marketing_startdate)}
            {renderField("Recruiter Assessment", data.recruiterassesment)}
            {renderField("Status Change Date", data.statuschangedate)}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Contact Information
            </h3>
            {renderField("Address", data.address)}
            {renderField("City", data.city)}
            {renderField("State", data.state)}
            {renderField("Country", data.country)}
            {renderField("Zip", data.zip)}
          </div>

                    {/* Emergency Contact */}
          <div className="space-y-4">
            {/* <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2"> */}
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">

              Emergency Contact
            </h3>
            {renderField("Emergency Name", data.emergcontactname)}
            {renderField("Emergency Email", data.emergcontactemail)}
            {renderField("Emergency Phone", data.emergcontactphone)}
            {renderField("Emergency Address", data.emergcontactaddrs)}
          </div>

          {/* Notes Section */}
          <div className="col-span-full space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Notes
            </h3>
            {renderField("Notes", data.notes)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
