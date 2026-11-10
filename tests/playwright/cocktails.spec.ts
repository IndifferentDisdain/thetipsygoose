import { expect, test, type Page } from '@playwright/test';

function watchPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content, `Page width ${dimensions.content}px exceeds viewport ${dimensions.viewport}px`).toBeLessThanOrEqual(dimensions.viewport);
}

test('curated menu has the intended drinks and responsive navigation', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/cocktails/');

  await expect(page).toHaveTitle(/Cocktail Menu/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cocktails');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('for the table');
  await expect(page.locator('[data-cocktail-card]')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'The House Martini' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The TiffTini' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Mediterranean Ten' })).toBeVisible();
  await expect(page.getByText("The Goose's Garden Cooler", { exact: true })).toHaveCount(0);

  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.locator('header details summary').click();
    await expect(page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Cocktails' })).toBeVisible();
  } else {
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Cocktails' })).toHaveAttribute('aria-current', 'page');
  }

  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('recipe archive presents the complete collection without unfinished controls', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/cocktails/recipes/');
  const cards = page.locator('[data-cocktail-card]');
  await expect(cards).toHaveCount(15);
  await expect(page.getByText('15 recipes and working records')).toBeVisible();
  await expect(page.locator('[data-cocktail-filter]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('tested recipes scale numeric ingredients while preserving descriptive amounts', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/cocktails/recipes/house-martini/');

  const quantities = page.locator('.cocktail-quantity');
  await expect(quantities).toHaveText(['2½', '½']);
  await page.getByLabel('Make').selectOption('2');
  await expect(quantities).toHaveText(['5', '1']);
  await page.getByLabel('Make').selectOption('4');
  await expect(quantities).toHaveText(['10', '2']);
  await expect(page.getByText(/Olive brine, A splash/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Preparation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tasting Notes' })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('incomplete records are clearly labeled and do not expose scaling', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/cocktails/recipes/lemon-drop/');

  await expect(page.getByText('Specification pending').first()).toBeVisible();
  await expect(page.locator('#cocktail-servings')).toHaveCount(0);
  await expect(page.getByText(/exact house specification still needs confirmation/i).first()).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);

  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('representative internal links return successful responses', async ({ page, request }) => {
  await page.goto('/cocktails/');
  const links = await page.locator('a[href^="/"]').evaluateAll(items => [...new Set(items.map(item => (item as HTMLAnchorElement).getAttribute('href')).filter(Boolean))] as string[]);

  for (const href of links) {
    const response = await request.get(href);
    expect(response.status(), `${href} returned ${response.status()}`).toBeLessThan(400);
  }
});
