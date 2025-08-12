// utils/auth.js

export const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

export const fetchUserRole = async (token) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_role`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch role");
    }

    const data = await response.json();
    return data.role || "candidate";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return "candidate"; // fallback
  }
};

export const getUserTeamRole = (token = null) => {
  const accessToken = token || localStorage.getItem("access_token");
  if (!accessToken) return null;

  const decoded = parseJwt(accessToken);
  if (!decoded) return null;

  const uname = decoded.sub || "";
  if (uname.toLowerCase() === "admin") {
    return "admin";
  }

  return "candidate";
};

export const isAuthenticated = async () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return { valid: false, message: "Please Login!" };
  }

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
    return {
      valid: false,
      message: "An error occurred while validating the token",
    };
  }
};