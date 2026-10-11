'use client'

import React, { useState, useEffect } from 'react'
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
      'Foundations of LLM application architecture & mental models',
      'Prompt engineering patterns, few-shot conditioning, and chain-of-thought',
      'Structured outputs with JSON schemas, Pydantic, and type validation',
      'Function calling and deterministic tool integrations',
      'Handling rate limits, token budgets, and fallback orchestration',
    ],
    handsOnProject:
      'Multi-modal Copilot with structured data extraction and real-time schema validation.',
    techStack: ['OpenAI API', 'Anthropic Claude', 'LangChain', 'Pydantic', 'TypeScript/Python'],
    learningOutcomes: [
      'Master prompt calibration & automated testing for prompt regressions',
      'Build deterministic function-calling pipelines with type safety',
      'Implement multi-provider failover and latency budgets',
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
      'Advanced chunking strategies (semantic, recursive, hierarchical, sliding-window)',
      'Vector embeddings, dense representations, and distance metrics',
      'Hybrid search pipelines (dense semantic + BM25 sparse keyword matching)',
      'Cross-encoder reranking algorithms and query transformation',
      'Long-context window optimization and prompt caching architectures',
    ],
    handsOnProject:
      'Self-correcting Enterprise Knowledge Retrieval System (Self-RAG) with query decomposition.',
    techStack: ['LlamaIndex', 'Pinecone', 'Weaviate', 'Cohere Rerank', 'pgvector'],
    learningOutcomes: [
      'Eliminate hallucination through contextual grounding and verification',
      'Deploy production hybrid search with sub-50ms latency',
      'Optimize token costs using prompt cache strategies',
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
      'Deterministic DAGs vs non-deterministic autonomous agents',
      'Multi-agent patterns: hierarchical delegation, consensus, and swarm collaboration',
      'State machines, cycle detection, and infinite-loop breakers',
      'Human-in-the-loop (HITL) approval checkpoints and review queues',
      'Dynamic task decomposition, reflection, and self-correction loops',
    ],
    handsOnProject:
      'Multi-Agent Market Intelligence Team that autonomously plans research, crawls data, verifies sources, and drafts analyst reports.',
    techStack: ['LangGraph', 'CrewAI', 'AutoGen', 'Temporal', 'Python StateGraph'],
    learningOutcomes: [
      'Architect robust multi-agent swarms with bounded autonomy',
      'Implement persistent checkpoints and resume-from-state capabilities',
      'Enforce human verification gates for critical real-world actions',
    ],
  },
  {
    id: 'agent-harness-engineering',
    number: '04',
    title: 'Agent Harness Engineering',
    description:
      'Provide the runtime, tools, state, and execution controls your agents need.',
    category: 'agents',
    duration: '2 Weeks · 8 Hands-on Labs',
    highlight: true,
    topics: [
      'Sandboxed code execution environments (Docker, E2B microVMs, WebAssembly)',
      'Agent memory architectures: working memory, episodic recall, and semantic memory',
      'Standardized tool protocols, authorization scopes, and credential isolation',
      'State persistence, audit logs, and transaction rollback mechanics',
      'Execution timeouts, rate limiters, and circuit-breaker patterns',
    ],
    handsOnProject:
      'Secure Agent Runtime Harness with isolated code execution sandbox and rollback-capable state manager.',
    techStack: ['E2B Code Sandbox', 'Docker', 'Redis', 'PostgreSQL', 'LangGraph'],
    learningOutcomes: [
      'Run untrusted agent-generated code safely in hardened sandboxes',
      'Design modular memory layers that persist across sessions',
      'Prevent catastrophic runaway loops with hardware and token quotas',
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
      'Evals vs Unit Tests: non-deterministic testing methodologies',
      'Core RAG evaluation metrics: context precision, recall, faithfulness, answer relevance',
      'Synthetic test dataset generation using frontier LLM judges',
      'Red-teaming, prompt injection defenses, and safety benchmarking',
      'Continuous evaluation CI/CD pipelines and regression threshold gates',
    ],
    handsOnProject:
      'Automated LLM Evaluation CI/CD Pipeline that tests quality, tool accuracy, and safety gates before merging code.',
    techStack: ['Ragas', 'TruLens', 'DeepEval', 'NeMo Guardrails', 'GitHub Actions'],
    learningOutcomes: [
      'Quantify and prevent model regressions before deploying updates',
      'Implement automated LLM-as-a-judge scoring with statistical confidence',
      'Harden applications against prompt injections and jailbreaks',
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
      'Distributed OpenTelemetry tracing across nested agent chains and tool calls',
      'Granular cost tracking and token attribution per user, session, and feature',
      'Latency profiling: Time-to-First-Token (TTFT), tokens-per-second, and queue delays',
      'Data governance: automated PII redaction, data leakage prevention, and audit trails',
      'Real-time anomaly detection, quality degradation alerts, and feedback capture',
    ],
    handsOnProject:
      'Enterprise LLM Telemetry Dashboard with real-time token spend alerts, distributed tracing, and compliance reporting.',
    techStack: ['LangSmith', 'Arize Phoenix', 'OpenLLMetry', 'Prometheus', 'Grafana'],
    learningOutcomes: [
      'Pinpoint latency bottlenecks and failing tool calls across distributed agents',
      'Monitor and control team-wide AI infrastructure budgets in real time',
      'Comply with enterprise SOC2 and HIPAA AI governance requirements',
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
      'Open-source model serving frameworks (vLLM, Ollama, TGI)',
      'Model quantization techniques: AWQ, GPTQ, GGUF, and 4-bit/8-bit precision trade-offs',
      'KV cache optimization, continuous batching, and speculative decoding',
      'Intelligent model routers: dynamic cascading from lightweight SLMs to frontier LLMs',
      'Self-hosted GPU deployment vs cloud serverless endpoints cost analysis',
    ],
    handsOnProject:
      'High-Throughput Inference Cluster with an intelligent semantic query router that cuts API spend by over 70%.',
    techStack: ['vLLM', 'Ollama', 'LiteLLM', 'Hugging Face', 'Ray Serve'],
    learningOutcomes: [
      'Deploy open-weight models with production-grade throughput & continuous batching',
      'Slash operational costs by routing queries to the most cost-effective model',
      'Optimize GPU memory and VRAM utilization for high-concurrency loads',
    ],
  },
]

export function AiCurriculum() {
  const [activeCardId, setActiveCardId] = useState<string>('agent-harness-engineering')
  const [selectedModule, setSelectedModule] = useState<CurriculumModule | null>(null)

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
      {selectedModule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
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

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-body-color/10 bg-gray-50 p-4 sm:px-6 dark:border-white/10 dark:bg-[#161a3d]">
              <span className="text-xs text-body-color">
                Included with Whitebox Learning AI track
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedModule(null)}
                  className="rounded-lg border border-body-color/20 bg-white px-4 py-2 text-xs font-semibold text-body-color hover:bg-gray-50 dark:border-white/10 dark:bg-dark dark:text-white"
                >
                  Close
                </button>
                <a
                  href="#contact"
                  onClick={() => setSelectedModule(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-opacity-90"
                >
                  <span>Apply for this track</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
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

