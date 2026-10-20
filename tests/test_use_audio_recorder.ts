import assert from 'assert';
import { getSupportedAudioMimeType } from '../hooks/useAudioRecorder';

// 1. Test in SSR / Node environment (window undefined)
console.log('Testing getSupportedAudioMimeType in Node/SSR environment...');
const ssrMime = getSupportedAudioMimeType();
assert.strictEqual(ssrMime, 'audio/webm;codecs=opus', 'Should default to audio/webm;codecs=opus in SSR');
console.log('✓ SSR fallback test passed:', ssrMime);

// 2. Test in simulated browser environment (MediaRecorder with isTypeSupported)
console.log('Testing getSupportedAudioMimeType with simulated MediaRecorder browser support...');
(global as any).window = {};
(global as any).MediaRecorder = {
  isTypeSupported: (type: string) => {
    // Simulate Safari where only audio/mp4 is supported
    return type === 'audio/mp4';
  },
};

const safariMime = getSupportedAudioMimeType();
assert.strictEqual(safariMime, 'audio/mp4', 'Should pick audio/mp4 when only mp4 is supported');
console.log('✓ Safari audio/mp4 fallback test passed:', safariMime);

// 3. Test Chrome / Firefox where audio/webm;codecs=opus is supported
(global as any).MediaRecorder = {
  isTypeSupported: (type: string) => {
    return type.startsWith('audio/webm');
  },
};

const chromeMime = getSupportedAudioMimeType();
assert.strictEqual(chromeMime, 'audio/webm;codecs=opus', 'Should pick audio/webm;codecs=opus when available');
console.log('✓ Chrome/Firefox audio/webm;codecs=opus test passed:', chromeMime);

console.log('\nAll useAudioRecorder logic tests passed successfully!');
