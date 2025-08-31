// services/emailService.js
import nodemailer from "nodemailer";
import config from "../config/config.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"Samlex" <${config.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Email sending failed:", error);
      throw error;
    }
  }

  async sendWelcomeEmail(user, temporaryPassword, lawFirm) {
    const subject = `Welcome to ${lawFirm.firmName} - Law Firm Case Management`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Welcome to ${lawFirm.firmName}</h2>
        <p>Hello ${user.firstName} ${user.lastName},</p>
        <p>Your account has been created in the Law Firm Case Management System.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          <p><strong>Role:</strong> ${user.role
            .replace("_", " ")
            .toUpperCase()}</p>
        </div>
        <p style="color: #ef4444; font-weight: bold;">
          ⚠️ Please change your password after your first login for security purposes.
        </p>
        <p>
          <a href="${config.CLIENT_URL}/login" 
             style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Login to Your Account
          </a>
        </p>
        <p>If you have any questions, please contact your system administrator.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">
          This is an automated email from the Law Firm Case Management System.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  async sendLawFirmRegistrationEmail({ to, firmName, adminName, plan }) {
    const subject = `Welcome to Samlex - ${firmName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Welcome to Samlex</h2>
        <p>Hello ${adminName},</p>
        <p>Thank you for registering ${firmName} with Samlex!</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Registration Details:</h3>
          <p><strong>Firm Name:</strong> ${firmName}</p>
          <p><strong>Selected Plan:</strong> ${
            plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Standard"
          }</p>
          <p><strong>Admin Email:</strong> ${to}</p>
        </div>
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Next Steps:</h3>
          <p>1. Complete your payment to activate your account</p>
          <p>2. You will receive login credentials once payment is confirmed</p>
          <p>3. Access your dashboard and start managing your cases</p>
        </div>
        <p>If you have any questions about completing your payment or need assistance, please contact our support team.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">
          This is an automated email from the Samlex platform.
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendLawFirmWelcomeEmail({
    to,
    firmName,
    loginEmail,
    password,
    firmCode,
  }) {
    const subject = `Welcome to Samlex - ${firmName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Welcome to Samlex</h2>
        <p>Hello ${firmName} Team,</p>
        <p>Your law firm has been successfully registered in the Samlex platform.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Law Firm Details:</h3>
          <p><strong>Firm Name:</strong> ${firmName}</p>
          <p><strong>Firm Code:</strong> ${firmCode}</p>
          <p><strong>Primary Email:</strong> ${to}</p>
        </div>
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Login Credentials:</h3>
          <p><strong>Login Email:</strong> ${loginEmail}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p style="color: #ef4444; font-weight: bold;">
            ⚠️ Please change your password after your first login for security purposes.
          </p>
        </div>
        <p>
          <a href="${config.CLIENT_URL}/login" 
             style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Login to Your Dashboard
          </a>
        </p>
        <p><strong>Alternative Login:</strong> You can also login using your primary email (${to}) with the same password.</p>
        <p>If you have any questions, please contact our support team.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">
          This is an automated email from the Samlex platform.
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendCaseAssignmentNotification(user, caseData, assigner) {
    const subject = `New Case Assigned: ${caseData.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">New Case Assignment</h2>
        <p>Hello ${user.firstName},</p>
        <p>You have been assigned a new case by ${assigner.firstName} ${
      assigner.lastName
    }.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Case Details:</h3>
          <p><strong>Case Number:</strong> ${caseData.caseNumber}</p>
          <p><strong>Case Reference:</strong> ${
            caseData.caseReference || "Not set"
          }</p>
          <p><strong>Title:</strong> ${caseData.title}</p>
          <p><strong>Priority:</strong> ${caseData.priority.toUpperCase()}</p>
        </div>
        <p>
          <a href="${config.CLIENT_URL}/cases/${caseData._id}" 
             style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Case Details
          </a>
        </p>
        <p>Please log in to your dashboard to start working on this case.</p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  async sendPaymentConfirmation(user, payment, caseData) {
    const subject = `Payment Confirmation - ${payment.paymentId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Payment Confirmed</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your payment has been successfully processed.</p>
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Details:</h3>
          <p><strong>Payment ID:</strong> ${payment.paymentId}</p>
          <p><strong>Amount:</strong> ${
            payment.currency
          } ${payment.amount.toLocaleString()}</p>
          <p><strong>Purpose:</strong> ${payment.purpose
            .replace("_", " ")
            .toUpperCase()}</p>
          <p><strong>Case:</strong> ${caseData.caseNumber} - ${
      caseData.title
    }</p>
          <p><strong>Date:</strong> ${new Date(
            payment.createdAt
          ).toLocaleDateString()}</p>
        </div>
        <p>Thank you for your payment. Your case will now proceed to the next stage.</p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.CLIENT_URL}/reset-password/${resetToken}`;
    const subject = "Password Reset Request";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Password Reset Request</h2>
        <p>Hello ${user.firstName},</p>
        <p>You have requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security purposes.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">
          If the button doesn't work, copy and paste this URL into your browser:<br>
          ${resetUrl}
        </p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  // Method to verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready to send emails");
      return true;
    } catch (error) {
      console.error("Email service verification failed:", error);
      return false;
    }
  }
}

export default new EmailService();
