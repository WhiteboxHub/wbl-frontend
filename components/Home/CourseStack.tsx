'use client'

import { useState, useEffect, useCallback, type ComponentType } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'

type Course = {
  id: string
  tag: string
  title: string
  description: string
  duration: string
  features: { label: string; icon: ComponentType<{ className?: string }> }[]
}

const courses: Course[] = [
  {
    id: 'agentic-systems',
    tag: 'Agentic Systems',
    title: 'Design agents that act',
    description: 'Build autonomous agents that plan, call tools, and collaborate across workflows.',
    duration: '10 weeks',
    features: [
      { label: 'Tool calling', icon: Bot },
      { label: 'Multi-agent workflows', icon: Workflow },
      { label: 'Memory & planning', icon: Brain },
    ],
  },
  {
    id: 'generative-ai',
    tag: 'Generative AI',
    title: 'Build with large language models',
    description: 'Go from prompts to production-ready LLM apps with retrieval, evals, and guardrails.',
    duration: '8 weeks',
    features: [
      { label: 'Prompt & context design', icon: Sparkles },
      { label: 'RAG pipelines', icon: Search },
      { label: 'Evals & guardrails', icon: ShieldCheck },
    ],
  },
  {
    id: 'ml-engineering',
    tag: 'ML Engineering',
    title: 'Ship models to production',
    description: 'Train, serve, and monitor machine learning models with modern MLOps practices.',
    duration: '12 weeks',
    features: [
      { label: 'Training pipelines', icon: Database },
      { label: 'Model serving', icon: Server },
      { label: 'Monitoring & MLOps', icon: Activity },
    ],
  },
]

// Normalize offset to circular range (-1, 0, 1 for 3 items)
function getRelativeOffset(index: number, activeIndex: number, total: number): number {
  let diff = index - activeIndex
  while (diff > total / 2) diff -= total
  while (diff < -total / 2) diff += total
  return diff
}

export function CourseStack() {
  const [activeIndex, setActiveIndex] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + courses.length) % courses.length)
  }, [])

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % courses.length)
  }, [])

  // Autoplay rotation every 4.5 seconds when not paused
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      handleNext()
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, handleNext])

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchEndX - touchStartX
    if (diff > 45) {
      handlePrev()
    } else if (diff < -45) {
      handleNext()
    }
    setTouchStartX(null)
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[460px] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') handlePrev()
        if (e.key === 'ArrowRight') handleNext()
      }}
      role="region"
      aria-label="Featured programs carousel. Use arrow keys or click cards to navigate."
    >
      {/* ── Cards Stack Container ── */}
      <div
        className="relative w-full"
        style={{ aspectRatio: '1.25 / 1' }}
      >
        {courses.map((course, index) => {
          const offset = getRelativeOffset(index, activeIndex, courses.length)
          const isActive = offset === 0
          const depth = Math.abs(offset)

          // 3D positioning relative to active card
          let transform = 'translateX(0%) translateY(0%) scale(1) rotate(0deg)'
          if (offset === -1) {
            transform = 'translateX(-22%) translateY(-6%) scale(0.88) rotate(-4deg)'
          } else if (offset === 1) {
            transform = 'translateX(22%) translateY(-6%) scale(0.88) rotate(4deg)'
          }

          return (
            <div
              key={course.id}
              onClick={() => {
                if (!isActive) setActiveIndex(index)
              }}
              aria-current={isActive ? 'true' : undefined}
              title={isActive ? undefined : `Click to view ${course.title}`}
              style={{
                transform,
                zIndex: isActive ? 30 : 20 - depth,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.5s ease, opacity 0.4s ease',
                position: 'absolute',
                left: '14%',
                top: '10%',
                width: '72%',
              }}
              className={`rounded-[1.75rem] outline-none transition-all ${
                isActive
                  ? 'cursor-default shadow-[0_30px_60px_-20px_rgba(11,20,55,0.45)]'
                  : 'cursor-pointer hover:-translate-y-2 shadow-[0_16px_30px_-18px_rgba(11,20,55,0.35)]'
              }`}
            >
              <CourseCard course={course} isActive={isActive} />
            </div>
          )
        })}

        {/* Previous Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          aria-label="Previous program"
          className="absolute -left-2 sm:-left-3 top-[48%] -translate-y-1/2 z-40 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#1D2144]/90 backdrop-blur-sm border border-body-color/20 text-black dark:text-white shadow-md hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          aria-label="Next program"
          className="absolute -right-2 sm:-right-3 top-[48%] -translate-y-1/2 z-40 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#1D2144]/90 backdrop-blur-sm border border-body-color/20 text-black dark:text-white shadow-md hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* ── Dots navigation ── */}
      <div className="relative mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Course slides">
        {courses.map((course, idx) => (
          <button
            key={course.id}
            role="tab"
            aria-selected={idx === activeIndex}
            aria-label={`Jump to ${course.tag}`}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              idx === activeIndex
                ? 'w-6 bg-primary'
                : 'w-2 bg-gray-300 hover:bg-gray-400 dark:bg-white/20 dark:hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function CourseCard({ course, isActive }: { course: Course; isActive: boolean }) {
  const handleViewCourse = (e: React.MouseEvent) => {
    e.stopPropagation()
    const curriculumSection = document.getElementById('curriculum')
    if (curriculumSection) {
      curriculumSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div
      className="relative flex flex-col rounded-[1.5rem] p-2"
      style={{ background: '#1D2144', aspectRatio: '5/4' }}
    >
      {/* Window chrome dots */}
      <div className="flex items-center justify-between px-2 pb-1.5 pt-0.5">
        <div className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        </div>
        <span className="text-[9px] font-semibold tracking-wide text-white/70">{course.tag}</span>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col rounded-xl p-3 bg-[#F8FAFC]">
        <h3
          className="text-balance text-center font-bold leading-tight text-black"
          style={{ fontSize: 'clamp(0.68rem, 1.1vw, 0.85rem)' }}
        >
          {course.title}
        </h3>
        <p
          className="mx-auto mt-0.5 max-w-[36ch] text-center leading-relaxed text-body-color"
          style={{ fontSize: 'clamp(0.56rem, 0.75vw, 0.66rem)', minHeight: '2rem' }}
        >
          {course.description}
        </p>

        <ul className="mt-auto grid grid-cols-3 gap-1.5 py-1">
          {course.features.map(({ label, icon: Icon }) => (
            <li key={label} className="flex flex-col items-center gap-0.5 text-center">
              <span
                className="flex items-center justify-center rounded-lg bg-primary/10 text-primary"
                style={{ width: '1.5rem', height: '1.5rem' }}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
              </span>
              <span
                className="font-semibold leading-tight text-black"
                style={{ fontSize: 'clamp(0.48rem, 0.65vw, 0.58rem)' }}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>

        <div
          className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5"
          style={{ fontSize: 'clamp(0.5rem, 0.68vw, 0.62rem)' }}
        >
          <span className="text-body-color">{course.duration} · Live</span>
          <a
            href="#curriculum"
            onClick={handleViewCourse}
            className="group/link inline-flex items-center gap-1 font-semibold text-primary hover:text-primarylight transition-colors"
          >
            <span>View course</span>
            <ArrowRight className="h-2 w-2 transition-transform group-hover/link:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Dim overlay for inactive cards */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[#c9d3e8] transition-opacity duration-500"
        style={{ opacity: isActive ? 0 : 0.55 }}
      />
    </div>
  )
}

export default CourseStack
