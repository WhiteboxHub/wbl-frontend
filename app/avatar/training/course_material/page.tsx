"use client";

import React, { useMemo,useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/admin_ui/dialog";


const validTypes = ['P', 'C', 'D', 'S', 'I', 'B', 'N', 'T', 'G', 'M'];

export default function CourseMaterialPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [materials, setMaterials] = useState<any[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  // const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  
  // Modal state for adding new material
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    subjectid: "",
    courseid: "",
    name: "",
    description: "",
    type: "",
    link: "",
    sortorder: ""
  });


  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/course-materials`);
      setMaterials(res.data);
      setFilteredMaterials(res.data);
      toast.success("Course Materials fetched successfully", { position: "top-center" });
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
      toast.error("Failed to fetch Course Materials", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // search filter
  useEffect(() => {
  const lower = searchTerm.trim().toLowerCase();
  if (!lower) return setFilteredMaterials(materials);

  const filtered = materials.filter((row) => {
    const idStr = row.id?.toString().toLowerCase() || "";
    const nameStr = row.name?.toLowerCase() || "";
    const typeStr = row.type?.toLowerCase() || "";
    const courseIdStr = row.course_id?.toString().toLowerCase() || "";
    const subjectIdStr = row.subject_id?.toString().toLowerCase() || "";

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


const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "id", headerName: "ID", width: 100, pinned: "left" },
    { field: "subjectid", headerName: "Subject ID", width: 130, editable: false },
    { field: "courseid", headerName: "Course ID", width: 130, editable: true },
    { field: "name", headerName: "Name", width: 230, editable: true },
    { field: "description", headerName: "Description", width: 180, editable: true },
    { field: "type", headerName: "Type", width: 120, editable: true },
    {field: "link",
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
  ], []);

  // Add new material
const handleAddMaterial = async () => {
  // Validate type
  if (newMaterial.type && !validTypes.includes(newMaterial.type)) {
    toast.error(`Invalid type. Must be one of: ${validTypes.join(", ")}`, { position: "top-center" });
    return;
  }

  
  const payload = {
    ...newMaterial,
    subjectid: Number(newMaterial.subjectid) || 0,
    courseid: Number(newMaterial.courseid) || 0,
    sortorder: Number(newMaterial.sortorder) || 9999,
  };

  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/course-materials`,
      payload
    );
    setMaterials(prev => [...prev, res.data]);
    setFilteredMaterials(prev => [...prev, res.data]);
    toast.success("Course Material added successfully", { position: "top-center" });
    setIsModalOpen(false);
    setNewMaterial({
      subjectid: "",
      courseid: "",
      name: "",
      description: "",
      type: "",
      link: "",
      sortorder: ""
    });
  } catch (e: any) {
    toast.error(
      e.response?.data?.message || "Failed to add Course Material",
      { position: "top-center" }
    );
  }
};

  // update row
  const handleRowUpdated = async (updatedRow: any) => {
    if (updatedRow.type && !validTypes.includes(updatedRow.type)) {
      alert(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
      return;
    }
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/course-materials/${updatedRow.id}`, updatedRow);
      setFilteredMaterials(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
      toast.success("Course Material updated successfully", { position: "top-center" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update Course Material", { position: "top-center" });
    }
  };

  // delete row
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/course-materials/${id}`);
      setFilteredMaterials(prev => prev.filter(r => r.id !== id));
      toast.success(`Course Material ${id} deleted`, { position: "top-center" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete Course Material", { position: "top-center" });
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

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
            placeholder="Search by ID, name, type or ..."
            className="pl-10"
          />
        </div>
      </div>

       {/* Add Course Material */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subjectid">Subject ID</Label>
              <Input
                id="subjectid"
                type="number"
                value={newMaterial.subjectid}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, subjectid: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="courseid">Course ID (Required)</Label>
              <Input
                id="courseid"
                type="number"
                value={newMaterial.courseid}
                required
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, courseid: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="name">Name (Required)</Label>
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
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newMaterial.description}
                maxLength={500}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={newMaterial.type}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, type: e.target.value }))
                }
                placeholder={`Valid types: ${validTypes.join(", ")}`}
              />
            </div>
            <div className="md:col-span-2">
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
            <div>
              <Label htmlFor="sortorder">Sort Order</Label>
              <Input
                id="sortorder"
                type="number"
                value={newMaterial.sortorder}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, sortorder: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMaterial}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AG Grid */}
      <AGGridTable
        rowData={filteredMaterials.slice((page-1)*pageSize,page*pageSize)}
        columnDefs={columnDefs}
        title={`Course Materials (${filteredMaterials.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10,20,50,100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(p-1,1))}
            disabled={page===1}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >Previous</button>
          <span className="text-sm">Page {page}</span>
          <button
            onClick={() => setPage(p => p+1)}
            className="px-2 py-1 border rounded text-sm"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
