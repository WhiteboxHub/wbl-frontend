import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";


type ComponentType =
  | "Presentations"
  | "Must Watch"
  | "Cheatsheets"
  | "Study Guides"
  | "Interactive Visual Explainers"
  | "Newsletters"
  | "Books"
  | "Questions"
  | "Git Repo's";

// ---------------------------------------------------------------------------
// Data fetching
// The Bearer token is forwarded when the caller is authenticated so that the
// backend returns material links.  When no token is provided the backend
// strips the `link` field, which is consistent with the existing 401-handling
// already present in this function (see the res.status === 401 block).
// ---------------------------------------------------------------------------
const fetchPresentationData = async (
  course: string,
  type: ComponentType,
  authToken: string | null
) => {
  const base = (process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || "").replace(
    /\/$/,
    ""
  );
  let endpointsToTry = [`/materials?course=${course}&search=${type}`];

  if (type === "Git Repo's") {
    endpointsToTry = [`/github-classroom-repos?course=${course}`];
  }

  const normalize = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    for (const k of Object.keys(data || {})) if (Array.isArray(data[k])) return data[k];
    if (typeof data === "object") return [data];
    return [];
  };

  try {
    const isClient = typeof window !== "undefined";
    // Prefer the token passed via prop (comes from AuthContext); fall back to
    // the values the existing code already reads from localStorage so that any
    // other callers that don't pass the prop continue to work unchanged.
    const token =
      authToken ||
      (isClient
        ? localStorage.getItem("access_token") ||
          localStorage.getItem("token") ||
          localStorage.getItem("auth_token")
        : null);

    for (const ep of endpointsToTry) {
      const fullUrl = `${base}/${ep.replace(/^\/+/, "")}`;
      console.log("[fetchPresentationData] Trying:", fullUrl);

      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
        };

        // Only attach the Authorization header when a token is present.
        // Without it the backend will return the catalogue with link=null.
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(fullUrl, {
          method: "GET",
          headers,
          credentials: "include", // sends cookies if needed
        });

        if (res.status === 401) {
          console.warn("401 Unauthorized — token might be expired");
          if (isClient) {
            localStorage.removeItem("access_token");
            toast.error("Session expired. Please log in again.");
            window.location.href = "/login";
          }
          return null;
        }

        if (res.status === 403) {
          toast.error("Access forbidden – insufficient permissions");
          continue;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        return normalize(json);
      } catch (err) {
        console.warn(`[fetchPresentationData] failed for ${ep}:`, err);
      }
    }

    toast.error("Unable to load materials. Please check your login or permissions.");
    return null;
  } catch (err: any) {
    console.error("[fetchPresentationData] unexpected error:", err);
    toast.error(err?.message || "Failed to fetch data");
    return null;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ResourcesTable = ({
  course,
  type,
  authToken = null,
  isAuthenticated = false,
}: {
  course: string;
  type: ComponentType;
  /** JWT from AuthContext — forwarded to the API so authenticated users get
   *  material links.  Defaults to null for backward-compatibility when the
   *  prop is not supplied by a caller. */
  authToken?: string | null;
  /** Whether the current user is logged in — used to gate the click handler. */
  isAuthenticated?: boolean;
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clickError, setClickError] = useState<string | null>(null);

  const getData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Cache key includes a suffix to differentiate authenticated vs
    // unauthenticated responses (different backends return different payloads).
    const authSuffix = authToken ? "_auth" : "_guest";
    const sessionKey = `data_${course}_${type}${authSuffix}`;
    const tsKey = `${sessionKey}_timestamp`;
    const sessionData = sessionStorage.getItem(sessionKey);
    const sessionTs = sessionStorage.getItem(tsKey);
    const dataAge = Date.now() - (sessionTs ? parseInt(sessionTs, 10) : 0);

    if (sessionData && dataAge < 86400000) {
      // < 24h cache valid
      setData(JSON.parse(sessionData));
      setLoading(false);
      return;
    }

    const fetchedData = await fetchPresentationData(course, type, authToken);
    if (fetchedData) {
      setData(fetchedData);
      sessionStorage.setItem(sessionKey, JSON.stringify(fetchedData));
      sessionStorage.setItem(tsKey, Date.now().toString());
    } else {
      setError("No data found.");
    }

    setLoading(false);
  }, [course, type, authToken]);

  useEffect(() => {
    getData();
  }, [getData]);

  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Click handler — gated by authentication
  // ---------------------------------------------------------------------------
  const handleSubjectClick = (link: string | null) => {
    // Helper: check if a raw JWT is still valid (not expired).
    // Mirrors isTokenExpired() in utils/auth.js without needing to import it.
    const isTokenValid = (t: string) => {
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        return !!payload?.exp && payload.exp * 1000 > Date.now();
      } catch {
        return false;
      }
    };

    // Primary: use the isAuthenticated boolean from AuthContext (most reliable
    // once the context has hydrated). Secondary: check localStorage directly
    // with expiry validation so a logged-in user who clicks before AuthContext
    // finishes its async fetch is never incorrectly redirected.
    const rawToken =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token") ||
          localStorage.getItem("token") ||
          localStorage.getItem("auth_token")
        : null;

    const userIsLoggedIn = isAuthenticated || (!!rawToken && isTokenValid(rawToken));

    if (!userIsLoggedIn) {
      // Not logged in (or token expired) — go to the Login page.
      // router.push uses Next.js client-side navigation with no hard-coded host.
      router.push("/login");
      return;
    }

    // Authenticated — open the material.
    if (!link) {
      setClickError("Oops !! No data found");
      setTimeout(() => setClickError(null), 3000);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.open(link, "_blank");
  };



  if (loading) {
    return (
      <div className="text-md mb-4 text-center font-medium text-black dark:text-white sm:text-2xl">
        Loading&nbsp;
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
        >
          <circle cx="4" cy="12" r="3" fill="currentColor">
            <animate attributeName="r" begin="0;svgSpinners3DotsScale1.end-0.2s" dur="0.6s" values="3;.2;3" />
          </circle>
          <circle cx="12" cy="12" r="3" fill="currentColor">
            <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.48s" dur="0.6s" values="3;.2;3" />
          </circle>
          <circle cx="20" cy="12" r="3" fill="currentColor">
            <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.36s" dur="0.6s" values="3;.2;3" />
          </circle>
        </svg>
      </div>
    );
  }

  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!data || data.length === 0) return <p className="text-center">No data available.</p>;

  return (
    <div className="overflow-x-auto sm:w-4/5">
      {clickError && <p className="mb-4 text-center text-red-600">{clickError}</p>}

      <table className="w-full table-auto border-collapse border border-gray-500 shadow-2xl shadow-gray-800">
        <thead>
          <tr>
            <th className="border border-gray-500 bg-primary px-4 py-2 text-xl text-blue-300 w-1/4 sm:w-1/6 md:w-1/6 lg:w-1/4">
              Serial No.
            </th>
            <th className="border border-gray-500 bg-primary px-4 py-2 text-xl text-blue-300 w-3/4 sm:w-5/6 md:w-5/6 lg:w-3/4">
              Subject Name
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((subject: any, index: number) => (
            <tr
              key={subject.id || index}
              className={`hover:bg-gray-200 dark:hover:bg-blue-500 ${
                index % 2 === 0
                  ? "bg-gray-100 dark:bg-transparent"
                  : "bg-gray-200 dark:bg-transparent"
              }`}
            >
              <td className="border border-primary px-4 py-2 text-center text-black dark:border-blue-900 dark:text-white">
                {index + 1}
              </td>
              <td className="border border-primary px-4 py-2 text-center text-blue-600 dark:border-blue-900 dark:text-white">
                <button
                  onClick={() => handleSubjectClick(subject.link)}
                  className="text-blue-600 dark:text-white"
                >
                  {type === "Newsletters" ? (
                    <span dangerouslySetInnerHTML={{ __html: subject.name }} />
                  ) : (
                    subject.name
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResourcesTable;
