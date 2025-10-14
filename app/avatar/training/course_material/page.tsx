"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";
import { apiFetch } from "@/lib/api.js";

export default function CourseMaterialPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [materials, setMaterials] = useState<any[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newMaterial, setNewMaterial] = useState({
    subjectid: "0",
    courseid: "",
    name: "",
    description: "",
    type: "P",
    link: "",
    sortorder: "9999",
  });

  const fetchCourses = async () => {
    try {
      const res = await apiFetch("/courses");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedCourses = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setCourses(sortedCourses);
    } catch (e: any) {
      // don't block page — log and show toast optionally
      console.error("Failed to fetch courses", e);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await apiFetch("/subjects");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedSubjects = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setSubjects(sortedSubjects);
    } catch (e: any) {
      console.error("Failed to fetch subjects", e);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch("/course-materials");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedMaterials = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setMaterials(sortedMaterials);
      setFilteredMaterials(sortedMaterials);
      toast.success("Course Materials fetched successfully", { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to fetch Course Materials";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error("Failed to fetch Course Materials", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch in parallel
    fetchMaterials();
    fetchCourses();
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOrphanCourseIds = () => {
    const courseIdsFromMaterials = [...new Set(materials.map((m) => m.courseid))];
    return courseIdsFromMaterials
      .filter((id) => !courses.some((course) => course.id === id))
      .sort((a, b) => b - a);
  };

  const getOrphanSubjectIds = () => {
    const subjectIdsFromMaterials = [...new Set(materials.map((m) => m.subjectid))];
    return subjectIdsFromMaterials
      .filter((id) => !subjects.some((subject) => subject.id === id))
      .sort((a, b) => b - a);
  };

  // search filter
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) {
      setFilteredMaterials(materials);
      return;
    }

    const filtered = materials.filter((row) => {
      const idStr = row.id?.toString().toLowerCase() || "";
      const nameStr = row.name?.toLowerCase() || "";
      const typeStr = row.type?.toLowerCase() || "";
      const courseIdStr = row.courseid?.toString().toLowerCase() || "";
      const subjectIdStr = row.subjectid?.toString().toLowerCase() || "";

      return (
        idStr.includes(lower) ||
        nameStr.includes(lower) ||
        typeStr.includes(lower) ||
        courseIdStr.includes(lower) ||
        subjectIdStr.includes(lower)
      );
    });

    setFilteredMaterials(filtered);
  }, [searchTerm, materials]);

  const columnDefs: ColDef[] = useMemo<ColDef[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 130,
        pinned: "left",
        editable: false,
      },
      {
        field: "subjectid",
        headerName: "Subject ID",
        width: 130,
        editable: true,
      },
      {
        field: "courseid",
        headerName: "Course ID",
        width: 130,
        editable: true,
      },
      { field: "name", headerName: "Name", width: 250, editable: true },
      {
        field: "description",
        headerName: "Description",
        width: 230,
        editable: true,
      },
      { field: "type", headerName: "Type", width: 130, editable: true },
      {
        field: "link",
        headerName: "Link",
        width: 130,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={params.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Click Here
            </a>
          );
        },
      },
      {
        field: "sortorder",
        headerName: "Sort Order",
        width: 140,
        editable: true,
      },
    ],
    []
  );

  // Add new material
  const handleAddMaterial = async () => {
    const payload = {
      ...newMaterial,
      subjectid: Number(newMaterial.subjectid) || 0,
      courseid: Number(newMaterial.courseid) || 0,
      sortorder: Number(newMaterial.sortorder) || 9999,
    };

    try {
      const res = await apiFetch("/course-materials", { method: "POST", body: payload });
      const created = res && !Array.isArray(res) ? (res.data ?? res) : res;
      const updated = [...materials, created].slice().sort((a, b) => b.id - a.id);
      setMaterials(updated);
      setFilteredMaterials(updated);
      toast.success("Course Material added successfully", { position: "top-center" });
      setIsModalOpen(false);
      setNewMaterial({
        subjectid: "0",
        courseid: "",
        name: "",
        description: "",
        type: "P",
        link: "",
        sortorder: "9999",
      });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to add Course Material";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { position: "top-center" });
    }
  };

  // update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/course-materials/${updatedRow.id}`, { method: "PUT", body: updatedRow });
      setMaterials((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
      setFilteredMaterials((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
      toast.success("Course Material updated successfully", { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to update Course Material";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { position: "top-center" });
    }
  };

  // delete
  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/course-materials/${id}`, { method: "DELETE" });
      setMaterials((prev) => prev.filter((r) => r.id !== id));
      setFilteredMaterials((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Course Material ${id} deleted`, { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to delete Course Material";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { position: "top-center" });
    }
  };

  if (loading) return <p className="mt-8 text-center">Loading...</p>;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      {/* Header + Search + Add Button (Responsive Layout) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Section */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Materials</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage course materials for courses and subjects.</p>

          {/* Search Input */}
          <div className="mt-2 sm:mt-0 sm:max-w-md">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
            <div className="relative mt-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by ID, name, type..." className="w-full pl-10 text-sm sm:text-base" />
            </div>
            {searchTerm && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{filteredMaterials.length} results found</p>}
          </div>
        </div>

        {/* Right Section */}
        <div className="mt-2 flex flex-row items-center gap-2 sm:mt-0">
          <Button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap bg-green-600 text-white hover:bg-green-700">+ Add Course Material</Button>
        </div>
      </div>

      {/* Add Material Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setNewMaterial({
              subjectid: "0",
              courseid: "",
              name: "",
              description: "",
              type: "P",
              link: "",
              sortorder: "9999",
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Course Material</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Course ID */}
            <div className="space-y-2">
              <Label htmlFor="courseid">Course ID*</Label>
              {courses.length === 0 ? (
                <p className="text-gray-500">Loading courses...</p>
              ) : (
                <select id="courseid" value={newMaterial.courseid} onChange={(e) => setNewMaterial((prev) => ({ ...prev, courseid: e.target.value }))} className="max-h-48 w-full overflow-y-auto rounded border border-gray-300 px-2 py-1">
                  {courses.map((course) => <option key={course.id} value={course.id}>{course.id}</option>)}
                  {getOrphanCourseIds().map((id) => <option key={`orphan-${id}`} value={id}>{id}</option>)}
                </select>
              )}
            </div>

            {/* Subject ID */}
            <div className="space-y-2">
              <Label htmlFor="subjectid">Subject ID</Label>
              {subjects.length === 0 ? (
                <p className="text-gray-500">Loading subjects...</p>
              ) : (
                <select id="subjectid" value={newMaterial.subjectid} onChange={(e) => setNewMaterial((prev) => ({ ...prev, subjectid: e.target.value }))} className="max-h-48 w-full overflow-y-auto rounded border border-gray-300 px-2 py-1">
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.id}</option>)}
                  {getOrphanSubjectIds().map((id) => <option key={`orphan-${id}`} value={id}>{id}</option>)}
                </select>
              )}
            </div>

            <div className=" space-y-2">
              <Label htmlFor="name">Name*</Label>
              <Input id="name" value={newMaterial.name} maxLength={250} required onChange={(e) => setNewMaterial((prev) => ({ ...prev, name: e.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={newMaterial.description} maxLength={500} onChange={(e) => setNewMaterial((prev) => ({ ...prev, description: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input id="type" value={newMaterial.type} onChange={(e) => setNewMaterial((prev) => ({ ...prev, type: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortorder">Sort Order</Label>
              <Input id="sortorder" type="number" value={newMaterial.sortorder} onChange={(e) => setNewMaterial((prev) => ({ ...prev, sortorder: e.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="link">Link</Label>
              <Input id="link" value={newMaterial.link} maxLength={500} onChange={(e) => setNewMaterial((prev) => ({ ...prev, link: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMaterial}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AGGridTable
        rowData={filteredMaterials}
        columnDefs={columnDefs}
        defaultColDef={{
          editable: true,
          flex: 1,
          resizable: true,
        }}
        title={`Course Materials (${filteredMaterials.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}
