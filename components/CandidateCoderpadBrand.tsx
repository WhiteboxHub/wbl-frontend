"use client";

/** Official wireframe cube mark (user-provided asset). */
export const WHITEBOX_CUBE_LOGO_SRC = "/images/logos/whitebox-learning-logo.png";

export type CandidateCoderpadBrandVariant = "topbar" | "welcome";

export interface CandidateCoderpadBrandProps {
  variant?: CandidateCoderpadBrandVariant;
  className?: string;
}

/**
 * CoderPad chrome: cube logo before the snippet title; welcome modal shows logo + "coderpad".
 */
export function CandidateCoderpadBrand({
  variant = "topbar",
  className = "",
}: CandidateCoderpadBrandProps) {
  const isWelcome = variant === "welcome";

  if (!isWelcome) {
    return (
      <img
        src={WHITEBOX_CUBE_LOGO_SRC}
        alt=""
        className={`topbar-brand-logo ${className}`.trim()}
        aria-hidden
      />
    );
  }

  const row =
    `inline-flex items-center gap-2.5 font-sans text-lg font-semibold tracking-tight text-white ${className}`.trim();
  const nameClass =
    "font-sans text-lg font-semibold tracking-tight text-white lowercase";

  return (
    <div className={row} aria-label="CoderPad">
      <img
        src={WHITEBOX_CUBE_LOGO_SRC}
        alt=""
        className="h-6 w-6 shrink-0 object-contain opacity-95"
        aria-hidden
      />
      <span className={nameClass}>coderpad</span>
    </div>
  );
}
