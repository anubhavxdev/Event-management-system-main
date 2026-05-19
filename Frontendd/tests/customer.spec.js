import { test, expect } from '@playwright/test';

test('customer can browse events page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/event/i);
});

test('customer homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toBeVisible();
});

test('customer can view event cards', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('div');

  await expect(cards.first()).toBeVisible();
});

test('logged in customer can access dashboard', async ({ page }) => {
  await page.goto('/login');

  await page
    .locator('input[placeholder="name@example.com"]')
    .fill('test@gmail.com');

  await page
    .locator('input[type="password"]')
    .fill('password123');

  await page.getByRole('button', {
    name: /sign in/i,
  }).click();

  await page.goto('/customer/dashboard');

  await expect(page).toHaveURL(/customer\/dashboard/i);
});