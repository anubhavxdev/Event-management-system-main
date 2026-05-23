import { test, expect } from '@playwright/test';

test('admin can open login page', async ({ page }) => {
  await page.goto('/login');

  await expect(page).toHaveURL(/login/);
});

test('admin area loads without crashing', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toBeVisible();
});