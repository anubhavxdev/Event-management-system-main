import { test, expect } from '@playwright/test';

test('organizer can open login page', async ({ page }) => {
  await page.goto('/login');

  await expect(page).toHaveURL(/login/);
});

test('organizer area loads without crashing', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toBeVisible();
});