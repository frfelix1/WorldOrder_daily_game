import { test, expect } from '@playwright/test';

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

        // Check if game complete
        if (await page.locator('[data-testid="result-card"]').isVisible()) {
          solved = true;
          break;
        }

        // Check if stat advanced
        const statPanel = page.locator('[data-testid="stat-panel"]');
        const statAdvanced = await statPanel.getAttribute('data-stat-index');
        if (statAdvanced && parseInt(statAdvanced) > stat) {
          // Wait for board to reset (800ms transition)
          await page.waitForTimeout(900);
          solved = true;
          break;
        }

        await page.waitForTimeout(100);
      }
    }

    // Assert result screen appears with a score between 0 and 150
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });
    const scoreText = await page.locator('[data-testid="final-score"]').textContent();
    const score = parseInt(scoreText ?? '0');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(150);
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
      runningScore: 150,
      finalScore: 150,
      updatedAt: Date.now(),
    };

    await page.addInitScript((state) => {
      localStorage.setItem('rankle_state', JSON.stringify(state));
    }, completedState);

    await page.goto('/');

    // Should show result card without needing to play
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 5000 });
    // Ranking board should not be visible on the result screen
    await expect(page.locator('[data-testid="ranking-board"]')).not.toBeVisible();
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
