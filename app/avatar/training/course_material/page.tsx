"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";

interface CourseMaterial {
  id: number;
  subjectid: number;
  courseid: number;
  name: string;
  description: string;
  type: string;
  link: string;
  sortorder: number;
}

interface Course {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

const TYPE_MAPPING = {
  P: "Presentations",
  C: "Cheatsheets",
  D: "Diagrams",
  S: "Softwares",
  I: "Installations",
  B: "Books",
  N: "Newsletters",
  M: "Materials",
};

const TYPE_OPTIONS = [
  { value: "P", label: "Presentations" },
  { value: "C", label: "Cheatsheets" },
  { value: "D", label: "Diagrams" },
  { value: "S", label: "Softwares" },
  { value: "I", label: "Installations" },
  { value: "B", label: "Books" },
  { value: "N", label: "Newsletters" },
  { value: "M", label: "Materials" },
];

export default function CourseMaterialPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newMaterial, setNewMaterial] = useState({
    subjectid: "0",
    courseid: "",
    subjectName: "Basic Fundamentals",
    courseName: "",
    name: "",
    description: "",
    type: "P",
    typeName: "Presentations",
    link: "",
    sortorder: "9999",
  });

  const fetchCourses = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sortedCourses = res.data.sort((a: Course, b: Course) => b.id - a.id);
    setCourses(sortedCourses);
  };

  const fetchSubjects = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subjects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sortedSubjects = res.data.sort((a: Subject, b: Subject) => b.id - a.id);
    setSubjects(sortedSubjects);
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/course-materials`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sortedMaterials = res.data.sort(
        (a: CourseMaterial, b: CourseMaterial) => b.id - a.id
      );
      setMaterials(sortedMaterials);
      setFilteredMaterials(sortedMaterials);
      toast.success("Course Materials fetched successfully", {
        position: "top-center",
      });
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
      toast.error("Failed to fetch Course Materials", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (isModalOpen && courses.length > 0 && !newMaterial.courseid) {
      const latestCourse = courses[0];
      setNewMaterial(prev => ({
        ...prev,
        courseid: latestCourse.id.toString(),
        courseName: latestCourse.name
      }));
    }
  }, [isModalOpen, courses, newMaterial.courseid]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchCourses(), fetchSubjects()]);
        await fetchMaterials();
      } catch (e) {
        console.error("Error loading initial data", e);
        setError("Failed to load initial data");
      }
    };
    loadData();
  }, []);


  const getSubjectDisplayName = (subjectId: number) => {
    if (subjectId === 0) return "Basic Fundamentals";
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : `Subject ID: ${subjectId}`;
  };

  const getCourseDisplayName = (courseId: number) => {
    if (courseId === 0) return "Fundamentals";
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : `Course ID: ${courseId}`;
  };

  const getTypeDisplayName = (typeCode: string) => {
    return TYPE_MAPPING[typeCode as keyof typeof TYPE_MAPPING] || typeCode;
  };

  // Search filter
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredMaterials(materials);
    const filtered = materials.filter((row) => {
      const idStr = row.id?.toString().toLowerCase() || "";
      const nameStr = row.name?.toLowerCase() || "";
      const typeStr = getTypeDisplayName(row.type)?.toLowerCase() || "";
      const courseNameStr = getCourseDisplayName(row.courseid)?.toLowerCase() || "";
      const subjectNameStr = getSubjectDisplayName(row.subjectid)?.toLowerCase() || "";

      return (
        idStr.includes(lower) ||
        nameStr.includes(lower) ||
        typeStr.includes(lower) ||
        courseNameStr.includes(lower) ||
        subjectNameStr.includes(lower)
      );
    });

    setFilteredMaterials(filtered);
  }, [searchTerm, materials, subjects, courses]);

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "id", headerName: "ID", width: 130, pinned: "left", editable: false },
    {
      field: "subjectid",
      headerName: "Subject Name",
      width: 180,
      editable: true,
      valueGetter: (params) => getSubjectDisplayName(params.data.subjectid),
    },
    {
      field: "courseid",
      headerName: "Course Name",
      width: 180,
      editable: true,
      valueGetter: (params) => getCourseDisplayName(params.data.courseid),
    },
    { field: "name", headerName: "Material Name", width: 250, editable: true },
    { field: "description", headerName: "Description", width: 230, editable: true },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      editable: true,
      valueGetter: (params) => getTypeDisplayName(params.data.type),
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: Object.keys(TYPE_MAPPING),
      },
    },
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
    { field: "sortorder", headerName: "Sort Order", width: 140, editable: true },
  ], [subjects, courses]);

  // Add new material
  const handleAddMaterial = async () => {
    if (!newMaterial.courseid || !newMaterial.name.trim()) {
      toast.error("Course Name and Material Name are required");
      return;
    }

    const payload = {
      subjectid: Number(newMaterial.subjectid) || 0,
      courseid: Number(newMaterial.courseid) || 0,
      name: newMaterial.name,
      description: newMaterial.description,
      type: newMaterial.type,
      link: newMaterial.link,
      sortorder: Number(newMaterial.sortorder) || 9999,
    };

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-materials`,
        payload
      );

      const newMaterialData = response.data;

      const updated = [...materials, newMaterialData].sort((a, b) => b.id - a.id);
      setMaterials(updated);
      setFilteredMaterials(updated);
      toast.success("Course Material added successfully", { position: "top-center" });
      setIsModalOpen(false);
      setNewMaterial({
        subjectid: "0",
        courseid: "",
        subjectName: "Basic Fundamentals",
        courseName: "",
        name: "",
        description: "",
        type: "P",
        typeName: "Presentations",
        link: "",
        sortorder: "9999",
      });
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || "Failed to add Course Material",
        { position: "top-center" }
      );
    }
  };

  // Update material
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = {
        subjectid: Number(updatedRow.subjectid),
        courseid: Number(updatedRow.courseid),
        name: updatedRow.name,
        description: updatedRow.description,
        type: updatedRow.type,
        link: updatedRow.link,
        sortorder: Number(updatedRow.sortorder)
      };
      

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-materials/${updatedRow.id}`,
        payload
      );
      
      const updatedMaterial = response.data;

      const updatedMaterials = materials.map((m) =>
        m.id === updatedRow.id ? updatedMaterial : m
      );
      setMaterials(updatedMaterials);
      setFilteredMaterials(updatedMaterials);
      toast.success("Course Material updated successfully", {
        position: "top-center",
      });
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || "Failed to update Course Material",
        { position: "top-center" }
      );
    }
  };

  // Delete material
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/course-materials/${id}`
      );
      
      setFilteredMaterials((prev) => prev.filter((r) => r.id !== id));
      setMaterials((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Course Material ${id} deleted`, { position: "top-center" });
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || "Failed to delete Course Material",
        { position: "top-center" }
      );
    }
  };

  if (loading) return <p className="mt-8 text-center">Loading...</p>;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Course Materials</h1>
          <p>Manage course materials for courses and subjects.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Course Material</Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, type, course or subject..."
            className="pl-10"
          />
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
              subjectName: "Basic Fundamentals",
              courseName: "",
              name: "",
              description: "",
              type: "P",
              typeName: "Presentations",
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Name */}
            <div className="space-y-2">
              <Label htmlFor="coursename">Course Name*</Label>
              {courses.length === 0 ? (
                <p className="text-gray-500">Loading courses...</p>
              ) : (
                <select
                  id="coursename"
                  value={newMaterial.courseid}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    if (selectedValue === "0") {
                      setNewMaterial((prev) => ({
                        ...prev,
                        courseName: "Fundamentals",
                        courseid: "0",
                      }));
                    } else {
                      const selectedCourse = courses.find(
                        (c) => c.id === parseInt(selectedValue)
                      );
                      setNewMaterial((prev) => ({
                        ...prev,
                        courseName: selectedCourse ? selectedCourse.name : "",
                        courseid: selectedValue,
                      }));
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1 max-h-48 overflow-y-auto"
                >
                  <option value="" disabled hidden>Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                  <option value="0">Fundamentals</option>
                </select>
              )}
            </div>

            {/* Subject Name */}
            <div className="space-y-2">
              <Label htmlFor="subjectname">Subject Name</Label>
              {subjects.length === 0 ? (
                <p className="text-gray-500">Loading subjects...</p>
              ) : (
                <select
                  id="subjectname"
                  value={newMaterial.subjectid}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    if (selectedValue === "0") {
                      setNewMaterial((prev) => ({
                        ...prev,
                        subjectName: "Basic Fundamentals",
                        subjectid: "0",
                      }));
                    } else {
                      const selectedSubject = subjects.find(
                        (s) => s.id === parseInt(selectedValue)
                      );
                      setNewMaterial((prev) => ({
                        ...prev,
                        subjectName: selectedSubject ? selectedSubject.name : "",
                        subjectid: selectedValue,
                      }));
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1 max-h-48 overflow-y-auto"
                >
                  <option value="0">Basic Fundamentals</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Type Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="type">Type*</Label>
              <select
                id="type"
                value={newMaterial.type}
                onChange={(e) => {
                  const selectedType = TYPE_OPTIONS.find(
                    (t) => t.value === e.target.value
                  );
                  setNewMaterial((prev) => ({
                    ...prev,
                    type: e.target.value,
                    typeName: selectedType ? selectedType.label : "Presentations",
                  }));
                }}
                className="w-full border border-gray-300 rounded px-2 py-1"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sortorder">Sort Order</Label>
              <Input
                id="sortorder"
                type="number"
                value={newMaterial.sortorder}
                onChange={(e) =>
                  setNewMaterial((prev) => ({
                    ...prev,
                    sortorder: e.target.value,
                  }))
                }
              />
            </div>

            {/* Material Name */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Material Name*</Label>
              <Input
                id="name"
                value={newMaterial.name}
                maxLength={250}
                required
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Link */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                value={newMaterial.link}
                maxLength={500}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, link: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={newMaterial.description}
                maxLength={1000}
                onChange={(e) =>
                  setNewMaterial((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={handleAddMaterial}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save
            </Button>
            <Button
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AG Grid Table */}
      <AGGridTable
        rowData={filteredMaterials}
        columnDefs={columnDefs}
        title={`Course Materials (${filteredMaterials.length})`}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
      />
    </div>
  );
}