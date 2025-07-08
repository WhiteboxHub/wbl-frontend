"use client";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/admin_ui/button";
import { UserIcon, LogOutIcon, SettingsIcon, ShieldIcon } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Schedule", href: "/schedule" },
    { label: "Resources", href: "/resources" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-whitebox-500 to-whitebox-700 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded transform rotate-45"></div>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Whitebox Learning
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-whitebox-600 ${
                    location.pathname === item.href
                      ? "text-whitebox-600"
                      : "text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Unique Avatar Button */}
              <Link
                to="/avatar"
                className="relative group flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ShieldIcon className="relative h-5 w-5 text-white z-10" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </Link>

              <Button
                asChild
                className="bg-whitebox-600 hover:bg-whitebox-700 text-white px-4 py-2 rounded-lg"
              >
                <Link to="/profile">My Profile</Link>
              </Button>

              <Button className="bg-whitebox-500 hover:bg-whitebox-600 text-white px-4 py-2 rounded-lg">
                <LogOutIcon className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
