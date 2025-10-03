// whiteboxLearning-wbl\components\AvatarLayout.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/admin_ui/button";
import {
  ShieldCheck,
  HomeIcon,
  UsersIcon,
  UserCheckIcon,
  UserCogIcon,
  BuildingIcon,
  GraduationCap,
  ArrowLeftIcon,
  Video,
  ChevronRight,
} from "lucide-react";
import { cn } from "lib/utils";
import { useState, useEffect, useRef } from "react";

interface AvatarLayoutProps {
  children: React.ReactNode;
}

export function AvatarLayout({ children }: AvatarLayoutProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

  const handleItemClick = (href: string, hasChildren: boolean) => {
    if (hasChildren) {
      setExpandedItem(expandedItem === href ? null : href);
    } else {
      setSidebarOpen(false);
      setExpandedItem(null);
    }
  };

  const sidebarItems = [
    {
      title: "Dashboard",
      href: "/avatar",
      icon: HomeIcon,
      exact: true,
    },
    {
      title: "Leads",
      href: "/avatar/leads",
      icon: UsersIcon,
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
    {
      title: "Authuser",
      href: "/avatar/authuser",
      icon: ShieldCheck,
    },
    {
      title: "Employees",
      href: "/avatar/employee",
      icon: UsersIcon,
      children: [
        { title: "Employee", href: "/avatar/employee" },
        { title: "Employee Search", href: "/avatar/employee/employeesearch" },
       ],
    },
    {
      title: "Vendors",
      href: "/avatar/vendors",
      icon: BuildingIcon,
      children: [
        { title: "Daily Contact Extract", href: "/avatar/vendors/daily-contact" },
        { title: "Vendor", href: "/avatar/vendors/vendor" },
      ],
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile toggle */}
            <div className="md:hidden flex items-center">
              {!sidebarOpen ? (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    className="w-6 h-6 text-gray-700 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                <span>Back to Whitebox Learning</span>
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
        <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const itemIsActive = isActive(item.href, item.exact);
              const hasChildren = item.children && item.children.length > 0;
              const isHovered = hoveredItem === item.href;

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => hasChildren && setHoveredItem(item.href)}
                  onMouseLeave={() => hasChildren && setHoveredItem(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      itemIsActive
                        ? "bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 dark:from-violet-900/30 dark:to-fuchsia-900/30 dark:text-violet-300 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 hover:text-violet-600 dark:hover:from-violet-900/20 dark:hover:to-fuchsia-900/20 dark:hover:text-violet-400"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    {hasChildren && <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />}
                  </Link>

                  {hasChildren && isHovered && (
                    <div className="absolute left-full top-0 ml-2 min-w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-4 py-2 text-sm hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 dark:hover:from-violet-900/20 dark:hover:to-fuchsia-900/20",
                            pathname === child.href
                              ? "border-r-2 border-violet-500 bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 dark:border-violet-400 dark:from-violet-900/30 dark:to-fuchsia-900/30 dark:text-violet-300"
                              : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400"
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
            "fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col transform transition-transform duration-300 ease-in-out md:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Cross button */}
          <div className="flex justify-end p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg
                className="w-6 h-6 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.href} className="relative">
                  <button
                    onClick={() => handleItemClick(item.href, hasChildren)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    {hasChildren && (
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-gray-400 transition-transform duration-200",
                          expandedItem === item.href ? "rotate-90" : "rotate-0"
                        )}
                      />
                    )}
                  </button>

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
                          className="block px-4 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
