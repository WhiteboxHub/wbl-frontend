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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold dark:text-gray-100">
            Edit {title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Basic Information
            </h3>
            {renderField("ID", "id", "text")}
            {data.fullName && renderField("Full Name", "fullName", "text")}
            {data.company && renderField("Company", "company", "text")}
            {data.contact && renderField("Contact", "contact", "text")}
            {data.email && renderField("Email", "email", "email")}
            {data.phone && renderField("Phone", "phone", "text")}
            {data.visaStatus &&
              renderField("Visa Status", "visaStatus", "select", [
                "H1B",
                "Green Card",
                "F1 Student",
                "L1",
                "OPT",
                "H4 EAD",
              ])}
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Professional Information
            </h3>
            {data.education && renderField("Education", "education", "text")}
            {data.services && renderField("Services", "services", "text")}
            {data.status &&
              renderField("Status", "status", "select", [
                "active",
                "inactive",
                "preparation",
                "marketing",
                "placed",
              ])}
            {data.partnership &&
              renderField("Partnership", "partnership", "select", [
                "Premium",
                "Standard",
                "Basic",
              ])}
            {data.activeContracts &&
              renderField("Active Contracts", "activeContracts", "number")}
            {data.enrolledDate &&
              renderField("Enrolled Date", "enrolledDate", "date")}
            {data.lastContact &&
              renderField("Last Contact", "lastContact", "date")}
            {data.amountPaid &&
              renderField("Amount Paid", "amountPaid", "number")}
            {data.rating && renderField("Rating", "rating", "number")}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Contact Information
            </h3>
            {data.address && renderField("Address", "address", "text")}
            {data.location && renderField("Location", "location", "text")}
            {data.pincode && renderField("Pincode", "pincode", "text")}
            {data.referredBy &&
              renderField("Referred By", "referredBy", "text")}
            {data.primaryEmergencyContact &&
              renderField(
                "Primary Emergency Contact",
                "primaryEmergencyContact",
                "text",
              )}
            {data.secondaryEmergencyContact &&
              renderField(
                "Secondary Emergency Contact",
                "secondaryEmergencyContact",
                "text",
              )}
          </div>

          {/* Notes Section - Always shown at the end */}
          <div className="col-span-full space-y-4">
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
