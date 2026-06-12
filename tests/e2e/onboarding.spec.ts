import { test, expect } from './fixtures';

test('App Onboarding and Settings', async ({ page, extensionId }) => {
  // Navigate to the side panel
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`);

  // Verify the header is present
  await expect(page.locator('text=Universal AI')).toBeVisible();

  // Verify the empty state shows "No Active Provider"
  await expect(page.locator('text=No Active Provider')).toBeVisible();

  // Click on "Configure Providers" button
  await page.click('button:has-text("Configure Providers")');

  // Verify we are on the settings page by checking if "Settings" header is visible
  await expect(page.locator('h1', { hasText: 'Settings' })).toBeVisible();

  // Verify API Keys tab is selected
  await expect(page.locator('text=Configure your LLM providers')).toBeVisible();

  // Try expanding the OpenAI provider section
  await page.click('text=OpenAI');

  // Verify the password input is visible
  const input = page.locator('input[type="password"]');
  await expect(input).toBeVisible();

  // Note: We can't actually validate a fake key since it makes a real API call.
  // We're just asserting the UI flow works.
});
