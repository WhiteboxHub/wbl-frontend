

"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";
import { toast, Toaster } from "sonner";

interface CourseSubject {
  subject_id: number;
  course_id: number;
  course_name: string;   
  subject_name: string;
  //lastmoddatetime: string;
  id?: string; 
}

interface NewMapping {
  course_id: string;
  subject_id: string;
}

function getErrorMessage(e: any): string {
  if (typeof e === "string") return e;
  if (e?.response?.data?.detail) {
    const detail = e.response.data.detail;
    if (typeof detail === "string") return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return "Unexpected error format";
    }
  }
  if (e?.message) return e.message;
  return "Unknown error occurred";
}

export default function CourseSubjectPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSubjects, setCourseSubjects] = useState<CourseSubject[]>([]);
  const [filteredCourseSubjects, setFilteredCourseSubjects] = useState<CourseSubject[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showModal, setShowModal] = useState(false);
  const [newMapping, setNewMapping] = useState<NewMapping>({ course_id: "", subject_id: "" });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourseSubjects = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/course-subjects`);
      
      const dataWithId = res.data.map((item: CourseSubject) => ({
        ...item,
        id: `${item.course_id}-${item.subject_id}` 
      }));


    const sortedData = [...dataWithId].sort((a, b) => {
      const dateA = new Date(a.lastmoddatetime || a.created_at || 0).getTime();
      const dateB = new Date(b.lastmoddatetime || b.created_at || 0).getTime();
      return dateB - dateA; 
    });
      
      setCourseSubjects(sortedData);
      setFilteredCourseSubjects(sortedData);
      toast.success("Course-subject mappings loaded successfully!");
    } catch (e: any) {
      const errorMsg = getErrorMessage(e);
      setError(errorMsg);
      toast.error(`Failed to load data: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await fetchCourseSubjects();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourseSubjects();
  }, []);

  useEffect(() => {
  const lower = searchTerm.trim().toLowerCase();
  if (!lower) {
    setFilteredCourseSubjects(courseSubjects);
    setPage(1);
    return;
  }

  const parts = lower.split(/\s+/).filter(Boolean);

  const filtered = courseSubjects.filter((row) => {
    const courseIdStr = row.course_id?.toString() || "";
    const subjectIdStr = row.subject_id?.toString() || "";
    const courseNameStr = row.course_name?.toLowerCase() || "";
    const subjectNameStr = row.subject_name?.toLowerCase() || "";

    const haystack = `${courseIdStr} ${subjectIdStr} ${courseNameStr} ${subjectNameStr} ${courseIdStr}-${subjectIdStr} ${subjectIdStr}-${courseIdStr}`;

   
    if (parts.length === 2 && parts.every((p) => /^\d+$/.test(p))) {
      return (
        (parts[0] === courseIdStr && parts[1] === subjectIdStr) ||
        (parts[1] === courseIdStr && parts[0] === subjectIdStr)
      );
    }


    return parts.every((word) => haystack.includes(word));
  });

  setFilteredCourseSubjects(filtered);
  setPage(1);
}, [searchTerm, courseSubjects]);


  useEffect(() => {
    if (courseSubjects.length > 0) {
      const defs: ColDef[] = Object.keys(courseSubjects[0])
        .filter(key => key !== 'id'  && key !== 'lastmoddatetime' ) 
        .map((key) => {
          const col: ColDef = {
            field: key,
            headerName: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            width: 180,
            editable: false,
            sortable: true,
            filter: true,
          };

          if (key === "course_id" || key === "subject_id") {
            col.hide = true;
          }

          if (key === "course_name") {
            col.headerName = "Course";
            col.width = 300;
          }

          if (key === "subject_name") {
            col.headerName = "Subject";
            col.width = 400;
          }


          return col;
        });

      setColumnDefs(defs);
    }
  }, [courseSubjects]);

  const handleRowDeleted = async (compositeId: string) => {
    try {

      const [courseId, subjectId] = compositeId.split('-');
      
      if (!courseId || !subjectId) {
        toast.error("Invalid record ID format");
        return;
      }

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/course-subjects/${courseId}/${subjectId}`
      );

      setCourseSubjects((prev) => 
        prev.filter((r) => r.id !== compositeId)
      );
      setFilteredCourseSubjects((prev) => 
        prev.filter((r) => r.id !== compositeId)
      );

      toast.success("Course-subject mapping deleted successfully!");
    } catch (e: any) {
      console.error("Delete failed", e.response?.data || e.message);
      const errorMsg = getErrorMessage(e);
      setError(errorMsg);
      toast.error(`Delete failed: ${errorMsg}`);
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.course_id || !newMapping.subject_id) {
      toast.error("Course ID and Subject ID are required!");
      return;
    }

    const courseId = Number(newMapping.course_id);
    const subjectId = Number(newMapping.subject_id);
    
    if (isNaN(courseId) || isNaN(subjectId)) {
      toast.error("Course ID and Subject ID must be valid numbers!");
      return;
    }

    const exists = courseSubjects.some(
      (item) => item.course_id === courseId && item.subject_id === subjectId
    );
    
    if (exists) {
      toast.error("This course-subject mapping already exists!");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/course-subjects`, {
        course_id: courseId,
        subject_id: subjectId,
      });

    
      const newRecordWithId = {
        ...res.data,
        id: `${res.data.course_id}-${res.data.subject_id}`
      };

      const updated = [...courseSubjects, newRecordWithId].sort((a, b) => {
      const dateA = new Date(a.lastmoddatetime || 0).getTime();
      const dateB = new Date(b.lastmoddatetime || 0).getTime();
      return dateB - dateA; // latest first
      });
      

      setCourseSubjects(updated);
      setFilteredCourseSubjects(updated);
      toast.success("Course-subject mapping added successfully!");
      setShowModal(false);
      setNewMapping({ course_id: "", subject_id: "" });
    } catch (e: any) {
      const errorMsg = getErrorMessage(e);
      toast.error(`Failed to add mapping: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(filteredCourseSubjects.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredCourseSubjects.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading course-subject mappings...</p>
        </div>
      </div>
    );
  }

  if (error && courseSubjects.length === 0) {
    return (
      <div className="text-center mt-8 space-y-4">
        <p className="text-red-600 text-lg">{error}</p>
        <Button onClick={fetchCourseSubjects} variant="outline">
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Toaster richColors position="top-center" />
      
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Course-Subject Relationships
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage mappings between courses and subjects. Total mappings: {courseSubjects.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={refreshData} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => setShowModal(true)} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </div>
       </div>

      
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium">
          Search Mappings
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter course ID, subject ID..."
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-500 mt-1">
            Showing {filteredCourseSubjects.length} of {courseSubjects.length} mappings
          </p>
        )}
      </div>

     
      <AGGridTable
        rowData={paginatedData}
        columnDefs={columnDefs}
        title={`Course-Subject Mappings (${filteredCourseSubjects.length} results)`}
        height="calc(70vh - 100px)"
        onRowDeleted={handleRowDeleted}
        //onRowUpdated={handleRowUpdated}
        showSearch={false}
      />

      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredCourseSubjects.length)} of {filteredCourseSubjects.length}
          </span>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-sm font-medium px-2">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

  <Dialog open={showModal} onOpenChange={setShowModal}>
    <DialogContent  className="max-w-sm p-4">
      <DialogHeader>
        <DialogTitle>Add Course-Subject Mapping</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="course_id" className="text-sm font-medium">
            Course ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="course_id"
            type="number"
            value={newMapping.course_id}
            onChange={(e) =>
              setNewMapping((prev) => ({ ...prev, course_id: e.target.value }))
            }
            placeholder="Enter course ID"
          />
        </div>

        <div>
          <Label htmlFor="subject_id" className="text-sm font-medium">
            Subject ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subject_id"
            type="number"
            value={newMapping.subject_id}
            onChange={(e) =>
              setNewMapping((prev) => ({ ...prev, subject_id: e.target.value }))
            }
            placeholder="Enter subject ID"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            setShowModal(false);
            setNewMapping({ course_id: "", subject_id: "" });
          }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddMapping}
          disabled={saving || !newMapping.course_id || !newMapping.subject_id}
        >
          {saving ? (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  
    </div>
  );
}
