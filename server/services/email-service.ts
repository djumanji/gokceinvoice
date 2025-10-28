import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_local_dev');

export interface EmailVerificationParams {
  email: string;
  verificationToken: string;
  username?: string;
}

export interface PasswordResetParams {
  email: string;
  resetToken: string;
  username?: string;
}

/**
 * Send email verification email to new users
 */
export async function sendVerificationEmail({
  email,
  verificationToken,
  username
}: EmailVerificationParams): Promise<void> {
  const verificationUrl = `${process.env.APP_DOMAIN || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  // Use Resend's testing domain for development, or your verified domain in production
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Welcome to GokceInvoice!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #667eea;">Hi${username ? ` ${username}` : ''},</h2>
              <p>Thank you for signing up for GokceInvoice! To get started, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #667eea; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                This link will expire in 24 hours. If you didn't create an account with GokceInvoice, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to GokceInvoice!
        
        Hi${username ? ` ${username}` : ''},
        
        Thank you for signing up! To verify your email address, click the following link:
        
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, you can safely ignore this email.
      `
    });

    if (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data?.id);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  email,
  resetToken,
  username
}: PasswordResetParams): Promise<void> {
  const resetUrl = `${process.env.APP_DOMAIN || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // Use Resend's testing domain for development, or your verified domain in production
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Password Reset Request</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #667eea;">Hi${username ? ` ${username}` : ''},</h2>
              <p>We received a request to reset your password for your GokceInvoice account. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetUrl}</p>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hi${username ? ` ${username}` : ''},
        
        We received a request to reset your password. Click the following link to create a new password:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
      `
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Password reset email sent successfully:', data?.id);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

