import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/accessibility',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'line',
  use: {
    baseURL: externalBaseURL || 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: externalBaseURL
    ? undefined
    : {
      command: 'python3 -m http.server 4173 --directory docs',
      url: 'http://127.0.0.1:4173/generator/',
      reuseExistingServer: !process.env.CI,
    },
});
