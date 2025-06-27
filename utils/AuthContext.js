// "use client";

// // frntend/utils/AuthContext.js
// import { useSession } from "next-auth/react";
// import { signOut } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { createContext, useContext, useEffect, useState } from "react";
// import { isTokenExpired } from './auth';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [authToken, setAuthToken] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const { data: session } = useSession();
//   const router = useRouter();

//   // Initial check on component mount
//   useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     if (token) {
//       checkToken(token);
//     } else {
//       setIsAuthenticated(false);
//     }

//     const interval = setInterval(() => {
//       if (authToken) {
//         checkToken(authToken);
//       }
//     }, 1000 * 60); // Check every minute

//     return () => clearInterval(interval); // Clean up the interval on unmount
//   }, [authToken]);

//   // Function to check if the token is expired
//   const checkToken = (token) => {
//     if (isTokenExpired(token)) {
//       handleTokenExpiration();
//     } else {
//       setAuthToken(token);
//       setIsAuthenticated(true);
//     }
//   };

//   // Function to handle token expiration
//   const handleTokenExpiration = () => {
//     logout();
//     const currentPath = router.pathname;
    
//     if (currentPath === "/") {
//       // If on home page, clear session and stay on the home page
//       localStorage.removeItem("access_token");
//       sessionStorage.clear();
//       setAuthToken(null);
//       setIsAuthenticated(false);
//       alert("Session expired. Please login again."); // Optional alert (can be removed)
//     } else {
//       // If on any other page, redirect to login page
//       router.push("/login");
//     }
//   };

//   // Monitor session changes from NextAuth
//   useEffect(() => {
//     if (session?.accessToken) {
//       login(session.accessToken);
//     }
//   }, [session]);

//   const login = (token) => {
//     setAuthToken(token);
//     localStorage.setItem("access_token", token);
//     setIsAuthenticated(true);
//   };

//   const logout = () => {
//     localStorage.removeItem("access_token");
//     sessionStorage.clear();
//     setAuthToken(null);
//     setIsAuthenticated(false);
//     clearNextAuthCookies();
//     signOut({ redirect: false }); // Prevent automatic redirect on sign-out
//   };

//   function clearNextAuthCookies() {
//     if (typeof window !== "undefined") {
//       const cookiesToClear = [
//         'next-auth.session-token',
//         'next-auth.callback-url',
//         'next-auth.csrf-token'
//       ];
//       cookiesToClear.forEach(cookie => {
//         document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
//       });
//     }
//   }

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, authToken, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// // "use client";

// // import { useSession, signOut } from "next-auth/react";
// // import { useRouter } from "next/navigation";
// // import { createContext, useContext, useEffect, useState } from "react";
// // import { isTokenExpired } from "./auth";

// // const AuthContext = createContext();

// // export const AuthProvider = ({ children }) => {
// //   const [authToken, setAuthToken] = useState(null);
// //   const [isAuthenticated, setIsAuthenticated] = useState(false);
// //   const { data: session } = useSession();
// //   const router = useRouter();

// //   // Initial auth check
// //   useEffect(() => {
// //     if (typeof window !== "undefined") {
// //       const token = localStorage.getItem("access_token");
// //       if (token) checkToken(token);
// //     }

// //     // Check token expiration every 60 seconds
// //     const interval = setInterval(() => {
// //       if (typeof window !== "undefined" && authToken) {
// //         checkToken(authToken);
// //       }
// //     }, 60 * 1000);

// //     return () => clearInterval(interval);
// //   }, [authToken]);

// //   // Check token and set state
// //   const checkToken = (token) => {
// //     if (isTokenExpired(token)) {
// //       handleTokenExpiration();
// //     } else {
// //       setAuthToken(token);
// //       setIsAuthenticated(true);
// //     }
// //   };

// //   // Handle expired token
// //   const handleTokenExpiration = () => {
// //     logout();

// //     if (typeof window !== "undefined") {
// //       const currentPath = window.location.pathname;
// //       if (currentPath === "/") {
// //         localStorage.removeItem("access_token");
// //         sessionStorage.clear();
// //         setAuthToken(null);
// //         setIsAuthenticated(false);
// //         alert("Session expired. Please login again.");
// //       } else {
// //         router.push("/login");
// //       }
// //     }
// //   };

// //   // Automatically login if NextAuth session token is present
// //   useEffect(() => {
// //     if (session?.accessToken) {
// //       login(session.accessToken);
// //     }
// //   }, [session]);

// //   // Login method
// //   const login = (token) => {
// //     if (typeof window !== "undefined") {
// //       localStorage.setItem("access_token", token);
// //     }
// //     setAuthToken(token);
// //     setIsAuthenticated(true);
// //   };

// //   // Logout method
// //   const logout = () => {
// //     if (typeof window !== "undefined") {
// //       localStorage.removeItem("access_token");
// //       sessionStorage.clear();
// //     }

// //     setAuthToken(null);
// //     setIsAuthenticated(false);
// //     clearNextAuthCookies();
// //     signOut({ redirect: false }); // Prevents redirect on sign out
// //   };

// //   // Clear cookies created by next-auth
// //   const clearNextAuthCookies = () => {
// //     if (typeof window !== "undefined") {
// //       const cookies = [
// //         "next-auth.session-token",
// //         "next-auth.callback-url",
// //         "next-auth.csrf-token",
// //       ];
// //       cookies.forEach((cookie) => {
// //         document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
// //       });
// //     }
// //   };

// //   return (
// //     <AuthContext.Provider value={{ isAuthenticated, authToken, login, logout }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };

// // Hook to use authentication context
// // export const useAuth = () => useContext(AuthContext);




"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { isTokenExpired, getUserTeamRole } from './auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // Track role (admin or candidate)

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
    }, 1000 * 60); // Check every minute

    return () => clearInterval(interval);
  }, [authToken]);

  const checkToken = (token) => {
    if (isTokenExpired(token)) {
      handleTokenExpiration();
    } else {
      setAuthToken(token);
      setIsAuthenticated(true);
      const role = getUserTeamRole(token); // ✅ Pass token explicitly
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

  const login = (token) => {
    setAuthToken(token);
    localStorage.setItem("access_token", token);
    setIsAuthenticated(true);
    const role = getUserTeamRole(token); 
    setUserRole(role);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.clear();
    setAuthToken(null);
    setIsAuthenticated(false);
    setUserRole(null);
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
      userRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
