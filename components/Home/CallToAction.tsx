'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CallToAction() {
  return (
    <section
      id="cta"
      aria-label="Ready when you are"
      className="relative z-10 overflow-hidden bg-white py-14 md:py-20 dark:bg-[#12172a]"
    >
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
              READY WHEN YOU ARE
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-black dark:text-white">
              Make your next move <br className="hidden sm:inline" />
              <span className="text-black dark:text-white">the meaningful one.</span>
            </h2>
          </div>

          <div>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-[0_10px_25px_-5px_rgba(74,108,247,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-opacity-90 hover:shadow-[0_15px_30px_-5px_rgba(74,108,247,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            >
              <span>Start learning</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction
