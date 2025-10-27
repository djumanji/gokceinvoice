# Deployment Fix Guide for Invoice Management System

This guide will help you fix the deployment issues you're experiencing with your Node.js full-stack application on Replit.

## Problem Summary

Your application is currently configured for **Cloud Run (Autoscale)** deployment, but this deployment type has limitations with Node.js applications that require build tools. The build environment doesn't have access to npm/Node.js during the build phase.

## Solution: Change to Reserved VM Deployment

### Step 1: Change Deployment Type

1. **Open the Deployments pane** in Replit (left sidebar)
2. Click on the **Configuration** tab
3. Under "Deployment Type", change from **"Autoscale (Cloud Run)"** to **"Reserved VM - Web Server"**
4. Click **Save** or **Apply**

### Step 2: Verify Environment Configuration

Your `.replit` file should have these settings (verify they exist):

```toml
[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "cloudrun"
ignorePorts = false
build = ["sh", "-c", "npm install && npm run build"]
```

**After changing to Reserved VM**, the deployment settings will be:
- **Build command**: `npm install && npm run build`
- **Run command**: `npm run start`
- **Port**: 5000 (already configured)

### Step 3: Verify Required Secrets

Make sure these environment variables/secrets are set in your Replit Secrets:

✅ **SESSION_SECRET** - Already configured
✅ **DATABASE_URL** - Already configured

If you need to add them manually:
1. Open **Secrets** tool (left sidebar or search in command bar)
2. Add any missing secrets:
   - `SESSION_SECRET`: Generate using `openssl rand -base64 32` in Shell
   - `DATABASE_URL`: Should be auto-populated if using Replit PostgreSQL

### Step 4: Optional - Edit .replit File Manually

If changing deployment type through UI doesn't work, you can manually edit the `.replit` file:

**Find this section:**
```toml
[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "cloudrun"
ignorePorts = false
build = ["sh", "-c", "npm run build"]
```

**Change `deploymentTarget` to `gce` or `vm` (Reserved VM):**
```toml
[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "vm"
ignorePorts = false
build = ["sh", "-c", "npm install && npm run build"]
```

### Step 5: Verify Nix Configuration

Your `replit.nix` file should include Node.js (it already does):

```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
    pkgs.postgresql_16
  ];
}
```

This is already correctly configured ✅

## Why This Fixes The Problem

1. **Reserved VM** provides a full runtime environment with Node.js available during both build and runtime
2. **Cloud Run** uses containerized builds that strip down the environment, making npm unavailable
3. Full-stack apps with build steps work better on Reserved VM deployments
4. The build command `npm install && npm run build` ensures all dependencies (including devDependencies needed for building) are installed before the build runs

## After Making Changes

1. **Re-deploy** your application from the Deployments pane
2. Monitor the build logs to ensure npm is found
3. Verify the application starts successfully

## Troubleshooting

If deployment still fails:

1. **Check build logs** in the Deployments pane for specific errors
2. **Verify all secrets are synced** between Workspace and Deployment
3. **Ensure DATABASE_URL points to production database** (not development)
4. **Check that port 5000 is properly configured** in your deployment settings

## Alternative: Static Deployment (Not Recommended for This App)

Your app could theoretically be built as a Static site, but since you have a backend with Express, database connections, and sessions, **Reserved VM is the correct choice**.

---

## Quick Checklist

- [ ] Change deployment type to Reserved VM
- [ ] Verify build command is `npm install && npm run build`
- [ ] Verify run command is `npm run start`
- [ ] Confirm SESSION_SECRET is set
- [ ] Confirm DATABASE_URL is set
- [ ] Deploy and monitor logs
- [ ] Test deployed application

---

If you continue to experience issues after following this guide, please share the specific error messages from the deployment logs.
