"use client";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import api, { smartUpdate } from "@/lib/api";

// Authentication helper (now redundant, but kept for reference)
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const tokenKeys = ["access_token", "token", "auth_token", "AuthorizationToken"];
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  return null;
};

// Password validation that matches backend exactly
const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters long.");
  if (!/[A-Z]/.test(password)) errors.push("Password must include at least one uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must include at least one lowercase letter.");
  if (!/\d/.test(password)) errors.push("Password must include at least one number.");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must include at least one special character.");
  return { isValid: errors.length === 0, errors };
};

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const requirements = [
    { test: (p: string) => p.length >= 8, text: "At least 8 characters" },
    { test: (p: string) => /[A-Z]/.test(p), text: "One uppercase letter" },
    { test: (p: string) => /[a-z]/.test(p), text: "One lowercase letter" },
    { test: (p: string) => /\d/.test(p), text: "One number" },
    { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), text: "One special character" },
  ];
  return (
    <div className="mt-2 space-y-1">
      {requirements.map((req, index) => {
        const isMet = req.test(password);
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            {isMet ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
            <span className={isMet ? "text-green-600" : "text-gray-500"}>{req.text}</span>
          </div>
        );
      })}
    </div>
  );
};

// Custom Password Editor Component
const PasswordEditor = ({ value, onValueChange, onFocus, onBlur }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(value === "********" ? "" : value);
  const [showStrength, setShowStrength] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    onValueChange(newPassword);
    setShowStrength(newPassword.length > 0);
  };
  const validation = validatePasswordStrength(password);
  return (
    <div className="p-2 space-y-2">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter new password"
          autoComplete="new-password"
        />
      </div>
      {showStrength && (
        <div className="border rounded-md p-3 bg-gray-50">
          <PasswordStrengthIndicator password={password} />
          {!validation.isValid && password.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 font-medium">Password requirements not met:</p>
              <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                {validation.errors.map((error, index) => <li key={index}>{error}</li>)}
              </ul>
            </div>
          )}
          {validation.isValid && password.length > 0 && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600 font-medium">Password meets all requirements ✓</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AuthUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch ALL users once (no pagination)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      let usersArray = [];
      if (Array.isArray(data)) usersArray = data;
      else if (data?.users) usersArray = data.users;
      else if (data?.data) usersArray = data.data;
      setUsers(usersArray);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error(err.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Filtered users (searching locally)
  const filteredUsers = users.filter((u) => {
    const term = debouncedSearch.toLowerCase();
    return (
      u.uname?.toLowerCase().includes(term) ||
      u.fullname?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term) ||
      String(u.id).includes(term)
    );
  });

  // Status Renderer
  const StatusRenderer = (params: any) => {
    const v = params.value?.toLowerCase() ?? "";
    const classes = v === "active" ? "bg-green-100 text-green-800" :
      v === "inactive" ? "bg-red-100 text-red-800" :
        "bg-gray-100 text-gray-800";
    return <Badge className={classes}>{params.value?.toUpperCase()}</Badge>;
  };

  // Role Renderer
  const RoleRenderer = (params: any) => {
    const role = params.value ?? "";
    const map: Record<string, string> = {
      ADMIN: "bg-indigo-100 text-indigo-800",
      USER: "bg-gray-100 text-gray-800",
      MANAGER: "bg-emerald-100 text-emerald-800",
    };
    return <Badge className={map[role] ?? "bg-gray-200 text-gray-700"}>{role}</Badge>;
  };

  // Visa Status Renderer
  const VisaStatusRenderer = (params: any) => {
    const visa = params.value ?? "";
    const map: Record<string, string> = {
      US_CITIZEN: "bg-blue-100 text-blue-800",
      GREEN_CARD: "bg-emerald-100 text-emerald-800",
      GC_EAD: "bg-teal-100 text-teal-800",
      I485_EAD: "bg-teal-100 text-teal-800",
      I140_APPROVED: "bg-cyan-100 text-cyan-800",
      F1: "bg-pink-100 text-pink-800",
      F1_OPT: "bg-pink-100 text-pink-800",
      F1_CPT: "bg-pink-100 text-pink-800",
      J1: "bg-amber-100 text-amber-800",
      J1_AT: "bg-amber-100 text-amber-800",
      H1B: "bg-indigo-100 text-indigo-800",
      H1B_TRANSFER: "bg-indigo-100 text-indigo-800",
      H1B_CAP_EXEMPT: "bg-indigo-100 text-indigo-800",
      H4: "bg-purple-100 text-purple-800",
      H4_EAD: "bg-purple-100 text-purple-800",
      L1A: "bg-violet-100 text-violet-800",
      L1B: "bg-violet-100 text-violet-800",
      L2: "bg-violet-100 text-violet-800",
      L2_EAD: "bg-violet-100 text-violet-800",
      O1: "bg-fuchsia-100 text-fuchsia-800",
      TN: "bg-sky-100 text-sky-800",
      E3: "bg-lime-100 text-lime-800",
      E3_EAD: "bg-lime-100 text-lime-800",
      E2: "bg-lime-100 text-lime-800",
      E2_EAD: "bg-lime-100 text-lime-800",
      TPS_EAD: "bg-yellow-100 text-yellow-800",
      ASYLUM_EAD: "bg-orange-100 text-orange-800",
      REFUGEE_EAD: "bg-orange-100 text-orange-800",
      DACA_EAD: "bg-orange-100 text-orange-800",
    };
    return <Badge className={map[visa] ?? "bg-gray-200 text-gray-700"}>{visa}</Badge>;
  };

  // Password Renderer
  const PasswordRenderer = (params: any) => {
    const [showPassword, setShowPassword] = useState(false);
    if (!params.value || params.value === "********") {
      return <div className="flex items-center gap-2"><span>********</span></div>;
    }
    return (
      <div className="flex items-center gap-2">
        <span>{showPassword ? params.value : "********"}</span>
      </div>
    );
  };

  // Column Definitions
  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "id", headerName: "ID", width: 100, pinned: "left" },
    {
      field: "uname",
      headerName: "Email",
      width: 250,
      editable: true,
      cellRenderer: (params: any) => (
        <a href={`mailto:${params.value}`} className="text-blue-600 underline hover:text-blue-800" onClick={(e) => e.stopPropagation()}>
          {params.value}
        </a>
      ),
      cellEditor: 'agTextCellEditor',
    },
    {
      field: "passwd",
      headerName: "Password",
      width: 140,
      editable: true,
      cellRenderer: PasswordRenderer,
      cellEditor: PasswordEditor,
      valueFormatter: () => "********",
      valueGetter: (params) => params.data.passwd === "********" ? "" : params.data.passwd,
      valueSetter: (params) => {
        if (params.newValue && params.newValue.trim() !== "" && params.newValue !== "********") {
          params.data.passwd = params.newValue;
        } else {
          params.data.passwd = params.oldValue;
        }
        return true;
      },
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      editable: true,
      cellRenderer: (params: any) => (
        <a href={`tel:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
          {params.value}
        </a>
      ),
      cellEditor: 'agTextCellEditor',
    },
    { field: "fullname", headerName: "Full Name", width: 180, editable: true, cellEditor: 'agTextCellEditor' },
    { field: "status", headerName: "Status", width: 150, editable: true, cellRenderer: StatusRenderer, cellEditor: 'agTextCellEditor' },
    { field: "visa_status", headerName: "Visa Status", width: 160, editable: true, cellRenderer: VisaStatusRenderer, cellEditor: 'agTextCellEditor' },
    { field: "address", headerName: "Address", width: 200, editable: true, cellEditor: 'agTextCellEditor' },
    { field: "state", headerName: "State", width: 140, editable: true, cellEditor: 'agTextCellEditor' },
    { field: "zip", headerName: "Zip Code", width: 120, editable: true, cellEditor: 'agTextCellEditor' },
    { field: "city", headerName: "City", width: 140, editable: true, cellEditor: 'agTextCellEditor' },
    { field: "country", headerName: "Country", width: 140, editable: true, cellEditor: 'agTextCellEditor' },
    {
      field: "registereddate",
      headerName: "Registered Date",
      width: 180,
      sortable: true,
      filter: "agDateColumnFilter",
      valueGetter: (params) => {
        return params.data?.entry_date ? new Date(params.data.entry_date) : null;
      },
      valueFormatter: (params) => {
        const value = params.value;
        if (!value) return "-";
        return value.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      },
    },
    { field: "googleId", headerName: "Google ID", width: 220, editable: false },
    { field: "team", headerName: "Team", width: 180, editable: true, cellEditor: 'agTextCellEditor' },
    { field: "message", headerName: "Message", width: 250, editable: true, cellEditor: 'agTextCellEditor' },
    {
      field: "enddate",
      headerName: "End Date",
      width: 150,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : "",
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
    { field: "role", headerName: "Role", width: 150, editable: true, cellRenderer: RoleRenderer, cellEditor: 'agTextCellEditor' },
    {
      field: "notes",
      headerName: "Notes",
      width: 300,
      sortable: true,
      editable: true,
      cellRenderer: (params: any) => (
        <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: params.value }} />
      ),
      cellEditor: 'agTextCellEditor',
    },
  ], []);

  // PUT request on row update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const dataToSend = { ...updatedRow };
      const originalUser = users.find(u => u.id === updatedRow.id);
      if (dataToSend.passwd && dataToSend.passwd !== "********" && dataToSend.passwd !== originalUser?.passwd) {
        const validation = validatePasswordStrength(dataToSend.passwd);
        if (!validation.isValid) {
          toast.error(validation.errors[0]);
          fetchUsers();
          return;
        }
      } else {
        delete dataToSend.passwd;
      }
      delete dataToSend.googleId;
      delete dataToSend.registereddate;

      const updatedUser = await smartUpdate("user", updatedRow.id, dataToSend);
      setUsers((prev) => prev.map((user) => (user.id === updatedRow.id ? updatedUser : user)));
      toast.success("User updated successfully");
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error(err.message || "Failed to update user");
      fetchUsers();
    }
  };

  // POST request to create new user
  const handleRowAdded = async (newUser: any) => {
    try {
      console.log("CREATING NEW USER:", newUser);

      // Remove empty password field if it exists
      const dataToSend = { ...newUser };
      if (dataToSend.passwd === "" || dataToSend.passwd === "********") {
        delete dataToSend.passwd;
      }

      // Validate password if provided
      if (dataToSend.passwd) {
        const validation = validatePasswordStrength(dataToSend.passwd);
        if (!validation.isValid) {
          toast.error(validation.errors[0]);
          return;
        }
      }

      // Remove fields that shouldn't be sent for new user
      delete dataToSend.id;
      delete dataToSend.googleId;

      // Send POST request to create new user
      const response = await api.post("/user", dataToSend);

      console.log("USER CREATED:", response);

      // Refresh the users list
      fetchUsers();

      toast.success("User created successfully");
    } catch (err: any) {
      console.error("FAILED TO CREATE USER:", err);
      toast.error(err.message || "Failed to create user");
    }
  };

  // DELETE request on row deletion
  const handleRowDeleted = async (id: number | string) => {
    try {
      await api.delete(`/user/${id}`);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast.success("User deleted successfully");
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error(err.message || "Failed to delete user");
    }
  };

  // Handle add user
  const handleAddUser = () => {
    // toast.info("Add user functionality to be implemented");
    toast.info("Click the + button in the table to add a new user");
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Auth Users</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage application authentication users</p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white" onClick={handleAddUser}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      {/* Search Input */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search by Name, Email or ID
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Type name, email, or numeric ID..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      {/* AG Grid Table */}
      {loading ? (
        <div className="flex justify-center items-center mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center mt-8 p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-lg">No users found</p>
          {users.length === 0 && <p className="text-gray-400 mt-2">Unable to load users from server</p>}
        </div>
      ) : (
        <AGGridTable
          rowData={filteredUsers}
          columnDefs={columnDefs}
          title={`Users (${filteredUsers.length})`}
          height="600px"
          showSearch={false}
          onRowAdded={handleRowAdded}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}
    </div>
  );
}