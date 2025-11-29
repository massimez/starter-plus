export const getBaseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .button { display: inline-block; background-color: #000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 24px; }
    .footer { margin-top: 32px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const getVerificationEmailTemplate = (otp: string) =>
	getBaseLayout(`
  <h1 style="margin-top: 0; font-size: 24px; font-weight: 600;">Verify your email</h1>
  <p>Thanks for signing up! Please use the code below to verify your email address.</p>
  <div style="background: #f4f4f5; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
    <span style="font-size: 32px; font-weight: 700; letter-spacing: 4px; font-family: monospace;">${otp}</span>
  </div>
  <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">If you didn't create an account, you can safely ignore this email.</p>
`);

export const getPasswordResetEmailTemplate = (otp: string) =>
	getBaseLayout(`
  <h1 style="margin-top: 0; font-size: 24px; font-weight: 600;">Reset your password</h1>
  <p>We received a request to reset your password. Use the code below to proceed.</p>
  <div style="background: #f4f4f5; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
    <span style="font-size: 32px; font-weight: 700; letter-spacing: 4px; font-family: monospace;">${otp}</span>
  </div>
  <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">If you didn't request a password reset, you can safely ignore this email.</p>
`);

export const getWelcomeEmailTemplate = (name: string) =>
	getBaseLayout(`
  <h1 style="margin-top: 0; font-size: 24px; font-weight: 600;">Welcome, ${name}!</h1>
  <p>We're excited to have you on board. Your account has been successfully created.</p>
`);
