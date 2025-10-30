"use client";
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import DynamicFormRenderer, { DynamicFormRendererProps } from "@/components/forms/DynamicFormRenderer";

export interface DynamicFormModalProps extends Omit<DynamicFormRendererProps, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function DynamicFormModal({ isOpen, onClose, title, ...rendererProps }: DynamicFormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) onClose();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 border-b border-blue-200 flex justify-between items-center">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{title}</h2>
          <button onClick={onClose} className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition">
            <X size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="p-3 sm:p-4 md:p-6 bg-white">
          <DynamicFormRenderer {...rendererProps} title={title} />
        </div>
      </div>
    </div>
  );
}

export default DynamicFormModal;


