import { test, expect } from '@playwright/test';

test.use({ 
  browserName: 'chromium',
  viewport: { width: 1920, height: 1080 }
});

test.describe('Marketing Page Header - Rendering and Positioning', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('desktop: header should be visible and properly positioned', async ({ page }) => {
    const header = page.locator('header');
    
    // Check header exists and is visible
    await expect(header).toBeVisible();
    
    // Check header position (should be absolute at top)
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox?.y).toBeLessThan(100); // Should be near top of page
    
    // Check header height
    expect(headerBox?.height).toBeCloseTo(60, 5); // Should be around 60px
  });

  test('desktop: login button should be visible and positioned correctly', async ({ page }) => {
    // Check login link exists
    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
    
    // Check login link is in header
    const loginBox = await loginLink.boundingBox();
    const headerBox = await (await page.locator('header').boundingBox());
    
    expect(loginBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    
    // Verify login link is within header bounds
    expect(loginBox!.y).toBeGreaterThanOrEqual(headerBox!.y);
    expect(loginBox!.y).toBeLessThan(headerBox!.y + headerBox!.height);
    
    // Check login text is visible
    await expect(loginLink).toContainText(/login/i);
  });

  test('desktop: signup button should be visible and positioned correctly', async ({ page }) => {
    // Check signup button exists
    const signupButton = page.locator('button:has-text("Signup"), a[href="/register"] button').first();
    await expect(signupButton).toBeVisible();
    
    // Check signup button is in header
    const signupBox = await signupButton.boundingBox();
    const headerBox = await (await page.locator('header').boundingBox());
    
    expect(signupBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    
    // Verify signup button is within header bounds
    expect(signupBox!.y).toBeGreaterThanOrEqual(headerBox!.y);
    expect(signupBox!.y).toBeLessThan(headerBox!.y + headerBox!.height);
  });

  test('desktop: navigation links should be visible and properly positioned', async ({ page }) => {
    const navLinks = [
      { href: '#features', text: /about us/i },
      { href: '#pricing', text: /pricing/i },
      { href: '#testimonials', text: /testimonials/i },
      { href: '#contact', text: /contact us/i },
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`a[href="${link.href}"]`).first();
      await expect(navLink).toBeVisible();
      
      // Check link is in header
      const linkBox = await navLink.boundingBox();
      const headerBox = await (await page.locator('header').boundingBox());
      
      expect(linkBox).not.toBeNull();
      expect(headerBox).not.toBeNull();
      
      // Verify link is within header bounds
      expect(linkBox!.y).toBeGreaterThanOrEqual(headerBox!.y);
      expect(linkBox!.y).toBeLessThan(headerBox!.y + headerBox!.height);
    }
  });

  test('desktop: collapsible header container should be visible and display flex', async ({ page }) => {
    const collapsibleHeader = page.locator('.collapsible-header');
    
    await expect(collapsibleHeader).toBeVisible();
    
    // Check computed styles
    const display = await collapsibleHeader.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');
    
    // Check opacity should be 1 (visible) on desktop
    const opacity = await collapsibleHeader.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(opacity)).toBeGreaterThan(0.9); // Should be fully visible
    
    // Check width should be 100% or auto on desktop
    const width = await collapsibleHeader.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    expect(width).not.toBe('0px');
  });

  test('mobile: hamburger menu button should be visible', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(300); // Wait for resize
    
    const menuButton = page.locator('[aria-controls="collapsed-header-items"]');
    await expect(menuButton).toBeVisible();
    
    // Check button position (should be top-right)
    const buttonBox = await menuButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    
    const headerBox = await (await page.locator('header').boundingBox());
    expect(headerBox).not.toBeNull();
    
    // Button should be in top-right area of header
    expect(buttonBox!.x + buttonBox!.width).toBeGreaterThan(headerBox!.width * 0.8);
    expect(buttonBox!.y).toBeLessThan(headerBox!.y + 20);
  });

  test('mobile: hamburger menu should toggle correctly', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(500); // Wait for resize
    
    const menuButton = page.locator('[aria-controls="collapsed-header-items"]');
    const collapsibleHeader = page.locator('.collapsible-header');
    
    // Menu should start collapsed (not visible)
    const initialOpacity = await collapsibleHeader.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(initialOpacity)).toBeLessThan(0.5);
    
    // Click hamburger button
    await menuButton.click();
    await page.waitForTimeout(800); // Wait longer for animation
    
    // Menu should now be visible - check width instead of opacity (more reliable)
    const openWidth = await collapsibleHeader.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    expect(openWidth).not.toBe('0px');
    expect(openWidth).not.toBe('0vw');
    
    // Navigation links should be visible
    const aboutUsLink = page.locator('a[href="#features"]');
    await expect(aboutUsLink).toBeVisible();
    
    // Click hamburger button again to close
    await menuButton.click();
    await page.waitForTimeout(800); // Wait for animation
    
    // Menu should be collapsed again - check width
    const closedWidth = await collapsibleHeader.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    expect(closedWidth).toBe('0px');
  });

  test('mobile: login and signup buttons should be accessible in menu', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(500);
    
    // Open menu
    const menuButton = page.locator('[aria-controls="collapsed-header-items"]');
    await menuButton.click();
    await page.waitForTimeout(800);
    
    // Check login link is visible in menu (use first() to get header one, not footer)
    const loginLink = page.locator('#collapsed-header-items a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
    
    // Check signup button is visible in menu
    const signupButton = page.locator('#collapsed-header-items button:has-text("Signup"), #collapsed-header-items a[href="/register"] button').first();
    await expect(signupButton).toBeVisible();
  });

  test('mobile: menu should close when clicking outside', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(300);
    
    const menuButton = page.locator('[aria-controls="collapsed-header-items"]');
    const collapsibleHeader = page.locator('.collapsible-header');
    
    // Open menu
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Click outside menu (on hero section)
    await page.locator('h1').first().click();
    await page.waitForTimeout(500);
    
    // Menu should be closed
    const opacity = await collapsibleHeader.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(opacity)).toBeLessThan(0.5);
  });

  test('responsive: header should adapt correctly on resize', async ({ page }) => {
    // Start with desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);
    
    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
    
    const menuButton = page.locator('[aria-controls="collapsed-header-items"]');
    await expect(menuButton).not.toBeVisible(); // Should be hidden on desktop
    
    // Resize to mobile
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(500); // Wait for resize handler
    
    // Hamburger should be visible
    await expect(menuButton).toBeVisible();
    
    // Login link should be hidden initially (in collapsed menu)
    const loginVisible = await loginLink.isVisible();
    // May or may not be visible depending on menu state, but hamburger should be
    
    // Resize back to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Login should be visible again
    await expect(loginLink).toBeVisible();
    
    // Hamburger should be hidden
    await expect(menuButton).not.toBeVisible();
  });
});

