import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const width of [320, 390, 768]) {
  test(`landing keeps overflow local and focus visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

    for (const block of await page.locator('.code-block').all()) {
      const box = await block.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }

    for (const pre of await page.locator('.code-block pre').all()) {
      await expect(pre).toHaveCSS('overflow-x', 'auto');
    }
    for (const tableRegion of await page.locator('.table-scroll').all()) {
      await expect(tableRegion).toHaveCSS('overflow-x', 'auto');
    }

    for (const cta of await page.locator('.cta-row a').all()) {
      await cta.focus();
      await expect(cta).toBeFocused();
      const box = await cta.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }

    if (width < 768) {
      const pre = page.locator('.code-block pre').first();
      const scrollDimensions = await pre.evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(scrollDimensions.scrollWidth).toBeGreaterThan(scrollDimensions.clientWidth);
      await pre.focus();
      await expect(pre).toBeFocused();
    }

    const results = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
