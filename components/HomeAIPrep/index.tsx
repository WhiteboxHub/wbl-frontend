'use client'

import { ArrowRight, BarChart3, Gauge, MessageSquareText, Timer } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/utils/AuthContext'

const highlights = [
  {
    icon: MessageSquareText,
    title: 'Role-specific questions',
    description: 'Practice for AI engineer, ML engineer, and data roles with questions drawn from real interviews.',
  },
  {
    icon: Timer,
    title: 'Timed answers',
    description: 'Answer on camera against the clock to build calm, structured responses under pressure.',
  },
  {
    icon: Gauge,
    title: 'Instant AI feedback',
    description: 'Get clear notes on clarity, depth, and structure the moment you finish each answer.',
  },
  {
    icon: BarChart3,
    title: 'Score tracking',
    description: 'Watch your scores improve session over session and know exactly what to practice next.',
  },
]

export function HomeAIPrep() {
  const { isAuthenticated } = useAuth()
  const targetUrl = isAuthenticated ? '/aiprep' : '/login'

  return (
    <section
      id="aiprep"
      aria-labelledby="aiprep-heading"
      className="relative z-10 overflow-hidden bg-white py-12 md:py-16 scroll-mt-20 dark:bg-dark"
    >
      {/* Decorative ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 rounded-full opacity-40 dark:opacity-20"
        style={{ width: 420, height: 420, background: 'radial-gradient(circle, rgba(74,108,247,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-32 rounded-full opacity-30 dark:opacity-15"
        style={{ width: 360, height: 360, background: 'radial-gradient(circle, rgba(74,108,247,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="container relative">
        <div className="flex flex-wrap items-center -mx-4">
          {/* Left column: Badge, Heading, Description, and CTA Button in place */}
          <div className="w-full px-4 lg:w-5/12 mb-8 lg:mb-0">
            {/* Badge */}
            <p className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              New · AIPrep
            </p>

            <h2
              id="aiprep-heading"
              className="mb-3 text-2xl font-bold leading-tight text-black dark:text-white sm:text-3xl"
            >
              Practice interviews with AI.{' '}
              <span className="text-primary">Walk in ready.</span>
            </h2>

            <p className="mb-5 text-sm sm:text-base leading-relaxed text-body-color">
              AIPrep is Whitebox Learning&apos;s interview practice platform. Rehearse real questions,
              get scored feedback in seconds, and turn nerves into confidence before the interview that counts.
            </p>

            {/* CTA in its present place on the left */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={targetUrl}
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(74,108,247,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              >
                Try AIPrep
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <p className="text-xs text-body-color">Included with every Whitebox program</p>
            </div>
          </div>

          {/* Right column: The 4 Feature Sections compressed cleanly in authentic WBL theme */}
          <div className="w-full px-4 lg:w-7/12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-body-color/15 bg-white p-4 shadow-one transition-all duration-200 hover:-translate-y-0.5 hover:shadow-two dark:border-white/10 dark:bg-[#181c3b]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-2.5 text-sm sm:text-base font-bold text-black dark:text-white">{title}</h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-body-color">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeAIPrep
