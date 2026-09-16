import { test, expect } from '@playwright/test';

test.describe('Game catalog filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('filters games by title as the user types', async ({ page }) => {
    const search = page.getByTestId('game-search');
    await search.fill('DevOps Dominion');

    await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(1);
    await expect(page.locator('[data-testid="game-card"]:visible').getByTestId('game-title')).toHaveText('DevOps Dominion');
    await expect(page.getByTestId('game-filter-status')).toHaveText('Showing 1 game');
  });

  test('filters games by one or more categories', async ({ page }) => {
    await page.getByLabel('Strategy').check();

    const strategyCards = page.locator('[data-testid="game-card"]:visible');
    await expect(strategyCards).toHaveCount(4);
    await expect(page.getByTestId('game-filter-status')).toHaveText('Showing 4 games');
  });

  test('combines category and publisher filters', async ({ page }) => {
    await page.getByLabel('Strategy').check();
    await page.getByTestId('publisher-filter').selectOption({ label: 'CodeForge Studios' });

    await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(1);
    await expect(page.locator('[data-testid="game-card"]:visible').getByTestId('game-title')).toHaveText('DevOps Dominion');
  });

  test('shows an empty state and clears filters', async ({ page }) => {
    const allCards = page.locator('[data-testid="game-card"]');
    const allCardCount = await allCards.count();
    await page.getByTestId('game-search').fill('no matching game');

    await expect(page.getByTestId('filtered-empty-state')).toBeVisible();
    await expect(page.getByTestId('game-filter-status')).toHaveText('Showing 0 games');

    await page.getByTestId('reset-game-filters').click();

    await expect(page.getByTestId('filtered-empty-state')).toBeHidden();
    await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(allCardCount);
    await expect(page.getByTestId('game-search')).toHaveValue('');
  });

  test('provides keyboard-accessible filter controls', async ({ page }) => {
    const search = page.getByTestId('game-search');
    await search.focus();
    await expect(search).toBeFocused();
    await expect(page.getByLabel('Publisher')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Categories' })).toBeVisible();
  });
});
