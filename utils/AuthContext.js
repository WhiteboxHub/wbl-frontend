// frontend/utils/AuthContext.js
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isTokenExpired, fetchUserRole, getUserTeamRole } from "./auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // admin | employee | candidate | null
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

  // Ref to always hold the latest logout function — avoids stale closures
  // in long-lived interval/event callbacks that capture the initial render.
  const logoutRef = useRef(null);

  // Helper: check if the SSO cookie still exists
  const _isSsoCookiePresent = () => {
    return document.cookie.split(";").some((c) => c.trim().startsWith("wbl_access_token="));
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      const isProd = typeof window !== "undefined" && window.location.hostname.endsWith("whitebox-learning.com");
      if (isProd && !_isSsoCookiePresent()) {
        if (typeof logoutRef.current === "function") logoutRef.current();
        return;
      }
      _checkToken(token);
    } else {
      setIsAuthenticated(false);
      setAuthToken(null);
      setUserRole(null);
    }

    // periodic check — also detects if SSO cookie was cleared by another service
    const interval = setInterval(() => {
      const t = localStorage.getItem("access_token");
      if (t) {
        // If the shared SSO cookie was cleared (e.g. by AI Prep Tool sign-out),
        // force a full logout so both services stay in sync.
        const isProd = typeof window !== "undefined" && window.location.hostname.endsWith("whitebox-learning.com");
        if (isProd && !_isSsoCookiePresent()) {
          if (typeof logoutRef.current === "function") logoutRef.current();
          return;
        }
        _checkToken(t);
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Instant SSO sync: when user switches back to this tab, check the cookie immediately
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const t = localStorage.getItem("access_token");
      if (!t) return; // already logged out
      const isProd = typeof window !== "undefined" && window.location.hostname.endsWith("whitebox-learning.com");
      if (isProd && !_isSsoCookiePresent()) {
        if (typeof logoutRef.current === "function") logoutRef.current();
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // NextAuth session login (if you use next-auth google)
    if (session?.accessToken) {
      login(session.accessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const _checkToken = async (token) => {
    if (isTokenExpired(token)) {
      handleTokenExpiration();
      return;
    }

    const { role, status } = await fetchUserRole(token);

    // Block inactive accounts at UI
    if (!status || status.toString().toLowerCase() !== "active") {
      // clear local data & sign out
      logout(false);
      return;
    }

    const teamRole = getUserTeamRole(token);
    setAuthToken(token);
    setIsAuthenticated(true);
    setUserRole(teamRole || role || "candidate");
    // optionally open sidebar if logged in
    setSidebarOpen(true);
  };

  const handleTokenExpiration = () => {
    logout();
    // redirect to login page
    try {
      router.push("/login");
    } catch (e) {
      console.warn("Router push failed:", e);
    }
  };

  const login = async (token) => {
    // Don't store or proceed if token expired
    if (!token || isTokenExpired(token)) {
      return { success: false, message: "Invalid or expired token" };
    }

    try {
      // Check backend status
      const { role, status } = await fetchUserRole(token);

      if (!status || status.toString().toLowerCase() !== "active") {
        return { success: false, message: "Account is inactive. Please contact admin." };
      }

      const teamRole = getUserTeamRole(token);

      // Store token and update auth state
      localStorage.setItem("access_token", token);
      
      // Set domain-wide cookie for SSO with ai-prep
      const isProd = window.location.hostname.endsWith('whitebox-learning.com');
      const domain = isProd ? '.whitebox-learning.com' : '';
      const domainAttr = domain ? `; domain=${domain}` : '';
      const secureAttr = window.location.protocol === 'https:' ? '; secure' : '';
      document.cookie = `wbl_access_token=${token}${domainAttr}; path=/${secureAttr}; samesite=lax`;

      setAuthToken(token);
      setIsAuthenticated(true);
      setUserRole(teamRole || role || "candidate");
      setSidebarOpen(true);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Login failed" };
    }
  };

  const logout = () => {
    // clear local storage + notify other tabs
    localStorage.removeItem("access_token");
    localStorage.removeItem("prep_token");
    
    // Clear the domain-wide SSO cookie
    const isProd = window.location.hostname.endsWith('whitebox-learning.com');
    const domain = isProd ? '.whitebox-learning.com' : '';
    const domainAttr = domain ? `; domain=${domain}` : '';
    const secureAttr = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `wbl_access_token=; path=/${secureAttr}; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 UTC${domainAttr};`;

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

  // Keep the ref in sync with the latest logout function on every render
  logoutRef.current = logout;

  function clearNextAuthCookies() {
    if (typeof window !== "undefined") {
      const cookiesToClear = [
        "next-auth.session-token",
        "next-auth.callback-url",
        "next-auth.csrf-token",
      ];
      cookiesToClear.forEach((cookie) => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authToken,
        login,
        logout,
        userRole,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);