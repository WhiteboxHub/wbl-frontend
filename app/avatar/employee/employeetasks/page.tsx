"use client";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { ColDef } from "ag-grid-community";
import { Plus, Search as SearchIcon, Edit2, Trash2 } from "lucide-react";
import AGGridTable from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface EmployeeTask {
  id: number;
  employee_id: number;
  employee_name: string;
  task: string;
  assigned_date: string;
  due_date: string;
  status: string;
  priority: string;
  notes: string;
}

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const [year, month, day] = params.value.split("-");
  return `${month}/${day}/${year}`;
};

const StatusRenderer = (params: any) => {
  const statusColors: any = {
    Pending: "bg-yellow-100 text-yellow-800",
    "In Progress": "bg-blue-100 text-blue-800",
    Completed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[params.value] || "bg-gray-100 text-gray-800"
      }`}
    >
      {params.value}
    </span>
  );
};

const PriorityRenderer = (params: any) => {
  const priorityColors: any = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-orange-100 text-orange-800",
    Low: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        priorityColors[params.value] || "bg-gray-100 text-gray-800"
      }`}
    >
      {params.value}
    </span>
  );
};


function TaskForm({ onTaskAdded }: { onTaskAdded: (task: EmployeeTask) => void }) {
  const [formData, setFormData] = useState({
    employee_id: "",
    employee_name: "",
    task: "",
    assigned_date: new Date().toISOString().split("T")[0],
    due_date: "",
    notes: "",
    status: "Pending",
    priority: "Medium",
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/employee-tasks`,
        formData
      );
      onTaskAdded(res.data);
      toast.success("Task created successfully");
      setFormData({
        employee_id: "",
        employee_name: "",
        task: "",
        assigned_date: new Date().toISOString().split("T")[0],
        due_date: "",
        notes: "",
        status: "Pending",
        priority: "Medium",
      });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="number"
                name="employee_id"
                placeholder="Employee ID"
                value={formData.employee_id}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
              <input
                type="text"
                name="employee_name"
                placeholder="Employee Name"
                value={formData.employee_name}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
              <input
                type="text"
                name="task"
                placeholder="Task"
                value={formData.task}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
              <div>
                <label className="block mb-1 font-medium">Assigned Date</label>
                <DatePicker
                  selected={formData.assigned_date ? new Date(formData.assigned_date) : null}
                  onChange={(date: Date) =>
                    setFormData((prev) => ({
                      ...prev,
                      assigned_date: date.toISOString().split("T")[0],
                    }))
                  }
                  dateFormat="yyyy-MM-dd"
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Due Date</label>
                <DatePicker
                  selected={formData.due_date ? new Date(formData.due_date) : null}
                  onChange={(date: Date) =>
                    setFormData((prev) => ({
                      ...prev,
                      due_date: date.toISOString().split("T")[0],
                    }))
                  }
                  dateFormat="yyyy-MM-dd"
                  className="w-full border rounded p-2"
                />
              </div>
              <textarea
                name="notes"
                placeholder="Notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ------------------ Edit Task Modal ------------------
function EditTaskModal({
  task,
  onClose,
  onSave,
}: {
  task: EmployeeTask;
  onClose: () => void;
  onSave: (updatedTask: EmployeeTask) => void;
}) {
  const [formData, setFormData] = useState<EmployeeTask>({ ...task });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/employee-tasks/${formData.id}`,
        formData
      );
      toast.success("Task updated successfully");
      onSave(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="employee_name"
            value={formData.employee_name}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Employee Name"
          />
          <input
            type="text"
            name="task"
            value={formData.task}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Task"
          />
          <div>
            <label className="block mb-1 font-medium">Assigned Date</label>
            <DatePicker
              selected={formData.assigned_date ? new Date(formData.assigned_date) : null}
              onChange={(date: Date) =>
                setFormData((prev) => ({
                  ...prev,
                  assigned_date: date.toISOString().split("T")[0],
                }))
              }
              dateFormat="yyyy-MM-dd"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Due Date</label>
            <DatePicker
              selected={formData.due_date ? new Date(formData.due_date) : null}
              onChange={(date: Date) =>
                setFormData((prev) => ({
                  ...prev,
                  due_date: date.toISOString().split("T")[0],
                }))
              }
              dateFormat="yyyy-MM-dd"
              className="w-full border rounded p-2"
            />
          </div>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Notes"
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------ Main Page ------------------
export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTask, setEditingTask] = useState<EmployeeTask | null>(null);
  const [employees, setEmployees] = useState<{ id: number; full_name: string }[]>([]);
    useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/employees`)
        .then(res => setEmployees(res.data))
        .catch(() => toast.error("Failed to load employees"));
    }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/employee-tasks`);
      setTasks(res.data);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskAdded = (newTask: EmployeeTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleTaskUpdated = (updatedTask: EmployeeTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleTaskDeleted = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/employee-tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success(`Task ${id} deleted`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete task");
    }
  };

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter(
      (t) =>
        t.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "Pending").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
  };

  const columnDefs: ColDef[] = [
    { headerName: "ID", field: "id", width: 80, filter: "agNumberColumnFilter" },
    { headerName: "Employee", field: "employee_name", width: 150 },
    { headerName: "Task", field: "task", width: 200 },
    {
      headerName: "Assigned Date",
      field: "assigned_date",
      width: 120,
      valueFormatter: DateFormatter,
    },
    {
      headerName: "Due Date",
      field: "due_date",
      width: 120,
      valueFormatter: DateFormatter,
    },
    { headerName: "Notes", field: "notes", width: 250 },
    {
      headerName: "Status",
      field: "status",
      width: 130,
      cellRenderer: StatusRenderer,
    },
    {
      headerName: "Priority",
      field: "priority",
      width: 110,
      cellRenderer: PriorityRenderer,
    },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Task Management</h1>
        <TaskForm onTaskAdded={handleTaskAdded} />
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search">Search Tasks</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee, task, status..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-gray-600">Completed</div>
        </div>
      </div>

      {/* Task Table */}
      <AGGridTable
        rowData={filteredTasks}
        columnDefs={columnDefs}
        height="60vh"
        loading={loading}
        showFilters={true}
        showSearch={false}
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleTaskUpdated}
        />
      )}
    </div>
  );
}
