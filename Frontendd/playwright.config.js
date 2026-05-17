/* global process */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 30000,

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

 webServer: [
  {
    command: 'cd ../backend && npm install && npm run dev',
    port: 5050,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
],
});