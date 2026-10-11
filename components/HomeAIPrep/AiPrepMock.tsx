'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Mic, Sparkles, Video } from 'lucide-react'

const ANSWER_SECONDS = 120

const feedback = [
  { label: 'Clarity', score: 92 },
  { label: 'Technical depth', score: 84 },
  { label: 'Structure', score: 88 },
]

export function AiPrepMock() {
  const [secondsLeft, setSecondsLeft] = useState(ANSWER_SECONDS - 48)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? ANSWER_SECONDS : s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const progress = secondsLeft / ANSWER_SECONDS
  const CIRC = 97.4
  const dash = progress * CIRC

  return (
    <figure className="relative mx-auto w-full max-w-[540px] pb-44 sm:pb-40">
      <figcaption className="sr-only">
        Preview of the AIPrep interview practice screen with a question, countdown timer, recording
        indicator, and AI feedback score.
      </figcaption>

      {/* Main card */}
      <div className="rounded-[1.75rem] bg-[#0d1630] p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-2 pb-3 pt-1">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            <span className="w-2 h-2 rounded-full bg-white/20" />
            <span className="w-2 h-2 rounded-full bg-white/20" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-white/50">AIPrep · Mock interview</span>
        </div>

        {/* Card body */}
        <div className="rounded-2xl bg-white p-5 text-[#0b1437] sm:p-6">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs font-semibold text-[#2f6bf0]">
              AI Engineer · Question 3 of 8
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Recording
            </span>
          </div>

          {/* Question */}
          <p className="mt-5 text-lg font-bold leading-snug text-[#0b1437] sm:text-xl">
            {'"How would you design a retrieval pipeline that keeps an agent\'s answers grounded and up to date?"'}
          </p>

          {/* Timer + audio bars */}
          <div className="mt-6 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="relative h-16 w-16 shrink-0" aria-hidden="true">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" stroke="#eaf1ff" />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${CIRC}`}
                  stroke="#2f6bf0"
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-[#0b1437]">
                {minutes}:{seconds}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0b1437]">Time remaining</p>
              <div className="mt-2 flex h-6 items-end gap-0.5" aria-hidden="true">
                {[40, 70, 55, 90, 35, 65, 80, 45, 60, 95, 50, 75, 40, 85, 55, 70, 30, 60].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 origin-bottom animate-pulse rounded-full bg-[#2f6bf0]/70"
                    style={{ height: `${h}%`, animationDelay: `${i * 90}ms`, minWidth: '3px' }}
                  />
                ))}
              </div>
            </div>

            <div className="hidden gap-2 sm:flex" aria-hidden="true">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2f6bf0]">
                <Mic className="h-4 w-4" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2f6bf0]">
                <Video className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating feedback card */}
      <div className="absolute bottom-0 right-0 w-[min(100%,300px)] rounded-2xl bg-white p-5 text-[#0b1437] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.55)] sm:-right-4">
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-[#2f6bf0]" aria-hidden="true" />
            AI feedback
          </p>
          <p className="text-2xl font-black text-[#2f6bf0]">
            88<span className="text-sm font-semibold text-gray-400">/100</span>
          </p>
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {feedback.map(({ label, score }) => (
            <li key={label}>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold tabular-nums">{score}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-[#eaf1ff]">
                <div className="h-full rounded-full bg-[#2f6bf0]" style={{ width: `${score}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex gap-2 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
          Strong example. Mention how you would evaluate retrieval quality.
        </p>
      </div>
    </figure>
  )
}
