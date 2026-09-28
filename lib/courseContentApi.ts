import { apiFetch } from "@/lib/api";

export const getCourseContentData = async () => {
  const endpointsToTry = ["/course-content", "/course-content?limit=100"];

  const normalize = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    for (const k of Object.keys(data || {})) if (Array.isArray(data[k])) return data[k];
    if (typeof data === "object") return [data];
    return [];
  };

  for (const ep of endpointsToTry) {
    try {
      const data = await apiFetch(ep, { credentials: 'include' });
      
      const normalizedData = normalize(data);
      if (normalizedData.length > 0) {
        return normalizedData;
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        throw new Error("unauthorized");
      }
      console.warn(`Failed for endpoint ${ep}:`, err);
    }
  }
  
  return [];
};
