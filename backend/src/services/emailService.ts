import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const EmailService = {
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, name: string) {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@codecouncil.ai',
      subject: 'Welcome to CodeCouncil AI 🚀',
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>You've just unlocked access to your AI Engineering Team.</p>
        <p><strong>Your Trial Credits: 400</strong></p>
        <p>This is enough for:</p>
        <ul>
          <li>5 × Startup Audits (50 CR each)</li>
          <li>2 × Enterprise Deep Dives (150 CR each)</li>
        </ul>
        <p><a href="https://app.codecouncil.ai/dashboard" style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Get Started</a></p>
        <p>Questions? Reply to this email or visit our <a href="https://codecouncil.ai/docs">docs</a>.</p>
      `
    };

    try {
      if (process.env.ENABLE_EMAIL === 'true') {
        await sgMail.send(msg);
        return { success: true };
      } else {
        console.log('📧 Email (disabled):', msg);
        return { success: true, mocked: true };
      }
    } catch (error: any) {
      console.error('❌ SendGrid error:', error.message);
      throw error;
    }
  },

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(email: string, name: string, invoiceUrl: string, amount: number) {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@codecouncil.ai',
      subject: 'Your CodeCouncil AI Invoice',
      html: `
        <h2>Invoice from CodeCouncil AI</h2>
        <p>Hi ${name},</p>
        <p>Thank you for your purchase!</p>
        <p><strong>Amount: $${(amount / 100).toFixed(2)} USD</strong></p>
        <p><a href="${invoiceUrl}">View Invoice</a></p>
        <p>Questions? Contact support@codecouncil.ai</p>
      `
    };

    try {
      if (process.env.ENABLE_EMAIL === 'true') {
        await sgMail.send(msg);
        return { success: true };
      } else {
        console.log('📧 Email (disabled):', msg);
        return { success: true, mocked: true };
      }
    } catch (error: any) {
      console.error('❌ SendGrid error:', error.message);
      throw error;
    }
  },

  /**
   * Send notification email
   */
  async sendNotification(email: string, subject: string, htmlContent: string) {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@codecouncil.ai',
      subject,
      html: htmlContent
    };

    try {
      if (process.env.ENABLE_EMAIL === 'true') {
        await sgMail.send(msg);
        return { success: true };
      } else {
        console.log('📧 Email (disabled):', msg);
        return { success: true, mocked: true };
      }
    } catch (error: any) {
      console.error('❌ SendGrid error:', error.message);
      throw error;
    }
  }
};

export default EmailService;
