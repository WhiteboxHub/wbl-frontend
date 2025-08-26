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
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { cn } from "lib/utils";
import { useState, useEffect, useRef } from "react";
import NewEvent from "./NewEvent";

interface AvatarLayoutProps {
  children: React.ReactNode;
}

export function AvatarLayout({ children }: AvatarLayoutProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
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
      title: "Training",
      href: "/avatar/training/batch",
      icon: GraduationCap,
      children: [
        { title: "Batch", href: "/avatar/training/batch" },
        { title: "Session", href: "/avatar/training/session" },
  
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
    
    },
    

   {
      title: "Vendors",
      href: "/avatar/vendors",
      icon: BuildingIcon,
      children: [
      // { title: "List", href: "/avatar/vendors" },
      //{ title: "Search", href: "/avatar/vendors/search" },
      // { title: "List", href: "/avatar/vendors/vendor" },          // Vendor table page
      // { title: "Daily Contact", href: "/avatar/vendors/daily-contact" },
      {title:"Daily Contact Extract", href:"/avatar/vendors/daily-contact" },
      {title:"Vendor", href:"/avatar/vendors/vendor"},
      // { title: "Daily Activity", href: "/avatar/vendors/daily-activity" },
      ],
    }

  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <Link href="/" className="flex items-center space-x-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to Whitebox Learning</span>
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center space-x-3">
                <Link href="/avatar">
                  <h1
                    className="text-3xl font-semibold bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 bg-clip-text text-transparent tracking-wide cursor-pointer"
                    style={{
                      fontFamily:
                        '"Poppins", "SF Pro Display", "Helvetica Neue", system-ui, -apple-system, sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    Avatar
                  </h1>
                </Link>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            {/* <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-9 w-9 hover:bg-gradient-to-r hover:from-violet-100 hover:to-fuchsia-100 hover:text-violet-600 transition-all duration-200"
              >
                {darkMode ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </Button>
            </div> */}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const itemIsActive = isActive(item.href, item.exact);
              const hasChildren = item.children && item.children.length > 0;
              const isHovered = hoveredItem === item.href;

              const handleMouseEnter = () => {
                if (hasChildren) {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                  setHoveredItem(item.href);
                }
              };

              const handleMouseLeave = () => {
                if (hasChildren) {
                  hoverTimeoutRef.current = setTimeout(() => {
                    setHoveredItem(null);
                  }, 300); // 300ms delay before hiding
                }
              };

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1",
                        itemIsActive
                          ? "bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 text-violet-700 dark:text-violet-300 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 dark:hover:from-violet-900/20 dark:hover:to-fuchsia-900/20 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-sm",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                    {hasChildren && (
                      <div className="h-8 w-8 flex items-center justify-center">
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Hover Dropdown */}
                  {hasChildren && isHovered && (
                    <div
                      className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
                      onMouseEnter={() => {
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                        setHoveredItem(item.href);
                      }}
                      onMouseLeave={() => {
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredItem(null);
                        }, 300);
                      }}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-4 py-2 text-sm transition-all duration-200 hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 dark:hover:from-violet-900/20 dark:hover:to-fuchsia-900/20",
                            pathname === child.href
                              ? "text-violet-700 dark:text-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/30 border-r-2 border-violet-500 dark:border-violet-400"
                              : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400",
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

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
      
      {/* New Event for Avatar Section */}
      {/* <NewEvent 
        title="Upcoming Events"
        message="New features and updates available in your avatar dashboard!"
        ctaText="Explore"
        ctaLink="/avatar"
        autoHide={false}
      /> */}
    </div>
  );
} 