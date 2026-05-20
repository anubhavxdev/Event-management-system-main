/* global process */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  timeout: 30000,

  use: {
    baseURL: process.env.CLIENT_URL || 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: process.env.CI 
    ? undefined  // In CI, backend is already started in previous job step
    : [
        {
          command: 'cd ../backend && npm run dev',
          port: 5050,
          reuseExistingServer: false,
          timeout: 120 * 1000,
        },
        {
          command: 'npm run dev',
          port: 5173,
          reuseExistingServer: false,
          timeout: 120 * 1000,
        },
      ],
});