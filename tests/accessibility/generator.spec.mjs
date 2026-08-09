import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('generator accessibility', () => {
  test.use({
    permissions: ['clipboard-read', 'clipboard-write'],
    reducedMotion: 'reduce',
  });

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/generator/');
  });

  test('has no detectable WCAG A or AA violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('supports keyboard generation, selection, copying, and disclosure', async ({ page }) => {
    const upper = page.getByRole('button', { name: 'Uppercase' });
    const lower = page.getByRole('button', { name: 'Lowercase' });

    await expect(upper).toHaveAttribute('aria-pressed', 'true');
    await lower.focus();
    await page.keyboard.press('Enter');
    await expect(lower).toHaveAttribute('aria-pressed', 'true');
    await expect(upper).toHaveAttribute('aria-pressed', 'false');

    const generate = page.getByRole('button', { name: 'Generate' });
    await generate.focus();
    await page.keyboard.press('Enter');

    const codes = page.getByRole('button', { name: /^Copy code / });
    await expect(codes).toHaveCount(10);
    await expect(page.getByRole('status', { name: 'Generation status' }))
      .toHaveText('Generated 10 codes.');

    await codes.first().focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status', { name: 'Copy status' }))
      .toContainText('Copied:');
    await expect(codes.first()).toHaveClass(/copied/);

    const disclosure = page.getByRole('button', { name: 'Why these 25 characters?' });
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await disclosure.focus();
    await page.keyboard.press('Enter');
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#rationaleBody')).toBeVisible();

    const interactionResults = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .analyze();
    expect(interactionResults.violations).toEqual([]);

    const copyAll = page.getByRole('button', { name: 'Copy All' });
    await copyAll.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status', { name: 'Copy status' }))
      .toHaveText('Copied 10 codes');

    const clear = page.getByRole('button', { name: 'Clear' });
    await clear.focus();
    await page.keyboard.press('Enter');
    await expect(codes).toHaveCount(0);
    await expect(page.getByRole('status', { name: 'Generation status' }))
      .toHaveText('Generated codes cleared.');
  });

  test('honors reduced-motion preferences', async ({ page }) => {
    await expect.poll(() => page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches
    )).toBe(true);

    const transitionDuration = await page.getByRole('button', { name: 'Generate' })
      .evaluate((element) => getComputedStyle(element).transitionDuration);

    expect(transitionDuration).toBe('0s');
  });
});
