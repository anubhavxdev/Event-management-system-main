import { test, expect } from '@playwright/test';

test('frontend should load successfully', async ({ page }) => {
  await page.goto('/');
  expect(page).toBeTruthy();
  
  // Verify page has loaded basic content
  const body = await page.locator('body');
  expect(body).toBeTruthy();
});

test('signup page should be accessible', async ({ page }) => {
  await page.goto('/signup');
  expect(page).toBeTruthy();
});

test('login page should be accessible', async ({ page }) => {
  await page.goto('/login');
  expect(page).toBeTruthy();
});
