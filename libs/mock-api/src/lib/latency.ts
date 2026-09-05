/**
 * Fake network latency for the mock backend.
 *
 * Instant mock responses make a demo lie: loading states never render, so
 * skeletons and spinners go untested and the UI looks smoother than it will
 * against a real API. A random delay in a realistic band keeps those states
 * honest.
 */
export const MOCK_LATENCY_MIN_MS = 200;
export const MOCK_LATENCY_MAX_MS = 600;

export function randomLatency(
  min = MOCK_LATENCY_MIN_MS,
  max = MOCK_LATENCY_MAX_MS,
): number {
  return Math.floor(min + Math.random() * (max - min));
}
