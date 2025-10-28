# Password Reset Flow

## Overview

Complete password reset flow from login page to password reset completion.

## User Journey

### 1. Forgot Password Request
- User clicks "Forgot password?" link on login page
- Redirected to `/forgot-password` page
- Enters email address
- System sends password reset email

### 2. Password Reset Email
- User receives email with reset link
- Link format: `/reset-password?token={reset-token}`

### 3. Set New Password
- User clicks link in email
- Redirected to reset password page
- Enters new password and confirms
- Password is updated in database

## Components

### Pages

1. **Login.tsx**
   - Added "Forgot password?" link next to password field
   - Links to `/forgot-password`

2. **ForgotPassword.tsx** (NEW)
   - Email input form
   - Success state showing instructions
   - Calls `/api/auth/forgot-password`

3. **ResetPassword.tsx** (EXISTING)
   - Token-based password reset form
   - Validates token from URL
   - Calls `/api/auth/reset-password`

## API Endpoints

### POST /api/auth/forgot-password
- **Body:** `{ email: string }`
- **Response:** Success message
- **Actions:**
  - Finds user by email
  - Generates reset token
  - Sends reset email
  - Stores token in database with expiration

### POST /api/auth/reset-password
- **Body:** `{ token: string, password: string }`
- **Response:** Success message
- **Actions:**
  - Validates token
  - Checks expiration
  - Updates password
  - Invalidates token

## Security Features

1. **Token Expiration**
   - Reset tokens expire after 1 hour
   - Stored with timestamp in database

2. **Rate Limiting**
   - Applies to forgot-password endpoint
   - Prevents abuse

3. **One-Time Use**
   - Token is invalidated after use
   - Cannot be reused

## Translation Keys

Added to `en.json`:
- `auth.forgotPassword` - "Forgot password?"
- `auth.sendResetLink` - "Send Reset Link"
- `auth.checkEmailForReset` - "Check your email for reset instructions"
- `auth.enterEmailToReset` - "Enter your email address..."
- `auth.resetEmailInstructions` - "We've sent password reset..."
- `auth.passwordResetSent` - "Password reset link sent successfully"
- `auth.passwordResetFailed` - "Failed to send password reset link"

## Testing

1. Go to login page
2. Click "Forgot password?" link
3. Enter email address
4. Check email for reset link
5. Click link and set new password
6. Login with new password

## Files Modified

- `client/src/pages/Login.tsx` - Added forgot password link
- `client/src/pages/ForgotPassword.tsx` - New page
- `client/src/App.tsx` - Added route
- `client/src/i18n/locales/en.json` - Added translations

## Database Schema

Existing columns in `users` table:
- `password_reset_token` - Token for reset
- `password_reset_expires` - Expiration timestamp

