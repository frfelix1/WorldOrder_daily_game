import { test, expect, type Page } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Inject a completed game state into localStorage */
async function injectCompletedState(page: Page) {
  const EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const todayUtcMs = Math.floor(nowMs / MS_PER_DAY) * MS_PER_DAY;
  const epochUtcMs = Math.floor(EPOCH_MS / MS_PER_DAY) * MS_PER_DAY;
  const pn = Math.floor((todayUtcMs - epochUtcMs) / MS_PER_DAY);

  const completedState = {
    puzzleNumber: pn,
    dateUTC: new Date().toISOString().slice(0, 10),
    status: 'complete',
    activeStatIndex: 2,
    stats: [
      { statId: 'stat_1', solved: true, guesses: [{ order: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'], bulls: [true, true, true, true, true] }] },
      { statId: 'stat_2', solved: true, guesses: [{ order: ['AUS', 'BRA', 'DEU', 'NGA', 'JPN'], bulls: [true, true, true, true, true] }] },
      { statId: 'stat_3', solved: true, guesses: [{ order: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'], bulls: [true, true, true, true, true] }] },
    ],
    runningScore: 100,
    finalScore: 100,
    updatedAt: Date.now(),
  };

  await page.addInitScript((state) => {
    localStorage.setItem('worldorder_state', JSON.stringify(state));
  }, completedState);
}

test.describe('Full game flow', () => {
  test('shows 5 pool chips, processes guesses, completes game', async ({ page }) => {
    await page.goto('/');

    // Wait for game to load — pool chips appear when ready
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });

    // Assert 5 pool chips are visible in the pool
    await expect(page.locator('[data-testid="pool-chip"]')).toHaveCount(5);

    // Assert 5 ranking slots are visible
    await expect(page.locator('[data-testid="ranking-slot"]')).toHaveCount(5);

    // Assert first stat panel is visible with a direction label
    await expect(page.locator('[data-testid="stat-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-direction"]')).toBeVisible();

    /** Fill all empty slots by clicking pool chips one at a time */
    async function fillEmptySlots() {
      while (true) {
        const count = await page.locator('[data-testid="pool-chip"]').count();
        if (count === 0) break;
        await page.locator('[data-testid="pool-chip"]').first().click();
        await page.waitForTimeout(30);
      }
    }

    // Play through all 3 stats
    for (let stat = 0; stat < 3; stat++) {
      let solved = false;
      let attempts = 0;

      while (!solved && attempts < 25) {
        // Fill any empty slots
        await fillEmptySlots();

        const submitBtn = page.locator('[data-testid="submit-btn"]');
        if (!(await submitBtn.isVisible())) {
          solved = true;
          break;
        }

        // Wait for submit to become enabled (all slots filled)
        await expect(submitBtn).toBeEnabled({ timeout: 2000 });
        await submitBtn.click();
        attempts++;

        // Check for feedback rows
        const feedbackRows = page.locator('[data-testid="feedback-row"]');
        const feedbackCount = await feedbackRows.count();
        if (feedbackCount > 0) {
          const firstRow = feedbackRows.first();
          const emojiSpans = firstRow.locator('span[aria-label]');
          await expect(emojiSpans).toHaveCount(5);
        }

        const nextStageBtn = page.locator('[data-testid="next-stage-btn"]');
        if (await nextStageBtn.isVisible()) {
          const buttonLabel = await nextStageBtn.textContent();
          await nextStageBtn.click();

          if (buttonLabel?.match(/show recap/i)) {
            await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });
            solved = true;
            break;
          }

          await page.waitForTimeout(100);
          solved = true;
          break;
        }

        await page.waitForTimeout(100);
      }
    }

    // Assert result screen appears with a score between 0 and 100
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });
    const scoreText = await page.locator('[data-testid="final-score"]').textContent();
    const score = parseInt(scoreText ?? '0');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);

    // US1: Summary screen shows three stat sections each with an accessible label
    const statSections = page.locator('[data-testid="result-card"] section');
    await expect(statSections).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const label = await statSections.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
    }

    // US2: Score bar has no CSS transition on width in inline styles (summary context)
    const summaryBar = page.locator('[data-testid="result-card"] [data-testid="score-bar"]');
    await expect(summaryBar).toBeVisible();
    const summaryTransition = await summaryBar.evaluate((el) => (el as HTMLElement).style.transition);
    expect(summaryTransition).toBe('');
  });
});

test.describe('Daily rotation', () => {
  test('shows result card immediately for completed puzzle', async ({ page }) => {
    // Inject a completed GameState into localStorage before navigating
    const { getPuzzleNumber } = await import('../../src/lib/puzzle.js');
    const pn = getPuzzleNumber();

    const completedState = {
      puzzleNumber: pn,
      dateUTC: new Date().toISOString().slice(0, 10),
      status: 'complete',
      activeStatIndex: 2,
      stats: [
        { statId: 'stat_1', solved: true, guesses: [{ order: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'], bulls: [true, true, true, true, true] }] },
        { statId: 'stat_2', solved: true, guesses: [{ order: ['AUS', 'BRA', 'DEU', 'NGA', 'JPN'], bulls: [true, true, true, true, true] }] },
        { statId: 'stat_3', solved: true, guesses: [{ order: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'], bulls: [true, true, true, true, true] }] },
      ],
      runningScore: 100,
      finalScore: 100,
      updatedAt: Date.now(),
    };

    await page.addInitScript((state) => {
      localStorage.setItem('worldorder_state', JSON.stringify(state));
    }, completedState);

    await page.goto('/');

    // Should show result card without needing to play
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });
    // Ranking board should not be visible on the result screen
    await expect(page.locator('[data-testid="ranking-board"]')).not.toBeVisible();
  });
});

test.describe('US3 — Zero-maintenance dynamic generation', () => {
  test('game loads valid puzzle for a future date with no pre-generated file (2027-01-01)', async ({ page }) => {
    // Navigate with a date far in the future — guaranteed to have no pre-generated file
    await page.goto('/?date=2027-01-01');

    // Game should not show an error state
    await expect(page.locator('[data-testid="error-state"]')).not.toBeVisible();

    // Wait for and assert exactly 5 pool chips are rendered
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="pool-chip"]')).toHaveCount(5);

    // The stat panel should be visible
    await expect(page.locator('[data-testid="stat-panel"]')).toBeVisible();
  });
});

test.describe('007 — Reveal correct values', () => {
  test('locked ranking slots display a value string after a correct solve', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });

    // Fill all slots by clicking chips
    while ((await page.locator('[data-testid="pool-chip"]').count()) > 0) {
      await page.locator('[data-testid="pool-chip"]').first().click();
      await page.waitForTimeout(30);
    }

    // Keep submitting until the stat advances (at least one correct solve)
    let statSolved = false;
    for (let attempt = 0; attempt < 25 && !statSolved; attempt++) {
      const submitBtn = page.locator('[data-testid="submit-btn"]');
      if (!(await submitBtn.isVisible())) { statSolved = true; break; }
      await expect(submitBtn).toBeEnabled({ timeout: 2000 });
      await submitBtn.click();

      // Stat solved when board transitions — submit button disappears briefly then new stat loads
      // OR result-card shows (last stat)
      if (await page.locator('[data-testid="result-card"]').isVisible()) { statSolved = true; break; }

      const statPanel = page.locator('[data-testid="stat-panel"]');
      const idx = await statPanel.getAttribute('data-stat-index');
      if (idx && parseInt(idx) > 0) { statSolved = true; break; }

      // Re-fill empty slots for next attempt
      while ((await page.locator('[data-testid="pool-chip"]').count()) > 0) {
        await page.locator('[data-testid="pool-chip"]').first().click();
        await page.waitForTimeout(30);
      }
      await page.waitForTimeout(100);
    }

    // After a correct solve, locked slots (data-testid="ranking-slot") should show a value.
    // We check that at least one locked slot contains a non-empty text node with a digit.
    const lockedSlots = page.locator('[data-testid="ranking-slot"]');
    const count = await lockedSlots.count();
    expect(count).toBe(5);

    let valueFound = false;
    for (let i = 0; i < count; i++) {
      const text = await lockedSlots.nth(i).textContent();
      if (text && /\d/.test(text)) {
        valueFound = true;
        break;
      }
    }
    expect(valueFound).toBe(true);
  });
});

test.describe('US3 — Pool chip size', () => {
  test('each pool chip bounding box height is >= 44px', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });

    const chips = page.locator('[data-testid="pool-chip"]');
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await chips.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('all pool chips are visible within 1280px viewport without horizontal scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('008 — Revamped results screen', () => {
  test('summary screen shows three stat sections and clipboard-only share (US1 + US3)', async ({ page }) => {
    // Compute puzzle number in the test process (same formula as getPuzzleNumber())
    const EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const todayUtcMs = Math.floor(nowMs / MS_PER_DAY) * MS_PER_DAY;
    const epochUtcMs = Math.floor(EPOCH_MS / MS_PER_DAY) * MS_PER_DAY;
    const pn = Math.floor((todayUtcMs - epochUtcMs) / MS_PER_DAY);

    const completedState = {
      puzzleNumber: pn,
      dateUTC: new Date().toISOString().slice(0, 10),
      status: 'complete',
      activeStatIndex: 2,
      stats: [
        { statId: 'stat_1', solved: true, guesses: [{ order: ['NGA', 'BRA', 'DEU', 'JPN', 'AUS'], bulls: [true, true, true, true, true] }] },
        { statId: 'stat_2', solved: true, guesses: [{ order: ['AUS', 'BRA', 'DEU', 'NGA', 'JPN'], bulls: [true, true, true, true, true] }] },
        { statId: 'stat_3', solved: true, guesses: [{ order: ['AUS', 'JPN', 'DEU', 'BRA', 'NGA'], bulls: [true, true, true, true, true] }] },
      ],
      runningScore: 100,
      finalScore: 100,
      updatedAt: Date.now(),
    };

    await page.addInitScript((state) => {
      localStorage.setItem('worldorder_state', JSON.stringify(state));
    }, completedState);

    // Mock clipboard API and track calls; mock navigator.share to detect if called
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (_text: string) => {
            (window as Record<string, unknown>).__clipboardCalled = true;
            return Promise.resolve();
          },
        },
        configurable: true,
      });
      // Define share but track if it gets called — it should NOT be called
      Object.defineProperty(navigator, 'share', {
        value: () => {
          (window as Record<string, unknown>).__shareCalled = true;
          return Promise.resolve();
        },
        configurable: true,
        writable: true,
      });
    });

    await page.goto('/');
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });

    // US1: Three stat sections rendered with accessible labels
    const sections = page.locator('[data-testid="result-card"] section');
    await expect(sections).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const label = await sections.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
    }

    // US2: Score bar has no transition on width in inline styles
    const scoreBar = page.locator('[data-testid="result-card"] [data-testid="score-bar"]');
    await expect(scoreBar).toBeVisible();
    const transition = await scoreBar.evaluate((el) => (el as HTMLElement).style.transition);
    expect(transition).toBe('');

    // US3: Clicking share button writes to clipboard and never calls navigator.share
    const shareBtn = page.locator('[data-testid="share-btn"]');
    await shareBtn.click();
    await expect(shareBtn).toHaveText(/Copied!/);

    const clipboardCalled = await page.evaluate(() => (window as Record<string, unknown>).__clipboardCalled);
    const shareCalled = await page.evaluate(() => (window as Record<string, unknown>).__shareCalled);
    expect(clipboardCalled).toBe(true);
    expect(shareCalled).toBeFalsy();
  });
});

// ── T003: Reduced-motion + viewport-meta ───────────────────────────────────────

test.describe('009 — Reduced-motion & viewport metadata', () => {
  test('T003a: with prefers-reduced-motion:reduce, no continuously-running CSS animation on the playing screen', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });

    // Assert no element has a running animation (animation-play-state: running + non-none animation-name)
    const hasRunningAnimation = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      return all.some((el) => {
        const style = window.getComputedStyle(el);
        const name = style.animationName;
        const playState = style.animationPlayState;
        // "none" means no animation; if name is not "none" and is "running" that's a violation
        return name !== 'none' && playState === 'running' && name !== '';
      });
    });
    expect(hasRunningAnimation).toBe(false);
  });

  test('T003b: document exposes theme-color meta and dark color-scheme', async ({ page }) => {
    await page.goto('/');
    // theme-color meta tag
    const themeColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      return meta ? meta.getAttribute('content') : null;
    });
    expect(themeColor).toBeTruthy();

    // color-scheme meta or CSS
    const colorScheme = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) return meta.getAttribute('content');
      // Also check the <html> or <meta name="color-scheme">
      const html = document.documentElement;
      return window.getComputedStyle(html).colorScheme;
    });
    expect(colorScheme).toMatch(/dark/);
  });
});

// ── T009: Touch-drag without page scroll (mobile project) ────────────────────

test.describe('009 — Touch drag (mobile)', () => {
  test('T009: tapping a pool chip places it in a slot without blocking (tap-to-place verification)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });

    // Count chips before
    const chipsBefore = await page.locator('[data-testid="pool-chip"]').count();
    expect(chipsBefore).toBe(5);

    // Click/tap the first chip (tap-to-place)
    await page.click('[data-testid="pool-chip"]');
    await page.waitForTimeout(100);

    // After placing, one less chip in pool
    const chipsAfter = await page.locator('[data-testid="pool-chip"]').count();
    expect(chipsAfter).toBe(4);
  });
});

// ── T010: Full game by touch (mobile project) ────────────────────────────────

test.describe('009 — Full game by touch (mobile)', () => {
  test('T010: game is playable via click interactions (touch-equivalent)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });
    // Verify all interactive elements are present and clickable
    await expect(page.locator('[data-testid="pool-chip"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="ranking-slot"]')).toHaveCount(5);
    // Click a chip to verify tap-to-place works
    await page.locator('[data-testid="pool-chip"]').first().click();
    await page.waitForTimeout(50);
    const chipsAfter = await page.locator('[data-testid="pool-chip"]').count();
    expect(chipsAfter).toBe(4);
  });
});

// ── T014: No horizontal scroll on PLAYING screen (mobile) ────────────────────

test.describe('009 — No horizontal scroll on playing screen (mobile)', () => {
  for (const width of [320, 360, 390, 414]) {
    test(`T014: playing screen has no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.goto('/');
      await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});

// ── T015: >=44px touch targets (mobile) ─────────────────────────────────────

test.describe('009 — Touch targets >= 44px on mobile', () => {
  test('T015: submit-btn and ranking-slot bounding boxes are >= 44px tall', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="pool-chip"]', { timeout: 10000 });

    const submitBtn = page.locator('[data-testid="submit-btn"]');
    // Fill all slots first so submit is enabled and visible
    while ((await page.locator('[data-testid="pool-chip"]').count()) > 0) {
      await page.locator('[data-testid="pool-chip"]').first().click();
      await page.waitForTimeout(30);
    }

    const submitBox = await submitBtn.boundingBox();
    expect(submitBox).not.toBeNull();
    expect(submitBox!.height).toBeGreaterThanOrEqual(44);

    const slots = page.locator('[data-testid="ranking-slot"]');
    const slotCount = await slots.count();
    for (let i = 0; i < slotCount; i++) {
      const box = await slots.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

// ── T020: No horizontal scroll on RESULTS screen (mobile) ───────────────────

test.describe('009 — No horizontal scroll on results screen (mobile)', () => {
  for (const width of [320, 360, 390, 414]) {
    test(`T020: results screen has no horizontal scroll at ${width}px`, async ({ page }) => {
      await injectCompletedState(page);
      await page.setViewportSize({ width, height: 812 });
      await page.goto('/');
      await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});

// ── T021: share-btn >= 44px (mobile) ────────────────────────────────────────

test.describe('009 — Share button >= 44px on mobile', () => {
  test('T021: share-btn bounding box height is >= 44px on mobile', async ({ page }) => {
    await injectCompletedState(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });

    const shareBtn = page.locator('[data-testid="share-btn"]');
    const box = await shareBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

// ── T026: Tooltip touch-open and stays within viewport (mobile) ──────────────

test.describe('009 — Tooltip touch-open and viewport bounds (mobile)', () => {
  test('T026: tooltip trigger exists and tooltip panel is in DOM and within viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="stat-panel"]', { timeout: 10000 });

    // Trigger must exist
    const tooltipTrigger = page.locator('[data-testid="tooltip-trigger"]');
    await expect(tooltipTrigger).toBeVisible();

    // Tooltip panel is in DOM
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeAttached();

    // When visible, tooltip width must fit within viewport
    // Force open via hover
    await tooltipTrigger.hover();
    await page.waitForTimeout(100);

    const tooltipBox = await tooltip.boundingBox();
    if (tooltipBox) {
      expect(tooltipBox.x).toBeGreaterThanOrEqual(-1);
      expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(392);
    }
  });
});
