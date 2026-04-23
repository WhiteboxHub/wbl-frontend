import axios from "axios";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
const API = `${API_BASE}/approval`;

export const getDocuments = async (email: string) => {
  try {
    const res = await fetch(
      `${API}/documents?email=${email}&_t=${Date.now()}`
    );

    // ✅ check if response is OK
    if (!res.ok) {
      console.error("API ERROR:", res.status);
      return null;
    }

    // ✅ check if response is JSON
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON response:", text);
      return null;
    }

  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};

export const uploadDocument = async (formData: FormData) => {
  const res = await axios.post(
    `${API}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};
export const deleteDocument = async (uid: string) => {
  const res = await axios.delete(`${API}/documents/${uid}`);
  return res.data;
};