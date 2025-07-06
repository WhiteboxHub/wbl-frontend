// whiteboxLearning-wbl/components/EditModal.tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Textarea } from "@/components/admin_ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin_ui/select";
import { useState, useEffect } from "react";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  data: any;
  title: string;
}

export function EditModal({
  isOpen,
  onClose,
  onSave,
  data,
  title,
}: EditModalProps) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (data && isOpen) {
      setFormData({ ...data });
    }
  }, [data, isOpen]);

  if (!data) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderField = (
    label: string,
    field: string,
    type: string = "text",
    options?: string[],
  ) => {
    const value = formData[field] || "";

    return (
      <div key={field} className="space-y-1">
        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </Label>
        {type === "select" && options ? (
          <Select
            value={String(value)}
            onValueChange={(newValue) => handleChange(field, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "number" ? (
          <Input
            type="number"
            value={String(value)}
            onChange={(e) => handleChange(field, Number(e.target.value))}
            disabled={isLoading}
          />
        ) : type === "email" ? (
          <Input
            type="email"
            value={String(value)}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isLoading}
          />
        ) : type === "date" ? (
          <Input
            type="date"
            value={String(value)}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isLoading}
          />
        ) : type === "textarea" ? (
          <Textarea
            value={String(value)}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isLoading}
            rows={3}
            placeholder="Add your notes here..."
          />
        ) : (
          <Input
            type="text"
            value={String(value)}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isLoading}
          />
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold dark:text-gray-100">
            Edit {title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Basic Information
            </h3>
            {renderField("ID", "candidateid")}
            {renderField("Name", "name")}
            {renderField("DOB", "dob", "date")}
            {renderField("Email", "email", "email")}
            {renderField("Secondary Email", "secondaryemail", "email")}
            {renderField("Phone", "phone")}
            {renderField("Secondary Phone", "secondaryphone")}
            {renderField("Course", "course")}
            {renderField("Batch Name", "batchname")}
            {renderField("Batch ID", "batchid", "number")}
            {renderField("Enrolled Date", "enrolleddate", "date")}
            {renderField("Status", "status")}
            {renderField("Status Change Date", "statuschangedate", "date")}
            {renderField("Work Status", "workstatus")}
            {renderField("SSN", "ssn")}
            {renderField("SSN Validated", "ssnvalidated")}
            {renderField("Avatar ID", "avatarid")}
            {renderField("Original Resume", "originalresume")}
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Professional Information
            </h3>
            {renderField("Education", "education")}
            {renderField("Work Experience", "workexperience")}
            {renderField("Promissory", "promissory")}
            {renderField("Agreement", "agreement")}
            {renderField("Driver's License", "driverslicense")}
            {renderField("DL URL", "dlurl")}
            {renderField("Work Permit", "workpermit")}
            {renderField("WP Expiration Date", "wpexpirationdate", "date")}
            {renderField("WP URL", "workpermiturl")}
            {renderField("SSN URL", "ssnurl")}
            {renderField("Employment Agreement URL", "empagreementurl")}
            {renderField("Offer Letter", "offerletter")}
            {renderField("Offer Letter URL", "offerletterurl")}
            {renderField("Contract URL", "contracturl")}
            {renderField("Guarantor Name", "guarantorname")}
            {renderField("Guarantor Designation", "guarantordesignation")}
            {renderField("Guarantor Company", "guarantorcompany")}
            {renderField("Salary at Joining", "salary0")}
            {renderField("Salary at 6 Months", "salary6")}
            {renderField("Salary at 12 Months", "salary12")}
            {renderField("Fee Paid", "feepaid", "number")}
            {renderField("Fee Due", "feedue", "number")}
            {renderField("Guidelines", "guidelines")}
            {renderField("BGV", "bgv")}
            {renderField("Term", "term")}
            {renderField("Recruiter Assessment", "recruiterassesment", "textarea")}
            {renderField("Background", "background", "textarea")}
            {renderField("Process Flag", "processflag")}
            {renderField("Default Process Flag", "defaultprocessflag")}
            {renderField("Dice Flag", "diceflag")}
            {renderField("Marketing Start Date", "marketing_startdate", "date")}
            {renderField("Instructor", "instructor")}
            {renderField("Second Instructor", "second_instructor")}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Contact Information
            </h3>
            {renderField("Address", "address")}
            {renderField("City", "city")}
            {renderField("State", "state")}
            {renderField("Zip", "zip")}
            {renderField("Country", "country")}
            {renderField("LinkedIn", "linkedin")}
            {renderField("Referral ID", "referralid")}
            {renderField("Portal ID", "portalid")}
            {renderField("Email List", "emaillist")}
          </div>
          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Emergency Contact
            </h3>
            {renderField("Name", "emergcontactname")}
            {renderField("Email", "emergcontactemail", "email")}
            {renderField("Phone", "emergcontactphone")}
            {renderField("Address", "emergcontactaddrs")}
          </div>
          {/* Notes Section - Always shown at the end */}
          <div className="col-span-full space-y-4">
            {/* <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2"> */}
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">

              Notes
            </h3>
            {renderField("Edit Notes", "notes", "textarea")}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end space-x-2 pt-4">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="lg" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
