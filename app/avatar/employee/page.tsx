"use client";
import React, { useEffect, useState, useRef } from "react";
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
import { createPortal } from "react-dom";
import { Badge } from "@/components/admin_ui/badge";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";


const DateFormatter = (params: any) => {
  if (!params.value) return "";

  const [year, month, day] = params.value.split("-");
  return `${month}/${day}/${year}`;
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

const InstructorRenderer = (params: any) => {
  const isYes = Number(params.value) === 1;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${isYes
        ? "bg-blue-100 text-blue-700"
        : "bg-orange-100 text-orange-700"
        }`}
    >
      {isYes ? "Yes" : "No"}
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

const statusOptions = ["Active", "Inactive"];
const instructorOptions = ["Yes", "No"];

const StatusFilterHeaderComponent = (props: any) => {
  const { selectedStatuses, setSelectedStatuses } = props;
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: Math.max(0, rect.left + window.scrollX - 100),
      });
    }
    setFilterVisible((v) => !v);
  };

  const handleStatusChange = (status: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedStatuses((prev: string[]) => {
      const isSelected = prev.includes(status);
      if (isSelected) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedStatuses([...statusOptions]);
    } else {
      setSelectedStatuses([]);
    }
  };

  const isAllSelected = selectedStatuses.length === statusOptions.length;
  const isIndeterminate = selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length;

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

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setFilterVisible(false);
      }
    };

    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex items-center w-full">
      <span className="mr-2 flex-grow">Status</span>
      <div
        ref={filterButtonRef}
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
        onClick={toggleFilter}
      >
        {selectedStatuses.length > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {selectedStatuses.length}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-500 hover:text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
          />
        </svg>
      </div>

      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="filter-dropdown fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b pb-2 mb-2">
              <label className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded text-sm">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={handleSelectAll}
                  className="mr-3"
                  onClick={(e) => e.stopPropagation()}
                />
                Select All
              </label>
            </div>
            {statusOptions.map((status) => {
              const isActive = status === "Active";
              return (
                <label
                  key={status}
                  className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={(e) => handleStatusChange(status, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="mr-3"
                  />
                  <Badge className={`${isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    } capitalize`}>
                    {status}
                  </Badge>
                </label>
              );
            })}
            {selectedStatuses.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatuses([]);
                  }}
                  className="w-full text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 py-1"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

const InstructorFilterHeaderComponent = (props: any) => {
  const { selectedInstructors, setSelectedInstructors } = props;
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [filterVisible, setFilterVisible] = useState(false);

  const toggleFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: Math.max(0, rect.left + window.scrollX - 100),
      });
    }
    setFilterVisible((v) => !v);
  };

  const handleInstructorChange = (instructor: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedInstructors((prev: string[]) => {
      const isSelected = prev.includes(instructor);
      if (isSelected) {
        return prev.filter((s) => s !== instructor);
      } else {
        return [...prev, instructor];
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedInstructors([...instructorOptions]);
    } else {
      setSelectedInstructors([]);
    }
  };

  const isAllSelected = selectedInstructors.length === instructorOptions.length;
  const isIndeterminate = selectedInstructors.length > 0 && selectedInstructors.length < instructorOptions.length;

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

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setFilterVisible(false);
      }
    };

    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex items-center w-full">
      <span className="mr-2 flex-grow">Instructor</span>
      <div
        ref={filterButtonRef}
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
        onClick={toggleFilter}
      >
        {selectedInstructors.length > 0 && (
          <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {selectedInstructors.length}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-500 hover:text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
          />
        </svg>
      </div>

      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className="filter-dropdown fixed bg-white border rounded-lg shadow-xl p-3 flex flex-col space-y-2 w-56 pointer-events-auto dark:bg-gray-800 dark:border-gray-600"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              zIndex: 99999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b pb-2 mb-2">
              <label className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded text-sm">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={handleSelectAll}
                  className="mr-3"
                  onClick={(e) => e.stopPropagation()}
                />
                Select All
              </label>
            </div>
            {instructorOptions.map((instructor) => {
              const isYes = instructor === "Yes";
              return (
                <label
                  key={instructor}
                  className="flex items-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedInstructors.includes(instructor)}
                    onChange={(e) => handleInstructorChange(instructor, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="mr-3"
                  />
                  <Badge className={`${isYes
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    }`}>
                    {instructor}
                  </Badge>
                </label>
              );
            })}
            {selectedInstructors.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInstructors([]);
                  }}
                  className="w-full text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 py-1"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
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
  const showLoader = useMinimumLoadingTime(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [formSaveLoading, setFormSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);

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

    if (selectedStatuses.length > 0) {
      result = result.filter((emp) =>
        selectedStatuses.some(
          status => status === (Number(emp.status) === 1 ? "Active" : "Inactive")
        )
      );
    }

    if (selectedInstructors.length > 0) {
      result = result.filter((emp) =>
        selectedInstructors.some(
          instructor => instructor === (Number(emp.instructor) === 1 ? "Yes" : "No")
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
  }, [searchTerm, employees, dateFilter, selectedStatuses, selectedInstructors]);


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
      cellRenderer: InstructorRenderer,
      headerComponent: InstructorFilterHeaderComponent,
      headerComponentParams: { selectedInstructors, setSelectedInstructors },
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
      headerComponent: StatusFilterHeaderComponent,
      headerComponentParams: { selectedStatuses, setSelectedStatuses },
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
      <style jsx global>{`
        .filter-dropdown {
          scrollbar-width: thin;
        }
        .filter-dropdown::-webkit-scrollbar {
          width: 8px;
        }
        .filter-dropdown::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .filter-dropdown::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .filter-dropdown::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
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
      {showLoader ? (
        <Loader />
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