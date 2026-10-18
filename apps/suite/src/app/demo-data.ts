/**
 * Whether the numbers on screen are demo data, served by the mock backend.
 * True in development and in the demo on GitHub Pages; the production build
 * replaces this file with `demo-data.production.ts`, where it is false.
 *
 * Kept apart from `mock-backend.ts` so the shell can read it without pulling
 * the mock into the initial bundle.
 */
export const DEMO_DATA = true;
