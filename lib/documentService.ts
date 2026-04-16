import axios from "axios";

const API = "http://127.0.0.1:8000/api/approval";

export const getDocuments = async (email: string) => {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/approval/documents?email=${email}&_t=${Date.now()}`
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
    "http://127.0.0.1:8000/api/approval/upload",
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