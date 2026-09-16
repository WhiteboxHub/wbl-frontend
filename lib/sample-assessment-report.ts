import { normalizeReport, type NormalizedReport } from "@/types/aiprep-report";
import type { AssessmentDetail, AssessmentDataResponse, AssessmentReportResponse } from "@/types/aiprep";

export function getSampleNormalizedReport(assessmentId: string | number = "1"): NormalizedReport {
  const assessment: AssessmentDetail = {
    id: typeof assessmentId === "number" ? assessmentId : parseInt(assessmentId, 10) || 1,
    assessment_uuid: "sample-demo-uuid",
    candidate_id: 1,
    assessment_type: "INTRO",
    media_type: "VIDEO",
    status: "COMPLETED",
    job_description: null,
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    started_at: "2026-03-15T10:00:00Z",
    completed_at: "2026-03-15T10:05:00Z",
    created_at: "2026-03-15T10:00:00Z",
  };

  const data: AssessmentDataResponse = {
    id: 1,
    assessment_id: assessment.id,
    questions: [
      {
        id: 1,
        question: "Tell me about yourself and your background.",
        time_limit_sec: 180,
      },
    ],
    transcript: {
      full_text:
        "Recently I worked on a RAG-based AI chatbot. It has two main parts: the ingestion pipeline " +
        "and query pipeline. I basically did data cleaning, chunking, preprocessing using semantic chunking " +
        "and sentence transformers. I also implemented a hybrid retriever with Milvus and reranking. " +
        "Additionally, I implemented the multi-agent architecture with MCP tool calling, LangGraph, " +
        "and supervisor pattern with long-term and short-term memory management.",
      segments: [
        { start_s: 0.0, end_s: 15.0, text: "Recently I worked on a RAG-based AI chatbot." },
        { start_s: 15.0, end_s: 35.0, text: "It has two main parts: the ingestion pipeline and query pipeline." },
        { start_s: 35.0, end_s: 65.0, text: "I basically did data cleaning, semantic chunking, and sentence transformers." },
        { start_s: 65.0, end_s: 105.0, text: "I also implemented a hybrid retriever with Milvus and reranking." },
        { start_s: 105.0, end_s: 140.0, text: "Additionally, I implemented the multi-agent architecture with MCP tool calling and LangGraph." },
        { start_s: 140.0, end_s: 180.0, text: "It is based on a supervisor pattern with long-term and short-term memory management." },
      ],
    },
    audio_telemetry: { wpm: 104, silence_ratio: 0.228, filler_rate_per_min: 5.6, volume_dbfs: -27.2 },
    video_telemetry: { eye_contact_pct: 68.0, facial_engagement_pct: 58.0, posture_score: 74 },
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:05:00Z",
  };

  const report: AssessmentReportResponse = {
    id: 1,
    assessment_id: assessment.id,
    overall_score: 71,
    audio_evaluation: {
      coherence: "The response has a clear progression from the RAG chatbot to its ingestion and query pipelines, followed by the multi-agent phase, but the delivery contains fragmented transitions and repeated filler phrases.",
      clarity: "The technical content is understandable and includes specific implementation details, but several phrases are imprecise or appear affected by speech recognition errors, reducing verbal crispness.",
      fluency: "The filler rate of 5.6 per minute is excessive according to the benchmark, while the silence ratio of 22.8% falls in the hesitant range; reducing fillers and tightening pauses would substantially improve fluency.",
      confidence: "The average volume of -27.2 dBFS is in the soft-spoken range and the mean pitch of 112.5 Hz is just below the optimal pitch range, suggesting that stronger vocal projection would improve delivery.",
      pace: "The speaking pace of 104 WPM is below the 110 WPM threshold and falls into the too-slow or hesitant range, making the answer longer and less energetic than necessary.",
      volume: "The average volume of -27.2 dBFS falls within the soft-spoken -22.1 to -30.0 dBFS range, so slightly stronger vocal projection would improve listener effort and clarity.",
      professionalism: "The technical content is appropriate for a professional AI engineering interview, but excessive fillers, long pauses, slow pace, and relatively soft volume reduce the polish of the delivery.",
    },
    video_evaluation: {
      eye_contact: "Eye contact was 68.0%, which falls in the acceptable benchmark range of 60–79%. This is reported only as a camera-engagement telemetry signal.",
      facial_engagement: "Facial engagement was 58.0%; this is presented only as a visual presentation telemetry signal and is not interpreted as a measure of personality, emotion, or capability.",
      posture: "Posture score was 74/100, which falls in the good range, indicating mostly stable positioning with some room for improvement in consistency.",
      expression_variety: "Expression variety was 52.0%, which falls within the natural-range benchmark of 40–69%.",
      distraction: "Distraction level was 14.2%, which falls in the low-distraction range and indicates limited detected visual/environmental distraction.",
    },
    transcript_evaluation: {
      scores_breakdown_json: {
        ai_engineering: {
          score: 82,
          band: "STRONG",
          sub_scores: {
            llm_knowledge: 76,
            rag_understanding: 88,
            evaluation_methodology: 78,
            deployment_mlops: 84,
          },
        },
        core_engineering: {
          score: 67,
          band: "DEVELOPING",
          sub_scores: {
            system_design: 76,
            algorithms: 57,
            code_quality: 67,
          },
        },
        non_technical: {
          score: 68,
          band: "DEVELOPING",
          sub_scores: {
            communication_clarity: 61,
            answer_structure: 75,
            confidence: 68,
          },
        },
        business_acumen: {
          score: 47,
          band: "NEEDS_WORK",
          sub_scores: {
            problem_framing: 43,
            stakeholder_thinking: 51,
          },
        },
        overall_score: 71,
        overall_band: "STRONG",
      },
      checklist_verification: {
        introduced_self: {
          covered: false,
          observation: "The transcript does not clearly state the candidate's name or professional title at the beginning. It starts directly with technical content, so the self-introduction component is missing.",
        },
        career_arc_covered: {
          covered: false,
          observation: "The candidate focuses almost entirely on the current RAG and agent project and does not narrate the progression across AI/ML Engineer, Product Manager, Product Owner, and earlier engineering roles.",
        },
        ml_to_ai_transition_covered: {
          covered: false,
          observation: "The candidate demonstrates strong current GenAI experience but does not explicitly explain how or why she transitioned from earlier software/product/ML-oriented work into GenAI and agentic AI.",
        },
        current_role_and_responsibilities: {
          covered: false,
          observation: "The candidate describes substantial current responsibilities but does not explicitly identify her current title or company in the spoken introduction.",
        },
        team_and_company_mentioned: {
          covered: false,
          observation: "No current company, team structure, or broader organisational impact is clearly described in the transcript.",
        },
        ai_agents_multiagent_mentioned: {
          covered: true,
          observation: "The candidate explicitly describes a multi-agent architecture with an orchestrator, multiple specialized agents, MCP tool calling, LangGraph, and a supervisor pattern.",
        },
        mcp_mentioned: {
          covered: true,
          observation: "MCP is explicitly mentioned in the context of tool calling: 'that used MCP tool calling.'",
        },
        memory_context_engineering_mentioned: {
          covered: true,
          observation: "The candidate explicitly states that the system includes 'long term short term memory management' and also mentions conversation history and query optimization.",
        },
        guardrails_evals_observability_mentioned: {
          covered: true,
          observation: "The candidate explicitly mentions guardrails and says she worked on both retriever evaluation and generation evaluation.",
        },
        rag_retrieval_chunking_mentioned: {
          covered: true,
          observation: "This is a strong area of the response: the candidate describes document cleaning, preprocessing, semantic chunking, sentence-transformer embeddings, hybrid semantic plus keyword retrieval, Milvus, and reranking.",
        },
      },
      resume_alignment: {
        score: 82,
        band: "STRONG",
        missed_highlights: [
          "Graph-based retrieval using Neo4j alongside vector similarity search.",
          "Specific use of LangSmith and custom observability pipelines for agent execution tracing and retrieval/generation monitoring.",
          "Real-time MongoDB and AWS Lambda pipelines supporting asynchronous workflow and evaluation processes.",
          "Earlier MLOps/Product Manager experience involving SageMaker, MLflow, Docker, EKS/ECS, CI/CD, drift thresholds, bias evaluation, and Grafana/Prometheus.",
          "Product Owner experience at Cisco and Apple, including management of 100+ user stories across 10+ stakeholder teams and 95% stakeholder satisfaction.",
          "Apple quality automation experience that reduced engineering effort by 30% and improved release processes.",
        ],
        unverified_claims: [
          "The use of Milvus as the vector database is not stated in the supplied resume.",
          "The specific HRMS application and its specialized agents are not stated in the supplied resume.",
          "The use of sentence transformers for embeddings is not explicitly stated in the supplied resume.",
          "The specific supervisor-pattern router implementation is not described in the supplied resume.",
        ],
      },
      technical_analysis_json: {
        summary: "The candidate demonstrates strong hands-on GenAI engineering depth in the introduction, particularly around RAG architecture, retrieval, evaluation, guardrails, memory, and multi-agent orchestration. The spoken technical content is considerably stronger than the career-introduction component, but several important resume capabilities such as Neo4j graph retrieval, LangSmith observability, and earlier MLOps/product leadership are not surfaced.",
        strengths: [
          "Provides concrete RAG architecture details including separate ingestion and query pipelines, semantic chunking, embeddings, hybrid retrieval, reranking, and Bedrock-based generation.",
          "Demonstrates multi-agent architecture knowledge by describing an orchestrator, multiple agents, MCP tool calling, LangGraph, supervisor pattern, and intent routing.",
          "Explicitly discusses both retriever and generation evaluation rather than only claiming that the system was evaluated.",
          "Mentions guardrails, conversation history, long-term and short-term memory, and query optimization, showing awareness of production concerns beyond basic RAG implementation.",
          "Describes a full-stack production deployment involving React, FastAPI, AWS EKS, and AWS Bedrock.",
        ],
        areas_for_improvement: [
          "The candidate should begin with a concise professional identity and career summary before diving into project details.",
          "The ML-to-GenAI transition is not explained, despite the resume showing a substantial earlier product, software, and MLOps background.",
          "The response could better explain why specific architectural choices were made, such as why hybrid retrieval was selected and how reranking improved retrieval quality.",
          "Evaluation is mentioned but not quantified; the candidate should explain the metrics, evaluation methodology, or measurable improvements.",
          "The introduction omits strong resume evidence around Neo4j graph retrieval, LangSmith observability, and MLOps architecture.",
        ],
        depth_assessment: "This response provides meaningful evidence of architectural ownership rather than merely surface-level familiarity. The candidate explains concrete RAG components and a multi-agent orchestration pattern, although deeper validation would be useful around architectural trade-offs, evaluation methodology, scalability, and production reliability.",
      },
      non_technical_analysis_json: {
        communication_summary: "The candidate's answer contains substantial technical substance and follows a logical project progression, but the spoken delivery is less polished than the technical content. Frequent fillers, slow pacing, long pauses, and fragmented sentences make the answer harder to follow than necessary.",
        structure_quality: "The project narrative is reasonably well structured: POC to production, ingestion/query pipelines, RAG implementation, evaluation, deployment, and then the transition to multi-agent architecture. However, it functions more like a project deep dive than a complete 'tell me about yourself' response.",
        confidence_notes: "The candidate demonstrates technical ownership through direct statements about implementing RAG, hybrid retrieval, guardrails, memory, MCP, and multi-agent architecture. Vocal delivery is less confident than the content suggests because the pace is 104 WPM, volume is soft at -27.2 dBFS, and filler usage is 5.6 per minute.",
      },
      coaching_suggestions_json: [
        {
          priority: 1,
          dimension: "Non-Technical",
          area: "Build a proper introduction",
          suggestion: "Start with your name, current title, company, years or breadth of experience, and a one-sentence career arc before moving into the RAG project.",
          evidence: "The response begins directly with technical content and never clearly introduces the candidate's professional identity.",
        },
        {
          priority: 2,
          dimension: "Non-Technical",
          area: "Improve vocal fluency",
          suggestion: "Slow down less, but use deliberate short pauses instead of extended gaps, and consciously remove repeated 'so', 'right', and 'yeah' fillers.",
          evidence: "Telemetry shows 104 WPM, 22.8% silence ratio, and 5.6 fillers per minute.",
        },
        {
          priority: 3,
          dimension: "AI Engineering",
          area: "Explain retrieval trade-offs",
          suggestion: "When mentioning hybrid retrieval, explain why dense plus keyword retrieval was selected, what failure mode it addressed, and how reranking affected precision or relevance.",
          evidence: "The candidate says 'I also implemented a hybrid retriever. So semantic plus keyword' but does not explain the engineering rationale or measured outcome.",
        },
        {
          priority: 4,
          dimension: "AI Engineering",
          area: "Quantify evaluation",
          suggestion: "Name the evaluation metrics or methodology used for retriever and generation evaluation and provide one concrete improvement or quality signal.",
          evidence: "The candidate says 'I did some work on the retriever evaluation and generation evaluation' without explaining the evaluation approach or results.",
        },
        {
          priority: 5,
          dimension: "Resume Alignment",
          area: "Surface differentiating resume experience",
          suggestion: "Briefly connect the current GenAI work to earlier MLOps and product ownership experience, especially model lifecycle management, stakeholder coordination, and production monitoring.",
          evidence: "The transcript focuses almost exclusively on the current RAG/agent project and does not mention the substantial MLOps and product leadership experience in the resume.",
        },
        {
          priority: 6,
          dimension: "Business Acumen",
          area: "Connect architecture to business outcomes",
          suggestion: "Add one sentence explaining the business problem solved by the HRMS/RAG system and one measurable outcome such as reduced response latency, improved retrieval quality, reduced manual work, or improved user experience.",
          evidence: "The candidate identifies the application as an HRMS system but does not explain its business impact or measurable outcome.",
        },
      ],
      signal_timeline_json: [
        {
          question_index: 1,
          energy: 63,
          clarity: 71,
        },
      ],
      transcript_evidence_json: [
        {
          quote: "recently I worked on a rag based AI chatbot",
          timestamp_s: 12,
          dimension: "AI Engineering",
          observation: "Establishes direct hands-on experience building a RAG application.",
        },
        {
          quote: "it has two main parts right the ingestion pipeline and query pipeline",
          timestamp_s: 24,
          dimension: "Core Engineering",
          observation: "Shows architectural decomposition of the RAG system into ingestion and query paths.",
        },
        {
          quote: "basically did data cleaning, chunking, pre processing",
          timestamp_s: 42,
          dimension: "AI Engineering",
          observation: "Demonstrates hands-on preprocessing and document preparation experience.",
        },
        {
          quote: "I basically use semantic chunking and sentence transformers",
          timestamp_s: 58,
          dimension: "AI Engineering",
          observation: "Provides concrete evidence of semantic chunking and transformer-based embedding work.",
        },
        {
          quote: "I also implemented a hybrid retriever. So semantic plus keyword",
          timestamp_s: 75,
          dimension: "AI Engineering",
          observation: "Strong evidence of understanding hybrid retrieval combining semantic and keyword search.",
        },
        {
          quote: "I also implemented guardrails and handled conversation history, re ranking and query optimization",
          timestamp_s: 95,
          dimension: "AI Engineering",
          observation: "Shows awareness of multiple production RAG concerns including guardrails, conversational context, reranking, and query optimization.",
        },
        {
          quote: "I implemented the multi agent architecture",
          timestamp_s: 115,
          dimension: "AI Engineering",
          observation: "Provides direct evidence of hands-on multi-agent system implementation.",
        },
        {
          quote: "that used MCP tool calling",
          timestamp_s: 130,
          dimension: "AI Engineering",
          observation: "Explicitly demonstrates MCP and tool-calling experience.",
        },
        {
          quote: "long term short term memory management",
          timestamp_s: 145,
          dimension: "AI Engineering",
          observation: "Demonstrates explicit awareness and implementation of different memory scopes for agent workflows.",
        },
        {
          quote: "it's based on supervisor pattern and uses router for intent",
          timestamp_s: 160,
          dimension: "Core Engineering",
          observation: "Shows architectural understanding of supervisor-based multi-agent orchestration and intent routing.",
        },
      ],
      gaps_to_validate_json: [
        {
          topic: "RAG evaluation methodology",
          reason: "The candidate claims retriever and generation evaluation but does not identify the metrics, datasets, methodology, or measurable results.",
        },
        {
          topic: "Hybrid retrieval trade-offs",
          reason: "The candidate describes semantic plus keyword retrieval but does not explain why the combination was required or how retrieval quality changed.",
        },
        {
          topic: "Multi-agent coordination",
          reason: "The candidate describes a supervisor pattern and router but should explain state transitions, agent selection, failure handling, and coordination between specialized agents.",
        },
        {
          topic: "MCP implementation",
          reason: "MCP tool calling is mentioned, but the candidate should explain the tools exposed, protocol flow, security boundaries, and why MCP was selected.",
        },
        {
          topic: "Memory architecture",
          reason: "Long-term and short-term memory are mentioned, but the storage mechanism, retrieval strategy, lifecycle, and context-window management are not explained.",
        },
        {
          topic: "Production scalability",
          reason: "AWS EKS and FastAPI deployment are mentioned, but horizontal scaling, latency, concurrency, failure handling, and monitoring strategy are not discussed.",
        },
      ],
      improvements_json: [
        {
          priority: 1,
          topic: "Reframe the answer as a career story",
          effort: "low",
          rationale: "The technical project content is strong, but the candidate currently answers a project-deep-dive question rather than a complete general introduction.",
        },
        {
          priority: 2,
          topic: "Improve speaking fluency and projection",
          effort: "low",
          rationale: "The largest delivery gaps are measurable: 104 WPM, 22.8% silence, 5.6 fillers/minute, and -27.2 dBFS volume.",
        },
        {
          priority: 3,
          topic: "Add measurable technical outcomes",
          effort: "medium",
          rationale: "Quantifying retrieval quality, latency, evaluation performance, or production scale would turn strong technical descriptions into stronger evidence of engineering impact.",
        },
        {
          priority: 4,
          topic: "Explain architectural trade-offs",
          effort: "medium",
          rationale: "The candidate names several advanced components but does not yet explain the reasoning behind choices such as hybrid retrieval, reranking, supervisor routing, and memory architecture.",
        },
        {
          priority: 5,
          topic: "Connect GenAI work with prior MLOps and product leadership",
          effort: "low",
          rationale: "The resume shows a distinctive combination of AI engineering, MLOps, product ownership, and stakeholder management that is almost completely absent from the spoken introduction.",
        },
      ],
    },
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:05:00Z",
  };

  return normalizeReport(assessment, data, report);
}
