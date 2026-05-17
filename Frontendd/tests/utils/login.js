export async function login(page, email, password) {
  await page.goto('/login');

  await page
    .locator('input[placeholder="name@example.com"]')
    .fill(email);

  await page
    .locator('input[type="password"]')
    .fill(password);

  await page.getByRole('button', {
    name: /sign in/i,
  }).click();
}