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

  test('rejects invalid payload lengths without generating and recovers', async ({ page }) => {
    const input = page.getByLabel('Payload Length');
    const generate = page.getByRole('button', { name: 'Generate' });
    const codes = page.getByRole('button', { name: /^Copy code / });
    const status = page.getByRole('status', { name: 'Generation status' });

    for (const value of ['', '0', '-1', '1.5', '33']) {
      await input.fill(value);
      await generate.click();
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toBeFocused();
      await expect(page.locator('#codeLengthError')).toBeVisible();
      await expect(status).toContainText('Payload Length: enter a whole number from 1 to 32.');
      await expect(page.locator('#permutations')).toHaveText('--');
      await expect(page.locator('#bitsEntropy')).toHaveText('--');
      await expect(codes).toHaveCount(0);
    }

    const invalidStateResults = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .analyze();
    expect(invalidStateResults.violations).toEqual([]);

    await input.fill('8');
    await page.getByLabel('Quantity').fill('3');
    await page.getByLabel('Mod-25').check();
    await generate.click();

    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#codeLengthError')).toBeHidden();
    await expect(codes).toHaveCount(3);
    await expect(status).toHaveText('Generated 3 codes.');
    await expect(page.locator('#permutations')).toHaveText('152.6B');
    await expect(page.locator('#bitsEntropy')).toHaveText('37.2 bits');
    for (const code of await codes.allTextContents()) {
      const raw = code.replaceAll('-', '');
      expect(raw).toHaveLength(9);
      expect(raw).toMatch(/^[0-9ACDFGHJKMNPRUWY]+$/);
    }
  });

  test('rejects invalid quantities without replacing existing results', async ({ page }) => {
    const quantity = page.getByLabel('Quantity');
    const generate = page.getByRole('button', { name: 'Generate' });
    const codes = page.getByRole('button', { name: /^Copy code / });
    const status = page.getByRole('status', { name: 'Generation status' });

    await quantity.fill('2');
    await generate.click();
    await expect(codes).toHaveCount(2);
    const originalCodes = await codes.allTextContents();
    const originalGenerated = await page.locator('#generated').textContent();

    for (const value of ['', '0', '-1', '1.5', '501']) {
      await quantity.fill(value);
      await generate.click();
      await expect(quantity).toHaveAttribute('aria-invalid', 'true');
      await expect(quantity).toBeFocused();
      await expect(page.locator('#quantityError')).toBeVisible();
      await expect(status).toContainText('Quantity: enter a whole number from 1 to 500.');
      await expect(codes).toHaveCount(2);
      expect(await codes.allTextContents()).toEqual(originalCodes);
      await expect(page.locator('#generated')).toHaveText(originalGenerated);
    }

    await quantity.fill('1');
    await generate.click();
    await expect(quantity).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#quantityError')).toBeHidden();
    await expect(codes).toHaveCount(1);
    await expect(status).toHaveText('Generated 1 code.');
  });

  test('keeps payload statistics independent of an appended check digit', async ({ page }) => {
    await page.getByLabel('Payload Length').fill('16');
    await page.getByLabel('Quantity').fill('1');
    const checkDigit = page.getByLabel('Mod-25');
    const generate = page.getByRole('button', { name: 'Generate' });
    const codes = page.getByRole('button', { name: /^Copy code / });

    await generate.click();
    await expect(page.locator('#permutations')).toHaveText('2.33e+22');
    await expect(page.locator('#bitsEntropy')).toHaveText('74.3 bits');
    expect((await codes.first().textContent()).replaceAll('-', '')).toHaveLength(16);

    await checkDigit.check();
    await generate.click();
    await expect(page.locator('#permutations')).toHaveText('2.33e+22');
    await expect(page.locator('#bitsEntropy')).toHaveText('74.3 bits');
    expect((await codes.first().textContent()).replaceAll('-', '')).toHaveLength(17);
    await expect(page.getByText(/adds no random entropy/)).toBeVisible();
  });
});
