import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { normalize, verifyCheckDigit } from '../../js/index.js';
import { checkRuntimeErrors } from './runtime-errors.mjs';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
checkRuntimeErrors(test, expect);

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

  test('separator choices preserve canonical IDs in display and clipboard', async ({ page }) => {
    const separator = page.getByLabel('Separator', { exact: true });
    const codes = page.getByRole('button', { name: /^Copy code / });
    await page.getByLabel('Quantity').fill('2');
    await page.getByLabel('Mod-25').check();
    for (const choice of ['-', '_', '.', ' ']) {
      await separator.selectOption(choice);
      await separator.focus();
      await expect(separator).toBeFocused();
      await page.getByRole('button', { name: 'Generate', exact: true }).click();
      const displayed = await codes.allTextContents();
      for (const value of displayed) expect(verifyCheckDigit(value)).toBe(true);
      await codes.first().click();
      await expect(page.getByRole('status', { name: 'Copy status' })).toContainText('Copied:');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(displayed[0]);
      await page.getByRole('button', { name: 'Copy All', exact: true }).click();
      await expect(page.getByRole('status', { name: 'Copy status' })).toHaveText('Copied 2 codes');
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      expect(copied.split('\n').map(normalize)).toEqual(displayed.map(normalize));
    }
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

  test('preserves an entire batch on secure-randomness failure and recovers', async ({ page }) => {
    const codes = page.getByRole('button', { name: /^Copy code / });
    const generate = page.getByRole('button', { name: 'Generate', exact: true });
    await page.getByLabel('Quantity').fill('2');
    await generate.click();
    const previous = await codes.allTextContents();
    const count = await page.locator('#generated').textContent();
    await page.evaluate(() => {
      window.__originalRandom = crypto.getRandomValues.bind(crypto);
      let calls = 0;
      crypto.getRandomValues = buffer => {
        if (++calls === 2) throw new Error('Injected entropy failure');
        return buffer.fill(10);
      };
    });
    await generate.click();
    expect(await codes.allTextContents()).toEqual(previous);
    await expect(page.locator('#generated')).toHaveText(count);
    await expect(page.locator('#generationError')).toBeVisible();
    await expect(page.getByRole('status', { name: 'Generation status' })).toContainText('Generation failed');
    await page.evaluate(() => { crypto.getRandomValues = window.__originalRandom; });
    await generate.click();
    await expect(page.locator('#generationError')).toBeHidden();
    await expect(page.locator('#generated')).toHaveText('4');
  });

  test('keeps current formatting, accessible names and copied text aligned', async ({ page }) => {
    await page.getByLabel('Quantity').fill('2');
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    const codes = page.getByRole('button', { name: /^Copy code / });
    const canonical = (await codes.allTextContents()).map(normalize);
    await page.getByRole('button', { name: 'Lowercase', exact: true }).click();
    await page.getByLabel('Group every N').fill('3');
    await page.getByLabel('Separator', { exact: true }).selectOption('.');
    const displayed = await codes.allTextContents();
    expect(displayed.map(normalize)).toEqual(canonical);
    for (const chip of await codes.all()) {
      await expect(chip).toHaveAttribute('aria-label', 'Copy code ' + await chip.textContent());
    }
    await page.getByRole('button', { name: 'Copy All', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Copy status' })).toHaveText('Copied 2 codes');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(displayed.join('\n'));
  });

  test('announces unavailable or denied clipboard access with manual recovery', async ({ page }) => {
    await page.getByLabel('Quantity').fill('1');
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    const displayed = await page.getByRole('button', { name: /^Copy code / }).textContent();
    for (const unavailable of [false, true]) {
      await page.evaluate(missing => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: missing ? undefined : { writeText: () => Promise.reject(new Error('Clipboard denied')) },
        });
      }, unavailable);
      await page.getByRole('button', { name: 'Copy All', exact: true }).click();
      const manual = page.getByLabel('Select and copy these codes manually');
      await expect(manual).toBeVisible();
      await expect(manual).toHaveValue(displayed);
      await expect(manual).toBeFocused();
      await expect(page.getByRole('status', { name: 'Copy status' })).toContainText('Copy failed');
    }
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
    await page.evaluate(() => { delete navigator.clipboard; });
    await page.getByRole('button', { name: 'Copy All', exact: true }).click();
    await expect(page.locator('#manualCopy')).toBeHidden();
  });

  test('ignores stale clipboard completions after clear or regeneration', async ({ page }) => {
    for (const action of ['clear', 'regenerate']) {
      await page.getByLabel('Quantity').fill('2');
      await page.getByRole('button', { name: 'Generate', exact: true }).click();
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: () => new Promise(resolve => { window.__finishCopy = resolve; }) },
        });
      });
      await page.getByRole('button', { name: 'Copy All', exact: true }).click();
      if (action === 'clear') await page.getByRole('button', { name: 'Clear', exact: true }).click();
      else {
        await page.getByLabel('Quantity').fill('1');
        await page.getByRole('button', { name: 'Generate', exact: true }).click();
      }
      await page.evaluate(() => window.__finishCopy());
      await expect(page.getByRole('status', { name: 'Copy status' })).toBeEmpty();
      await expect(page.locator('#manualCopy')).toBeHidden();
    }
  });

  test('generation and copying use no network or persistent storage', async ({ page }) => {
    const requests = [];
    await page.route('**/*', route => { requests.push(route.request().url()); return route.abort(); });
    await page.evaluate(() => {
      window.__privacyCalls = [];
      const forbidden = name => () => { window.__privacyCalls.push(name); throw new Error(name); };
      for (const key of ['localStorage', 'sessionStorage', 'indexedDB', 'caches']) {
        Object.defineProperty(window, key, { configurable: true, get: forbidden(key) });
      }
      navigator.sendBeacon = forbidden('sendBeacon');
    });
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await page.getByRole('button', { name: 'Copy All', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Copy status' })).toContainText('Copied');
    expect(requests).toEqual([]);
    expect(await page.evaluate(() => window.__privacyCalls)).toEqual([]);
  });
});
