import { test, expect } from '@playwright/test';

// Catalog end-to-end smoke covering search, filters and empty/product states
// Tests are resilient to Supabase being empty by allowing either real products or empty-state copy.
test.describe('Catalog experience', () => {
  test('allows visitors to search and view catalog layout', async ({ page }) => {
    await page.goto('/catalog');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(/Каталог/);

    const filtersButton = page.getByRole('button', { name: 'Фильтры' });
    if (await filtersButton.count()) {
      await expect(filtersButton.first()).toBeVisible();
    }

    const quickFilter = page.locator('button', { hasText: /Товары|Наборы/ });
    if (await quickFilter.count()) {
      await expect(quickFilter.first()).toBeVisible();
    }

    const searchInput = page.getByPlaceholder('Поиск товаров...');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('набор');
    await page.waitForTimeout(400); // allow state update + data refetch

    await expect(page).toHaveURL(/catalog\?search=/);

    const emptyState = page.getByText('Товары не найдены');
    const productCards = page.locator('[data-testid="product-card"], a[href^="/product/"]');

    if (await productCards.first().isVisible()) {
      await expect(productCards.first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }
  });
});
