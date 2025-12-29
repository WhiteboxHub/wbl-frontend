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

type Jobs = {
  count: number;
  names: string[];
};

type Task = {
  id: number;
  task: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_date?: string;
};

type Placements = {
  count: number;
  names: string[];
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
  const [employeeJobs, setEmployeeJobs] = useState<Jobs | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  const [employeePlacements, setEmployeePlacements] = useState<Placements | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
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
        console.error(" Employee search failed:", error);
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
        console.error(" Candidate fetch failed:", error);
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


  useEffect(() => {
    if (!selectedEmployee) return;

    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const data = await apiFetch(`/employees/${selectedEmployee.id}/jobs`);
        setEmployeeJobs(data);
      } catch (err) { console.error("Jobs fetch failed", err); }
      finally { setLoadingJobs(false); }
    };

    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const data = await apiFetch(`/employees/${selectedEmployee.id}/tasks`);
        setEmployeeTasks(data);
      } catch (err) { console.error("Tasks fetch failed", err); }
      finally { setLoadingTasks(false); }
    };

    const fetchPlacements = async () => {
      setLoadingPlacements(true);
      try {
        const data = await apiFetch(`/employees/${selectedEmployee.id}/placements`);
        setEmployeePlacements(data);
      } catch (err) { console.error("Placements fetch failed", err); }
      finally { setLoadingPlacements(false); }
    };

    fetchJobs();
    fetchTasks();
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


  const renderTasksSection = (tasks: Task[]) => (
    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        <Activity className="h-5 w-5 text-purple-600" />
        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">Assigned Tasks</h4>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div className="space-y-3">
        {tasks.length > 0 ? tasks.map(t => (
          <div key={t.id} className="p-3 border border-black-100 dark:border-black-700 rounded-md">
            <div className="flex justify-between items-start">
              <span className="font-bold text-black-900 dark:text-black-100">{t.task}</span>
              <Badge className={t.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {t.status}
              </Badge>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-black-500">
              <span>Priority: <span className="font-semibold uppercase">{t.priority}</span></span>
              <span>Due: {DateFormatter(t.due_date)}</span>
            </div>
          </div>
        )) : <p className="text-sm text-black-500 text-center py-4">No tasks found</p>}
      </div>
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
                <p className="text-sm text-black-500 dark:text-black-400 flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {item.date ? DateFormatter(item.date) : "No date"}
                </p>
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

            {/* Placements */}
            <AccordionSection
              title="Placements Made"
              icon={<Users className="h-5 w-5 text-black-600 dark:text-black-400" />}
              isOpen={openSections.placements}
              onToggle={() => toggleSection("placements")}
            >
              {loadingPlacements ? (
                <Loader text="Loading placements..." />
              ) : employeePlacements ? (
                renderCandidateSection(
                  "Placed Candidates",
                  employeePlacements.count,
                  employeePlacements.names,
                  "bg-emerald-50 dark:bg-emerald-900/20"
                )
              ) : (
                <p className="text-black-500 dark:text-black-400 text-center py-8">
                  No placement data available
                </p>
              )}
            </AccordionSection>

            {/* Tasks */}
            <AccordionSection
              title="Assigned Tasks"
              icon={<Activity className="h-5 w-5 text-black-600 dark:text-black-400" />}
              isOpen={openSections.tasks}
              onToggle={() => toggleSection("tasks")}
            >
              {loadingTasks ? <Loader text="Loading tasks..." /> : renderTasksSection(employeeTasks)}
            </AccordionSection>

            {/* Jobs */}
            <AccordionSection
              title="Owned Jobs"
              icon={<Briefcase className="h-5 w-5 text-black-600 dark:text-black-400" />}
              isOpen={openSections.jobs}
              onToggle={() => toggleSection("jobs")}
            >
              {loadingJobs ? (
                <Loader text="Loading jobs..." />
              ) : employeeJobs ? (
                renderCandidateSection(
                  "Job Assignments",
                  employeeJobs.count,
                  employeeJobs.names,
                  "bg-blue-50 dark:bg-blue-900/20"
                )
              ) : (
                <p className="text-black-500 dark:text-black-400 text-center py-8">
                  No jobs assigned
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
