import { test, expect } from '@playwright/test';

test.describe('Full game flow', () => {
  test('shows 5 country cards, processes guesses, completes game', async ({ page }) => {
    await page.goto('/');

    // Wait for game to load (not the loading spinner)
    await page.waitForSelector('[data-testid="country-card"]', { timeout: 10000 });

    // Assert 5 country cards are visible
    const cards = page.locator('[data-testid="country-card"]');
    await expect(cards).toHaveCount(5);

    // Assert first stat panel is visible with a direction label
    await expect(page.locator('[data-testid="stat-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-direction"]')).toBeVisible();

    // Submit guesses for stat 1 until solved
    let stat1Solved = false;
    let attempts = 0;
    while (!stat1Solved && attempts < 20) {
      const submitBtn = page.locator('[data-testid="submit-btn"]');
      if (!(await submitBtn.isVisible())) break;
      await submitBtn.click();
      attempts++;

      // Check if stat advanced (stat panel changes or next stat label appears)
      const feedbackRows = page.locator('[data-testid="feedback-row"]');
      const feedbackCount = await feedbackRows.count();
      if (feedbackCount > 0) {
        // Check each feedback row for 5 emojis
        const firstRow = feedbackRows.first();
        const emojiSpans = firstRow.locator('span[aria-label]');
        await expect(emojiSpans).toHaveCount(5);
      }

      // Check if a stat 2 indicator appeared
      const statAdvanced = await page
        .locator('[data-testid="stat-panel"]')
        .getAttribute('data-stat-index');
      if (statAdvanced && parseInt(statAdvanced) > 0) {
        stat1Solved = true;
        break;
      }

      // Or check for result card (game complete)
      if (await page.locator('[data-testid="result-card"]').isVisible()) {
        break;
      }
    }

    // Complete stats 2 and 3
    for (let stat = 0; stat < 2; stat++) {
      let solved = false;
      attempts = 0;
      while (!solved && attempts < 20) {
        const submitBtn = page.locator('[data-testid="submit-btn"]');
        if (!(await submitBtn.isVisible())) {
          solved = true;
          break;
        }
        await submitBtn.click();
        attempts++;

        if (await page.locator('[data-testid="result-card"]').isVisible()) {
          solved = true;
          break;
        }
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
    // RankingList should not be visible
    await expect(page.locator('[data-testid="ranking-list"]')).not.toBeVisible();
  });
});
