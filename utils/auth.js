// frntend/utils/auth.js

export const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true; // Token is expired if there's no exp field
  return decoded.exp * 1000 < Date.now(); // Convert exp to milliseconds and check if expired
};

export const isAuthenticated = async () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return { valid: false, message: "Please Login!" };
  }

  // Check if the token is expired
  if (isTokenExpired(token)) {
    return { valid: false, message: "Session expired, please login again." };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/verify_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: token, token_type: "Bearer" }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        valid: false,
        message: errorData.detail || "Token validation failed",
      };
    }

    return { valid: true, message: "" };
  } catch (error) {
    // console.error("Error validating token:", error);
    return {
      valid: false,
      message: "An error occurred while validating the token",
    };
  }
};

// frontend/utils/auth.js

// Helper function to decode base64url (JWT-safe) format
// const base64UrlDecode = (str) => {
  // try {
//     return decodeURIComponent(
//       atob(str.replace(/-/g, '+').replace(/_/g, '/'))
//         .split('')
//         .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
//         .join('')
//     );
//   } catch (e) {
//     return null;
//   }
// };

// // Parse JWT payload safely
// export const parseJwt = (token) => {
//   try {
//     const payload = token.split('.')[1];
//     return JSON.parse(base64UrlDecode(payload));
//   } catch (e) {
//     return null;
//   }
// };

// // Check if JWT is expired
// export const isTokenExpired = (token) => {
//   const decoded = parseJwt(token);
//   if (!decoded || !decoded.exp) return true;
//   return decoded.exp * 1000 < Date.now(); // exp is in seconds, Date.now() is in ms
// };

// // Validate the token using API and check expiry
// export const isAuthenticated = async () => {
//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

//   if (!token) {
//     return { valid: false, message: "Please Login!" };
//   }

//   if (isTokenExpired(token)) {
//     return { valid: false, message: "Session expired, please login again." };
//   }

//   if (!process.env.NEXT_PUBLIC_API_URL) {
//     console.warn("Missing NEXT_PUBLIC_API_URL in environment.");
//     return {
//       valid: false,
//       message: "Configuration error: API URL not defined.",
//     };
//   }

//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/verify_token`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ access_token: token, token_type: "Bearer" }),
//       }
//     );

//     if (!response.ok) {
//       const errorData = await response.json();
//       return {
//         valid: false,
//         message: errorData?.detail || "Token validation failed",
//       };
//     }

//     return { valid: true, message: "" };
//   } catch (error) {
//     console.error("Error validating token:", error);
//     return {
//       valid: false,
//       message: "An error occurred while validating the token.",
//     };
//   }
// };

