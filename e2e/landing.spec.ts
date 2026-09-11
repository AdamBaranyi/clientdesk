import { expect, test, type Page } from '@playwright/test';

/**
 * Der Nebel auf der Startseite. Ohne Anmeldung, damit «/» die Startseite
 * zeigt und nicht aufs Dashboard weiterleitet.
 */
test.use({ storageState: { cookies: [], origins: [] } });

async function openLanding(page: Page) {
  await page.goto('/');
  // Aufgeblendet heisst: die Blende ist durch, nicht nur begonnen.
  await page.waitForFunction(() => {
    const fog = document.querySelector('canvas[data-fog]');
    return fog !== null && getComputedStyle(fog).opacity === '1';
  });
}

/** Zwei Aufnahmen der Leinwand mit Abstand. Gleich heisst: nichts bewegt sich. */
async function fogMoves(page: Page): Promise<boolean> {
  const fog = page.locator('canvas[data-fog]');
  // Farbwechsel am Knopf nach einem Klick sollen nicht als Bewegung zählen.
  await page.waitForTimeout(300);
  const first = await fog.screenshot();
  await page.waitForTimeout(700);
  const second = await fog.screenshot();
  return !first.equals(second);
}

test.describe('Nebel auf der Startseite', () => {
  test('blendet hinter dem Text auf, die Überschrift wartet nicht darauf', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('canvas[data-fog]')).toHaveClass(/opacity-100/);
    await expect(page.locator('canvas[data-fog]')).toHaveAttribute('aria-hidden', 'true');
    // Der Nebel liegt hinter dem Inhalt; der Knopf darüber bleibt bedienbar.
    await expect(page.getByRole('button', { name: 'Demo starten' })).toBeEnabled();
  });

  test('«Bewegung anhalten» hält ihn wirklich an, auch nach dem Neuladen', async ({ page }) => {
    await openLanding(page);
    expect(await fogMoves(page)).toBe(true);

    const toggle = page.getByRole('button', { name: 'Bewegung anhalten' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await fogMoves(page)).toBe(false);

    await openLanding(page);
    await expect(page.getByRole('button', { name: 'Bewegung anhalten' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await fogMoves(page)).toBe(false);
  });
});

test.describe('Nebel bei reduzierter Bewegung', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('steht still und braucht dann keinen Knopf', async ({ page }) => {
    await openLanding(page);
    await expect(page.getByRole('button', { name: 'Bewegung anhalten' })).toHaveCount(0);
    expect(await fogMoves(page)).toBe(false);
  });
});
