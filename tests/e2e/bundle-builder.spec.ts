import { test, expect } from '@playwright/test';

test.describe('Bundle builder experience', () => {
  test('guides visitors through selection to review', async ({ page }) => {
    await page.goto('/bundle-builder');

    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading).toHaveText(/Выберите товары|Конструктор наборов/i);

    const addButtonLocator = page.locator('button', { hasText: 'Добавить' });
    const addButtonCount = await addButtonLocator.count();

    if (addButtonCount === 0) {
      return;
    }

    let clicks = 0;
    for (let i = 0; i < 5; i += 1) {
      const button = addButtonLocator.first();
      if (!(await button.isVisible())) break;

      await button.scrollIntoViewIfNeeded();
      await button.click();
      clicks += 1;
      await page.waitForTimeout(150);
    }

    const progress = page.locator('text=/\\d+ \\/ 20/');
    await expect(progress.first()).toBeVisible({ timeout: 5000 });

    if (clicks < 5) {
      return;
    }

    const reviewButton = page.getByRole('button', { name: /Проверить набор/ });
    await expect(reviewButton).toBeEnabled();
    await reviewButton.click();

    await expect(page.getByRole('button', { name: /Добавить в корзину/ })).toBeVisible();
  });
});
