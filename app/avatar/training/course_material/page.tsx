"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, X } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { useForm } from "react-hook-form";

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

interface MaterialFormData {
  courseid: string;
  subjectid: string;
  type: string;
  sortorder: string;
  name: string;
  link: string;
  description: string;
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<MaterialFormData>({
    defaultValues: {
      subjectid: "0",
      courseid: "",
      type: "P",
      sortorder: "9999",
      name: "",
      description: "",
      link: ""
    }
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
    if (isModalOpen && courses.length > 0) {
      const latestCourse = courses[0];
      setValue('courseid', latestCourse.id.toString());
    }
  }, [isModalOpen, courses, setValue]);

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

  
  // Search Filter
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
    { 
      field: "id", 
      headerName: "ID", 
      width: 130, 
      pinned: "left", 
      editable: false 
    },
    {
      field: "subjectid",
      headerName: "Subject Name",
      width: 180,
      editable: true,
      valueFormatter: (params) => {
        return getSubjectDisplayName(params.value);
      },
      cellEditor: "agRichSelectCellEditor",
      cellEditorParams: {
        values: [
          0,  
          ...subjects.map(s => s.id) 
        ],
        formatValue: (value: number) => {
          return getSubjectDisplayName(value);
        }
      },
      cellEditorPopup: true,
    },
    {
      field: "courseid",
      headerName: "Course Name",
      width: 180,
      editable: true,
      valueFormatter: (params) => {
        return getCourseDisplayName(params.value);
      },
      cellEditor: "agRichSelectCellEditor",
      cellEditorParams: {
        values: [
          0,  
          ...courses.map(c => c.id)
        ],
        formatValue: (value: number) => {
          return getCourseDisplayName(value);
        }
      },
      cellEditorPopup: true,
    },
    { 
      field: "name", 
      headerName: "Material Name", 
      width: 250, 
      editable: true 
    },
    { 
      field: "description", 
      headerName: "Description", 
      width: 230, 
      editable: true 
    },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      editable: true,
      valueFormatter: (params) => {
        return getTypeDisplayName(params.value);
      },
      cellEditor: "agRichSelectCellEditor",
      cellEditorParams: {
        values: Object.keys(TYPE_MAPPING), 
        formatValue: (value: string) => {
          return getTypeDisplayName(value);
        }
      },
      cellEditorPopup: true,
    },
    {
      field: "link",
      headerName: "Link",
      width: 130,
      editable: true,
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
      valueParser: (params) => Number(params.newValue)
    },
  ], [subjects, courses]);

  
  // CREATE - Add new material
  const onSubmit = async (data: MaterialFormData) => {
    if (!data.courseid || !data.name.trim()) {
      toast.error("Course Name and Material Name are required");
      return;
    }

    const payload = {
      subjectid: Number(data.subjectid) || 0,
      courseid: Number(data.courseid) || 0,
      name: data.name,
      description: data.description,
      type: data.type,
      link: data.link,
      sortorder: Number(data.sortorder) || 9999,
    };

    console.log("Creating new material with payload:", payload);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-materials`,
        payload
      );

      const newMaterialData = response.data;
      console.log("Backend returned:", newMaterialData);

      const updated = [...materials, newMaterialData].sort((a, b) => b.id - a.id);
      setMaterials(updated);
      setFilteredMaterials(updated);
      toast.success("Course Material added successfully", { position: "top-center" });
      setIsModalOpen(false);
      reset();
    } catch (e: any) {
      console.error(" Create error:", e.response?.data);
      toast.error(
        e.response?.data?.detail || "Failed to add Course Material",
        { position: "top-center" }
      );
    }
  };

  
  // UPDATE 
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

      console.log("Updating material with payload:", payload);

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-materials/${updatedRow.id}`,
        payload
      );
      
      const updatedMaterial = response.data;
      console.log("Backend returned:", updatedMaterial);

      // Update local state with the response from backend
      const updatedMaterials = materials.map((m) =>
        m.id === updatedRow.id ? updatedMaterial : m
      );
      setMaterials(updatedMaterials);
      setFilteredMaterials(updatedMaterials);
      
      toast.success("Course Material updated successfully", {
        position: "top-center",
      });
    } catch (e: any) {
      console.error("Update error:", e.response?.data);
      toast.error(
        e.response?.data?.detail || "Failed to update Course Material",
        { position: "top-center" }
      );
    }
  };


  const handleRowDeleted = async (id: number) => {
    try {
      console.log("Deleting material with ID:", id);
      
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/course-materials/${id}`
      );
      
      console.log("Material deleted successfully");
      
      setFilteredMaterials((prev) => prev.filter((r) => r.id !== id));
      setMaterials((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Course Material ${id} deleted`, { position: "top-center" });
    } catch (e: any) {
      console.error("Delete error:", e.response?.data);
      toast.error(
        e.response?.data?.detail || "Failed to delete Course Material",
        { position: "top-center" }
      );
    }
  };

  if (loading) return <p className="mt-8 text-center">Loading...</p>;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Course Materials</h1>
          <p>Manage course materials for courses and subjects.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Material</Button>
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-5 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add Course Material
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-3 sm:p-4 md:p-6 bg-white">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5">
                  
                  {/* Course Dropdown */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Course <span className="text-red-700">*</span>
                    </label>
                    {courses.length === 0 ? (
                      <p className="text-gray-500 text-xs">Loading courses...</p>
                    ) : (
                      <select
                        {...register("courseid", { required: "Course is required" })}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                      >
                        <option value="">Select a course</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                        <option value="0">Fundamentals</option>
                      </select>
                    )}
                    {errors.courseid && (
                      <p className="text-red-600 text-xs mt-1">{errors.courseid.message}</p>
                    )}
                  </div>

                  {/* Type Dropdown */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Type <span className="text-red-700">*</span>
                    </label>
                    <select
                      {...register("type", { required: "Type is required" })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="text-red-600 text-xs mt-1">{errors.type.message}</p>
                    )}
                  </div>

                  {/* Material Name */}
                  <div className="sm:col-span-2 space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Material Name <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("name", { 
                        required: "Material name is required",
                        maxLength: {
                          value: 250,
                          message: "Material name cannot exceed 250 characters"
                        }
                      })}
                      placeholder="Enter material name"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Subject Dropdown */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Subject
                    </label>
                    {subjects.length === 0 ? (
                      <p className="text-gray-500 text-xs">Loading subjects...</p>
                    ) : (
                      <select
                        {...register("subjectid")}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
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

                  {/* Sort Order */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      {...register("sortorder")}
                      placeholder="9999"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                  </div>

                  {/* Link */}
                  <div className="sm:col-span-2 space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Link
                    </label>
                    <input
                      type="url"
                      {...register("link", {
                        maxLength: {
                          value: 500,
                          message: "Link cannot exceed 500 characters"
                        }
                      })}
                      placeholder="https://example.com"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                    />
                    {errors.link && (
                      <p className="text-red-600 text-xs mt-1">{errors.link.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                      Description
                    </label>
                    <textarea
                      {...register("description", {
                        maxLength: {
                          value: 1000,
                          message: "Description cannot exceed 1000 characters"
                        }
                      })}
                      placeholder="Enter description..."
                      rows={2}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-none"
                    />
                    {errors.description && (
                      <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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