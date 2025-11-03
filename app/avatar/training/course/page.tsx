"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";
import { SearchIcon, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";

export default function CoursePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    alias: "",
    description: "",
    syllabus: "",
  });

  const columnDefs: ColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      pinned: "left",
      editable: false,
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      editable: true,
    },
    {
      field: "alias",
      headerName: "Alias",
      width: 150,
      editable: true,
    },
    {
      field: "description",
      headerName: "Description",
      width: 410,
      editable: true,
    },
    {
      field: "syllabus",
      headerName: "Syllabus",
      width: 410,
      editable: true,
    },
  ];

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch("/courses");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedCourses = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setCourses(sortedCourses);
      setFilteredCourses(sortedCourses);
      toast.success("Fetched courses successfully.");
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to fetch courses";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);


  // Add this useEffect after your existing useEffects
useEffect(() => {
  const handleEscKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsModalOpen(false);
    }
  };

  if (isModalOpen) {
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }
}, [isModalOpen]);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredCourses(courses);

    const filtered = courses.filter((row) => {
      const idMatch = row.id?.toString().includes(lower);
      const nameMatch = row.name?.toLowerCase().includes(lower);
      const aliasMatch = row.alias?.toLowerCase().includes(lower);
      const descMatch = row.description?.toLowerCase().includes(lower);
      const syllabusMatch = row.syllabus?.toLowerCase().includes(lower);

      return idMatch || nameMatch || aliasMatch || descMatch || syllabusMatch;
    });

    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  // Update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/courses/${updatedRow.id}`, {
        method: "PUT",
        body: updatedRow,
      });

      const updated = courses
        .map((c) => (c.id === updatedRow.id ? updatedRow : c))
        .slice()
        .sort((a, b) => b.id - a.id);

      setCourses(updated);
      setFilteredCourses(updated);
      toast.success("Row updated successfully.");
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to update course";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // Delete
  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/courses/${id}`, { method: "DELETE" });
      const updated = courses.filter((c) => c.id !== id);
      setCourses(updated);
      setFilteredCourses(updated);
      toast.success(`Course ${id} deleted.`);
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to delete course";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // Add course
  const handleAddCourse = async () => {
    if (!newCourse.name.trim()) {
      toast.error("Course Name is required");
      return;
    }

    try {
      const res = await apiFetch("/courses", { method: "POST", body: newCourse });
      const created = res && !Array.isArray(res) ? (res.data ?? res) : res;
      const updated = [...courses, created].slice().sort((a, b) => b.id - a.id);
      setCourses(updated);
      setFilteredCourses(updated);
      toast.success("New course created.");
      setIsModalOpen(false);
      setNewCourse({ name: "", alias: "", description: "", syllabus: "" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to create course";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p>Manage all courses here.</p>
        </div>
        {/* <Button onClick={() => setIsModalOpen(true)}>+ Add Course</Button> */}
      </div>

      {/* Search bar */}
      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Id, name, alias, or description..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Add Course Modal - Updated with same colors */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-5 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add Course
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-3 sm:p-4 md:p-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5">
                
                {/* Name */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Name <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) => {
                      const regex = /^[A-Za-z]*$/;
                      if (regex.test(e.target.value)) {
                        setNewCourse((prev) => ({ ...prev, name: e.target.value }));
                      }
                    }}
                    placeholder="Enter course name"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                  />
                </div>

                {/* Alias */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Alias
                  </label>
                  <input
                    type="text"
                    value={newCourse.alias}
                    onChange={(e) => {
                      const regex = /^[A-Za-z]*$/;
                      if (regex.test(e.target.value)) {
                        setNewCourse((prev) => ({ ...prev, alias: e.target.value }));
                      }
                    }}
                    placeholder="Enter course alias"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => {
                      const regex = /^[^0-9]*$/;
                      if (regex.test(e.target.value)) {
                        setNewCourse((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                      }
                    }}
                    placeholder="Enter course description"
                    rows={4}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-none"
                  />
                </div>

                {/* Syllabus */}
                <div className="sm:col-span-2 space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Syllabus
                  </label>
                  <textarea
                    value={newCourse.syllabus}
                    onChange={(e) => {
                      const regex = /^[^0-9]*$/;
                      if (regex.test(e.target.value)) {
                        setNewCourse((prev) => ({ ...prev, syllabus: e.target.value }));
                      }
                    }}
                    placeholder="Enter course syllabus"
                    rows={5}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCourse}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AGGridTable
        rowData={filteredCourses}
        columnDefs={columnDefs}
        title={`Courses (${filteredCourses.length})`}
        height="calc(70vh)"
        onRowAdded={async (newRow: any) => {
          try {
            const payload = {
              name: newRow.name || "",
              alias: newRow.alias || "",
              description: newRow.description || "",
              syllabus: newRow.syllabus || "",
            };
            if (!payload.name) { toast.error("Name is required"); return; }
            const res = await apiFetch("/courses", { method: "POST", body: payload });
            const created = Array.isArray(res) ? res : (res?.data ?? res);
            const updated = [created, ...courses].slice().sort((a:any,b:any)=>b.id-a.id);
            setCourses(updated);
            setFilteredCourses(updated);
            toast.success("Course created");
          } catch (e:any) {
            const msg = e?.body || e?.message || "Failed to create course";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
          }
        }}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}