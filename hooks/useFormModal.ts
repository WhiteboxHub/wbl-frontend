"use client";
import { useState, useCallback } from "react";
import { FormModal } from "../components/FormModal";
import { apiFetch } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Batch {
  batchid: number;
  batchname: string;
  subject?: string;
  courseid?: number;
}

interface UseFormModalProps {
  entityType: 'vendor' | 'candidate' | 'lead' | 'employee' | 'interview' | 'marketing' | 'placement' | 'preparation' | 'course-material' | 'course-subject' | 'batch';
  apiEndpoint: string;
  onSuccess?: () => void;
  batches?: Batch[];
}

export function useFormModal({ entityType, apiEndpoint, onSuccess, batches }: UseFormModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Record<string, any> | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalTitle, setModalTitle] = useState('');

  const openAddModal = useCallback(() => {
    setModalData(undefined);
    setModalMode('add');
    setModalTitle(`Add New ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`);
    setIsModalOpen(true);
  }, [entityType]);

  const openEditModal = useCallback((data: Record<string, any>) => {
    setModalData(data);
    setModalMode('edit');
    setModalTitle(`Edit ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`);
    setIsModalOpen(true);
  }, [entityType]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalData(undefined);
  }, []);

  const handleSave = useCallback(async (formData: Record<string, any>) => {
    try {
      if (modalMode === 'add') {
        // Handle add operation
        const response = await apiFetch(apiEndpoint, {
          method: "POST",
          body: formData,
          timeout: 10000,
        });
        
        toast.success(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} created successfully!`);
      } else {
        // Handle edit operation
        const id = modalData?.id;
        if (!id) {
          throw new Error('No ID provided for edit operation');
        }
        
        const response = await apiFetch(`${apiEndpoint}/${id}`, {
          method: "PUT",
          body: formData,
          timeout: 10000,
        });
        
        toast.success(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} updated successfully!`);
      }
      
      onSuccess?.();
      closeModal();
    } catch (error: any) {
      console.error(`Error ${modalMode === 'add' ? 'creating' : 'updating'} ${entityType}:`, error);
      
      if (error.name === 'TimeoutError') {
        toast.error(`Server timeout - ${entityType} ${modalMode === 'add' ? 'creation' : 'update'} failed`);
      } else if (error.name === 'NetworkError') {
        toast.error("Network error - cannot connect to server");
      } else if (error.status === 401) {
        toast.error("Session expired - please login again");
      } else {
        toast.error(error.message || `Failed to ${modalMode === 'add' ? 'create' : 'update'} ${entityType}`);
      }
    }
  }, [modalMode, modalData, apiEndpoint, entityType, onSuccess, closeModal]);

  return {
    isModalOpen,
    openAddModal,
    openEditModal,
    closeModal,
    handleSave,
    modalData,
    modalTitle,
    modalMode,
    entityType,
    batches,
  };
}