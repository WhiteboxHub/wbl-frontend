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

  // Listen for logout events from other tabs/windows and force redirect
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "logout") {
        // another tab has logged out — clear local state and navigate to login
        localStorage.removeItem("access_token");
        sessionStorage.clear();
        setAuthToken(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setSidebarOpen(false);
        try {
          router.push("/login");
        } catch (err) {
          // router might not be ready in some contexts
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  }, [router]);

  const login = async (token) => {
    setAuthToken(token);
    localStorage.setItem("access_token", token);
    setIsAuthenticated(true);

    const role = await fetchUserRole(token);
    setUserRole(role);
    setSidebarOpen(true); 
  };

  const logout = () => {
    // clear local storage + notify other tabs
    localStorage.removeItem("access_token");
    // write a `logout` key so other tabs receive the `storage` event
    try {
      localStorage.setItem("logout", Date.now().toString());
    } catch (e) {
      // ignore quota errors
    }

    sessionStorage.clear();
    setAuthToken(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setSidebarOpen(false);
    clearNextAuthCookies();
    // sign out from next-auth (server) but don't auto-redirect; we'll navigate explicitly
    signOut({ redirect: false });

    // ensure current tab navigates to login
    try {
      router.push("/login");
    } catch (err) {
      // fall back: reload the page
      window.location.href = "/login";
    }
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