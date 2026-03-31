"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CoderpadEditor from "@/components/CoderpadEditor";

export default function CoderpadPage() {
  const router = useRouter();

  // Auth guard — redirect to login if no token
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "fixed", inset: 0 }}>
      <CoderpadEditor />
    </div>
  );
}
