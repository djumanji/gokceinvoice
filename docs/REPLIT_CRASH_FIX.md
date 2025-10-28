# Fix Replit Crash: Missing i18next

## Problem
The app crashes with error: `Failed to resolve import "i18next" from "client/src/i排放/config.ts"`

## Solution

Run this command in Replit:

```bash
npm install
```

This will install all missing dependencies including:
- i18next
- react-i18next
- i18next-browser-languagedetector
- All other dependencies from package.json

## After Installation

1. Restart your Repl
2. The app should start successfully

## If it still crashes

Check if all dependencies are properly listed in `package.json`:

```bash
cat package.json | grep i18n
```

You should see:
```json
"i18next": "^23.0.0",
"react-i18next": "^14.0.0",
"i18next-browser-languagedetector": "^7.0.0"
```

If these are missing, they were probably added after you pulled the code but `npm install` hasn't been run yet.

