"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  KeyRound,
  FileText,
  Clock,
  MessageSquare,
  Briefcase,
  Sparkles,
  Headphones,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/aiprep",
    exact: true,
  },
  {
    label: "Assessments",
    icon: ClipboardList,
    href: "/aiprep/start",
    exact: false,
    matchPrefixes: ["/aiprep/start", "/aiprep/session"],
  },
  {
    label: "My LLM Setup",
    icon: KeyRound,
    href: "/user_dashboard/my-llm-setup",
    exact: false,
  },
  {
    label: "My Resume",
    icon: FileText,
    href: "/user_dashboard/my-resume",
    exact: false,
  },
  {
    label: "My Sessions",
    icon: Clock,
    href: "/user_dashboard/my-sessions",
    exact: false,
  },
  {
    label: "My Interviews",
    icon: MessageSquare,
    href: "/user_dashboard/my-interviews",
    exact: false,
  },
  {
    label: "My Applications",
    icon: Briefcase,
    href: "/user_dashboard/my-applications",
    exact: false,
  },
  {
    label: "AI Prep Tool",
    icon: Sparkles,
    href: "/aiprep",
    exact: true,
  },
];

export default function AIPrepLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(item: (typeof navItems)[0]) {
    if (item.matchPrefixes) {
      return item.matchPrefixes.some((p) => pathname.startsWith(p));
    }
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }

  return (
    <div className="flex min-h-screen pt-20">
      {/* Sidebar */}
      <aside
        className="w-[220px] flex-shrink-0 bg-white border-r border-gray-200 sticky top-20 self-start"
        style={{ height: "calc(100vh - 5rem)" }}
      >
        <div className="flex flex-col h-full p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-2">
            Navigation
          </p>
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.label + item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-600 font-semibold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom help section */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center text-center gap-2">
              <div className="bg-indigo-100 rounded-full p-2">
                <Headphones size={16} className="text-indigo-600" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Need help?</p>
              <p className="text-xs text-gray-500">
                Check our FAQ or contact support.
              </p>
              <a
                href="mailto:support@wbl.ai"
                className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors w-full text-center"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 min-h-full overflow-auto">
        {children}
      </main>
    </div>
  );
}
