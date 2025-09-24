
"use client";
import { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { ColDef } from "ag-grid-community";
import { Plus } from "lucide-react";
import AGGridTable from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";


interface EmployeeTask {
  id: number;
  employee_name: string;
  task: string;
  assigned_date: string;
  due_date: string;
  status: string;
  priority: string;
  notes: string;
}


function RichTextEditor({
  value,
  onChange,
  height = "120px",
}: {
  value: string;
  onChange: (val: string) => void;
  height?: string;
}) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      style={{ height }}
    />
  );
}


const RichTextCellEditor = forwardRef((props: any, ref) => {
  const [value, setValue] = useState(props.value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  
  useImperativeHandle(ref, () => ({
    getValue: () => value,
  }));


  useEffect(() => {
    if (!containerRef.current) return;

    const quillEditor = containerRef.current.querySelector(".ql-editor") as HTMLElement;

    const handleBlur = () => {
      
      props.stopEditing?.();
    };

    quillEditor?.addEventListener("blur", handleBlur);

    
    const range = document.createRange();
    range.selectNodeContents(quillEditor);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    quillEditor?.focus();

    return () => {
      quillEditor?.removeEventListener("blur", handleBlur);
    };
  }, [containerRef]);

  return (
    <div ref={containerRef} style={{ minWidth: "200px" }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={(val) => setValue(val)}
        style={{ height: "120px" }}
      />
    </div>
  );
});


// -------------------- Formatters --------------------
const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const [year, month, day] = params.value.split("-");
  return `${month}/${day}/${year}`;
};

const StatusRenderer = (params: any) => {
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
  const status = params.value?.toLowerCase() || "";
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {textMap[status] || params.value}
    </span>
  );
};

const PriorityRenderer = (params: any) => {
  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-800",
    medium: "bg-orange-100 text-orange-800",
    low: "bg-green-100 text-green-800",
    urgent: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        priorityColors[params.value?.toLowerCase()] ||
        "bg-gray-100 text-gray-800"
      }`}
    >
      {params.value}
    </span>
  );
};

function TaskForm({ onTaskAdded }: { onTaskAdded: (task: EmployeeTask) => void }) {
  const [formData, setFormData] = useState({
    employee_name: "",
    task: "",
    assigned_date: new Date().toISOString().split("T")[0],
    due_date: "",
    notes: "",
    status: "pending",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        employee_name: formData.employee_name.trim(),
        task: formData.task.trim(),
        assigned_date:
          formData.assigned_date || new Date().toISOString().split("T")[0],
        due_date: formData.due_date,
        status: formData.status.toLowerCase(),
        priority: formData.priority.toLowerCase(),
        notes: formData.notes || "",
      };
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/employee-tasks`,
        payload
      );
      onTaskAdded(res.data);
      toast.success("Task created successfully");
      setFormData({
        employee_name: "",
        task: "",
        assigned_date: new Date().toISOString().split("T")[0],
        due_date: "",
        notes: "",
        status: "pending",
        priority: "medium",
      });
      setOpen(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail
        ? Array.isArray(err.response.data.detail)
          ? err.response.data.detail.map((d: any) => d.msg).join(", ")
          : String(err.response.data.detail)
        : "Failed to create task";
      toast.error(errorMessage);
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
            <div className="w-[90%] h-[90%] max-w-4xl bg-white rounded-lg shadow-xl overflow-auto">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Add New Task</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      name="employee_name"
                      placeholder="Enter employee name"
                      value={formData.employee_name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Description
                    </label>
                    <RichTextEditor
                      value={formData.task}
                      onChange={(val) => setFormData((p) => ({ ...p, task: val }))}
                      height="150px"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assigned Date
                        </label>
                        <div className="relative">
                          <DatePicker
                            selected={
                              formData.assigned_date
                                ? new Date(formData.assigned_date)
                                : null
                            }
                            onChange={(date: Date) =>
                              setFormData((prev) => ({
                                ...prev,
                                assigned_date: date ? date.toISOString().split("T")[0] : "",
                              }))
                            }
                            dateFormat="yyyy-MM-dd"
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholderText="Select assigned date"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                        </label>
                        <div className="relative">
                          <DatePicker
                            selected={
                              formData.due_date ? new Date(formData.due_date) : null
                            }
                            onChange={(date: Date) =>
                              setFormData((prev) => ({
                                ...prev,
                                due_date: date ? date.toISOString().split("T")[0] : "",
                              }))
                            }
                            dateFormat="yyyy-MM-dd"
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholderText="Select due date"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>               
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <RichTextEditor
                      value={formData.notes}
                      onChange={(val) => setFormData((p) => ({ ...p, notes: val }))}
                      height="150px"
                    />
                  </div>             
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                      {loading ? "Saving..." : "Save Task"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        </div>
      )}
    </>
  );
}


export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/employee-tasks`
      );
      setTasks(res.data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskAdded = (newTask: EmployeeTask) =>
    setTasks((prev) => [...prev, newTask]);

  const handleRowUpdated = async (updatedTask: EmployeeTask) => {
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/employee-tasks/${updatedTask.id}`,
        {
          ...updatedTask,
          status: updatedTask.status.toLowerCase(),
          priority: updatedTask.priority.toLowerCase(),
        }
      );
      toast.success("Task updated successfully");
      setTasks((prev) =>
        prev.map((t) => (t.id === res.data.id ? res.data : t))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update task");
    }
  };

  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/employee-tasks/${id}`
      );
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
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const columnDefs: ColDef[] = [
    { headerName: "ID", field: "id", width: 80 },
    { headerName: "Employee", field: "employee_name", width: 150, editable: true },
    {
      headerName: "Task",
      field: "task",
      flex: 2,
      editable: true,
      cellEditor: RichTextCellEditor,
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
      flex: 2,
      editable: true,
      cellEditor: RichTextCellEditor,
      autoHeight: true,
      cellRenderer: (params: any) => (
        <div dangerouslySetInnerHTML={{ __html: params.value }} />
      ),
    },
    {
      headerName: "Assigned Date",
      field: "assigned_date",
      width: 120,
      valueFormatter: DateFormatter,
      editable: true,
    },
    {
      headerName: "Due Date",
      field: "due_date",
      width: 120,
      valueFormatter: DateFormatter,
      editable: true,
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
    },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Task Management</h1>
        <TaskForm onTaskAdded={handleTaskAdded} />
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search Tasks</Label>
        <Input
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by employee, task, status..."
          className="mt-1 pl-3"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {taskStats.total}
          </div>
          <div className="text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">
            {taskStats.pending}
          </div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            {taskStats.inProgress}
          </div>
          <div className="text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {taskStats.completed}
          </div>
          <div className="text-gray-600">Completed</div>
        </div>
      </div>

      <AGGridTable
        rowData={filteredTasks}
        columnDefs={columnDefs}
        title={`Employee Tasks (${filteredTasks.length})`}
        height="60vh"
        showSearch={false}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
      />
    </div>
  );
}
