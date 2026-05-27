import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  const useMock = process.env.USE_MOCK_EMAIL === "true" || !process.env.SMTP_HOST;

  if (useMock) {
    console.log("======================================== MOCK EMAIL ========================================");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html.replace(/<[^>]*>/g, "\n").trim()}`); // simple HTML-to-text formatting for logs
    console.log("=============================================================================================");
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@privatesocial.local",
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Error sending email via SMTP:", error);
    return false;
  }
}

// Pre-configured HTML email templates
export function getEmailVerificationTemplate(username: string, link: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to our Private Community!</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Thank you for signing up. Please click the button below to verify your email address and proceed with registration:</p>
      <a href="${link}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 20px 0;">Verify Email Address</a>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">${link}</p>
      <p>This verification link will expire in 24 hours.</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
        This email was sent to you because you requested to join a private network. If you did not make this request, you can ignore this email.
      </p>
    </div>
  `;
}

export function getPasswordResetTemplate(username: string, link: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Reset Your Password</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <a href="${link}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 20px 0;">Reset Password</a>
      <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p>This reset link will expire in 1 hour.</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
        If the button doesn't work, copy and paste this link into your browser: <br/> ${link}
      </p>
    </div>
  `;
}
