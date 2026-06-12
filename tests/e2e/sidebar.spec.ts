import { test, expect } from './fixtures';

test('Sidebar functionality', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`);

  // Open sidebar
  await page.click('button[title="Menu"]');

  // Verify sidebar is visible
  await expect(page.locator('text=New Chat')).toBeVisible();

  // Test search input is present
  await expect(page.locator('input[placeholder="Search chats..."]')).toBeVisible();

  // Test creating a folder
  // Mock window.prompt
  await page.evaluate(() => {
    window.prompt = () => 'My Test Folder';
  });

  // Click New Folder button
  await page.click('button[title="New Folder"]');

  // Verify folder is added
  await expect(page.locator('text=My Test Folder')).toBeVisible();
});
