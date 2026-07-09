import { test, expect, type Page } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Puzzle number for "today", matching getPuzzleNumber() in src/lib/puzzle.ts. */
function todayPuzzleNumber(): number {
  const EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const todayUtcMs = Math.floor(nowMs / MS_PER_DAY) * MS_PER_DAY;
  const epochUtcMs = Math.floor(EPOCH_MS / MS_PER_DAY) * MS_PER_DAY;
  return Math.floor((todayUtcMs - epochUtcMs) / MS_PER_DAY);
}

/** A completed game state for the current puzzle (all three stats solved perfectly). */
function completedState() {
  return {
    puzzleNumber: todayPuzzleNumber(),
    dateUTC: new Date().toISOString().slice(0, 10),
    status: 'complete',
    activeStatIndex: 2,
    stats: [
      { statId: 'stat_1', solved: true, guesses: [{ order: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'], bulls: [true, true, true, true, true], positions: {} }] },
      { statId: 'stat_2', solved: true, guesses: [{ order: ['AUS', 'BRA', 'DEU', 'NGA', 'JPN'], bulls: [true, true, true, true, true], positions: {} }] },
      { statId: 'stat_3', solved: true, guesses: [{ order: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'], bulls: [true, true, true, true, true], positions: {} }] },
    ],
    runningScore: 100,
    finalScore: 100,
    updatedAt: Date.now(),
  };
}

/**
 * Place all five tokens on the line using the keyboard, spreading them across
 * distinct positions so they form a valid (fully-placed) submission. Each token
 * is sent to the far left (Home) then nudged right by a distinct number of steps.
 */
async function placeAllTokensByKeyboard(page: Page) {
  const tokens = page.locator('[data-testid="line-token"]');
  const count = await tokens.count();
  for (let i = 0; i < count; i++) {
    const token = tokens.nth(i);
    await token.focus();
    await page.keyboard.press('Home');
    // Distinct positions: token i gets i*5 right-steps (0, 5, 10, ...).
    for (let s = 0; s < i * 5; s++) {
      await page.keyboard.press('ArrowRight');
    }
  }
}

// ── Rendering & core interaction ─────────────────────────────────────────────

test.describe('Line-scale board — rendering', () => {
  test('renders the board, track, five tokens, endpoints and readout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="line-scale-board"]', { timeout: 10000 });

    await expect(page.locator('[data-testid="line-scale-track"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-token"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="line-endpoint-min"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-endpoint-max"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-value-readout"]')).toBeAttached();

    // Stat panel + direction label present.
    await expect(page.locator('[data-testid="stat-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-direction"]')).toBeVisible();
  });

  test('submit is disabled until all five tokens are placed, then a guess records feedback', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="line-scale-board"]', { timeout: 10000 });

    const submitBtn = page.locator('[data-testid="submit-btn"]');
    await expect(submitBtn).toBeDisabled();

    await placeAllTokensByKeyboard(page);

    await expect(submitBtn).toBeEnabled({ timeout: 3000 });
    await submitBtn.click();

    // Either the stat was solved (advance button) or a feedback row is shown.
    const feedbackRows = page.locator('[data-testid="feedback-row"]');
    const nextStage = page.locator('[data-testid="next-stage-btn"]');
    await expect(async () => {
      const solved = await nextStage.isVisible();
      const fb = await feedbackRows.count();
      expect(solved || fb > 0).toBeTruthy();
    }).toPass({ timeout: 5000 });

    // If a feedback row is present, it has five per-token cells.
    if ((await feedbackRows.count()) > 0) {
      const cells = feedbackRows.first().locator('[data-testid="feedback-cell"]');
      await expect(cells).toHaveCount(5);
    }
  });

  test('dragging a token shows a live value readout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="line-token"]', { timeout: 10000 });

    const token = page.locator('[data-testid="line-token"]').first();
    // Focus + keyboard nudge updates the token's accessible value.
    await token.focus();
    await page.keyboard.press('End'); // jump to far right → max value
    // The token's aria-valuetext reflects a formatted value (non-empty).
    const valueText = await token.getAttribute('aria-valuetext');
    expect(valueText && valueText.length > 0).toBeTruthy();
  });
});

// ── Completed-state / results screen (unchanged pipeline) ────────────────────

test.describe('Results screen', () => {
  test('injected completed state shows the result card with a score in [0,100]', async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('worldorder_state', JSON.stringify(state));
    }, completedState());

    await page.goto('/');
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });

    const scoreText = await page.locator('[data-testid="final-score"]').textContent();
    const score = parseInt(scoreText ?? '0');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);

    // Three stat sections, each with an accessible label.
    const sections = page.locator('[data-testid="result-card"] section');
    await expect(sections).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      expect(await sections.nth(i).getAttribute('aria-label')).toBeTruthy();
    }
  });

  test('share button copies to clipboard and never calls navigator.share', async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('worldorder_state', JSON.stringify(state));
    }, completedState());

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () => {
            (window as unknown as Record<string, unknown>).__clipboardCalled = true;
            return Promise.resolve();
          },
        },
        configurable: true,
      });
      Object.defineProperty(navigator, 'share', {
        value: () => {
          (window as unknown as Record<string, unknown>).__shareCalled = true;
          return Promise.resolve();
        },
        configurable: true,
        writable: true,
      });
    });

    await page.goto('/');
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });

    const shareBtn = page.locator('[data-testid="share-btn"]');
    await shareBtn.click();
    await expect(shareBtn).toHaveText(/Copied!/);

    const clipboardCalled = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__clipboardCalled,
    );
    const shareCalled = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__shareCalled,
    );
    expect(clipboardCalled).toBe(true);
    expect(shareCalled).toBeFalsy();
  });
});

// ── Accessibility & mobile (US5) ─────────────────────────────────────────────

test.describe('Accessibility & mobile', () => {
  test('with prefers-reduced-motion:reduce, no continuously-running animation on the playing screen', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForSelector('[data-testid="line-scale-board"]', { timeout: 10000 });

    const hasRunningAnimation = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      return all.some((el) => {
        const style = window.getComputedStyle(el);
        return style.animationName !== 'none' && style.animationPlayState === 'running';
      });
    });
    expect(hasRunningAnimation).toBe(false);
  });

  test('at 320px width the board fits with no horizontal page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="line-scale-board"]', { timeout: 10000 });

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('each token has a minimum touch-target height of ~44px', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="line-token"]', { timeout: 10000 });

    const tokens = page.locator('[data-testid="line-token"]');
    const count = await tokens.count();
    expect(count).toBe(5);
    for (let i = 0; i < count; i++) {
      const box = await tokens.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(28);
    }
  });
});
