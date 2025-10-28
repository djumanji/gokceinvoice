# Email Configuration Guide

## Overview
The application uses [Resend](https://resend.com) for sending transactional emails including:
- Email verification for new user registrations
- Password reset emails

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=your_api_key_here

# From email address
RESEND_FROM_EMAIL=onboarding@resend.dev

# Application domain (used in email links)
APP_DOMAIN=http://localhost:3000
```

### Development vs Production

#### Development (Testing Mode)
- **From Email**: Use `onboarding@resend.dev`
- **Limitation**: Can only send to the email address that owns the Resend account
- **Use Case**: Testing email functionality during development

```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

#### Production
- **From Email**: Use your verified domain (e.g., `noreply@yourdomain.com`)
- **Requirement**: You must verify your domain at [resend.com/domains](https://resend.com/domains)
- **Use Case**: Sending to any email address

```bash
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## How to Verify Your Domain for Production

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the provided DNS records to your domain's DNS settings:
   - SPF record
   - DKIM records
   - DMARC record (recommended)
5. Wait for verification (usually takes a few minutes to a few hours)
6. Once verified, update `RESEND_FROM_EMAIL` to use your domain:
   ```bash
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

## Testing

### Test with Your Own Email

Since you're using the testing domain (`onboarding@resend.dev`), you can only send emails to the email address associated with your Resend account.

**Example**: If your Resend account is `cemre@example.com`, you can:
- ✅ Register with `cemre@example.com` - Email will be sent
- ❌ Register with `other@example.com` - Email will fail with validation error

### Production Testing

Once you've verified your domain, you can send emails to any recipient.

## Email Templates

The application includes two email templates:

### 1. Email Verification
- **Subject**: "Verify Your Email Address"
- **Purpose**: Sent when a new user registers
- **Contains**: Verification link that expires in 24 hours
- **File**: `server/services/email-service.ts` - `sendVerificationEmail()`

### 2. Password Reset
- **Subject**: "Reset Your Password"
- **Purpose**: Sent when a user requests password reset
- **Contains**: Reset link that expires in 1 hour
- **File**: `server/services/email-service.ts` - `sendPasswordResetEmail()`

## Troubleshooting

### Error: "You can only send testing emails to your own email address"

**Cause**: You're using `onboarding@resend.dev` but trying to send to an email that doesn't own the Resend account.

**Solution**: Either:
1. Test with the email address that owns your Resend account, OR
2. Verify your domain and use a custom from address

### Error: "Unable to fetch data. The request could not be resolved."

**Cause**: Invalid or missing Resend API key.

**Solution**:
1. Check that `RESEND_API_KEY` is set in your `.env` file
2. Verify your API key at [resend.com/api-keys](https://resend.com/api-keys)
3. Make sure the key starts with `re_`

### Emails Not Being Received

**Check:**
1. Spam/Junk folder
2. Server logs for "Verification email sent successfully: msg_xxxxx"
3. Resend dashboard at [resend.com/emails](https://resend.com/emails) to see email status

### Email Sending Fails But Registration Succeeds

This is **intentional behavior**. The application doesn't fail user registration if email sending fails. Users can still:
- Log in to the application
- Use all features (email verification is optional)
- Request a new verification email later (when you implement the feature)

## Code Reference

### Email Service Implementation
- **File**: `server/services/email-service.ts`
- **Functions**:
  - `sendVerificationEmail()` - Sends verification emails
  - `sendPasswordResetEmail()` - Sends password reset emails

### Usage in Auth Routes
- **File**: `server/auth-routes.ts`
- **Register endpoint** (line 71): Sends verification email after user creation
- **Forgot password endpoint** (line 244): Sends password reset email

## Best Practices

1. **Development**: Always use `onboarding@resend.dev` for testing
2. **Production**: Always use a verified domain
3. **Security**: Never commit your `RESEND_API_KEY` to version control
4. **Error Handling**: Email failures don't block user registration (current implementation)
5. **Monitoring**: Check Resend dashboard regularly for email delivery stats

## Cost & Limits

Resend free tier includes:
- 3,000 emails per month
- 100 emails per day
- Perfect for development and small projects

For production at scale, check [Resend Pricing](https://resend.com/pricing).

## Next Steps

To fully utilize email functionality in production:

1. ✅ Verify your domain at [resend.com/domains](https://resend.com/domains)
2. ✅ Update `RESEND_FROM_EMAIL` in your `.env`
3. ✅ Customize email templates in `server/services/email-service.ts`
4. ⏳ Implement "Resend Verification Email" feature
5. ⏳ Add email verification status badge on dashboard
6. ⏳ Implement "Forgot Password" link on login page

## Support

- Resend Documentation: [docs.resend.com](https://resend.com/docs)
- Resend Dashboard: [resend.com](https://resend.com)
- GitHub Issues: Report bugs in your project repository
