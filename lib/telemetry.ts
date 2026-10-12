import posthog from 'posthog-js';
import { onLCP, onINP, onCLS } from 'web-vitals';
import {
  ObservabilityPostHogPayload,
  ObservabilityEventPayload,
  ObservabilityStatus,
  ObservabilityStage,
  AssessmentTypeSelectedPayload,
  DeviceCheckCategory,
  DeviceCheckStatus,
  DeviceFailureReason,
  DeviceCheckTelemetryPayload,
  QuestionTelemetryPayload,
  SessionHeartbeatPayload,
  AssessmentCompletionTelemetryPayload,
  PracticeTelemetryPayload,
  TabSwitchTelemetryPayload,
  AIWizardStep,
} from '@/types/telemetry';
import { getStoredCandidateId } from '@/lib/aiprep-api';
import { parseJwt } from '@/utils/auth';

export class AIPrepTelemetry {
  private static isErrorListenerInitialized = false;
  private static lastIdentifiedCandidateId: string | number | null = null;

  /**
   * Listens for global JS errors and unhandled promise rejections.
   */
  static initGlobalErrorListeners() {
    if (typeof window === 'undefined' || this.isErrorListenerInitialized) return;
    this.isErrorListenerInitialized = true;

    // 1. Uncaught JS errors (AI Prep pages only)
    window.addEventListener('error', (event) => {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/aiprep') && !window.location.pathname.includes('/user_dashboard')) return;
      if (event.filename && event.filename.includes('telemetry')) return;
      if (typeof window !== 'undefined' && event.error) {
        try { posthog.captureException(event.error); } catch (_) { }
      }
      this.sendToPostHog({
        candidate_id: this.getResolvedCandidateId(),
        events: [
          {
            stage: 'RUNTIME_ERROR',
            event_type: 'UNCAUGHT_JS_EXCEPTION',
            status: 'FAILED',
            message: event.message || 'Uncaught JS error',
            client_timestamp: new Date().toISOString(),
            metadata: {
              error_message: event.message,
              filename: event.filename,
              line_number: event.lineno,
              column_number: event.colno,
              error_name: event.error?.name || 'Error',
            },
          },
        ],
      });
    });

    // 2. Unhandled promise rejections (AI Prep pages only)
    window.addEventListener('unhandledrejection', (event) => {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/aiprep') && !window.location.pathname.includes('/user_dashboard')) return;
      const reason = event.reason;
      const errorMsg = reason?.message || String(reason || 'Unhandled Promise Rejection');
      if (typeof window !== 'undefined' && reason) {
        try { posthog.captureException(reason instanceof Error ? reason : new Error(errorMsg)); } catch (_) { }
      }
      this.sendToPostHog({
        candidate_id: this.getResolvedCandidateId(),
        events: [
          {
            stage: 'RUNTIME_ERROR',
            event_type: 'UNHANDLED_PROMISE_REJECTION',
            status: 'FAILED',
            message: `Unhandled promise: ${errorMsg}`,
            client_timestamp: new Date().toISOString(),
            metadata: {
              error_message: errorMsg,
              stack: reason?.stack || null,
            },
          },
        ],
      });
    });
  }

  /**
   * Tracks React component crashes from error boundaries.
   */
  static trackReactComponentError(error: Error, errorInfo?: any) {
    if (typeof window !== 'undefined' && error) {
      try { posthog.captureException(error); } catch (_) { }
    }
    this.sendToPostHog({
      candidate_id: this.getResolvedCandidateId(),
      events: [
        {
          stage: 'REACT_ERROR_BOUNDARY',
          event_type: 'REACT_COMPONENT_CRASH',
          status: 'FAILED',
          message: error?.message || 'React component crash',
          client_timestamp: new Date().toISOString(),
          metadata: {
            error_name: error?.name || 'Error',
            error_message: error?.message,
            component_stack: errorInfo?.componentStack || null,
          },
        },
      ],
    });
  }

  private static isUxFrictionInitialized = false;
  private static isCwvInitialized = false;

  /**
   * Tracks rage clicks (rapid clicks) and dead clicks on disabled elements.
   */
  static initUxFrictionTracker() {
    if (typeof window === 'undefined' || this.isUxFrictionInitialized) return;
    this.isUxFrictionInitialized = true;

    let clickCount = 0;
    let lastClickTime = 0;
    let lastTarget: HTMLElement | null = null;

    window.addEventListener('click', (e) => {
      // Scope click tracking strictly to AI Prep routes (HIGH 3)
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname;
      if (!pathname.includes('/aiprep') && !pathname.includes('/user_dashboard/ai-prep')) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Never track clicks on sensitive input fields or password inputs to prevent capturing PII
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.getAttribute('type') === 'password' ||
        target.closest('input, textarea, [data-sensitive="true"]')
      ) {
        return;
      }

      const now = Date.now();
      const isSameTarget = target === lastTarget || target.contains(lastTarget) || (lastTarget ? lastTarget.contains(target) : false);

      if (isSameTarget && now - lastClickTime < 900) {
        clickCount++;
      } else {
        clickCount = 1;
        lastTarget = target;
      }
      lastClickTime = now;

      // Only capture safe element labels (buttons, links, or action pills)
      const elementId = target.id || target.getAttribute('name') || target.tagName.toLowerCase();
      const safeElementText = target.tagName.match(/BUTTON|A|SPAN/i)
        ? (target.textContent || '').replace(/[^\w\s-]/g, '').trim().slice(0, 20)
        : '';

      // 1. Detect Rage Click (3+ rapid clicks in <900ms)
      if (clickCount === 3) {
        this.trackUxFriction('RAGE_CLICK', elementId, safeElementText);
      }

      // 2. Detect Dead Click on disabled elements
      const isOptionDisabled =
        target.hasAttribute('disabled') ||
        target.getAttribute('aria-disabled') === 'true' ||
        target.classList.contains('pointer-events-none') ||
        target.classList.contains('cursor-not-allowed') ||
        target.closest('[data-locked="true"]') !== null;

      if (isOptionDisabled) {
        this.trackUxFriction('DEAD_CLICK', elementId, safeElementText);
      }
    }, true);
  }

  /**
   * Tracks Web Vitals performance metrics (LCP, INP, CLS) scoped to AI Prep routes.
   */
  static initCoreWebVitalsTracker() {
    if (typeof window === 'undefined' || this.isCwvInitialized) return;
    this.isCwvInitialized = true;

    try {
      const handleMetric = (metric: any) => {
        if (typeof window === 'undefined') return;
        const pathname = window.location.pathname;
        if (!pathname.includes('/aiprep') && !pathname.includes('/user_dashboard/ai-prep')) return;
        const value = Math.round(metric.value);
        this.trackCoreWebVitals(metric.name, value, metric.rating);
      };

      onLCP(handleMetric);
      onINP((metric) => {
        if (metric.value > 200) {
          handleMetric(metric);
        }
      });
      onCLS(handleMetric);
    } catch (_) { }
  }

  /**
   * Tracks WebRTC network and media quality metrics.
   */
  static trackWebRtcHealth(payload: {
    candidate_id?: number;
    assessment_id?: number;
    assessment_uuid?: string;
    ping_ms: number;
    bandwidth_kbps: number;
    packet_loss_pct?: number;
    audio_silence_sec?: number;
  }) {
    this.sendToPostHog({
      candidate_id: payload.candidate_id,
      assessment_id: payload.assessment_id,
      assessment_uuid: payload.assessment_uuid,
      events: [
        {
          stage: 'MEDIA_PIPELINE',
          event_type: 'WEBRTC_HEALTH_METRICS',
          status: 'SUCCESS',
          message: `Media stream network health: ping ${payload.ping_ms}ms, bandwidth ${payload.bandwidth_kbps}kbps`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            ping_ms: payload.ping_ms,
            bandwidth_kbps: payload.bandwidth_kbps,
            ...(payload.packet_loss_pct !== undefined ? { packet_loss_pct: payload.packet_loss_pct } : {}),
            ...(payload.audio_silence_sec !== undefined ? { audio_silence_sec: payload.audio_silence_sec } : {}),
          },
        },
      ],
    });
  }

  /**
   * Tracks Web Vitals performance metrics.
   */
  static trackCoreWebVitals(metricName: 'LCP' | 'INP' | 'CLS' | string, value: number, rating: 'good' | 'needs_improvement' | 'poor') {
    this.sendToPostHog({
      candidate_id: this.getResolvedCandidateId(),
      events: [
        {
          stage: 'FRONTEND_APM',
          event_type: 'CORE_WEB_VITALS',
          status: rating === 'poor' ? 'WARNING' : 'SUCCESS',
          message: `Core Web Vital ${metricName}: ${value}ms (${rating})`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            metric_name: metricName,
            value_ms: value,
            rating,
          },
        },
      ],
    });
  }

  /**
   * Tracks UX Friction alerts (Rage Clicks and Dead Clicks).
   */
  static trackUxFriction(frictionType: 'RAGE_CLICK' | 'DEAD_CLICK', elementId: string, elementText?: string) {
    this.sendToPostHog({
      candidate_id: this.getResolvedCandidateId(),
      events: [
        {
          stage: 'UX_FRICTION',
          event_type: 'UX_FRICTION_ALERT',
          status: 'WARNING',
          message: `UX Friction alert: ${frictionType} detected on ${elementId}`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            friction_type: frictionType,
            element_id: elementId,
            ...(elementText ? { element_text: elementText } : {}),
          },
        },
      ],
    });
  }

  /**
   * Tracks question performance analytics & skip ratios.
   */
  static trackQuestionFriction(payload: {
    question_id: number | string;
    question_number: number;
    duration_seconds: number;
    is_skipped: boolean;
    candidate_id?: number;
    assessment_id?: number;
  }) {
    this.sendToPostHog({
      candidate_id: payload.candidate_id,
      assessment_id: payload.assessment_id,
      events: [
        {
          stage: 'QUESTION_ANALYTICS',
          event_type: 'QUESTION_PERFORMANCE_METRICS',
          status: payload.is_skipped ? 'DECLINED' : 'SUCCESS',
          message: `Question #${payload.question_number} spent ${payload.duration_seconds}s (skipped: ${payload.is_skipped})`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            question_id: payload.question_id,
            question_number: payload.question_number,
            duration_seconds: payload.duration_seconds,
            is_skipped: payload.is_skipped,
          },
        },
      ],
    });
  }

  /**
   * Helper to retrieve currently authenticated candidate_id from client storage or JWT.
   * Always reads JWT first (cleared on logout), then falls back through available sources.
   */
  /**
   * Helper to retrieve currently authenticated candidate_id from client storage or JWT.
   * Always reads JWT first (cleared on logout), then falls back through available sources.
   */
  static getResolvedCandidateId(): number | undefined {
    if (typeof window === 'undefined') return undefined;

    // Primary: use the aiprep-api helper (JWT → cached id → user object)
    const cid = getStoredCandidateId('');
    if (cid !== undefined && cid !== null && cid !== '') {
      const parsedCid = Number(cid);
      if (!isNaN(parsedCid)) return parsedCid;
    }

    // Additional safety net: read user object directly in case getStoredCandidateId
    // returned empty due to a transient parse failure
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        const id = parsed?.candidate_id ?? parsed?.id;
        if (id !== undefined && id !== null && id !== '') {
          const parsedId = Number(id);
          if (!isNaN(parsedId)) return parsedId;
        }
      }
    } catch { }

    return undefined;
  }

  /**
   * Helper to retrieve candidate email from client storage or JWT token.
   */
  static getResolvedCandidateEmail(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    try {
      if (typeof localStorage !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          const email = parsed?.email || parsed?.uname || parsed?.user_email;
          if (email && typeof email === 'string' && email.includes('@')) {
            return email.trim().toLowerCase();
          }
        }
      }
    } catch { }

    try {
      const cookieToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.trim().startsWith('wbl_access_token='))?.split('=')[1]
        : undefined;

      const token =
        (typeof localStorage !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null) ||
        cookieToken;

      if (token && token.includes('.')) {
        const payload = parseJwt(token);
        if (payload) {
          const email = payload?.email || (payload?.sub && payload.sub.includes('@') ? payload.sub : undefined);
          if (email && typeof email === 'string' && email.includes('@')) {
            return email.trim().toLowerCase();
          }
        }
      }
    } catch { }

    return undefined;
  }

  /**
   * Formats a human-friendly full name from an email address when no explicit full name is stored.
   * Example: sonaliojha -> Sonali Ojha
   */
  private static formatNameFromEmail(email: string): string {
    if (!email || typeof email !== 'string' || !email.includes('@')) return '';
    const prefix = email.split('@')[0].trim();
    if (!prefix) return '';

    const alphaOnly = prefix.replace(/[0-9]/g, ' ').replace(/[\._\-]/g, ' ').trim();
    const words = alphaOnly.split(/\s+/).filter(Boolean);

    if (words.length > 0) {
      const capitalized = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      return capitalized.join(' ');
    }
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  /**
   * Helper to retrieve currently authenticated candidate_name from client storage, user object, or JWT token.
   * Prioritizes actual full candidate names (e.g. "Sonali Ojha") over raw emails or numeric IDs.
   * Never outputs numeric candidate IDs.
   */
  static getResolvedCandidateName(fallbackName?: string): string {
    if (typeof window === 'undefined') return 'Candidate';

    const isCleanName = (str?: string | null): boolean => {
      if (!str || !str.trim()) return false;
      const s = str.trim();
      if (!isNaN(Number(s))) return false; // reject numeric candidate IDs like 581
      if (s.includes('@')) return false; // email handled separately as fallback
      if (s.toLowerCase() === 'candidate') return false;
      return true;
    };

    // 1. Direct local/session storage reads (set by login or fetchAndCacheCandidateId)
    try {
      if (typeof localStorage !== 'undefined') {
        const directName =
          localStorage.getItem('candidate_name') ||
          localStorage.getItem('full_name') ||
          localStorage.getItem('candidate_full_name') ||
          localStorage.getItem('user_name') ||
          sessionStorage.getItem('candidate_name');
        if (isCleanName(directName)) return directName!.trim();

        const userStr = localStorage.getItem('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          const fullName = parsed?.full_name || parsed?.candidate_name || parsed?.fullname || parsed?.name;
          if (isCleanName(fullName)) return String(fullName).trim();
          if (parsed?.first_name) {
            const joined = `${parsed.first_name} ${parsed.last_name || ''}`.trim();
            if (isCleanName(joined)) return joined;
          }
        }
      }
    } catch { }

    // 2. Decode JWT token payload (access_token from localStorage or wbl_access_token cookie)
    try {
      const cookieToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.trim().startsWith('wbl_access_token='))?.split('=')[1]
        : undefined;

      const token =
        (typeof localStorage !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null) ||
        cookieToken;

      if (token && token.includes('.')) {
        const payload = parseJwt(token);
        if (payload) {
          const jwtName = payload?.full_name || payload?.candidate_name || payload?.fullname || payload?.name;
          if (isCleanName(jwtName)) return String(jwtName).trim();
          if (payload?.first_name) {
            const joined = `${payload.first_name} ${payload.last_name || ''}`.trim();
            if (isCleanName(joined)) return joined;
          }
        }
      }
    } catch { }

    // 3. Fallback name parameter if passed and clean
    if (isCleanName(fallbackName)) {
      return fallbackName!.trim();
    }

    // 4. Formatted email fallback (e.g. sonaliojha86@gmail.com -> Sonali Ojha)
    try {
      let email: string | undefined;
      if (typeof localStorage !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          email = parsed?.email || parsed?.uname;
        }
      }
      if (!email && fallbackName && fallbackName.includes('@')) {
        email = fallbackName;
      }
      if (!email) {
        const cookieToken = typeof document !== 'undefined'
          ? document.cookie.split('; ').find(row => row.trim().startsWith('wbl_access_token='))?.split('=')[1]
          : undefined;
        const token = (typeof localStorage !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null) || cookieToken;
        if (token && token.includes('.')) {
          const payload = parseJwt(token);
          if (payload) {
            email = payload?.email || (payload?.sub && payload.sub.includes('@') ? payload.sub : undefined);
          }
        }
      }
      if (email) {
        const formatted = this.formatNameFromEmail(email);
        if (formatted && formatted.length >= 2) return formatted;
      }
    } catch { }

    return 'Candidate';
  }

  private static eventSequence = 0;

  private static _sessionId: string | null = null;
  private static get sessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    if (!this._sessionId) {
      this._sessionId = sessionStorage.getItem('x_session_id');
      if (!this._sessionId) {
        this._sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
        sessionStorage.setItem('x_session_id', this._sessionId);
      }
    }
    return this._sessionId;
  }


  /**
   * Strictly sanitizes candidate email using regex to prevent script injection/XSS payloads.
   * Limits max length and ensures conformance to standard email pattern.
   */
  private static sanitizeCandidateEmail(email?: string | null): string | undefined {
    if (!email || typeof email !== 'string') return undefined;
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length > 100) return undefined;
    // Disallow HTML tags, control characters, quotes, or script injection vectors
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return undefined;
    return trimmed;
  }

  /**
   * Strictly sanitizes candidate name using regex to prevent script injection/XSS payloads.
   * Strips HTML tags, control characters, and disallows any characters outside standard name characters.
   */
  private static sanitizeCandidateName(name?: string | null): string {
    if (!name || typeof name !== 'string') return 'Candidate';
    // Strip HTML tags and control characters
    let cleaned = name.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    // Allow only Unicode letters, numbers, spaces, dots, hyphens, apostrophes
    cleaned = cleaned.replace(/[^\p{L}\p{N}\s\.\-']/gu, '');
    cleaned = cleaned.trim().slice(0, 60);
    if (!cleaned || cleaned.toLowerCase() === 'candidate' || cleaned.length < 2) {
      return 'Candidate';
    }
    return cleaned;
  }

  /**
   * Schema allowlist defining permitted telemetry property keys and their expected scalar types.
   */
  private static readonly ALLOWED_METADATA_SCHEMA: Record<string, 'string' | 'number' | 'boolean' | 'string_array' | 'string | number'> = {
    // Errors & Exceptions
    error_message: 'string',
    filename: 'string',
    line_number: 'number',
    column_number: 'number',
    error_name: 'string',
    stack: 'string',
    component_stack: 'string',
    error_code: 'string',

    // Network & WebRTC APM
    ping_ms: 'number',
    bandwidth_kbps: 'number',
    packet_loss_pct: 'number',
    audio_silence_sec: 'number',
    metric_name: 'string',
    value_ms: 'number',
    rating: 'string',

    // UX Friction Tracking
    friction_type: 'string',
    element_id: 'string',
    element_text: 'string',

    // Assessment Selection & Catalog
    catalog_categories: 'string_array',
    assessment_type: 'string',
    is_locked: 'boolean',
    lock_badge: 'string',
    duration: 'number',
    source_page: 'string',
    jd_character_length: 'number',

    // Consent & Modes
    mode: 'string',
    video_analytics_enabled: 'boolean',
    consent_save_recording: 'boolean',
    consent_save_transcript: 'boolean',
    action: 'string',
    reason: 'string',
    source_step: 'string',
    modal_type: 'string',

    // Device Verification
    audio_devices_count: 'number',
    video_devices_count: 'number',
    browser: 'string',
    os: 'string',
    screen_resolution: 'string',
    is_embedded: 'boolean',
    device_category: 'string',
    status: 'string',
    failure_reason: 'string',
    is_retry: 'boolean',
    passed_count: 'number',
    total_retries: 'number',
    permission_state: 'string',
    device_id: 'string',
    device_label: 'string',

    // Practice Sandbox
    practice_question_type: 'string',
    attempt_number: 'number',

    // Assessment Session & Questions
    assessment_id: 'number',
    assessment_uuid: 'string',
    media_type: 'string',
    total_questions: 'number',
    question_count: 'number',
    url: 'string',
    question_id: 'string | number',
    question_number: 'number',
    duration_seconds: 'number',
    is_skipped: 'boolean',

    // Chunks & Media Upload
    chunks_uploaded: 'number',
    chunk_index: 'number',
    chunk_size_bytes: 'number',
    is_final: 'boolean',
    uploaded_chunks_count: 'number',
    retry_count: 'number',

    // Proctoring & Completion
    violation_type: 'string',
    violation_count: 'number',
    time_away_seconds: 'number',
    assessment_status: 'string',
    answered_questions: 'number',
    skipped_questions: 'number',
    total_duration_seconds: 'number',
    last_active_question: 'number',
    step: 'string',
  };

  private static readonly ALLOWED_EVENT_PROPERTY_SCHEMA: Record<string, 'string' | 'number' | 'boolean' | 'string_array' | 'string | number'> = {
    distinct_id: 'string',
    $current_url: 'string',
    stage: 'string',
    status: 'string',
    message: 'string',
    candidate_name: 'string',
    assessment_id: 'number',
    assessment_uuid: 'string',
    event_id: 'string',
    seq: 'number',
    session_id: 'string',
    ...AIPrepTelemetry.ALLOWED_METADATA_SCHEMA,
  };

  /**
   * Validates and sanitizes a property value strictly against its declared schema type.
   * Strictly rejects nested object structures, arbitrary array structures, and prototype pollution.
   */
  private static validateAndSanitizeValue(
    val: any,
    expectedType: 'string' | 'number' | 'boolean' | 'string_array' | 'string | number'
  ): string | number | boolean | string[] | undefined {
    if (val === null || val === undefined) return undefined;

    if (expectedType === 'string') {
      if (typeof val !== 'string') return undefined;
      const stripped = val.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
      const bounded = stripped.length > 200 ? stripped.substring(0, 197) + '...' : stripped;
      return this.escapeHtml(bounded);
    }

    if (expectedType === 'number') {
      if (typeof val !== 'number' || !Number.isFinite(val)) return undefined;
      return val;
    }

    if (expectedType === 'boolean') {
      return typeof val === 'boolean' ? val : undefined;
    }

    if (expectedType === 'string | number') {
      if (typeof val === 'number' && Number.isFinite(val)) return val;
      if (typeof val === 'string') {
        const stripped = val.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
        const bounded = stripped.length > 200 ? stripped.substring(0, 197) + '...' : stripped;
        return this.escapeHtml(bounded);
      }
      return undefined;
    }

    if (expectedType === 'string_array') {
      if (!Array.isArray(val)) return undefined;
      const sanitizedArr: string[] = [];
      for (const item of val.slice(0, 20)) {
        if (typeof item === 'string') {
          const stripped = item.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, 50);
          if (stripped) {
            sanitizedArr.push(this.escapeHtml(stripped));
          }
        }
      }
      return sanitizedArr.length > 0 ? sanitizedArr : undefined;
    }

    return undefined;
  }

  /**
   * Sanitizes metadata against the strict allowlist schema to prevent XSS injection,
   * prototype pollution, and arbitrary object/array serialization.
   */
  private static sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;

    const sanitized: Record<string, any> = Object.create(null);
    let count = 0;

    for (const [key, expectedType] of Object.entries(AIPrepTelemetry.ALLOWED_METADATA_SCHEMA)) {
      if (count >= 50) break;
      if (!Object.prototype.hasOwnProperty.call(metadata, key)) continue;

      const rawVal = metadata[key];
      if (rawVal === undefined || rawVal === null) continue;

      const validatedVal = this.validateAndSanitizeValue(rawVal, expectedType);
      if (validatedVal !== undefined) {
        sanitized[key] = validatedVal;
        count++;
      }
    }

    return count > 0 ? { ...sanitized } : undefined;
  }

  /**
   * Dispatches an observability event directly to PostHog Cloud.
   * Prefers PostHog SDK capture (HIGH 2), falling back to custom GET transport if SDK is unavailable.
   * Sends sanitized candidate_name to PostHog identity and event properties.
   */
  static sendToPostHog(payload: ObservabilityPostHogPayload) {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    if (!pathname.includes('/aiprep') && !pathname.includes('/user_dashboard')) {
      return;
    }

    let candidateNameParam = payload.candidate_name;
    if (candidateNameParam && (!isNaN(Number(candidateNameParam)) || String(candidateNameParam).includes('@') || String(candidateNameParam).toLowerCase() === 'candidate')) {
      candidateNameParam = undefined;
    }

    const rawCandidateName = candidateNameParam ?? this.getResolvedCandidateName();
    const effectiveCandidateName = this.sanitizeCandidateName(rawCandidateName);
    const distinctId = (effectiveCandidateName && effectiveCandidateName !== 'Candidate' ? effectiveCandidateName : undefined) || (this.sessionId ? `session_${this.sessionId}` : 'anonymous');

    // Move identify/reset to the TOP before firing events
    if (distinctId && distinctId !== 'anonymous') {
      try {
        if (this.lastIdentifiedCandidateId && String(this.lastIdentifiedCandidateId) !== distinctId) {
          try { posthog.reset(); } catch (_) { }
        }
        this.lastIdentifiedCandidateId = distinctId;
        posthog.identify(distinctId, {
          candidate_name: effectiveCandidateName,
        });
      } catch (_) { }
    }

    const nowIso = new Date().toISOString();

    payload.events.forEach((evt) => {
      this.eventSequence++;
      const cleanMeta = this.sanitizeMetadata(evt.metadata);
      const safeRawMsg = evt.message ? String(evt.message).replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim() : '';
      const cleanMsg = safeRawMsg && safeRawMsg.length > 150 ? safeRawMsg.substring(0, 147) + '...' : (safeRawMsg || undefined);

      const preparedEvent = {
        ...evt,
        message: cleanMsg,
        metadata: cleanMeta,
        client_timestamp: evt.client_timestamp || nowIso,
        event_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        seq: this.eventSequence,
        session_id: this.sessionId,
        candidate_name: effectiveCandidateName,
        assessment_id: payload.assessment_id,
        assessment_uuid: payload.assessment_uuid,
      };

      try {
        const eventProperties: Record<string, any> = {
          ...(cleanMeta || {}),
          distinct_id: distinctId,
          stage: evt.stage,
          status: evt.status,
          message: cleanMsg,
          candidate_name: effectiveCandidateName,
          assessment_id: payload.assessment_id,
          assessment_uuid: payload.assessment_uuid,
          event_id: preparedEvent.event_id,
          seq: preparedEvent.seq,
          session_id: preparedEvent.session_id,
        };

        // Prefer official PostHog SDK capture (HIGH 2)
        let capturedViaSdk = false;
        try {
          if (typeof posthog !== 'undefined' && (posthog as any).__loaded) {
            posthog.capture(evt.event_type, eventProperties);
            capturedViaSdk = true;
          }
        } catch (_) { }

        // Fallback to custom GET sender only if SDK is unavailable or unloaded
        if (!capturedViaSdk) {
          this.sendPostHogGetEvent(evt.event_type, eventProperties);
        }
      } catch (_) { }
    });
  }

  /**
   * Encodes HTML entities in strings to mitigate any potential stored XSS in observability dashboards.
   */
  static escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Dispatches a PostHog telemetry event using an explicit HTTP GET call with Base64 payload,
   * strictly validating all property keys and scalar types against the allowlist schema.
   */
  static sendPostHogGetEvent(eventName: string, properties: Record<string, any> = {}) {
    if (typeof window === 'undefined') return;
    try {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');
      if (!apiKey) return;

      // Validate eventName format
      if (typeof eventName !== 'string' || !/^[A-Za-z0-9_]{1,64}$/.test(eventName.trim())) {
        return;
      }
      const safeEventName = eventName.trim();

      // Enforce strict allowlist schema for all event properties
      const safeProperties: Record<string, any> = Object.create(null);
      let keyCount = 0;
      const MAX_KEYS = 50;

      for (const [key, expectedType] of Object.entries(AIPrepTelemetry.ALLOWED_EVENT_PROPERTY_SCHEMA)) {
        if (keyCount >= MAX_KEYS) break;
        if (!Object.prototype.hasOwnProperty.call(properties, key)) continue;

        const val = properties[key];
        if (val === undefined || val === null) continue;

        const validatedVal = this.validateAndSanitizeValue(val, expectedType);
        if (validatedVal !== undefined) {
          safeProperties[key] = validatedVal;
          keyCount++;
        }
      }

      const rawDistinctId =
        (safeProperties.candidate_name && safeProperties.candidate_name !== 'Candidate'
          ? safeProperties.candidate_name
          : undefined) ||
        properties.distinct_id ||
        (properties.session_id ? `session_${properties.session_id}` : undefined) ||
        'anonymous';

      const distinctId = typeof rawDistinctId === 'string'
        ? rawDistinctId.replace(/[^\w.-]/g, '').trim().slice(0, 100) || 'anonymous'
        : 'anonymous';

      const safeUrl = typeof window !== 'undefined' && window.location ? window.location.href.slice(0, 500) : '';

      const payload = {
        api_key: apiKey.trim(),
        event: safeEventName,
        properties: {
          distinct_id: distinctId,
          $current_url: safeUrl,
          ...safeProperties,
        },
        timestamp: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(payload);
      const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
      const getUrl = `${posthogHost}/e/?data=${encodeURIComponent(base64Data)}`;

      fetch(getUrl, {
        method: 'GET',
        keepalive: true,
        cache: 'no-store',
      }).catch(() => { });
    } catch (_) { }
  }

  // ==========================================
  // STEP 1: Assessment Selection
  // ==========================================
  static trackAssessmentSelectionPage(candidateId?: number, categories?: string[]) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'ASSESSMENT_SELECTION',
          event_type: 'ASSESSMENT_SELECTION_PAGE_VIEWED',
          status: 'SUCCESS',
          message: 'Candidate viewed assessment selection page',
          client_timestamp: new Date().toISOString(),
          metadata: {
            ...(categories && categories.length > 0 ? { catalog_categories: categories } : {}),
          },
        },
      ],
    });
  }

  static trackAssessmentSelected(payload: AssessmentTypeSelectedPayload) {
    if (payload.is_locked) {
      this.sendToPostHog({
        candidate_id: payload.candidate_id,
        events: [
          {
            stage: 'ASSESSMENT_SELECTION',
            event_type: 'ASSESSMENT_LOCKED_ATTEMPT',
            status: 'LOCKED',
            message: `Candidate clicked locked assessment type ${payload.assessment_type}`,
            client_timestamp: new Date().toISOString(),
            metadata: {
              assessment_type: payload.assessment_type,
              is_locked: true,
              ...(payload.lock_badge ? { lock_badge: payload.lock_badge } : {}),
            },
          },
        ],
      });
    } else {
      this.sendToPostHog({
        candidate_id: payload.candidate_id,
        events: [
          {
            stage: 'ASSESSMENT_SELECTION',
            event_type: 'ASSESSMENT_TYPE_SELECTED',
            status: 'SUCCESS',
            message: `Candidate selected assessment type ${payload.assessment_type}`,
            client_timestamp: new Date().toISOString(),
            metadata: {
              assessment_type: payload.assessment_type,
              ...(payload.duration ? { duration: payload.duration } : {}),
              ...(payload.source_page ? { source_page: payload.source_page } : {}),
            },
          },
        ],
      });
    }
  }

  static trackAssessmentInfoViewed(candidateId: number | undefined, assessmentType: string) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'ASSESSMENT_SELECTION',
          event_type: 'ASSESSMENT_INFO_VIEWED',
          status: 'SUCCESS',
          message: `Candidate viewed info details for ${assessmentType}`,
          client_timestamp: new Date().toISOString(),
          metadata: { assessment_type: assessmentType },
        },
      ],
    });
  }

  static trackJdAttached(candidateId: number | undefined, characterLength: number) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'ASSESSMENT_SELECTION',
          event_type: 'JD_TEXT_ATTACHED',
          status: 'SUCCESS',
          message: 'Candidate attached job description for JD_INTRO',
          client_timestamp: new Date().toISOString(),
          metadata: {
            assessment_type: 'JD_INTRO',
            jd_character_length: characterLength,
          },
        },
      ],
    });
  }

  // ==========================================
  // STEP 2: Consent & Mode
  // ==========================================
  static trackConsentModeSelected(candidateId: number | undefined, mode: 'AUDIO_ONLY' | 'VIDEO_AUDIO') {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'CONSENT',
          event_type: 'ASSESSMENT_MODE_SELECTED',
          status: 'SUCCESS',
          message: `Candidate selected ${mode} mode`,
          client_timestamp: new Date().toISOString(),
          metadata: { mode },
        },
      ],
    });
  }

  static trackConsentAccepted(candidateId: number | undefined, mode: string, videoAnalytics: boolean) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'CONSENT',
          event_type: 'CONSENT_ACCEPTED',
          status: 'SUCCESS',
          message: `Candidate accepted ${mode} consent terms`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            mode,
            video_analytics_enabled: mode === 'VIDEO_AUDIO' ? videoAnalytics : false,
            consent_save_recording: true,
            consent_save_transcript: true,
          },
        },
      ],
    });
  }

  static trackConsentDeclined(candidateId: number | undefined, mode: string, reason?: string) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'CONSENT',
          event_type: 'CONSENT_DECLINED',
          status: 'DECLINED',
          message: 'Candidate declined mandatory recording consent',
          client_timestamp: new Date().toISOString(),
          metadata: {
            mode,
            consent_save_recording: false,
            action: 'consent_declined',
            reason: reason || 'candidate_unchecked_recording_consent',
          },
        },
      ],
    });
  }

  static trackAnalyticsConsentDeclined(candidateId: number | undefined, mode: string) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'CONSENT',
          event_type: 'VIDEO_ANALYTICS_CONSENT_DECLINED',
          status: 'DECLINED',
          message: 'Candidate accepted recording but opted out of AI facial analytics',
          client_timestamp: new Date().toISOString(),
          metadata: {
            mode,
            video_analytics_enabled: false,
            consent_save_recording: true,
            action: 'video_analytics_consent_declined',
          },
        },
      ],
    });
  }

  static trackConsentCancelled(candidateId: number | undefined) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'CONSENT',
          event_type: 'CONSENT_CANCELLED',
          status: 'DECLINED',
          message: 'Candidate cancelled consent dialog and returned to catalog',
          client_timestamp: new Date().toISOString(),
          metadata: {
            action: 'consent_modal_cancelled',
            source_step: 'CONSENT',
          },
        },
      ],
    });
  }

  static trackConsentInfoViewed(candidateId: number | undefined, modalType: string) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'CONSENT',
          event_type: 'CONSENT_INFO_VIEWED',
          status: 'SUCCESS',
          message: `Candidate opened info modal for ${modalType}`,
          client_timestamp: new Date().toISOString(),
          metadata: { modal_type: modalType },
        },
      ],
    });
  }

  // ==========================================
  // STEP 3: Hardware Verification
  // ==========================================
  static trackDeviceCheckStarted(payload: {
    candidate_id?: number;
    audio_devices_count?: number;
    video_devices_count?: number;
    browser?: string;
    os?: string;
    screen_resolution?: string;
  }) {
    this.sendToPostHog({
      candidate_id: payload.candidate_id,
      events: [
        {
          stage: 'DEVICE_CHECK',
          event_type: 'DEVICE_CHECK_STARTED',
          status: 'SUCCESS',
          message: 'Candidate entered hardware verification wizard',
          client_timestamp: new Date().toISOString(),
          metadata: {
            ...(payload.audio_devices_count !== undefined ? { audio_devices_count: payload.audio_devices_count } : {}),
            ...(payload.video_devices_count !== undefined ? { video_devices_count: payload.video_devices_count } : {}),
            ...(payload.browser ? { browser: payload.browser } : {}),
            ...(payload.os ? { os: payload.os } : {}),
            ...(payload.screen_resolution ? { screen_resolution: payload.screen_resolution } : {}),
            is_embedded: typeof window !== 'undefined' ? window.top !== window : false,
          },
        },
      ],
    });
  }

  static trackDeviceCheck(
    category: DeviceCheckCategory,
    status: DeviceCheckStatus | ObservabilityStatus,
    failureReason?: DeviceFailureReason | string,
    metadata?: Record<string, any>,
    candidateId?: number
  ) {
    let stage: ObservabilityStage = 'DEVICE_CHECK';
    if (category === DeviceCheckCategory.MICROPHONE) stage = 'HARDWARE_MIC';
    else if (category === DeviceCheckCategory.SPEAKER) stage = 'HARDWARE_SPEAKER';
    else if (category === DeviceCheckCategory.CAMERA) stage = 'HARDWARE_CAMERA';

    let eventType = 'DEVICE_CHECK_PASSED';
    let obsStatus: ObservabilityStatus = 'SUCCESS';
    let message = `${category} check verified successfully`;

    if (status === DeviceCheckStatus.PASSED || status === 'SUCCESS') {
      eventType = 'DEVICE_CHECK_PASSED';
      obsStatus = 'SUCCESS';
    } else if (status === DeviceCheckStatus.DECLINED || failureReason === DeviceFailureReason.PERMISSION_BLOCKED || failureReason === 'PERMISSION_DENIED') {
      eventType = 'DEVICE_CHECK_FAILED';
      obsStatus = 'DECLINED';
      message = `${category} permission denied or blocked by browser`;
    } else {
      eventType = metadata?.is_retry ? 'DEVICE_CHECK_RETRY' : 'DEVICE_CHECK_FAILED';
      obsStatus = 'FAILED';
      message = `${category} check failed: ${failureReason || 'unknown issue'}`;
    }

    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage,
          event_type: eventType,
          status: obsStatus,
          message,
          client_timestamp: new Date().toISOString(),
          metadata: {
            device_category: category,
            status: obsStatus.toLowerCase(),
            ...(failureReason ? { failure_reason: failureReason } : {}),
            ...(metadata || {}),
          },
        },
      ],
    });
  }

  static trackDeviceCheckCompleted(payload: {
    candidate_id?: number;
    passed_count: number;
    total_retries?: number;
    duration_seconds?: number;
  }) {
    this.sendToPostHog({
      candidate_id: payload.candidate_id,
      events: [
        {
          stage: 'DEVICE_CHECK',
          event_type: 'DEVICE_CHECK_COMPLETED',
          status: 'SUCCESS',
          message: 'All hardware checks completed successfully',
          client_timestamp: new Date().toISOString(),
          metadata: {
            passed_count: payload.passed_count,
            ...(payload.total_retries !== undefined ? { total_retries: payload.total_retries } : {}),
            ...(payload.duration_seconds !== undefined ? { duration_seconds: payload.duration_seconds } : {}),
          },
        },
      ],
    });
  }


  static trackPracticePage(payload: PracticeTelemetryPayload) {
    let eventType = 'PRACTICE_ENTERED';
    let obsStatus: ObservabilityStatus = 'SUCCESS';
    let message = 'Candidate entered interactive practice sandbox';

    if (payload.action === 'PRACTICE_SKIPPED' || payload.action === 'practice_skipped') {
      eventType = 'PRACTICE_SKIPPED';
      obsStatus = 'DECLINED';
      message = 'Candidate chose to skip practice trial';
    } else if (payload.action === 'RECORDING_STARTED' || payload.action === 'practice_recording_started') {
      eventType = 'RECORDING_STARTED';
      message = 'Candidate started practice response recording';
    } else if (payload.action === 'RECORDING_FINISHED' || payload.action === 'practice_recording_finished') {
      eventType = 'RECORDING_FINISHED';
      message = 'Candidate finished practice response recording';
    } else if (payload.action === 'PLAYBACK_STARTED' || payload.action === 'practice_playback_started') {
      eventType = 'PLAYBACK_STARTED';
      message = 'Candidate started playback review of practice trial';
    } else if (payload.action === 'ASSESSMENT_LAUNCHED' || payload.action === 'practice_assessment_launched') {
      eventType = 'ASSESSMENT_LAUNCHED';
      message = 'Candidate confirmed practice and launched real assessment';
    }

    this.sendToPostHog({
      candidate_id: payload.candidate_id,
      events: [
        {
          stage: 'PRACTICE',
          event_type: eventType,
          status: obsStatus,
          message,
          client_timestamp: new Date().toISOString(),
          metadata: {
            practice_question_type: payload.practice_question_type || 'WARMUP_INTRO',
            ...(payload.assessment_type ? { assessment_type: payload.assessment_type } : {}),
            ...(payload.mode ? { mode: payload.mode } : {}),
            ...(payload.attempt_number !== undefined ? { attempt_number: payload.attempt_number } : {}),
            ...(payload.duration_seconds !== undefined ? { duration_seconds: payload.duration_seconds } : {}),
            ...(payload.reason ? { reason: payload.reason } : {}),
          },
        },
      ],
    });
  }

  static trackAssessmentCreation(payload: {
    candidate_id?: number;
    assessment_id?: number;
    assessment_uuid?: string;
    assessment_type?: string;
    media_type?: string;
    success: boolean;
    question_count?: number;
    error_message?: string;
  }) {
    this.sendToPostHog({
      candidate_id: payload.candidate_id,
      assessment_id: payload.assessment_id,
      assessment_uuid: payload.assessment_uuid,
      events: [
        {
          stage: 'ASSESSMENT_INIT',
          event_type: payload.success ? 'ASSESSMENT_CREATED' : 'ASSESSMENT_CREATION_FAILED',
          status: payload.success ? 'SUCCESS' : 'FAILED',
          message: payload.success
            ? `Assessment #${payload.assessment_id} initialized with ${payload.question_count ?? 0} questions`
            : `Failed to initialize assessment: ${payload.error_message || 'API error'}`,
          client_timestamp: new Date().toISOString(),
          metadata: payload.success
            ? {
              assessment_id: payload.assessment_id,
              assessment_uuid: payload.assessment_uuid,
              ...(payload.assessment_type ? { assessment_type: payload.assessment_type } : {}),
              ...(payload.media_type ? { media_type: payload.media_type } : {}),
              ...(payload.question_count !== undefined ? { total_questions: payload.question_count, question_count: payload.question_count } : {}),
            }
            : {
              error_code: 'API_500',
              error_message: payload.error_message,
            },
        },
      ],
    });
  }

  static trackApiFailure(endpoint: string, statusCode: number, errorMessage: string, candidateId?: number) {
    // Only track failures for AI Prep endpoints or when on AI Prep pages
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/aiprep') && !endpoint.includes('aiprep')) return;

    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: 'API_FAILURE',
          event_type: 'API_CALL_FAILED',
          status: 'FAILED',
          message: `API call failed with status ${statusCode}`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            url: endpoint,
            status: statusCode,
            error_message: errorMessage,
          },
        },
      ],
    });
  }

  // ==========================================
  // STEP 5 & 6: Live Session, Media & Completion
  // ==========================================
  static trackQuestionAction(payload: QuestionTelemetryPayload) {
    let stage: ObservabilityStage = 'ASSESSMENT_SESSION';
    let eventType = String(payload.action);
    let status: ObservabilityStatus = 'SUCCESS';
    let message = `Question #${payload.question_number} action: ${payload.action}`;

    if (payload.action === 'QUESTION_SKIPPED' || payload.action === 'question_skipped') {
      eventType = 'QUESTION_SKIPPED';
      status = 'DECLINED';
      message = `Candidate skipped question #${payload.question_number}`;
    } else if (payload.action === 'QUESTION_VIEWED' || payload.action === 'question_viewed') {
      eventType = 'QUESTION_VIEWED';
      message = `Candidate viewed question #${payload.question_number}`;
    } else if (payload.action === 'START_RECORDING' || payload.action === 'start_recording') {
      eventType = 'START_RECORDING';
      message = `Candidate started speaking for question #${payload.question_number}`;
    } else if (payload.action === 'QUESTION_ANSWERED' || payload.action === 'QUESTION_SUBMITTED' || payload.action === 'question_answered' || payload.action === 'question_submitted') {
      eventType = 'QUESTION_SUBMITTED';
      message = `Question #${payload.question_number} answered and submitted`;
    }

    this.sendToPostHog({
      assessment_id: payload.assessment_id,
      assessment_uuid: payload.assessment_uuid,
      candidate_id: payload.candidate_id,
      events: [
        {
          stage,
          event_type: eventType,
          status,
          message,
          client_timestamp: new Date().toISOString(),
          metadata: {
            question_id: payload.question_id,
            question_number: payload.question_number,
            ...(payload.total_questions !== undefined ? { total_questions: payload.total_questions } : {}),
            ...(payload.duration_seconds !== undefined ? { duration_seconds: payload.duration_seconds } : {}),
            ...(payload.chunks_uploaded !== undefined ? { chunks_uploaded: payload.chunks_uploaded } : {}),
          },
        },
      ],
    });
  }

  static trackAudioChunk(payload: {
    assessment_id: number;
    assessment_uuid: string;
    candidate_id?: number;
    question_id: number | string;
    chunk_index: number;
    chunk_size_bytes: number;
    is_final: boolean;
    uploaded_chunks_count: number;
    success: boolean;
    retry_count?: number;
    error_message?: string;
  }) {
    this.sendToPostHog({
      assessment_id: payload.assessment_id,
      assessment_uuid: payload.assessment_uuid,
      candidate_id: payload.candidate_id,
      events: [
        {
          stage: 'MEDIA_PIPELINE',
          event_type: payload.success ? 'AUDIO_CHUNK_UPLOADED' : 'AUDIO_CHUNK_FAILED',
          status: payload.success ? 'SUCCESS' : 'FAILED',
          message: payload.success
            ? `30s audio slice #${payload.chunk_index} uploaded successfully`
            : `30s audio slice #${payload.chunk_index} upload failed`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            question_id: payload.question_id,
            chunk_index: payload.chunk_index,
            chunk_size_bytes: payload.chunk_size_bytes,
            is_final: payload.is_final,
            uploaded_chunks_count: payload.uploaded_chunks_count,
            ...(payload.retry_count !== undefined ? { retry_count: payload.retry_count } : {}),
            ...(payload.error_message ? { error_message: payload.error_message } : {}),
          },
        },
      ],
    });
  }

  static trackProctoringViolation(payload: {
    assessment_id: number;
    assessment_uuid: string;
    candidate_id?: number;
    violation_type: string;
    violation_count: number;
    time_away_seconds: number;
  }) {
    this.sendToPostHog({
      assessment_id: payload.assessment_id,
      assessment_uuid: payload.assessment_uuid,
      candidate_id: payload.candidate_id,
      events: [
        {
          stage: 'PROCTORING',
          event_type: 'PROCTORING_VIOLATION',
          status: 'WARNING',
          message: `Proctoring alert: candidate tab switched away for ${payload.time_away_seconds}s`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            violation_type: payload.violation_type,
            violation_count: payload.violation_count,
            time_away_seconds: payload.time_away_seconds,
          },
        },
      ],
    });
  }


  static trackAssessmentCompletion(payload: AssessmentCompletionTelemetryPayload) {
    const isCompleted = payload.assessment_status === 'COMPLETED';
    this.sendToPostHog({
      assessment_id: payload.assessment_id,
      assessment_uuid: payload.assessment_uuid,
      candidate_id: payload.candidate_id,
      events: [
        {
          stage: 'ASSESSMENT_COMPLETION',
          event_type: isCompleted ? 'ASSESSMENT_COMPLETED' : 'ASSESSMENT_ABANDONED',
          status: isCompleted ? 'SUCCESS' : 'FAILED',
          message: isCompleted
            ? `Assessment completed: ${payload.answered_questions ?? 0}/${payload.total_questions ?? 0} answered`
            : `Assessment abandoned by candidate at question #${payload.last_active_question ?? 1}`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            assessment_status: payload.assessment_status,
            ...(payload.total_questions ? { total_questions: payload.total_questions } : {}),
            ...(payload.answered_questions ? { answered_questions: payload.answered_questions } : {}),
            ...(payload.skipped_questions ? { skipped_questions: payload.skipped_questions } : {}),
            ...(payload.total_duration_seconds ? { total_duration_seconds: payload.total_duration_seconds } : {}),
            ...(payload.last_active_question ? { last_active_question: payload.last_active_question } : {}),
            ...(payload.reason ? { reason: payload.reason } : {}),
          },
        },
      ],
    });
  }

  // Step transition telemetry
  static trackWizardStep(step: AIWizardStep | string, assessmentType?: string, candidateId?: number) {
    this.sendToPostHog({
      candidate_id: candidateId,
      events: [
        {
          stage: String(step),
          event_type: 'WIZARD_STEP_VIEWED',
          status: 'SUCCESS',
          message: `Candidate viewed wizard step ${step}`,
          client_timestamp: new Date().toISOString(),
          metadata: {
            step: String(step),
            ...(assessmentType ? { assessment_type: assessmentType } : {}),
          },
        },
      ],
    });
  }

  static trackTabSwitch(payload: TabSwitchTelemetryPayload) {
    if (payload.assessment_id && payload.assessment_uuid) {
      this.trackProctoringViolation({
        assessment_id: payload.assessment_id,
        assessment_uuid: payload.assessment_uuid,
        candidate_id: payload.candidate_id,
        violation_type: payload.hidden ? 'TAB_SWITCH_BLUR' : 'TAB_SWITCH_FOCUS',
        violation_count: payload.violation_count || 1,
        time_away_seconds: payload.time_away_seconds || 0,
      });
    }
  }
}
