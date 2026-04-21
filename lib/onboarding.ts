export type OnboardingStep = "basic_info" | "id_upload" | "agreements" | "complete";

export interface OnboardingStatus {
  basic_info_validated: boolean;
  id_uploaded: boolean;
  id_verification_status: "pending" | "verified" | "rejected";
  id_cancel_count: number;
  id_cancel_limit: number;
  id_cancel_blocked: boolean;
  enrollment_signed: boolean;
  placement_signed: boolean;
  enrollment_verified: boolean;
  placement_verified: boolean;
  onboarding_complete: boolean;
  next_step: OnboardingStep;
  access_restricted: boolean;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function persistOnboardingState(onboarding: OnboardingStatus | null | undefined) {
  if (typeof window === "undefined" || !onboarding) return;
  localStorage.setItem("onboarding_status", JSON.stringify(onboarding));
}

export function readOnboardingState(): OnboardingStatus | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("onboarding_status");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingStatus;
  } catch {
    return null;
  }
}

export async function getOnboardingStatus(email: string): Promise<OnboardingStatus> {
  const response = await fetch(
    `${API_BASE}/approval/onboarding/status?email=${encodeURIComponent(email)}`,
    { method: "GET", headers: authHeaders() }
  );
  if (!response.ok) throw new Error("Failed to load onboarding status");
  const data = await response.json();
  persistOnboardingState(data);
  return data;
}

export async function submitBasicInfo(payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/approval/onboarding/basic-info`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || "Failed to submit basic information");
  persistOnboardingState(data?.onboarding);
  return data;
}

export async function markIdUploaded(email: string) {
  const response = await fetch(`${API_BASE}/approval/onboarding/id/uploaded`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || "Failed to update ID upload status");
  persistOnboardingState(data?.onboarding);
  return data;
}

export async function recordIdCancel(email: string) {
  const response = await fetch(`${API_BASE}/approval/onboarding/id/cancel`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || "Failed to record ID cancel");
  persistOnboardingState(data?.onboarding);
  return data;
}

export async function signAgreement(email: string, agreementType: "enrollment" | "placement") {
  const response = await fetch(`${API_BASE}/approval/onboarding/agreements/sign`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      agreement_type: agreementType,
      agreed: true,
      signed: true,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || "Failed to mark agreement signed");
  persistOnboardingState(data?.onboarding);
  return data;
}

export async function adoptSignature(email: string) {
  const response = await fetch(`${API_BASE}/approval/onboarding/signature/adopt`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || "Failed to generate signature");
  return data;
}
