"use client";
import { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { ColDef } from "ag-grid-community";
import { SearchIcon } from "lucide-react";
import AGGridTable from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import api from "@/lib/api";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import { EditModal } from "@/components/EditModal";

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
    <div className="relative flex items-center w-full" ref={filterButtonRef}>
      <span className="mr-2">{columnName}</span>
      <svg
        onClick={toggleFilter}
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
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

const RichTextCellEditor = forwardRef((props: any, ref) => {
  const [value, setValue] = useState(props.value || "");

  useImperativeHandle(ref, () => ({
    getValue: () => value,
  }));

  return (
    <div style={{ minWidth: "200px" }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={(val) => setValue(val)}
        style={{ height: "120px" }}
      />
    </div>
  );
});

// -------------------- Renderers & Formatters --------------------
const DateFormatter = (params: any) => {
  if (!params.value) return "";
  try {
    const [year, month, day] = params.value.split("-");
    return `${month}/${day}/${year}`;
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
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
    >
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
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority] || "bg-gray-100 text-gray-800"
        }`}
    >
      {params.value}
    </span>
  );
};


export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setError("");
      const res = await api.get("/employee-tasks");
      const data = res?.data ?? res;

      // Normalize data to ensure status and priority are lowercase
      const normalizedData = (Array.isArray(data) ? data : []).map((task: any) => ({
        ...task,
        status: task.status?.toLowerCase() || "pending",
        priority: task.priority?.toLowerCase() || "medium"
      }));

      setTasks(normalizedData);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
      setError("Failed to load tasks.");
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filterData = useCallback(() => {
    let filtered = [...tasks];

    if (selectedStatuses.length > 0) {
      const lowerSelectedStatuses = selectedStatuses.map(v => v.toLowerCase());
      filtered = filtered.filter(task =>
        task.status && lowerSelectedStatuses.includes(task.status.toLowerCase())
      );
    }

    if (selectedPriorities.length > 0) {
      const lowerSelectedPriorities = selectedPriorities.map(v => v.toLowerCase());
      filtered = filtered.filter(task =>
        task.priority && lowerSelectedPriorities.includes(task.priority.toLowerCase())
      );
    }

    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((task) => {
        if (task.employee_name?.toLowerCase().includes(lower)) return true;
        if (task.task?.toLowerCase().includes(lower)) return true;
        if (task.status?.toLowerCase().includes(lower)) return true;
        if (task.priority?.toLowerCase().includes(lower)) return true;
        if (task.notes?.toLowerCase().includes(lower)) return true;
        return false;
      });
    }

    return filtered;
  }, [tasks, searchTerm, selectedStatuses, selectedPriorities]);

  const filteredTasks = useMemo(() => filterData(), [
    tasks,
    searchTerm,
    selectedStatuses,
    selectedPriorities
  ]);

  const handleTaskAdded = (newTask: EmployeeTask) =>
    setTasks((prev) => [newTask, ...prev]);

  const handleRowUpdated = async (updatedTask: EmployeeTask) => {
    try {
      const payload = {
        ...updatedTask,
        employee_name: updatedTask.employee_name,
        status: updatedTask.status?.toLowerCase(),
        priority: updatedTask.priority?.toLowerCase(),
      };
      console.log("Updating task with payload:", payload);

      const res = await api.put(`/employee-tasks/${updatedTask.id}`, payload);
      const updatedData = res.data;

      const normalizedUpdatedData = {
        ...updatedData,
        status: updatedData.status?.toLowerCase(),
        priority: updatedData.priority?.toLowerCase(),
      };

      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? { ...task, ...normalizedUpdatedData } : task))
      );
      toast.success("Task updated successfully!");
    } catch (err: any) {
      console.error("Failed to update task:", err);
      toast.error(err.response?.data?.detail || err.response?.data?.message || "Failed to update task.");
    }
  };

  const handleRowDeleted = async (taskId: number) => {
    try {
      if (!taskId) {
        toast.error("Cannot delete task: missing ID");
        return;
      }
      console.log("Deleting task ID:", taskId);
      await api.delete(`/employee-tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Task deleted successfully!");
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      toast.error(err.response?.data?.detail || "Failed to delete task.");
    }
  };


  const columnDefs = useMemo<ColDef[]>(() => [
    { headerName: "ID", field: "id", width: 80 },
    {
      headerName: "Employee",
      field: "employee_name",
      width: 180,
      editable: true,
      cellEditor: "agTextCellEditor",
    },
    {
      headerName: "Task",
      field: "task",
      flex: 2,
      editable: true,
      cellEditor: false,
      autoHeight: true,
      cellRenderer: (params: any) => (
        <div
          style={{ whiteSpace: "normal" }}
          dangerouslySetInnerHTML={{ __html: params.value || "" }}
        />
      ),
    },
    {
      headerName: "Notes",
      field: "notes",
      flex: 1,
      editable: true,
      hide: true,
      cellEditor: false,
      autoHeight: true,
      cellRenderer: (params: any) => (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: params.value || "" }}
        />
      ),
    },
    {
      headerName: "Assigned Date",
      field: "assigned_date",
      width: 130,
      valueFormatter: DateFormatter,
      editable: true,
      cellEditor: "agDateStringCellEditor",
    },
    {
      headerName: "Due Date",
      field: "due_date",
      width: 130,
      valueFormatter: DateFormatter,
      editable: true,
      cellEditor: "agDateStringCellEditor",
    },
    {
      headerName: "Status",
      field: "status",
      width: 130,
      cellRenderer: StatusRenderer,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["pending", "in_progress", "completed", "blocked"],
      },
      headerComponent: FilterHeaderComponent,
      headerComponentParams: {
        columnName: "Status",
        options: statusOptions,
        selectedValues: selectedStatuses,
        setSelectedValues: setSelectedStatuses,
      },
    },
    {
      headerName: "Priority",
      field: "priority",
      width: 110,
      cellRenderer: PriorityRenderer,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["low", "medium", "high", "urgent"],
      },
      headerComponent: FilterHeaderComponent,
      headerComponentParams: {
        columnName: "Priority",
        options: priorityOptions,
        selectedValues: selectedPriorities,
        setSelectedValues: setSelectedPriorities,
      },
    },
  ], [selectedStatuses, selectedPriorities]);

  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-center" richColors />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Employee Task Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track employee tasks and assignments
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Tasks
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee, task, status..."
            className="pl-10"
          />
        </div>
      </div>


      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={{
          employee_name: "",
          task: "",
          assigned_date: new Date().toISOString().split("T")[0],
          due_date: "",
          status: "pending",
          priority: "medium",
          notes: "",
        }}
        title="Employee Task"
        onSave={async (taskData) => {
          try {
            const payload = {
              employee_name: taskData.employee_name?.trim(),
              task: taskData.task?.trim(),
              assigned_date: taskData.assigned_date,
              due_date: taskData.due_date || null,
              status: taskData.status?.toLowerCase() || "pending",
              priority: taskData.priority?.toLowerCase() || "medium",
              notes: taskData.notes || "",
            };

            console.log("Creating task with payload:", payload);

            const res = await api.post(`/employee-tasks`, payload);
            const newTask = {
              ...res.data,
              status: res.data.status?.toLowerCase(),
              priority: res.data.priority?.toLowerCase(),
            };

            handleTaskAdded(newTask);
            toast.success("Task created successfully");
            setIsModalOpen(false);
          } catch (err: any) {
            console.error("Error creating task:", err);
            const errorMessage = err.response?.data?.detail
              ? Array.isArray(err.response.data.detail)
                ? err.response.data.detail.map((d: any) => d.msg).join(", ")
                : String(err.response.data.detail)
              : err.response?.data?.message || "Failed to create task";
            toast.error(errorMessage);
          }
        }}
        batches={[]}
        isAddMode={true}
      />


      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Loading tasks...
        </p>
      ) : error ? (
        <p className="text-center mt-8 text-red-500">{error}</p>
      ) : (
        <div className="flex flex-col items-center w-full space-y-4">
          <div className="w-full max-w-7xl">
            <AGGridTable
              rowData={filteredTasks}
              columnDefs={columnDefs}
              title="Employee Tasks Tracker"
              height="500px"
              showSearch={false}
              onAddClick={() => setIsModalOpen(true)}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}