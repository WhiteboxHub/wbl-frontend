"use client";
import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import AGGridTable from "@/components/AGGridTable";
import { apiFetch } from "@/lib/api";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";


const DateFormatter = (params: any) => {
  if (!params.value) return "";

  // value is already YYYY-MM-DD from backend
  const [year, month, day] = params.value.split("-");
  return `${month}/${day}/${year}`; // MM/DD/YYYY
};


const toInitCap = (name: string): string =>
  name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const StatusRenderer = (params: any) => {
  const isActive = Number(params.value) === 1;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${isActive
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
        }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};


const BooleanRenderer = (params: any) => {
  return params.value === 1 ? "Yes" : "No";
};


const booleanValueParser = (params: any) => {
  if (params.newValue === "Yes" || params.newValue === "Active") {
    return 1;
  } else if (params.newValue === "No" || params.newValue === "Inactive") {
    return 0;
  }
  return params.newValue;
};


const formatPhoneNumber = (phone: string) => {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
  }
  return phone;
};


const parsePhoneNumber = (phone: string) => {
  if (!phone) return "";

  return phone.replace(/[^\d+]/g, '');
};


const validateEmail = (email: string) => {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
};

const validatePhone = (phone: string) => {

  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]/.test(digits);
};

const validateAadhaar = (aadhaar: string) => {

  const digits = aadhaar.replace(/\D/g, '');
  return digits.length === 12;
};

type EmployeeFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  dob: string;
  startdate: string;
  enddate: string;
  instructor: number;
  status: number;
  notes: string;
  aadhaar: string;
};

const initialFormData: EmployeeFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  state: "",
  dob: "",
  startdate: "",
  enddate: "",
  instructor: 0,
  status: 1,
  notes: "",
  aadhaar: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<EmployeeFormData>({
    defaultValues: initialFormData,
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/employees");
      const rawData = Array.isArray(data) ? data : data?.data || [];

      const mappedData = rawData.map((emp: any) => {
        const fullName = emp.name ?? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim();
        return {
          ...emp,
          full_name: toInitCap(fullName),
          phone: emp.phone ? formatPhoneNumber(emp.phone) : "",
        };
      });

      setEmployees(mappedData);
      setFilteredEmployees(mappedData);
      setError(null);
    } catch (e: any) {
      console.error("Failed to fetch employees:", e);
      setError(e?.message || "Failed to fetch employees");
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let result = [...employees];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((emp) =>
        ["full_name", "name", "email", "phone"].some((field) =>
          String(emp[field] || "").toLowerCase().includes(term)
        )
      );
    }


    if (dateFilter.from || dateFilter.to) {
      result = result.filter((emp) => {
        if (!emp.startdate && !emp.enddate) return false;

        const startDate = emp.startdate ? new Date(emp.startdate) : null;
        const endDate = emp.enddate ? new Date(emp.enddate) : null;
        const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
        const toDate = dateFilter.to ? new Date(dateFilter.to) : null;

        if (fromDate && toDate) {

          if (startDate && endDate) {
            return (
              (startDate >= fromDate && startDate <= toDate) ||
              (endDate >= fromDate && endDate <= toDate) ||
              (startDate <= fromDate && endDate >= toDate)
            );
          } else if (startDate) {
            return startDate >= fromDate && startDate <= toDate;
          } else if (endDate) {
            return endDate >= fromDate && endDate <= toDate;
          }
        } else if (fromDate) {

          if (startDate && endDate) {
            return endDate >= fromDate;
          } else if (startDate) {
            return startDate >= fromDate;
          } else if (endDate) {
            return endDate >= fromDate;
          }
        } else if (toDate) {

          if (startDate && endDate) {
            return startDate <= toDate;
          } else if (startDate) {
            return startDate <= toDate;
          } else if (endDate) {
            return endDate <= toDate;
          }
        }
        return true;
      });
    }

    setFilteredEmployees(result);
  }, [searchTerm, employees, dateFilter]);


  const validateForm = (data: EmployeeFormData) => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(data.email)) {
      newErrors.email = "Invalid email format";
    }

    if (data.phone) {
      if (!validatePhone(data.phone)) {
        newErrors.phone = "Phone must be 10 digits";
      }
    }

    if (data.aadhaar) {
      if (!validateAadhaar(data.aadhaar)) {
        newErrors.aadhaar = "Aadhaar must be 12 digits";
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const formattedName = toInitCap(
        updatedRow.full_name || updatedRow.name || ""
      );

      const payload = {
        name: formattedName,
        email: updatedRow.email ?? null,
        phone: updatedRow.phone ? parsePhoneNumber(updatedRow.phone) : null,
        address: updatedRow.address ?? null,
        dob: updatedRow.dob ?? null,
        enddate: updatedRow.enddate ?? null,
        instructor:
          updatedRow.instructor !== undefined
            ? Number(updatedRow.instructor)
            : null,
        status:
          updatedRow.status !== undefined ? Number(updatedRow.status) : 1,
        notes: updatedRow.notes ?? null,
        state: updatedRow.state ?? null,
        aadhaar: updatedRow.aadhaar
          ? updatedRow.aadhaar.replace(/\D/g, "")
          : null,
      };

      await apiFetch(`/api/employees/${updatedRow.id}`, {
        method: "PUT",
        body: payload,
      });

      const updatedList = employees.map((emp) =>
        emp.id === updatedRow.id
          ? {
            ...emp,
            ...payload,
            full_name: formattedName,
            phone: payload.phone
              ? formatPhoneNumber(payload.phone)
              : "",
          }
          : emp
      );

      setEmployees(updatedList);
      setFilteredEmployees(updatedList);
      toast.success("Employee updated successfully");
    } catch (err: any) {
      console.error("Failed to update employee:", err);
      setError(err.message || "Failed to update employee");
    }
  };


const handleRowAdded = async (newRow: any) => {
  try {
    const formattedName = toInitCap(newRow.full_name || newRow.name || "");

    const payload = {
      name: formattedName,
      email: newRow.email ?? null,
      phone: newRow.phone ? parsePhoneNumber(newRow.phone) : null,
      address: newRow.address ?? null,
      dob: newRow.dob ?? null,
      startdate: newRow.startdate ?? null,
      enddate: newRow.enddate ?? null,
      instructor:
        newRow.instructor !== undefined ? Number(newRow.instructor) : null,
      status:
        newRow.status !== undefined ? Number(newRow.status) : 1,
      notes: newRow.notes ?? null,
      state: newRow.state ?? null,
      aadhaar: newRow.aadhaar
        ? newRow.aadhaar.replace(/\D/g, "")
        : null,
    };

    const created = await apiFetch("/api/employees", {
      method: "POST",
      body: payload,
    });

    const newEmployee = {
      ...created,
      full_name: formattedName,
      phone: created.phone ? formatPhoneNumber(created.phone) : "",
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    setFilteredEmployees((prev) => [newEmployee, ...prev]);

    toast.success("Employee created successfully");

  } catch (err: any) {
    console.error("Failed to add employee:", err);

    // 🔥 DUPLICATE EMAIL HANDLING
    if (err?.status === 409) {
      toast.error("Employee with this email already exists");
    } else {
      toast.error("Failed to create employee");
    }
  }
};




  const handleRowDeleted = async (id: number | string) => {
    try {
      await apiFetch(`/api/employees/${id}`, { method: "DELETE" });

      setEmployees((prev) => prev.filter((row) => row.id !== id));
      setFilteredEmployees((prev) => prev.filter((row) => row.id !== id));
      toast.success("Employee deleted successfully");
    } catch (err) {
      console.error("Failed to delete employee:", err);
      setError("Failed to delete employee");
    }
  };

const handleFormSubmit = async (data: EmployeeFormData) => {
  if (!validateForm(data)) return;

  setFormSaveLoading(true);

  try {
    const formattedName = toInitCap(data.name);

    const payload = {
      ...data,
      name: formattedName,
      phone: data.phone ? parsePhoneNumber(data.phone) : null,
      aadhaar: data.aadhaar ? data.aadhaar.replace(/\D/g, "") : null,
    };

    const created = await apiFetch("/api/employees", {
      method: "POST",
      body: payload,
    });

    const newEmployee = {
      ...created,
      full_name: formattedName,
      phone: created.phone ? formatPhoneNumber(created.phone) : "",
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    setFilteredEmployees((prev) => [newEmployee, ...prev]);

    toast.success("Employee created successfully");
    reset();
    setShowEmployeeForm(false);
    setFormErrors({});

  } catch (err: any) {
    console.error("Failed to add employee:", err);

    if (err?.status === 409) {
      toast.error("Employee with this email already exists");
      setFormErrors({ email: "Email already exists" });
    } else {
      toast.error("Failed to create employee");
    }
  } finally {
    setFormSaveLoading(false);
  }
};


  const columnDefs: ColDef[] = [
    { headerName: "ID", field: "id", width: 80, pinned: "left" },
    {
      headerName: "Full Name",
      field: "full_name",
      editable: true,
      onCellValueChanged: (params) => {
        params.data.full_name = toInitCap(params.newValue || "");
        handleRowUpdated(params.data);
      },
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      editable: true,
      cellRenderer: (params: any) =>
        params.value ? (
          <a href={`tel:${parsePhoneNumber(params.value)}`} className="text-blue-600 underline hover:text-blue-800">
            {params.value}
          </a>
        ) : (
          ""
        ),
      valueParser: (params) => formatPhoneNumber(params.newValue),
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      editable: true,
      cellRenderer: (params: any) =>
        params.value ? (
          <a
            href={`mailto:${params.value}`}
            className="text-blue-600 underline hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {params.value}
          </a>
        ) : (
          ""
        ),
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    { headerName: "Address", field: "address", editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "State", field: "state", editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
    {
      headerName: "DOB",
      field: "dob",
      valueFormatter: DateFormatter,
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
          if (!cellValue) return -1;
          const cellDate = new Date(cellValue);
          if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
            return 0;
          }
          return cellDate < filterLocalDateAtMidnight ? -1 : 1;
        },
      },
    },
    {
      headerName: "Start Date",
      field: "startdate",
      valueFormatter: DateFormatter,
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
          if (!cellValue) return -1;
          const cellDate = new Date(cellValue);
          if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
            return 0;
          }
          return cellDate < filterLocalDateAtMidnight ? -1 : 1;
        },
      },
    },
    {
      headerName: "End Date",
      field: "enddate",
      valueFormatter: DateFormatter,
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
          if (!cellValue) return -1;
          const cellDate = new Date(cellValue);
          if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
            return 0;
          }
          return cellDate < filterLocalDateAtMidnight ? -1 : 1;
        },
      },
    },
    {
      headerName: "Instructor",
      field: "instructor",

      cellRenderer: (p) => (Number(p.value) === 1 ? "Yes" : "No"),

     
      filterValueGetter: (p) =>
        Number(p.data.instructor) === 1 ? "Yes" : "No",

      filter: "agTextColumnFilter",

      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: [1, 0],
      },

      valueFormatter: (p) => (Number(p.value) === 1 ? "Yes" : "No"),
    },



    {
      headerName: "Status",
      field: "status",

      cellRenderer: StatusRenderer,

     
      filterValueGetter: (p) =>
        Number(p.data.status) === 1 ? "Active" : "Inactive",

      filter: "agTextColumnFilter",

      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: [1, 0],
      },

      valueFormatter: (p) =>
        Number(p.value) === 1 ? "Active" : "Inactive",
    }

    ,
    {
      field: "notes",
      headerName: "Notes",
      width: 300,
      sortable: true,
      cellRenderer: (params: any) =>
        params.value ? (
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: params.value }} />
        ) : (
          ""
        ),
    },
    {
      headerName: "Aadhaar Number",
      field: "aadhaar",
      editable: true,
      valueParser: (params) => parsePhoneNumber(params.newValue),
      cellRenderer: (params: any) =>
        params.value ? formatPhoneNumber(params.value) : "",
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>

        </div>
      </div>


      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">

        <div className="max-w-md flex-1">
          <div className="relative mt-1">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone"
              className="pl-10 w-full"
            />
          </div>
        </div>



      </div>



      {showEmployeeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Add New Employee</h2>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name*</label>
                <input
                  {...register("name", { required: "Name is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email*</label>
                <input
                  {...register("email", {
                    required: "Email is required",
                    validate: (value) => validateEmail(value) || "Invalid email format"
                  })}
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  {...register("phone", {
                    validate: (value) => !value || validatePhone(parsePhoneNumber(value)) || "Phone must be 10 digits"
                  })}
                  placeholder="+91 XXXXX XXXXX"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setValue("phone", formatted);
                  }}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Aadhaar</label>
                <input
                  {...register("aadhaar", {
                    validate: (value) => !value || validateAadhaar(value) || "Aadhaar must be 12 digits"
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.aadhaar && <p className="mt-1 text-sm text-red-600">{errors.aadhaar.message}</p>}
                {formErrors.aadhaar && <p className="mt-1 text-sm text-red-600">{formErrors.aadhaar}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register("address")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  {...register("dob")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  {...register("startdate")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  {...register("enddate")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  {...register("notes")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmployeeForm(false);
                    reset();
                    setFormErrors({});
                  }}
                  className="rounded px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaveLoading}
                  className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {formSaveLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading employees...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <AGGridTable
          rowData={filteredEmployees}
          columnDefs={columnDefs}
          title={`Employees (${filteredEmployees.length})`}
          height="70vh"
          onRowAdded={handleRowAdded}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          showFilters={false}
          showSearch={false}
        />
      )}
    </div>
  );
}