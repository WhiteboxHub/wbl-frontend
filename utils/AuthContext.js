// // // frntend/utils/AuthContext.js
// // import { useSession } from "next-auth/react";
// // import { signOut } from "next-auth/react";
// // import { useRouter } from "next/navigation";
// // import { createContext, useContext, useEffect, useState } from "react";
// // import { isTokenExpired } from './auth';

// // const AuthContext = createContext();

// // export const AuthProvider = ({ children }) => {
// //   const [authToken, setAuthToken] = useState(null);
// //   const [isAuthenticated, setIsAuthenticated] = useState(false);
// //   const { data: session } = useSession();
// //   const router = useRouter();

// //   // Initial check on component mount
// //   useEffect(() => {
// //     const token = localStorage.getItem("access_token");
// //     if (token) {
// //       checkToken(token);
// //     } else {
// //       setIsAuthenticated(false);
// //     }

// //     const interval = setInterval(() => {
// //       if (authToken) {
// //         checkToken(authToken);
// //       }
// //     }, 1000 * 60); // Check every minute

// //     return () => clearInterval(interval); // Clean up the interval on unmount
// //   }, [authToken]);

// //   // Function to check if the token is expired
// //   const checkToken = (token) => {
// //     if (isTokenExpired(token)) {
// //       handleTokenExpiration();
// //     } else {
// //       setAuthToken(token);
// //       setIsAuthenticated(true);
// //     }
// //   };

// //   // Function to handle token expiration
// //   const handleTokenExpiration = () => {
// //     logout();
// //     const currentPath = router.pathname;
    
// //     if (currentPath === "/") {
// //       // If on home page, clear session and stay on the home page
// //       localStorage.removeItem("access_token");
// //       sessionStorage.clear();
// //       setAuthToken(null);
// //       setIsAuthenticated(false);
// //       alert("Session expired. Please login again."); // Optional alert (can be removed)
// //     } else {
// //       // If on any other page, redirect to login page
// //       router.push("/login");
// //     }
// //   };

// //   // Monitor session changes from NextAuth
// //   useEffect(() => {
// //     if (session?.accessToken) {
// //       login(session.accessToken);
// //     }
// //   }, [session]);

// //   const login = (token) => {
// //     setAuthToken(token);
// //     localStorage.setItem("access_token", token);
// //     setIsAuthenticated(true);
// //   };

// //   const logout = () => {
// //     localStorage.removeItem("access_token");
// //     sessionStorage.clear();
// //     setAuthToken(null);
// //     setIsAuthenticated(false);
// //     clearNextAuthCookies();
// //     signOut({ redirect: false }); // Prevent automatic redirect on sign-out
// //   };

// //   function clearNextAuthCookies() {
// //     if (typeof window !== "undefined") {
// //       const cookiesToClear = [
// //         'next-auth.session-token',
// //         'next-auth.callback-url',
// //         'next-auth.csrf-token'
// //       ];
// //       cookiesToClear.forEach(cookie => {
// //         document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
// //       });
// //     }
// //   }

// //   return (
// //     <AuthContext.Provider value={{ isAuthenticated, authToken, login, logout }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };

// // export const useAuth = () => useContext(AuthContext);


// import { useSession } from "next-auth/react";
// import { signOut } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { createContext, useContext, useEffect, useState } from "react";
// import { isTokenExpired } from './auth';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [authToken, setAuthToken] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const { data: session, status } = useSession();
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
    
//   // Monitor session changes and handle errors from NextAuth
//   useEffect(() => {
//     if (session?.error === "TokenExpiredError"|| !session) {
//       handleTokenExpiration();
//     } else if (session?.accessToken) {
//       login(session.accessToken);
//     }
//   }, [session]);


//   // Function to handle token expiration
//   const handleTokenExpiration = () => {
    
//     const currentPath = router.pathname;
//     logout()
//     console.log(currentPath);
    
//     if (currentPath === "/") {
//       // If on home page, clear session and stay on the home page
//       localStorage.removeItem("access_token");
//       sessionStorage.clear();
//       setAuthToken(null);
//       setIsAuthenticated(false);
//       alert("Session expired. Please login again.");
//       // Optional alert (can be removed)
//       // router.push("/");
//     } else {
//       // If on any other page, redirect to login page
//       router.push("/login");
//     }
//   };

//   // const handleTokenExpiration = () => {
//   //   const currentPath = router.pathname;
  
//   //   console.log("Session expired. Current path:", currentPath);
  
//   //   if (currentPath === "/") {
//   //     // For home page, clear session data and update state
//   //     localStorage.removeItem("access_token");
//   //     sessionStorage.clear();
//   //     setAuthToken(null);
//   //     setIsAuthenticated(false);
  
//   //     console.log("Cleared session data on home page.");
//   //   } else {
//   //     // For other routes, log out and redirect to login page
//   //     logout();
//   //     router.push("/login");
//   //     console.log("Redirected to login page.");
//   //   }
//   // };

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


// import { useSession } from "next-auth/react";
// import { signOut } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { createContext, useContext, useEffect, useState } from "react";
// import { isTokenExpired } from './auth';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [authToken, setAuthToken] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const { data: session, status } = useSession();
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

//   // Monitor session changes and handle errors from NextAuth
//   useEffect(() => {
//     if (session?.error === "TokenExpiredError") {
//       handleTokenExpiration();
//     } else if (session?.accessToken) {
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




// frntend/utils/AuthContext.js
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { isTokenExpired } from './auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Initial check on component mount
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

    return () => clearInterval(interval); // Clean up the interval on unmount
  }, [authToken]);

  // Function to check if the token is expired
  const checkToken = (token) => {
    if (isTokenExpired(token)) {
      handleTokenExpiration();
    } else {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  };

  // Function to handle token expiration
  const handleTokenExpiration = () => {
    logout();
    const currentPath = router.pathname;
    
    if (currentPath === "/") {
      // If on home page, clear session and stay on the home page
      localStorage.removeItem("access_token");
      sessionStorage.clear();
      setAuthToken(null);
      setIsAuthenticated(false);
      alert("Session expired. Please login again."); // Optional alert (can be removed)
    } else {
      // If on any other page, redirect to login page
      router.push("/login");
    }
  };

  // Monitor session changes from NextAuth
  useEffect(() => {
    if (session?.accessToken) {
      login(session.accessToken);
    }
  }, [session]);

  const login = (token) => {
    setAuthToken(token);
    localStorage.setItem("access_token", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.clear();
    setAuthToken(null);
    setIsAuthenticated(false);
    clearNextAuthCookies();
    signOut({ redirect: false }); // Prevent automatic redirect on sign-out
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
    <AuthContext.Provider value={{ isAuthenticated, authToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);