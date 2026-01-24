"use client";
import { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { SearchIcon, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin_ui/tabs";
import AGGridTable from "@/components/AGGridTable";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import api from "@/lib/api";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

interface EmployeeTask {
  id: number;
  employee_name: string;
  employee_id: number;
  task: string;
  assigned_date: string;
  due_date: string;
  status: string;
  priority: string;
  notes: string;
  project_id?: number;
  project_name?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterHeaderProps {
  columnName: string;
  options: FilterOption[];
  selectedValues: string[];
  setSelectedValues: (values: string[]) => void;
}

const FilterHeaderComponent = ({
  columnName,
  options,
  selectedValues,
  setSelectedValues,
}: FilterHeaderProps) => {
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left });
    }
    setFilterVisible((v) => !v);
  };

  const handleValueChange = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((v) => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
    setFilterVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilterVisible(false);
      }
    };
    const handleScroll = () => setFilterVisible(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <div className="relative flex items-center w-full h-full" ref={filterButtonRef}>
      <span className="truncate">{columnName}</span>
      <svg
        onClick={(e) => { e.stopPropagation(); toggleFilter(); }}
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 ml-1 cursor-pointer text-gray-500 hover:text-gray-700 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
      </svg>
      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[99999] bg-white border border-gray-200 rounded-md shadow-lg w-48 max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              position: "absolute",
            }}
          >
            <div className="py-1">
              {options.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleValueChange(value)}
                  className={`block w-full text-left px-4 py-2 text-sm ${selectedValues.includes(value)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  try {
    const date = new Date(params.value);
    if (isNaN(date.getTime())) return params.value;
    return date.toLocaleDateString();
  } catch {
    return params.value;
  }
};

const StatusRenderer = (params: any) => {
  const status = (params.value || "").toLowerCase();
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  };
  const textMap: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    blocked: "Blocked",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
      {textMap[status] || params.value}
    </span>
  );
};

const PriorityRenderer = (params: any) => {
  const priority = (params.value || "").toLowerCase();
  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-800",
    medium: "bg-orange-100 text-orange-800",
    low: "bg-green-100 text-green-800",
    urgent: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority] || "bg-gray-100 text-gray-800"}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const HtmlRenderer = (params: any) => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: params.value || "" }}
      className="truncate max-w-full"
    />
  );
};

// --- Reusable Tasks List Component using AGGridTable ---
const TasksList = ({ projectId, employeeId, readOnly = false }: { projectId?: number; employeeId?: number; readOnly?: boolean }) => {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "blocked", label: "Blocked" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/employee-tasks/";
      const queryParams = [];
      if (projectId) queryParams.push(`project_id=${projectId}`);
      if (employeeId) queryParams.push(`employee_id=${employeeId}`);
      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const res = await api.get(url);
      const data = res?.data ?? res;
      const normalizedData = (Array.isArray(data) ? data : []).map((task: any) => ({
        ...task,
        status: task.status?.toLowerCase() || "pending",
        priority: task.priority?.toLowerCase() || "medium"
      }));
      setTasks(normalizedData);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [projectId, employeeId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    if (selectedStatuses.length > 0) {
      const lowerSelectedStatuses = selectedStatuses.map(v => v.toLowerCase());
      filtered = filtered.filter(task => task.status && lowerSelectedStatuses.includes(task.status.toLowerCase()));
    }
    if (selectedPriorities.length > 0) {
      const lowerSelectedPriorities = selectedPriorities.map(v => v.toLowerCase());
      filtered = filtered.filter(task => task.priority && lowerSelectedPriorities.includes(task.priority.toLowerCase()));
    }
    if (selectedStatuses.length === 0) {
      filtered = filtered.filter(task => task.status?.toLowerCase() !== 'completed');
    }
    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((task) => {
        return (
          task.task?.toLowerCase().includes(lower) ||
          task.employee_name?.toLowerCase().includes(lower) ||
          task.notes?.toLowerCase().includes(lower)
        );
      });
    }
    return filtered;
  }, [tasks, searchTerm, selectedStatuses, selectedPriorities]);

  const handleUpdate = async (data: any) => {
    try {
      await api.put(`/employee-tasks/${data.id}`, data);
      toast.success("Task updated");
      fetchTasks();
    } catch (e) { toast.error("Failed to update task"); }
  };

  const handleAdd = async (data: any) => {
    try {
      const payload = {
        ...data,
        project_id: projectId || data.project_id,
        employee_id: employeeId || data.employee_id
      };
      await api.post("/employee-tasks/", payload);
      toast.success("Task created");
      fetchTasks();
    } catch (e) { toast.error("Failed to create task"); }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await api.delete(`/employee-tasks/${id}`);
      toast.success("Task deleted");
      fetchTasks();
    } catch (e) { toast.error("Failed to delete task"); }
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "employee_name", headerName: "Employee Name", width: 150 },
    { field: "task", headerName: "Task", flex: 2, minWidth: 200, cellRenderer: HtmlRenderer },
    { field: "project_name", headerName: "Project", width: 150, hide: !!projectId },
    {
      field: "status",
      headerName: "Status",
      headerComponent: FilterHeaderComponent,
      headerComponentParams: {
        columnName: "Status",
        options: statusOptions,
        selectedValues: selectedStatuses,
        setSelectedValues: setSelectedStatuses
      },
      cellRenderer: StatusRenderer,
      width: 140
    },
    {
      field: "priority",
      headerName: "Priority",
      headerComponent: FilterHeaderComponent,
      headerComponentParams: {
        columnName: "Priority",
        options: priorityOptions,
        selectedValues: selectedPriorities,
        setSelectedValues: setSelectedPriorities
      },
      cellRenderer: PriorityRenderer,
      width: 130
    },
    { field: "due_date", headerName: "Due Date", cellRenderer: DateFormatter, width: 130 },
    { field: "assigned_date", headerName: "Assigned Date", cellRenderer: DateFormatter, width: 130 },
    {
      field: "notes",
      headerName: "Notes",
      flex: 1,
      cellRenderer: HtmlRenderer
    }
  ], [projectId, selectedStatuses, selectedPriorities]);

  return (
    <div className="flex flex-col space-y-2">
      {!readOnly && (
        <div className="flex justify-between items-center px-1">
          <div className="relative max-w-sm w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}
      {readOnly ? (
        <div className="w-full">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tasks found for this project</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {projectId ? "Employee Name" : "Project Name"}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task, index) => (
                    <tr key={task.id} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div dangerouslySetInnerHTML={{ __html: task.task || '' }} className="line-clamp-2" />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {projectId ? task.employee_name : task.project_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusRenderer value={task.status} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <PriorityRenderer value={task.priority} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        <DateFormatter value={task.due_date} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <AGGridTable
          rowData={filteredTasks}
          columnDefs={columnDefs}
          loading={loading}
          onRowUpdated={readOnly ? undefined : handleUpdate}
          onRowAdded={readOnly ? undefined : handleAdd}
          onRowDeleted={readOnly ? undefined : handleDelete}
          title={readOnly ? "" : "Employee Task"}
          batches={[]}
          showAddButton={!readOnly}
          height={readOnly ? "auto" : "calc(100vh - 350px)"}
          domLayout={readOnly ? "autoHeight" : undefined}
          hideToolbar={readOnly}
        />
      )}
    </div>
  );
};

// --- Projects Nested View ---
const ProjectsView = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects/");
      setProjects(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleUpdate = async (data: any) => {
    try {
      console.log("Updating project with data:", data);

      // Clean data - only send valid project fields
      const validFields = ['name', 'description', 'owner', 'start_date', 'target_end_date', 'end_date', 'priority', 'status'];
      const cleanData: any = {};
      validFields.forEach(f => { if (data[f] && data[f] !== '') cleanData[f] = data[f]; });

      await api.put(`/projects/${data.id}`, cleanData);
      toast.success("Project updated");
      fetchProjects();
    } catch (e: any) {
      console.error("Failed to update project:", e);
      const errorMsg = e?.response?.data?.detail || e?.message || "Failed to update project";
      toast.error(errorMsg);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      console.log("Creating project with data:", data);

      // Clean data - only send valid project fields
      const validFields = ['name', 'description', 'owner', 'start_date', 'target_end_date', 'end_date', 'priority', 'status'];
      const cleanData: any = {};
      validFields.forEach(f => { if (data[f] && data[f] !== '') cleanData[f] = data[f]; });

      await api.post("/projects/", cleanData);
      toast.success("Project created");
      fetchProjects();
    } catch (e: any) {
      console.error("Failed to create project:", e);
      const errorMsg = e?.response?.data?.detail || e?.message || "Failed to create project";
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch (e) { toast.error("Failed to delete project"); }
  };

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const lower = searchTerm.toLowerCase();
    return projects.filter(p =>
      p.name?.toLowerCase().includes(lower) ||
      p.owner?.toLowerCase().includes(lower) ||
      p.description?.toLowerCase().includes(lower)
    );
  }, [projects, searchTerm]);

  const gridData = useMemo(() => {
    const rows: any[] = [];
    filteredProjects.forEach(p => {
      rows.push(p);
      if (expandedIds.includes(p.id)) {
        rows.push({ _isDetail: true, _master: p });
      }
    });
    return rows;
  }, [filteredProjects, expandedIds]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const colDefs: ColDef[] = [
    {
      field: "name",
      headerName: "Project Name",
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2 h-full">
          {!params.data._isDetail && (
            <div
              onClick={(e) => { e.stopPropagation(); toggleExpand(params.data.id); }}
              className="cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
            >
              {expandedIds.includes(params.data.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          )}
          <span className="font-medium text-gray-700">{params.value}</span>
        </div>
      )
    },
    { field: "owner", headerName: "Owner", width: 150 },
    { field: "status", headerName: "Status", cellRenderer: StatusRenderer, width: 130 },
    { field: "priority", headerName: "Priority", cellRenderer: PriorityRenderer, width: 130 },
    { field: "start_date", headerName: "Start Date", cellRenderer: DateFormatter, width: 120},
    { field: "target_end_date", headerName: "Target End Date", cellRenderer: DateFormatter, width: 120},
    { field: "description", headerName: "Description", cellRenderer: HtmlRenderer },
  ];

  const fullWidthCellRenderer = useCallback((params: any) => {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <TasksList projectId={params.data._master.id} readOnly={true} />
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center px-1">
        <div className="relative max-w-sm w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <AGGridTable
        rowData={gridData}
        columnDefs={colDefs}
        loading={loading}
        onRowUpdated={handleUpdate}
        onRowAdded={handleCreate}
        onRowDeleted={handleDelete}
        title="Project"
        batches={[]}
        showAddButton={true}
        height="calc(100vh - 350px)"
        isFullWidthRow={(p: any) => p.rowNode.data._isDetail}
        fullWidthCellRenderer={fullWidthCellRenderer}
        getRowHeight={(p: any) => p.node.data._isDetail ? 600 : 50}
      />
    </div>
  );
};

// --- Employees Nested View ---
const EmployeesView = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/employees");
      const activeEmployees = res.data.filter((emp: any) => emp.status === 1);
      setEmployees(activeEmployees);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const lower = searchTerm.toLowerCase();
    return employees.filter(e =>
      e.name?.toLowerCase().includes(lower) ||
      e.email?.toLowerCase().includes(lower) ||
      e.phone?.toLowerCase().includes(lower)
    );
  }, [employees, searchTerm]);

  const gridData = useMemo(() => {
    const rows: any[] = [];
    filteredEmployees.forEach(e => {
      rows.push(e);
      if (expandedIds.includes(e.id)) {
        rows.push({ _isDetail: true, _master: e });
      }
    });
    return rows;
  }, [filteredEmployees, expandedIds]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const colDefs: ColDef[] = [
    {
      field: "name",
      headerName: "Employee Name",
      width: 250,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1 h-full">
          {!params.data._isDetail && (
            <div
              onClick={(e) => { e.stopPropagation(); toggleExpand(params.data.id); }}
              className="cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
            >
              {expandedIds.includes(params.data.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          )}
          <span className="font-medium text-gray-700">{params.value}</span>
        </div>
      )
    },
    { field: "email", headerName: "Email", width: 250 },
    { field: "phone", headerName: "Phone", width: 150 },
  ];

  const fullWidthCellRenderer = useCallback((params: any) => {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <TasksList employeeId={params.data._master.id} readOnly={true} />
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center px-1">
        <div className="relative max-w-sm w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <AGGridTable
        rowData={gridData}
        columnDefs={colDefs}
        loading={loading}
        title="Employee"
        batches={[]}
        showAddButton={false}
        height="calc(100vh - 350px)"
        isFullWidthRow={(p: any) => p.rowNode.data._isDetail}
        fullWidthCellRenderer={fullWidthCellRenderer}
        getRowHeight={(p: any) => p.node.data._isDetail ? 600 : 50}
      />
    </div>
  );
};

// --- Main Page Component ---
export default function EmployeeTasksPage() {
  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Task Management</h1>
        <p className="text-sm text-gray-500">Manage, organize and track employee tasks across projects.</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 bg-white/50 p-1 border">
          <TabsTrigger value="all" className="px-6 py-2">All Tasks</TabsTrigger>
          <TabsTrigger value="projects" className="px-6 py-2">By Project</TabsTrigger>
          <TabsTrigger value="employees" className="px-6 py-2">By Employee</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0 outline-none">
          <TasksList />
        </TabsContent>

        <TabsContent value="projects" className="mt-0 outline-none">
          <ProjectsView />
        </TabsContent>

        <TabsContent value="employees" className="mt-0 outline-none">
          <EmployeesView />
        </TabsContent>
      </Tabs>
      <Toaster position="top-right" richColors />
    </div>
  );
}