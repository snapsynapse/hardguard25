export function checkRuntimeErrors(test, expect) {
  const errors = new WeakMap();
  test.beforeEach(async ({ page }) => {
    const current = [];
    errors.set(page, current);
    page.on('pageerror', error => current.push(error.message));
    // Content Security Policy violations and failed resource loads are reported as console errors,
    // not page errors, so they must be captured here for the CSP to be tested at all.
    page.on('console', message => {
      if (message.type() === 'error') current.push(`console: ${message.text()}`);
    });
    await page.addInitScript(() => {
      window.__unhandledRejections = [];
      window.addEventListener('unhandledrejection', event => {
        window.__unhandledRejections.push(String(event.reason));
      });
    });
  });
  test.afterEach(async ({ page }) => {
    expect(errors.get(page)).toEqual([]);
    expect(await page.evaluate(() => window.__unhandledRejections || [])).toEqual([]);
  });
}
