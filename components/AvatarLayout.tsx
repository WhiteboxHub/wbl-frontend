"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/admin_ui/button";
import {
  ShieldCheck,
  HomeIcon,
  UsersIcon,
  UserCheckIcon,
  BuildingIcon,
  GraduationCap,
  ArrowLeftIcon,
  Video,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { cn } from "lib/utils";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/utils/AuthContext";

interface AvatarLayoutProps {
  children: React.ReactNode;
}

export function AvatarLayout({ children }: AvatarLayoutProps) {
  const pathname = usePathname();
  const { userRole } = useAuth() as { userRole: string };

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("darkMode") === "true" ||
        document.documentElement.classList.contains("dark")
      );
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const allSidebarItems = [
    { title: "Dashboard", href: "/avatar", icon: HomeIcon, exact: true },
    {
      title: "Leads",
      href: "/avatar/leads",
      icon: UsersIcon,
      children: [
        { title: "List", href: "/avatar/leads" },
        { title: "Potential Leads", href: "/avatar/leads/potential_leads" },
      ],
    },
    {
      title: "Training",
      href: "/avatar/training/course",
      icon: GraduationCap,
      children: [
        { title: "Course", href: "/avatar/training/course" },
        { title: "Subject", href: "/avatar/training/subject" },
        { title: "Course Subject", href: "/avatar/training/course_subject" },
        { title: "Course Content", href: "/avatar/training/course_content" },
        { title: "Course Material", href: "/avatar/training/course_material" },
        { title: "Batch", href: "/avatar/training/batch" },
        { title: "Recordings Batch", href: "/avatar/training/recording_batch" },
      ],
    },
    {
      title: "Candidates",
      href: "/avatar/candidates",
      icon: UserCheckIcon,
      children: [
        { title: "List", href: "/avatar/candidates" },
        { title: "Search", href: "/avatar/candidates/search" },
        { title: "Prep", href: "/avatar/candidates/prep" },
        { title: "Interviews", href: "/avatar/candidates/interviews" },
        { title: "Marketing", href: "/avatar/candidates/marketing" },
        { title: "Placements", href: "/avatar/candidates/placements" },
        { title: "Placements Fee", href: "/avatar/candidates/placement_fee" },
      ],
    },
    {
      title: "Recordings",
      href: "/avatar/recordings/class",
      icon: Video,
      children: [
        { title: "Class", href: "/avatar/recordings/class" },
        { title: "Sessions", href: "/avatar/recordings/session" },
      ],
    },
    { title: "Authuser", href: "/avatar/authuser", icon: ShieldCheck },
    {
      title: "Employees",
      href: "/avatar/employee",
      icon: UsersIcon,
      children: [
        { title: "List", href: "/avatar/employee" },
        { title: "Search", href: "/avatar/employee/employeesearch" },
        { title: "Tasks", href: "/avatar/employee/employeetasks" },
        {
          title: "Documents",
          href: "/avatar/employee/internal_documents",
        },
      ],
    },
    {
      title: "Vendors",
      href: "/avatar/vendors/daily-contact",
      icon: BuildingIcon,
      children: [
        {
          title: "Daily Contact Extract",
          href: "/avatar/vendors/daily-contact",
        },
        { title: "Vendor", href: "/avatar/vendors/vendor" },
        { title: "Outreach Contacts", href: "/avatar/vendors/outreach-contacts" },
      ],
    },
    { title: "HR Contacts", href: "/avatar/hr-contacts", icon: UsersIcon },
    {
      title: "Companies",
      href: "/avatar/companies",
      icon: BuildingIcon,
      children: [
        { title: "List", href: "/avatar/companies" },
        { title: "Contacts", href: "/avatar/company_contacts" },
      ],
    },
    {
      title: "Job Listings",
      href: "/avatar/job-listings",
      icon: Briefcase,
      children: [
        { title: "Job Listings", href: "/avatar/job-listings" },
        { title: "Raw Job Listings", href: "/avatar/raw-job-listings" },
      ],
    },
    {
      title: "Jobs",
      href: "/avatar/job-activity/job-types",
      icon: Briefcase,
      children: [
        {
          title: "Types",
          href: "/avatar/job-activity/job-types",
        },
        {
          title: "Logs",
          href: "/avatar/job-activity/job-activity-log",
        },
        {
          title: "Automation Keywords",
          href: "/avatar/job-activity/automation-keywords",
        },
      ],
    },
    {
      title: "Automation Workflow",
      href: "/avatar/workflow/automation-workflows",
      icon: Briefcase,
      children: [
        {
          title: "Workflows",
          href: "/avatar/workflow/automation-workflows",
        },
        {
          title: "Schedules",
          href: "/avatar/workflow/automation-workflow-schedules",
        },
        {
          title: "Logs",
          href: "/avatar/workflow/automation-workflow-logs",
        },
        {
          title: "Email Templates",
          href: "/avatar/workflow/email-templates",
        },
        {
          title: "Delivery Engines",
          href: "/avatar/workflow/delivery-engines",
        },
      ],
    },
  ];

  const sidebarItems = allSidebarItems;

  const handleItemClick = (href: string, hasChildren: boolean) => {
    if (hasChildren) {
      setExpandedItem(expandedItem === href ? null : href);
    } else {
      setSidebarOpen(false);
      setExpandedItem(null);
    }
  };

  const isActive = (item: (typeof sidebarItems)[number]) => {
    if (item.exact) return pathname === item.href;
    if (pathname === item.href) return true;
    if (item.children) {
      return item.children.some((child) => pathname.startsWith(child.href));
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* Mobile toggle */}
            <div className="flex items-center md:hidden">
              {!sidebarOpen ? (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    className="h-6 w-6 text-gray-700 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              ) : null}
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <Link href="/" className="flex items-center space-x-2">
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="md:hidden">Back</span>
                <span className="hidden md:inline">
                  Back to Whitebox Learning
                </span>
              </Link>
            </Button>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

            <Link href="/avatar">
              <h1 className="cursor-pointer bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 bg-clip-text text-3xl font-semibold tracking-wide text-transparent">
                Avatar
              </h1>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden min-h-screen w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:flex md:flex-col">
          <nav className="space-y-2 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const itemIsActive = isActive(item);

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current)
                      clearTimeout(hoverTimeoutRef.current);
                    if (hasChildren) setExpandedItem(item.href);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeoutRef.current)
                      clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = setTimeout(
                      () => setExpandedItem(null),
                      100
                    );
                  }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      itemIsActive
                        ? "bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 shadow-sm dark:from-violet-900/30 dark:to-fuchsia-900/30 dark:text-violet-300"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 hover:text-violet-600 dark:text-gray-300 dark:hover:from-violet-900/20 dark:hover:to-fuchsia-900/20 dark:hover:text-violet-400"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    {hasChildren && (
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                    )}
                  </Link>

                  {hasChildren && expandedItem === item.href && (
                    <div className="absolute left-full top-0 z-50 ml-2 min-w-[12rem] rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => {
                            if (hoverTimeoutRef.current)
                              clearTimeout(hoverTimeoutRef.current);
                            setExpandedItem(null);
                          }}
                          className={cn(
                            "block rounded px-4 py-2 text-sm hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 dark:hover:from-violet-900/20 dark:hover:to-fuchsia-900/20",
                            pathname === child.href
                              ? "border-r-2 border-violet-500 bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 dark:border-violet-400 dark:from-violet-900/30 dark:to-fuchsia-900/30 dark:text-violet-300"
                              : "text-gray-600 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400"
                          )}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 flex h-full min-h-screen w-64 transform flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 md:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg
                className="h-6 w-6 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItem === item.href;

              return (
                <div key={item.href} className="relative">
                  {hasChildren ? (
                    <button
                      onClick={() => handleItemClick(item.href, hasChildren)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-gray-400 transition-transform duration-200",
                          isExpanded ? "rotate-90" : "rotate-0"
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  )}

                  {hasChildren && expandedItem === item.href && (
                    <div className="ml-4 mt-1 flex flex-col space-y-1">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => {
                            setSidebarOpen(false);
                            setExpandedItem(null);
                          }}
                          className="block rounded px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
