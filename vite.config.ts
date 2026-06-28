import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages deploys this repository at:
// https://debasishsahoo.github.io/ip-intelligence-platform/
// Therefore Vite assets need the repository name as the base path.
export default defineConfig({
  base: '/ip-intelligence-platform/',
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts' },
});
