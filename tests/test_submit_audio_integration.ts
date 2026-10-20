import assert from 'assert';
import { aiPrepApi } from '../lib/aiprep-api';

console.log('Testing frontend submitAssessment and submitAssessmentStream with direct audioBlob...');

// Mock global fetch to capture request
let capturedRequest: { url: string; method: string; body: any; headers: any } | null = null;

(global as any).fetch = async (url: string, init: any) => {
  capturedRequest = {
    url,
    method: init.method,
    body: init.body,
    headers: init.headers,
  };

  // Mock SSE response for submitAssessmentStream
  if (url.includes('stream=true')) {
    const ssePayload = 'data: {"status": "COMPLETED", "progress": 100, "step": "Report Generated"}\n\n';
    return {
      ok: true,
      status: 200,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/event-stream' : null),
      },
      body: {
        getReader: () => {
          let sent = false;
          return {
            read: async () => {
              if (!sent) {
                sent = true;
                return { done: false, value: new TextEncoder().encode(ssePayload) };
              }
              return { done: true, value: undefined };
            },
            cancel: async () => {},
          };
        },
      },
    };
  }

  // Mock standard JSON response
  return {
    ok: true,
    status: 200,
    headers: {
      get: (h: string) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    json: async () => ({ id: 101, status: 'COMPLETED' }),
    text: async () => JSON.stringify({ id: 101, status: 'COMPLETED' }),
  };
};

// Polyfill FormData for Node test if not present
if (typeof (global as any).FormData === 'undefined') {
  class MockFormData {
    private entries: Record<string, any> = {};
    append(key: string, value: any, filename?: string) {
      this.entries[key] = { value, filename };
    }
    get(key: string) {
      return this.entries[key]?.value;
    }
    has(key: string) {
      return key in this.entries;
    }
  }
  (global as any).FormData = MockFormData;
}

// Polyfill Blob if needed
if (typeof (global as any).Blob === 'undefined') {
  class MockBlob {
    size: number;
    type: string;
    constructor(parts: any[] = [], options: any = {}) {
      this.size = parts.reduce((acc, p) => acc + (p?.length || 0), 0);
      this.type = options.type || '';
    }
  }
  (global as any).Blob = MockBlob;
}

async function runTests() {
  const mockAudioBlob = new (global as any).Blob(['mock audio bytes'], { type: 'audio/webm;codecs=opus' });

  // 1. Test submitAssessmentStream with audioBlob
  console.log('Testing submitAssessmentStream with audioBlob...');
  const progressEvents: any[] = [];
  const result = await aiPrepApi.submitAssessmentStream(
    101,
    { is_final: true, client_duration_seconds: 45.0 },
    (ev) => progressEvents.push(ev),
    3042,
    mockAudioBlob
  );

  assert.ok(capturedRequest, 'Request should have been captured');
  assert.strictEqual(capturedRequest!.method, 'PUT');
  assert.ok(capturedRequest!.body instanceof (global as any).FormData, 'Body must be FormData for audio upload');
  assert.ok(capturedRequest!.body.has('audio'), 'FormData must contain audio file');
  assert.ok(capturedRequest!.body.has('assessment_data'), 'FormData must contain assessment_data JSON');
  assert.strictEqual(result.status, 'COMPLETED');
  assert.strictEqual(progressEvents.length, 1);
  console.log('✓ submitAssessmentStream multipart FormData test passed');

  // 2. Test submitAssessmentStream without audioBlob (legacy JSON backward-compatibility)
  console.log('Testing submitAssessmentStream without audioBlob (JSON fallback)...');
  await aiPrepApi.submitAssessmentStream(
    101,
    { is_final: true, client_duration_seconds: 45.0 },
    undefined,
    3042,
    null
  );

  assert.ok(capturedRequest, 'Request should have been captured');
  assert.strictEqual(capturedRequest!.headers['Content-Type'], 'application/json');
  assert.strictEqual(typeof capturedRequest!.body, 'string');
  console.log('✓ submitAssessmentStream JSON fallback test passed');

  console.log('\nAll frontend submission integration tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
