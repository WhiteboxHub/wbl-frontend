// frontend/utils/AuthContext.js

"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { isTokenExpired, fetchUserRole } from './auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  const [sidebarOpen, setSidebarOpen] = useState(false); 

  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      checkToken(token);
    } else {
      setIsAuthenticated(false);
    }

    const interval = setInterval(() => {
      if (authToken) {
        checkToken(authToken);
      }
    }, 1000 * 60); // check every 60 seconds

    return () => clearInterval(interval);
  }, [authToken]);

  const checkToken = async (token) => {
    if (isTokenExpired(token)) {
      handleTokenExpiration();
    } else {
      setAuthToken(token);
      setIsAuthenticated(true);

      const role = await fetchUserRole(token);
      setUserRole(role);
    }
  };

  const handleTokenExpiration = () => {
    logout();
    const currentPath = router.pathname;

    if (currentPath === "/") {
      localStorage.removeItem("access_token");
      sessionStorage.clear();
      setAuthToken(null);
      setIsAuthenticated(false);
      setUserRole(null);
      setSidebarOpen(false); 
      alert("Session expired. Please login again.");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      login(session.accessToken);
    }
  }, [session]);

  const login = async (token) => {
    setAuthToken(token);
    localStorage.setItem("access_token", token);
    setIsAuthenticated(true);

    const role = await fetchUserRole(token);
    setUserRole(role);
    setSidebarOpen(true); 
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.clear();
    setAuthToken(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setSidebarOpen(false); 
    clearNextAuthCookies();
    signOut({ redirect: false });
  };

  function clearNextAuthCookies() {
    if (typeof window !== "undefined") {
      const cookiesToClear = [
        'next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token'
      ];
      cookiesToClear.forEach(cookie => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
    }
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      authToken,
      login,
      logout,
      userRole,
      sidebarOpen,       
      setSidebarOpen     
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
