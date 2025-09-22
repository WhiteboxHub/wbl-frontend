"use client";
import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, Plus, Calendar, User, Target, Download } from "lucide-react";
import AGGridTable from "@/components/AGGridTable";

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const [year, month, day] = params.value.split("-");
  return `${month}/${day}/${year}`;
};

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  
  const [formData, setFormData] = useState({
    employee: "",
    task: "",
    date: new Date().toISOString().split('T')[0],
    targetDate: "",
    notes: "",
    status: "Pending",
    priority: "Medium"
  });
  
  const [formSaveLoading, setFormSaveLoading] = useState(false);

  const employees = [
    { id: 1, name: "John Doe", department: "Engineering" },
    { id: 2, name: "Jane Smith", department: "Design" },
    { id: 3, name: "Mike Johnson", department: "Engineering" },
    { id: 4, name: "Sarah Wilson", department: "QA" },
    { id: 5, name: "David Brown", department: "Marketing" }
  ];

  const sampleTasks = [
    {
      id: 1,
      employee: "John Doe",
      employeeId: 1,
      task: "Complete project documentation",
      date: "2024-01-15",
      targetDate: "2024-02-15",
      notes: "Need to document all API endpoints and user flows.",
      status: "In Progress",
      priority: "High",
      progress: 65
    },
    {
      id: 2,
      employee: "Jane Smith",
      employeeId: 2,
      task: "Design new dashboard UI",
      date: "2024-01-20",
      targetDate: "2024-02-20",
      notes: "Create modern dashboard design with dark/light theme",
      status: "Pending",
      priority: "Medium",
      progress: 0
    },
    {
      id: 3,
      employee: "Mike Johnson",
      employeeId: 3,
      task: "Fix authentication bugs",
      date: "2024-01-10",
      targetDate: "2024-01-25",
      notes: "Critical bugs to fix: Login timeout, password reset, session management",
      status: "Completed",
      priority: "High",
      progress: 100
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setTasks(sampleTasks);
      setFilteredTasks(sampleTasks);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTasks(tasks);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = tasks.filter((task) =>
        ["employee", "task", "status", "priority"].some((field) =>
          String(task[field] || "").toLowerCase().includes(term)
        )
      );
      setFilteredTasks(filtered);
    }
  }, [searchTerm, tasks]);

  const handleOpenTaskForm = () => {
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setFormData({
      employee: "",
      task: "",
      date: new Date().toISOString().split('T')[0],
      targetDate: "",
      notes: "",
      status: "Pending",
      priority: "Medium"
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSaveLoading(true);
    try {
      const newTask = {
        id: tasks.length + 1,
        ...formData,
        employeeId: employees.find(emp => emp.name === formData.employee)?.id || 0,
        progress: 0
      };
      
      setTasks(prev => [newTask, ...prev]);
      setFilteredTasks(prev => [newTask, ...prev]);
      handleCloseTaskForm();
    } catch (error) {
      console.error("Failed to add task:", error);
      setError("Failed to add task");
    } finally {
      setFormSaveLoading(false);
    }
  };

  const StatusRenderer = (params: any) => {
    const statusColors: any = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[params.value] || 'bg-gray-100 text-gray-800'}`}>
        {params.value}
      </span>
    );
  };

  const PriorityRenderer = (params: any) => {
    const priorityColors: any = {
      'High': 'bg-red-100 text-red-800',
      'Medium': 'bg-orange-100 text-orange-800',
      'Low': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[params.value] || 'bg-gray-100 text-gray-800'}`}>
        {params.value}
      </span>
    );
  };

  const columnDefs: ColDef[] = [
    { 
      headerName: "ID", 
      field: "id", 
      width: 80,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: "Employee",
      field: "employee",
      width: 150,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          {params.value}
        </div>
      ),
    },
    {
      headerName: "Task",
      field: "task",
      width: 200,
    },
    {
      headerName: "Date",
      field: "date",
      width: 120,
      valueFormatter: DateFormatter,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          {DateFormatter(params)}
        </div>
      ),
    },
    {
      headerName: "Target Date",
      field: "targetDate",
      width: 120,
      valueFormatter: DateFormatter,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-500" />
          {DateFormatter(params)}
        </div>
      ),
    },
    {
      headerName: "Notes",
      field: "notes",
      width: 250,
    },
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
    {
      headerName: "Progress",
      field: "progress",
      width: 120,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${params.value}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-600">{params.value}%</span>
        </div>
      ),
    }
  ];

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    completed: tasks.filter(t => t.status === 'Completed').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employee Task Management</h1>
          <p className="text-gray-600">Manage and track employee tasks efficiently.</p>
        </div>
        <button
          onClick={handleOpenTaskForm}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-gray-600">Completed</div>
        </div>
      </div>


      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
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
        
        <div className="flex gap-2">
          {['all', 'Pending', 'In Progress', 'Completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter}
            </button>
          ))}
        </div>
      </div>

    
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-md max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-center text-xl font-semibold">Add New Task</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="employee">Employee *</Label>
                  <select
                    id="employee"
                    name="employee"
                    value={formData.employee}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="task">Task Title *</Label>
                  <Input
                    type="text"
                    id="task"
                    name="task"
                    value={formData.task}
                    onChange={handleFormChange}
                    placeholder="Enter task description"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="targetDate">Target Date *</Label>
                  <Input
                    type="date"
                    id="targetDate"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter task notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formSaveLoading}
                  className={`flex-1 rounded-md py-2.5 text-sm font-medium transition duration-200 ${
                    formSaveLoading
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {formSaveLoading ? "Saving..." : "Save Task"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseTaskForm}
                  className="flex-1 rounded-md border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
            <button
              onClick={handleCloseTaskForm}
              className="absolute right-4 top-4 text-2xl leading-none text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      ) : (
        <AGGridTable
          rowData={filteredTasks}
          columnDefs={columnDefs}
          height="60vh"
          loading={loading}
          showFilters={true}
          showSearch={false}
        />
      )}
    </div>
  );
}