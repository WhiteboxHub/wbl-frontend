/**
 * Unit tests for the AI Prep wizard (app/aiprep/start/page.tsx).
 *
 * TODO: Install missing dependencies before running:
 *   npm install -D @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock the API
vi.mock('@/lib/aiprep-api', () => ({
  aiPrepApi: {
    createAssessment: vi.fn().mockResolvedValue({ id: 1, assessment_uuid: 'test-uuid-123' }),
  },
}))

// Lazy import after mocks are set up
const { default: AIPrepStartPage } = await import('@/app/aiprep/start/page')

// ─── StepBar ─────────────────────────────────────────────────────────────────

describe('StepBar', () => {
  it('shows "Assessment Type" as active on step 0', () => {
    render(<AIPrepStartPage />)
    const label = screen.getByText('Assessment Type')
    expect(label).toHaveClass('text-indigo-600')
  })
})

// ─── Step 1: Assessment Type ──────────────────────────────────────────────────

describe('Step 1 — Assessment Type', () => {
  beforeEach(() => {
    render(<AIPrepStartPage />)
  })

  it('renders the Intro card', () => {
    expect(screen.getByText('Intro')).toBeInTheDocument()
  })

  it('locked cards show "Coming Soon" badge', () => {
    const badges = screen.getAllByText('Coming Soon')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('Next button is disabled when no assessment type selected', () => {
    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).toBeDisabled()
  })

  it('Next button is enabled after clicking Intro card', async () => {
    const user = userEvent.setup()
    const introCard = screen.getByText('Intro').closest('[class*="rounded-2xl"]')!
    await user.click(introCard)
    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).not.toBeDisabled()
  })

  it('locked cards cannot be selected', async () => {
    const user = userEvent.setup()
    // JD Walkthrough is locked — clicking it should not enable Next
    const lockedCard = screen.getByText('JD Walkthrough').closest('[class*="rounded-2xl"]')!
    await user.click(lockedCard)
    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).toBeDisabled()
  })
})

// ─── Step 1: Info modal ───────────────────────────────────────────────────────

describe('Step 1 — Info modal', () => {
  it('opens the Info modal when clicking Info on Intro card', async () => {
    const user = userEvent.setup()
    render(<AIPrepStartPage />)

    const infoBtn = screen.getByRole('button', { name: /info/i })
    await user.click(infoBtn)

    expect(screen.getByText('Intro Assessment Details')).toBeInTheDocument()
  })

  it('closes the Info modal when clicking Got It', async () => {
    const user = userEvent.setup()
    render(<AIPrepStartPage />)

    const infoBtn = screen.getByRole('button', { name: /info/i })
    await user.click(infoBtn)

    const gotItBtn = screen.getByRole('button', { name: /got it/i })
    await user.click(gotItBtn)

    expect(screen.queryByText('Intro Assessment Details')).not.toBeInTheDocument()
  })
})

// ─── Step 2: Media & Consent ──────────────────────────────────────────────────

describe('Step 2 — Media & Consent', () => {
  async function advanceToStep2() {
    const user = userEvent.setup()
    render(<AIPrepStartPage />)

    const introCard = screen.getByText('Intro').closest('[class*="rounded-2xl"]')!
    await user.click(introCard)
    const nextBtn = screen.getByRole('button', { name: /next/i })
    await user.click(nextBtn)
    return user
  }

  it('shows both media type options', async () => {
    await advanceToStep2()
    expect(screen.getByText('Audio Only')).toBeInTheDocument()
    expect(screen.getByText('Video + Audio')).toBeInTheDocument()
  })

  it('Video + Audio is selected by default', async () => {
    await advanceToStep2()
    // The Video + Audio button should have the selected styling
    const videoBtn = screen.getByText('Video + Audio').closest('button')!
    expect(videoBtn).toHaveClass('border-indigo-500')
  })

  it('clicking Audio Only selects it', async () => {
    const user = await advanceToStep2()
    const audioBtn = screen.getByText('Audio Only').closest('button')!
    await user.click(audioBtn)
    expect(audioBtn).toHaveClass('border-indigo-500')
  })

  it('all three consent checkboxes start checked', async () => {
    await advanceToStep2()
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
    checkboxes.forEach((cb) => expect(cb).toBeChecked())
  })

  it('consent checkboxes can be unchecked', async () => {
    const user = await advanceToStep2()
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(checkboxes[0]).not.toBeChecked()
  })
})

// ─── Step navigation ──────────────────────────────────────────────────────────

describe('Step navigation', () => {
  it('clicking Next on step 1 advances to step 2', async () => {
    const user = userEvent.setup()
    render(<AIPrepStartPage />)

    const introCard = screen.getByText('Intro').closest('[class*="rounded-2xl"]')!
    await user.click(introCard)
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 2 heading
    expect(screen.getByText('Media & Consent')).toBeInTheDocument()
    // StepBar should show "Media & Consent" as active
    const activeLabel = screen.getAllByText('Media & Consent')
    expect(activeLabel.length).toBeGreaterThan(0)
  })

  it('clicking Back from step 2 returns to step 1', async () => {
    const user = userEvent.setup()
    render(<AIPrepStartPage />)

    const introCard = screen.getByText('Intro').closest('[class*="rounded-2xl"]')!
    await user.click(introCard)
    await user.click(screen.getByRole('button', { name: /next/i }))

    const backBtn = screen.getByRole('button', { name: /back/i })
    await user.click(backBtn)

    expect(screen.getByText('Choose Your Assessment Type')).toBeInTheDocument()
  })
})

// ─── Step 5: Confirmation ─────────────────────────────────────────────────────

describe('Step 5 — Confirmation', () => {
  async function advanceToStep5() {
    const user = userEvent.setup()
    render(<AIPrepStartPage />)

    // Step 1: select Intro
    const introCard = screen.getByText('Intro').closest('[class*="rounded-2xl"]')!
    await user.click(introCard)
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 2: click Next: Device Check
    await user.click(screen.getByRole('button', { name: /next: device check/i }))

    // Step 3: click Next: Confirmation (note: step 3 → step 4, step 4 → step 5)
    await user.click(screen.getByRole('button', { name: /next: confirmation/i }))

    // Step 4: Skip Practice
    await user.click(screen.getByRole('button', { name: /skip practice/i }))

    return user
  }

  it('shows the selected assessment type', async () => {
    await advanceToStep5()
    expect(screen.getByText('Intro')).toBeInTheDocument()
  })

  it('shows the selected media type', async () => {
    await advanceToStep5()
    expect(screen.getByText('Video + Audio')).toBeInTheDocument()
  })

  it('Start Assessment button is present', async () => {
    await advanceToStep5()
    expect(screen.getByRole('button', { name: /start assessment/i })).toBeInTheDocument()
  })
})
