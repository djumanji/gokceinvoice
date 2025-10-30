import { test, expect } from '@playwright/test';

test.describe('Marketing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display marketing page correctly', async ({ page }) => {
    // Check hero section title
    await expect(page.locator('text=/Streamline your invoicing/i')).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('text=/About us/i')).toBeVisible();
    await expect(page.locator('text=/Pricing/i')).toBeVisible();
    await expect(page.locator('text=/Testimonials/i')).toBeVisible();
    await expect(page.locator('text=/Contact us/i')).toBeVisible();
    
    // Check login and signup buttons in header
    await expect(page.locator('text=/Login/i').first()).toBeVisible();
    await expect(page.locator('text=/Signup/i').first()).toBeVisible();
    
    // Check hero email input
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    
    // Check pricing section
    await expect(page.locator('text=/Simple, transparent pricing/i')).toBeVisible();
    await expect(page.locator('text=/Free Plan/i')).toBeVisible();
    await expect(page.locator('text=/Pro Plan/i')).toBeVisible();
    
    // Check features section
    await expect(page.locator('text=/Features for error-free invoicing/i')).toBeVisible();
  });

  test('should navigate to login page from header', async ({ page }) => {
    await page.locator('text=/Login/i').first().click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to register page from header', async ({ page }) => {
    await page.locator('button:has-text("Signup")').first().click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should navigate to register page from hero CTA', async ({ page }) => {
    await page.locator('button:has-text("Signup")').last().click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should scroll to pricing section when clicking pricing link', async ({ page }) => {
    await page.locator('a[href="#pricing"]').click();
    await page.waitForTimeout(500); // Wait for smooth scroll
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeVisible();
    
    // Check if we're scrolled near the pricing section
    const boundingBox = await pricingSection.boundingBox();
    expect(boundingBox).not.toBeNull();
  });

  test('should scroll to features section when clicking about us link', async ({ page }) => {
    await page.locator('a[href="#features"]').click();
    await page.waitForTimeout(500); // Wait for smooth scroll
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();
  });

  test('should scroll to testimonials section', async ({ page }) => {
    await page.locator('a[href="#testimonials"]').click();
    await page.waitForTimeout(500);
    const testimonialsSection = page.locator('#testimonials');
    await expect(testimonialsSection).toBeVisible();
  });

  test('should scroll to contact section', async ({ page }) => {
    await page.locator('a[href="#contact"]').click();
    await page.waitForTimeout(500);
    const contactSection = page.locator('#contact');
    await expect(contactSection).toBeVisible();
  });

  test('should display pricing plans correctly', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('a[href="#pricing"]').click();
    await page.waitForTimeout(500);
    
    // Check Free Plan
    await expect(page.locator('text=/Free Plan/i')).toBeVisible();
    await expect(page.locator('text=/\\$0/i')).toBeVisible();
    await expect(page.locator('text=/Get Started Free/i')).toBeVisible();
    
    // Check Pro Plan
    await expect(page.locator('text=/Pro Plan/i')).toBeVisible();
    await expect(page.locator('text=/\\$29/i')).toBeVisible();
    await expect(page.locator('text=/Coming Soon/i')).toBeVisible();
    await expect(page.locator('text=/Register Now/i')).toBeVisible();
    await expect(page.locator('text=/Get started for free and be an early adopter/i')).toBeVisible();
  });

  test('should navigate to register from Free Plan button', async ({ page }) => {
    await page.locator('a[href="#pricing"]').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Get Started Free")').click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should navigate to register from Pro Plan button', async ({ page }) => {
    await page.locator('a[href="#pricing"]').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Register Now")').click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should display testimonials carousel', async ({ page }) => {
    await page.locator('a[href="#testimonials"]').click();
    await page.waitForTimeout(500);
    
    // Check testimonials section is visible
    await expect(page.locator('text=/What some of our clients say/i')).toBeVisible();
    
    // Check that review cards are present
    const reviewCards = page.locator('.review-card');
    await expect(reviewCards.first()).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await page.locator('a[href="#features"]').click();
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=/Fast Creation/i')).toBeVisible();
    await expect(page.locator('text=/Track & Manage/i')).toBeVisible();
    await expect(page.locator('text=/Secure & Reliable/i')).toBeVisible();
  });

  test('should display newsletter signup section', async ({ page }) => {
    await page.locator('a[href="#contact"]').click();
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=/Stay in touch/i')).toBeVisible();
    await expect(page.locator('text=/Keep yourself updated/i')).toBeVisible();
    await expect(page.locator('input[type="email"]').last()).toBeVisible();
    await expect(page.locator('button:has-text("Signup")').last()).toBeVisible();
  });

  test('mobile menu should toggle on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(300); // Wait for resize
    
    // Check menu button is visible (using aria-controls instead of aria-label)
    const menuButton = page.locator('[aria-controls="collapsed-header-items"]');
    await expect(menuButton).toBeVisible();
    
    // Click menu button
    await menuButton.click();
    await page.waitForTimeout(500); // Wait for animation
    
    // Check that navigation items are visible (menu should be open)
    const aboutUsLink = page.locator('a[href="#features"]');
    await expect(aboutUsLink).toBeVisible();
  });

  test('should display footer correctly', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=/Follow us/i')).toBeVisible();
    await expect(page.locator('text=/Resources/i')).toBeVisible();
    
    // Check footer links
    await expect(page.locator('text=/About us/i').last()).toBeVisible();
    await expect(page.locator('text=/Contact Us/i')).toBeVisible();
  });

  test('should navigate from footer links', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Click login link in footer
    await page.locator('footer a:has-text("Login")').click();
    await expect(page).toHaveURL(/.*login/);
  });
});


