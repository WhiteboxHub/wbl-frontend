
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface SessionType {
  type: string;
}

interface Video {
  link: string;
  videoid: string;
  description: string;
}

interface Session {
  sessionid: number;
  title: string;
  status: string;
  sessiondate: string;
  type: string;
  link: string;
  videoid: string;
  description: string;
}

// Helper function to format the title
const formatVideoTitle = (filename: string) => {
  filename = filename.replace(/session_/gi, "");
  filename = filename.replace(/_\d+_/g, "_");
  filename = filename.replace(/_/g, " ");
  filename = filename.replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "");
  filename = filename.trim();

  const dateRegex = /\d{4}-\d{2}-\d{2}/;
  const dateMatch = filename.match(dateRegex);

  if (dateMatch) {
    const date = dateMatch[0];
    const restOfTitle = filename.replace(dateRegex, "").trim();
    return `${date} ${restOfTitle}`;
  }

  return filename;
};

// Desired order of session types
const desiredOrder = [
  "Group Mock",
  "Individual Mock",
  "Resume Session",
  "Interview Prep",
  "Job Help",
  "Misc",
  "Internal Sessions",
];

// Normalize helper: unify singular/plural for UI
const normalizeType = (type: string) => {
  if (!type) return "";
  if (type.toLowerCase().startsWith("internal session")) {
    return "Internal Sessions"; // always plural in UI
  }
  return type;
};

const sortSessionTypes = (types: SessionType[]) => {
  return types
    .map((t) => ({ ...t, type: normalizeType(t.type) }))
    .sort((a, b) => {
      const indexA = desiredOrder.indexOf(a.type);
      const indexB = desiredOrder.indexOf(b.type);
      if (indexA === -1 && indexB === -1) return a.type.localeCompare(b.type); // both unknown
      if (indexA === -1) return 1; // put unknowns at the end
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
};

const SessionComp = () => {
  const searchParams = useSearchParams();
  const course = searchParams.get("course") || "ML";

  const [isLoadingSessionTypes, setIsLoadingSessionTypes] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedType, setSelectedType] = useState<string>("Group Mock");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch session types
  useEffect(() => {
    setIsLoadingSessionTypes(true);
    const token = localStorage.getItem("access_token");

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/session-types`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("API raw session types:", data);

        let typesArray: SessionType[] = [];

        if (Array.isArray(data)) {
          typesArray = data.map((t) => ({ type: t }));
        } else if (Array.isArray(data.types)) {
          typesArray =
            typeof data.types[0] === "string"
              ? data.types.map((t) => ({ type: t }))
              : data.types;
        }

        console.log("Before sort (normalized):", typesArray);

        const sortedTypes = sortSessionTypes(typesArray);
        console.log("After sort:", sortedTypes);

        setSessionTypes(sortedTypes);

        if (sortedTypes.length > 0) {
          setSelectedType(sortedTypes[0].type);
        }

        setIsLoadingSessionTypes(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error fetching session types.");
        setIsLoadingSessionTypes(false);
      });
  }, []);

  // Fetch sessions
  const fetchSessions = () => {
    setIsLoadingSessions(true);
    const token = localStorage.getItem("access_token");

    // Convert UI value back if API expects singular
    let apiType = selectedType;
    if (selectedType === "Internal Sessions") {
      apiType = "Internal Session";
    }

    console.log("Fetching sessions for type:", apiType);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sessions?course_name=${course}&session_type=${apiType}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched sessions:", data);
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
        setIsLoadingSessions(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error fetching sessions.");
        setIsLoadingSessions(false);
      });
  };

  useEffect(() => {
    setSessions([]);
    setSelectedSession(null);
    setError(null);
    if (selectedType) {
      fetchSessions();
    }
  }, [course, selectedType]);

  // Handle session selection
  const handleSessionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = sessions.find((session) => session.sessionid === selectedId);
    if (selected) {
      setSelectedSession(selected);
      setError(null);
    } else {
      setSelectedSession(null);
      setError("Selected session not found.");
    }
  };

  // Render video
  const renderVideoPlayer = (video: Video) => {
    if (
      video.link &&
      (video.link.includes("youtu.be") || video.link.includes("youtube.com"))
    ) {
      const youtubeId = video.videoid || video.link.split("v=")[1]?.split("&")[0];
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;
      return (
        <iframe
          width="100%"
          height="350"
          src={youtubeEmbedUrl}
          title={video.description}
          frameBorder="0"
          allowFullScreen
          className="h-[350px] rounded-xl border-2 border-gray-500"
        ></iframe>
      );
    } else if (video.link) {
      return <video src={video.link} controls className="mb-2 w-full" />;
    }
    return <p className="text-red-500">No video available for this session.</p>;
  };

  return (
    <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:mt-0 sm:max-w-3xl">
      {/* Session Type Dropdown */}
      <div className="flex flex-grow flex-col">
        <label htmlFor="session-type">Select Session Type:</label>
        <select
          id="session-type"
          className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          disabled={isLoadingSessionTypes}
        >
          {isLoadingSessionTypes ? (
            <option disabled>Loading session types...</option>
          ) : (
            sessionTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {type.type || "No Type"}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Session Dropdown */}
      <div className="flex flex-grow flex-col">
        <label htmlFor="session-dropdown">Sessions:</label>
        <select
          id="session-dropdown"
          className="mb-5 rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          onChange={handleSessionSelect}
          disabled={isLoadingSessions}
        >
          {isLoadingSessions ? (
            <option disabled>Loading session videos...</option>
          ) : sessions.length > 0 ? (
            <>
              <option value="">Please select a session...</option>
              {sessions.map((session) => (
                <option key={session.sessionid} value={String(session.sessionid)}>
                  {formatVideoTitle(session.title)}
                </option>
              ))}
            </>
          ) : (
            <option disabled>No sessions found for this type.</option>
          )}
        </select>
      </div>

      {/* Video Player */}
      {selectedSession && (
        <div className="mt-4">{renderVideoPlayer(selectedSession)}</div>
      )}
    </div>
  );
};

export default SessionComp;





