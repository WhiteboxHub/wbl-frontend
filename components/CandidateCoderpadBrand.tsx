"use client";

/** Mark + name (avoid JSX parsing issues with `</>` in markup). */
const CODERPAD_ANGLE_MARK = "</>";

export type CandidateCoderpadBrandVariant = "topbar" | "welcome";

export interface CandidateCoderpadBrandProps {
  variant?: CandidateCoderpadBrandVariant;
  className?: string;
}

/**
 * CoderPad chrome: top bar shows only `</>` before the snippet title; welcome
 * modal still shows `</> coderpad`. Mark uses sans (same as dashboard body).
 */
export function CandidateCoderpadBrand({
  variant = "topbar",
  className = "",
}: CandidateCoderpadBrandProps) {
  const isWelcome = variant === "welcome";
  const gap = isWelcome ? "gap-2.5" : "gap-2";

  const markClass =
    "shrink-0 font-sans text-lg font-semibold leading-none tracking-tight text-[#58a6ff]";

  if (!isWelcome) {
    return (
      <div
        className={`inline-flex items-center font-sans ${className}`.trim()}
        aria-label="CoderPad"
      >
        <span className={markClass} aria-hidden>
          {CODERPAD_ANGLE_MARK}
        </span>
      </div>
    );
  }

  const row = `inline-flex items-center ${gap} font-sans text-lg font-semibold tracking-tight text-white ${className}`.trim();
  const nameClass =
    "font-sans text-lg font-semibold tracking-tight text-white lowercase";

  return (
    <div className={row} aria-label="CoderPad">
      <span className={markClass} aria-hidden>
        {CODERPAD_ANGLE_MARK}
      </span>
      <span className={nameClass}>coderpad</span>
    </div>
  );
}
