// Example: How to use the new FormModal in a vendor page
"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/admin_ui/button";
import { PlusCircle } from "lucide-react";
import { useFormModal } from "@/hooks/useFormModal";
import { FormModal } from "@/components/FormModal";

export default function VendorPageExample() {
  const [vendors, setVendors] = useState<any[]>([]);

  // Use the FormModal hook for vendors
  const { 
    isModalOpen, 
    openAddModal, 
    openEditModal, 
    closeModal, 
    handleSave, 
    modalData, 
    modalTitle, 
    modalMode, 
    entityType, 
    batches 
  } = useFormModal({
    entityType: 'vendor',
    apiEndpoint: '/vendors',
    onSuccess: () => {
      // Refresh vendor list after successful add/edit
      console.log('Vendor operation successful, refresh list');
    }
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Management</h1>
        <Button
          onClick={openAddModal}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Vendor
        </Button>
      </div>

      {/* Your vendor list/table component goes here */}
      <div>
        {/* Example: Click on a vendor to edit */}
        {vendors.map((vendor) => (
          <div 
            key={vendor.id} 
            onClick={() => openEditModal(vendor)}
            className="p-2 border rounded cursor-pointer hover:bg-gray-50"
          >
            {vendor.full_name} - {vendor.email}
          </div>
        ))}
      </div>

      {/* The FormModal component - handles both add and edit */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        data={modalData}
        title={modalTitle}
        onSave={handleSave}
        batches={batches}
        mode={modalMode}
        entityType={entityType}
      />
    </div>
  );
}
