'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Code2,
  Database,
  Layers,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  Zap,
} from 'lucide-react'

export interface CurriculumModule {
  id: string
  number: string
  title: string
  description: string
  category: 'foundation' | 'agents' | 'production'
  duration: string
  highlight?: boolean
  topics: string[]
  handsOnProject: string
  techStack: string[]
  learningOutcomes: string[]
}

const modules: CurriculumModule[] = [
  {
    id: 'ai-engineering',
    number: '01',
    title: 'AI Engineering',
    description:
      'Build applications around models with practical architecture, prompting, and production patterns.',
    category: 'foundation',
    duration: '2 Weeks · 8 Hands-on Labs',
    topics: [
      'Foundation model mechanics, tokenomics, and context window dynamics (lost-in-the-middle)',
      'The 6 parts of a production prompt & high-leverage few-shot in-context learning',
      'Reasoning models vs standard LLMs (DeepSeek-R1, Claude Extended Thinking, OpenAI o-series)',
      'Structured outputs with JSON schemas, Pydantic, and deterministic validation',
      'Function calling & tool integration patterns (read-only first, error handling, permissioning)',
    ],
    handsOnProject:
      'Production AI Application with 4-Layer Problem-First Design, Pydantic Schema Validation, and Multi-Provider Failover.',
    techStack: ['OpenAI API', 'Anthropic Claude', 'Amazon Bedrock', 'Pydantic', 'FastAPI', 'Python'],
    learningOutcomes: [
      'Master the 4-layer problem-first design framework to scope viable AI products',
      'Build deterministic function-calling pipelines with type safety and schema validation',
      'Implement multi-provider failover, token budgeting, and latency-aware orchestration',
    ],
  },
  {
    id: 'context-engineering',
    number: '02',
    title: 'Context Engineering',
    description:
      'Supply the right instructions, data, memory, and tools so models can do useful work.',
    category: 'foundation',
    duration: '2 Weeks · 7 Hands-on Labs',
    topics: [
      'Document ingestion & parsing pipelines with Docling and Amazon S3 storage',
      'Semantic chunking & strategic overlap to preserve document context boundaries',
      'Dense vector representations (Sentence Transformers) and Milvus HNSW graph indexing',
      'Hybrid retrieval fusion: combining BM25 keyword matching with dense vector search',
      'BGE Cross-Encoder reranking for precision scoring, metadata filtering, and zero hallucination',
    ],
    handsOnProject:
      'TalentScreen Enterprise RAG System: Production recruitment knowledge assistant with Docling parsing, Milvus hybrid search, BGE reranking, and Claude Sonnet on AWS Bedrock.',
    techStack: ['Milvus', 'Docling', 'Sentence Transformers', 'BM25', 'BGE Cross-Encoder', 'Amazon S3'],
    learningOutcomes: [
      'Eliminate hallucinations through multi-stage retrieval grounding and verification',
      'Deploy low-latency hybrid search pipelines combining keyword and semantic recall',
      'Implement semantic chunking, metadata filtering, and cross-encoder reranking in production',
    ],
  },
  {
    id: 'agentic-workflows',
    number: '03',
    title: 'Agentic Workflows',
    description:
      'Coordinate steps, agents, and human decisions into reliable end-to-end workflows.',
    category: 'agents',
    duration: '2.5 Weeks · 9 Hands-on Labs',
    topics: [
      'Workflow vs Agent spectrum: prompt chaining, routing, parallelization, and orchestrator-workers',
      'Stateful graph orchestration with LangGraph (StateGraph, checkpointing, conditional branching)',
      'Domain agent design: Triage & Routing, Candidate Intelligence, and Decision Support agents',
      'ReAct reasoning loops with reflection and self-correction (Think → Validate → Act → Reflect)',
      'Human-in-the-loop (HITL) approval checkpoints and escalation triggers for high-stakes actions',
    ],
    handsOnProject:
      'XYZ Recruiting Agentic Platform: Multi-agent hiring orchestration system built on LangGraph with state persistence, reflection loops, and automated triage.',
    techStack: ['LangGraph', 'LangChain', 'Claude Sonnet', 'PostgreSQL State Store', 'Python'],
    learningOutcomes: [
      'Architect fault-tolerant multi-agent systems with checkpointing and resumability',
      'Build self-correcting reflection loops that verify action outcomes before persisting',
      'Implement human-in-the-loop approval workflows for sensitive enterprise operations',
    ],
  },
  {
    id: 'agent-harness-engineering',
    number: '04',
    title: 'Harness Engineering',
    description:
      'Provide the runtime, tools, state, and execution controls your agents need.',
    category: 'agents',
    duration: '2 Weeks · 8 Hands-on Labs',
    highlight: true,
    topics: [
      'Model Context Protocol (MCP) architecture: client-server specifications and tool discovery',
      'Governed tool design: Pydantic typed schemas, strict contracts, and legible errors',
      'Safe execution boundaries: read-only tools first, runtime permission scoping, and idempotency',
      'Multi-scope memory management: session cache, workflow state, and long-term history (Redis & Postgres)',
      'Active context engineering: context pruning, conflict detection, and memory poisoning mitigation',
    ],
    handsOnProject:
      'Enterprise MCP Tool & Memory Gateway: Governed MCP server exposing ATS, calendar scheduling, and persistent candidate memory with policy validation.',
    techStack: ['Model Context Protocol (MCP)', 'FastMCP', 'Redis', 'PostgreSQL', 'Pydantic'],
    learningOutcomes: [
      'Develop enterprise MCP servers to standardize agent-to-tool integrations',
      'Enforce user-scoped permissioning and prevent agent credential and data leakage',
      'Design persistent agent memory layers with automatic decay and eviction policies',
    ],
  },
  {
    id: 'evaluation-engineering',
    number: '05',
    title: 'Evaluation Engineering',
    description:
      'Test outcomes, tool use, safety, and regressions before they reach production.',
    category: 'production',
    duration: '2 Weeks · 7 Hands-on Labs',
    topics: [
      'The 80/20 Flip: Code-based evals (schema, format, exact match, containment, length checks)',
      'LLM-as-a-judge: rubric engineering, label taxonomies, and the 50-case human calibration workflow',
      'RAG evaluation metrics: Grounding score, Faithfulness, Context relevance, Precision@K, and Recall@K',
      'Agent & workflow evaluation with DeepEval: tool selection accuracy, parameter correctness, and completion',
      'Input & output guardrails: PII redaction (Presidio), prompt injection defense, and action boundary shields',
    ],
    handsOnProject:
      'Continuous Calibration & Evaluation CI/CD Pipeline (CC/CD) with DeepEval test suites, calibrated LLM judges, and Bedrock Guardrails.',
    techStack: ['DeepEval', 'Ragas', 'Bedrock Guardrails', 'Microsoft Presidio', 'Pytest', 'GitHub Actions'],
    learningOutcomes: [
      'Establish durable eval infrastructure that detects silent quality drift and regressions',
      'Calibrate LLM judges against human expert consensus with >85% agreement',
      'Deploy real-time input/output guardrails that block prompt injections and PII leaks',
    ],
  },
  {
    id: 'observability-governance',
    number: '06',
    title: 'Observability & Governance',
    description:
      'Trace behavior, cost, access, and compliance across every intelligent system.',
    category: 'production',
    duration: '1.5 Weeks · 6 Hands-on Labs',
    topics: [
      'Distributed LLM tracing with Langfuse: visualizing multi-step agent trajectories and tool calls',
      'Operational infrastructure monitoring with AWS CloudWatch, Prometheus, and Grafana',
      'Production telemetry metrics: P50/P90/P99 latency, token consumption, error rates, and cache hit ratios',
      'Continuous Calibration & Development (CC/CD): converting production failure traces into eval regression tests',
      'Role-Based Access Control (RBAC), audit logging, and regulatory compliance (EU AI Act, NIST AI RMF)',
    ],
    handsOnProject:
      'Enterprise AI Observability & Audit Hub: Real-time Langfuse tracing dashboard integrated with CloudWatch alerts and automated failure case harvesting.',
    techStack: ['Langfuse', 'AWS CloudWatch', 'Prometheus', 'Grafana', 'OpenTelemetry'],
    learningOutcomes: [
      'Trace every prompt, retrieval chunk, and tool execution in production environments',
      'Diagnose multi-turn agent bottlenecks, cost spikes, and tool failure points in minutes',
      'Enforce auditable data governance and compliance ready for enterprise standards',
    ],
  },
  {
    id: 'inference-cost-engineering',
    number: '07',
    title: 'Inference & Cost Engineering',
    description:
      'Balance quality, latency, scale, and spend for sustainable AI products.',
    category: 'production',
    duration: '2 Weeks · 8 Hands-on Labs',
    topics: [
      'High-performance async API service architecture using FastAPI, Uvicorn, and API Gateway',
      'Containerizing multi-service AI platforms with Docker and production deployment on AWS EKS',
      'Multi-tier caching with Redis/ElastiCache: query cache, retrieval cache, and response deduplication',
      'Intelligent model routing: cascading between cost-effective models (Flash/Haiku) and frontier reasoning models',
      'The 18-point Production Readiness Checklist: pre-launch verification and post-launch review cadences',
    ],
    handsOnProject:
      'AWS EKS Production AI Deployment: Containerized FastAPI platform with Milvus cluster, Redis caching, Kubernetes auto-scaling, and cost optimization.',
    techStack: ['FastAPI', 'Docker', 'Amazon EKS', 'Redis / ElastiCache', 'Amazon Bedrock', 'Kubernetes'],
    learningOutcomes: [
      'Deploy and manage resilient AI workloads on AWS EKS with auto-scaling and zero-downtime rollouts',
      'Slash operational and token spend by 25–45% using multi-tier Redis caching and model routing',
      'Execute the 18-point Production Readiness Checklist to validate reliability before client launch',
    ],
  },
]

export function AiCurriculum() {
  const [activeCardId, setActiveCardId] = useState<string>('agent-harness-engineering')
  const [selectedModule, setSelectedModule] = useState<CurriculumModule | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedModule(null)
      }
    }
    if (selectedModule) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [selectedModule])

  return (
    <section
      id="curriculum"
      aria-labelledby="curriculum-heading"
      className="relative z-10 overflow-hidden bg-white py-12 md:py-16 scroll-mt-20 dark:bg-dark"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            The AI Engineering Curriculum
          </p>
          <h2
            id="curriculum-heading"
            className="mt-2.5 text-2xl font-bold tracking-tight text-black sm:text-3xl lg:text-4xl dark:text-white"
          >
            From models to <span className="text-primary">real</span> systems.
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-body-color">
            Whitebox Learning is restructuring its teaching, preparation, and resume support around
            the complete AI engineering lifecycle.
          </p>
        </div>

        {/* ── Cards Grid: 4 cards on top row, 3 cards on bottom row to fit the full width seamlessly ── */}
        <div className="mt-8 space-y-6">
          {/* Top row: 4 cards (01 - 04) */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {modules.slice(0, 4).map((module) => (
              <CardItem
                key={module.id}
                module={module}
                isActive={activeCardId === module.id}
                onSelect={() => {
                  setActiveCardId(module.id)
                  setSelectedModule(module)
                }}
                onMouseEnter={() => setActiveCardId(module.id)}
              />
            ))}
          </div>

          {/* Bottom row: 3 cards (05 - 07) spanning the row equally */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-3">
            {modules.slice(4, 7).map((module) => (
              <CardItem
                key={module.id}
                module={module}
                isActive={activeCardId === module.id}
                onSelect={() => {
                  setActiveCardId(module.id)
                  setSelectedModule(module)
                }}
                onMouseEnter={() => setActiveCardId(module.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Detailed Curriculum Modal ── */}
      {mounted && selectedModule && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            onClick={() => setSelectedModule(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-body-color/10 p-6 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    Module {selectedModule.number}
                  </span>
                </div>
                <h3
                  id="modal-title"
                  className="mt-2 text-2xl font-bold text-black sm:text-3xl dark:text-white"
                >
                  {selectedModule.title}
                </h3>
                <p className="mt-1 text-sm text-body-color">
                  {selectedModule.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModule(null)}
                className="rounded-lg p-2 text-body-color hover:bg-gray-100 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Detailed Topics */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <Layers className="h-4 w-4" />
                  Core Curriculum Topics
                </h4>
                <ul className="mt-3 space-y-2.5">
                  {selectedModule.topics.map((topic, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-black dark:text-white">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hands-on Project */}
              <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4 dark:bg-primary/[.08]">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Code2 className="h-4 w-4" />
                  Hands-on Project & Production Lab
                </h4>
                <p className="mt-2 text-sm font-semibold text-black dark:text-white">
                  {selectedModule.handsOnProject}
                </p>
              </div>

              {/* Tech Stack */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-body-color">
                  Tools & Frameworks Mastered
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {selectedModule.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-lg bg-primary/5 px-3 py-1 text-xs font-semibold text-black border border-body-color/10 dark:text-white dark:border-white/10"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Learning Outcomes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-body-color">
                  Key Career Outcomes
                </h4>
                <ul className="mt-2.5 space-y-1.5">
                  {selectedModule.learningOutcomes.map((outcome, i) => (
                    <li key={i} className="text-xs text-body-color">
                      • {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-body-color/10 bg-gray-50 p-4 sm:px-6 dark:border-white/10 dark:bg-[#161a3d]">
              <span className="text-xs text-body-color">
                Included with Whitebox Learning AI track
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}

interface CardItemProps {
  module: CurriculumModule
  isActive: boolean
  onSelect: () => void
  onMouseEnter: () => void
}

function CardItem({ module, isActive, onSelect, onMouseEnter }: CardItemProps) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-2xl bg-white p-5 transition-all duration-300 cursor-pointer dark:bg-dark h-full ${
        isActive
          ? 'border-t-[3.5px] border-t-primary border-x border-b border-body-color/20 shadow-[0_18px_36px_-12px_rgba(74,108,247,0.18)] -translate-y-1 dark:border-white/10 dark:border-t-primary'
          : 'border border-body-color/10 shadow-one hover:border-body-color/20 hover:shadow-two hover:-translate-y-0.5 dark:border-white/10 dark:hover:border-white/20'
      }`}
      style={{
        minHeight: '230px',
      }}
    >
      {/* Card Top: Number */}
      <div>
        <span className="text-xs font-bold tracking-wider text-primary">
          {module.number}
        </span>

        {/* Card Title */}
        <h3 className="mt-2.5 text-base sm:text-lg font-bold leading-snug text-black transition-colors group-hover:text-primary dark:text-white">
          {module.title}
        </h3>

        {/* Card Description */}
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-body-color">
          {module.description}
        </p>
      </div>

      {/* Card Bottom: Learn more link with interactive button */}
      <div className="mt-5 pt-3 border-t border-body-color/10 dark:border-white/10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary transition-colors hover:text-primarylight"
          aria-label={`Learn more about ${module.title}`}
        >
          <span>Learn more</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}

export default AiCurriculum

