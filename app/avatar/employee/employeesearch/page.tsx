"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/admin_ui/input";
import { Badge } from "@/components/admin_ui/badge";
import {
  SearchIcon,
  User,
  Users,
  Calendar,
  Activity,
  BookOpen,
  Briefcase,
  ClipboardList,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// ---------------------- TYPES ----------------------
type Employee = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  startdate?: string;
  address?: string;
  state?: string;
  dob?: string;
  enddate?: string;
  notes?: string;
  status?: number;
  instructor?: number;
  aadhaar?: string;
};

type Candidates = {
  preparation: { count: number; names: string[] };
  marketing: { count: number; names: string[] };
};

type TeachingItem = {
  type: "class" | "session";
  title: string;
  date?: string;
  link?: string;
};

type SessionClassData = {
  class_count: number;
  session_count: number;
  timeline: TeachingItem[];
};

type EmployeeTask = {
  id: number;
  employee_id: number;
  employee_name: string | null;
  task: string;
  assigned_date: string;
  due_date: string;
  status: string;
  priority: string;
  notes: string;
};

type Placement = {
  id: number;
  candidate_name: string;
  position: string;
  company: string;
  placement_date: string;
  type: string;
  status: string;
  base_salary: number;
  fee_paid: number;
  notes: string;
};

// ---------------------- SMALL COMPONENTS ----------------------
const StatusRenderer = ({ status }: { status: number }) => {
  const statusMap: Record<number, { label: string; class: string }> = {
    1: { label: "ACTIVE", class: "bg-green-100 text-green-800" },
    0: { label: "INACTIVE", class: "bg-red-100 text-red-800" },
  };
  const s = statusMap[status] || { label: "UNKNOWN", class: "bg-gray-100 text-gray-800" };
  return <Badge className={s.class}>{s.label}</Badge>;
};

const DateFormatter = (date: any) =>
  date ? new Date(date).toLocaleDateString() : "Not Set";

// ---------------------- MAIN COMPONENT ----------------------
export default function EmployeeSearchPage() {
  const [query, setQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [candidates, setCandidates] = useState<Candidates | null>(null);
  const [sessionClassData, setSessionClassData] = useState<SessionClassData | null>(null);
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingPlacements, setLoadingPlacements] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const toggleSection = (section: string) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // ---------------------- SEARCH EMPLOYEES ----------------------
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (!query.trim() || query.length < 2) {
      setFilteredEmployees([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/employees/search?query=${encodeURIComponent(query)}`);
        setFilteredEmployees(Array.isArray(data) ? data : data?.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("❌ Employee search failed:", error);
        setFilteredEmployees([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => debounceTimeout.current && clearTimeout(debounceTimeout.current);
  }, [query]);

  // ---------------------- FETCH CANDIDATES ----------------------
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const data = await apiFetch(`/employees/${selectedEmployee.id}/candidates`);
        setCandidates(data);
      } catch (error) {
        console.error("❌ Candidate fetch failed:", error);
        setCandidates(null);
      } finally {
        setLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, [selectedEmployee?.id]);

  // ---------------------- FETCH SESSION / CLASS ----------------------
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const data = await apiFetch(`/employees/${selectedEmployee.id}/session-class-data`);
        const sorted = (data.timeline || []).sort(
          (a: TeachingItem, b: TeachingItem) =>
            new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
        );
        setSessionClassData({ ...data, timeline: sorted });
      } catch (error) {
        console.error("❌ Session/Class fetch failed:", error);
        setSessionClassData(null);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [selectedEmployee?.id]);

  // ---------------------- FETCH TASKS ----------------------
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const data = await apiFetch(`/employee-tasks?employee_id=${selectedEmployee.id}`);
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Tasks fetch failed:", error);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, [selectedEmployee?.id]);

  // ---------------------- FETCH PLACEMENTS ----------------------
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchPlacements = async () => {
      setLoadingPlacements(true);
      try {
        const data = await apiFetch(`/employees/${selectedEmployee.id}/placements`);
        setPlacements(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Placements fetch failed:", error);
        setPlacements([]);
      } finally {
        setLoadingPlacements(false);
      }
    };
    fetchPlacements();
  }, [selectedEmployee?.id]);

  // ---------------------- SELECT EMPLOYEE ----------------------
  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSuggestions(false);
    setQuery("");
    setFilteredEmployees([]);
  };

  // ---------------------- RENDER HELPERS ----------------------
  const renderInfoCard = (title: string, icon: React.ReactNode, data: any) => (
    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        {icon}
        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">{title}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
        {Object.entries(data).map(([key, value]) => {
          if (!value) return null;
          const displayKey = key
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
          let displayValue: any = value;
          if (key.toLowerCase().includes("date")) displayValue = DateFormatter(value);
          else if (key === "status" && typeof value === "number")
            displayValue = <StatusRenderer status={value} />;
          return (
            <div
              key={key}
              className="flex items-center py-3 border-b border-black-100 dark:border-black-600 last:border-b-0"
            >
              <span className="text-black-600 dark:text-black-400 font-semibold w-1/3">
                {displayKey}:
              </span>
              <span className="text-black-900 dark:text-black-100 font-medium">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCandidateSection = (
    title: string,
    count: number,
    names: string[],
    color: string
  ) => (
    <div className={`${color} p-6 rounded-lg border border-black-200 dark:border-black-700 shadow-sm`}>
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        <Users className="h-5 w-5" />
        <h4 className="font-semibold text-lg">{title}</h4>
        <Badge variant="secondary">{count}</Badge>
      </div>
      {names.length > 0 ? (
        names.map((n, i) => (
          <div
            key={i}
            className="py-2 border-b border-black-100 dark:border-black-600 last:border-b-0 text-black-900 dark:text-black-100 font-medium"
          >
            {n}
          </div>
        ))
      ) : (
        <p className="text-black-500 dark:text-black-400 text-sm">No candidates found</p>
      )}
    </div>
  );

  const renderTeachingTimeline = (timeline: TeachingItem[]) => (
    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        <Activity className="h-5 w-5" />
        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">
          Recent Activity Timeline
        </h4>
        <Badge variant="secondary">{timeline.length}</Badge>
      </div>

      {timeline.length > 0 ? (
        <div className="space-y-4">
          {timeline.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 border border-black-200 dark:border-black-700 rounded-lg"
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${item.type === "class"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800"
                  }`}
              >
                {item.type === "class" ? "C" : "S"}
              </div>

              <div className="flex-1 min-w-0">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-black-900 dark:text-black-100 hover:text-blue-600 transition-colors"
                  >
                    {item.title || "Untitled Event"}
                  </a>
                ) : (
                  <p className="font-semibold text-black-900 dark:text-black-100">
                    {item.title || "Untitled Event"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-black-500 dark:text-black-400 text-sm">
          No sessions or classes recorded
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-black-900 dark:text-black-100">Search Employees</h1>
      <p className="text-black-600 dark:text-black-400">
        Search employees by name, ID, or email to view details
      </p>

      {/* Search bar */}
      <div className="max-w-md relative">
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black-400" />
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter at least 2 characters..."
            className="pl-10"
          />
        </div>

        {showSuggestions && filteredEmployees.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-black-800 border border-black-200 dark:border-black-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => selectEmployee(emp)}
                className="w-full px-4 py-3 text-left hover:bg-black-50 dark:hover:bg-black-700 border-b border-black-100 dark:border-black-600 last:border-b-0"
              >
                <div className="font-medium text-black-900 dark:text-black-100">{emp.name}</div>
                <div className="text-sm text-black-500 dark:text-black-400">{emp.email}</div>
              </button>
            ))}
          </div>
        )}

        {loading && <p className="text-sm text-blue-500 mt-2">Searching employees...</p>}
      </div>

      {/* Employee Details */}
      {selectedEmployee && (
        <div className="border border-black-200 dark:border-black-700 rounded-lg overflow-hidden">
          <div className="bg-blue-50 dark:bg-black-800 px-6 py-4 border-b border-black-200 dark:border-black-700">
            <h2 className="text-xl font-bold text-black-900 dark:text-black-100">
              {selectedEmployee.name}
            </h2>
            <p className="text-black-600 dark:text-black-400">
              ID: {selectedEmployee.id} • Email: {selectedEmployee.email || "N/A"} • Status:{" "}
              <StatusRenderer status={selectedEmployee.status || 0} />
            </p>
          </div>

          {/* Accordion Sections */}
          <div className="divide-y divide-black-200 dark:divide-black-700">
            {/* Basic */}
            <AccordionSection
              title="Basic Information"
              icon={<User className="h-5 w-5 text-black-600 dark:text-black-400" />}
              isOpen={openSections.basic}
              onToggle={() => toggleSection("basic")}
            >
              {renderInfoCard("Employee Details", <User className="h-4 w-4" />, {
                name: selectedEmployee.name,
                email: selectedEmployee.email,
                phone: selectedEmployee.phone,
                status: selectedEmployee.status,
                start_date: selectedEmployee.startdate,
                end_date: selectedEmployee.enddate,
                date_of_birth: selectedEmployee.dob,
                state: selectedEmployee.state,
                aadhaar: selectedEmployee.aadhaar,
                instructor: selectedEmployee.instructor,
                notes: selectedEmployee.notes,
                address: selectedEmployee.address,
              })}
            </AccordionSection>


            {/* Candidates */}
            <AccordionSection
              title="Candidate Information"
              icon={<Users className="h-5 w-5 text-black-600 dark:text-black-400" />}
              isOpen={openSections.candidates}
              onToggle={() => toggleSection("candidates")}
            >
              {loadingCandidates ? (
                <Loader text="Loading candidate details..." />
              ) : candidates ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderCandidateSection(
                    "Preparation Candidates",
                    candidates.preparation.count,
                    candidates.preparation.names,
                    "bg-indigo-50 dark:bg-indigo-900/20"
                  )}
                  {renderCandidateSection(
                    "Marketing Candidates",
                    candidates.marketing.count,
                    candidates.marketing.names,
                    "bg-teal-50 dark:bg-teal-900/20"
                  )}
                </div>
              ) : (
                <p className="text-black-500 dark:text-black-400 text-center py-8">
                  No candidate data available
                </p>
              )}
            </AccordionSection>

            {/* Placements Made */}
            <AccordionSection
              title="Placements Made"
              icon={<Briefcase className="h-5 w-5 text-black-600 dark:text-black-400" />}
              isOpen={openSections.placements}
              onToggle={() => toggleSection("placements")}
            >
              {loadingPlacements ? (
                <Loader text="Loading placements..." />
              ) : placements.length > 0 ? (
                <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg border border-black-200 dark:border-black-700 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
                    <User className="h-5 w-5 text-green-700" />
                    <h4 className="font-semibold text-lg text-green-800 dark:text-green-300">Placed Candidates</h4>
                    <Badge className="bg-green-100 text-green-800 border-green-200">{placements.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                    {placements.map((p) => (
                      <div
                        key={p.id}
                        className="py-2 border-b border-black-100 dark:border-black-700 last:border-b-0 text-black-900 dark:text-black-100 font-medium flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        {p.candidate_name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-black-500 dark:text-black-400 text-center py-8">
                  No placements recorded for this employee
                </p>
              )}
            </AccordionSection>

            {/* Tasks */}
            <AccordionSection
              title="Tasks Assigned"
              icon={<ClipboardList className="h-5 w-5 text-black-600 dark:text-black-400" />}
              isOpen={openSections.tasks}
              onToggle={() => toggleSection("tasks")}
            >
              {loadingTasks ? (
                <Loader text="Loading tasks..." />
              ) : tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div
                            className="text-black-900 dark:text-black-100 font-medium mb-2"
                            dangerouslySetInnerHTML={{ __html: task.task }}
                          />
                          <div className="flex flex-wrap gap-2 text-sm text-black-600 dark:text-black-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Assigned: {DateFormatter(task.assigned_date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Due: {DateFormatter(task.due_date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Badge
                            className={
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : task.status === "blocked"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {task.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          <Badge
                            className={
                              task.priority === "urgent"
                                ? "bg-purple-100 text-purple-800"
                                : task.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : task.priority === "medium"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-green-100 text-green-800"
                            }
                          >
                            {task.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {task.notes && (
                        <div className="mt-3 pt-3 border-t border-black-200 dark:border-black-700">
                          <p className="text-sm text-black-600 dark:text-black-400">
                            <strong>Notes:</strong>
                          </p>
                          <div
                            className="text-sm text-black-700 dark:text-black-300 mt-1"
                            dangerouslySetInnerHTML={{ __html: task.notes }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black-500 dark:text-black-400 text-center py-8">
                  No tasks assigned to this employee
                </p>
              )}
            </AccordionSection>

            {/* Sessions */}
            <AccordionSection
              title="Sessions & Classes"
              icon={<Activity className="h-5 w-5 text-black-600 dark:text-black-400" />}
              isOpen={openSections.teaching}
              onToggle={() => toggleSection("teaching")}
            >
              {loadingSessions ? (
                <Loader text="Loading session/class data..." />
              ) : sessionClassData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard
                      icon={<BookOpen className="h-5 w-5 text-yellow-700" />}
                      title="Total Classes"
                      count={sessionClassData.class_count}
                      color="text-yellow-700"
                      bg="bg-yellow-50 dark:bg-yellow-900/20"
                    />
                    <StatCard
                      icon={<Briefcase className="h-5 w-5 text-purple-700" />}
                      title="Total Sessions"
                      count={sessionClassData.session_count}
                      color="text-purple-700"
                      bg="bg-purple-50 dark:bg-purple-900/20"
                    />
                  </div>
                  <div className="max-h-96 overflow-y-auto mt-4">
                    {renderTeachingTimeline(sessionClassData.timeline)}
                  </div>
                </>
              ) : (
                <p className="text-black-500 dark:text-black-400 text-center py-8">
                  No session/class data available
                </p>
              )}
            </AccordionSection>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------- SUB COMPONENTS ----------------------
const Loader = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center py-8">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="ml-2 text-blue-500">{text}</p>
  </div>
);

const AccordionSection = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="accordion-item">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 border-l-4 border-transparent hover:border-blue-500"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold text-black-900 dark:text-black-100">{title}</span>
      </div>
      <span className="text-2xl font-bold text-black-400">{isOpen ? "−" : "+"}</span>
    </button>
    {isOpen && <div className="px-6 pb-4 space-y-4">{children}</div>}
  </div>
);

const StatCard = ({
  icon,
  title,
  count,
  color,
  bg,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  bg: string;
}) => (
  <div className={`flex items-center justify-between p-6 rounded-lg border border-black-200 dark:border-black-700 shadow-sm ${bg}`}>
    <div className="flex items-center gap-3">
      {icon}
      <h4 className={`font-semibold text-lg ${color}`}>{title}</h4>
    </div>
    <span className={`text-2xl font-bold ${color}`}>{count}</span>
  </div>
);
