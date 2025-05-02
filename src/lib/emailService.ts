import nodemailer from 'nodemailer';

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password',
  },
});

// Email templates
const templates = {
  rebateReceived: (data: {
    userName: string;
    amount: number;
    generatorName: string;
    level: number;
    productName: string;
  }) => {
    return {
      subject: `You've Received a Rebate of $${data.amount.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">New Rebate Received!</h2>
          <p>Hello ${data.userName},</p>
          <p>Great news! You've received a rebate of <strong style="color: #48bb78;">$${data.amount.toFixed(2)}</strong>.</p>
          <div style="background-color: #f7fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #4a5568;">Rebate Details:</h3>
            <ul style="padding-left: 20px;">
              <li>Amount: <strong>$${data.amount.toFixed(2)}</strong></li>
              <li>From: <strong>${data.generatorName}</strong></li>
              <li>Level: <strong>${data.level}</strong></li>
              <li>Product: <strong>${data.productName}</strong></li>
            </ul>
          </div>
          <p>This rebate has been added to your wallet balance. You can view your rebate details and wallet balance by logging into your account.</p>
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXTAUTH_URL}/wallet" style="background-color: #4299e1; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Wallet</a>
          </div>
          <p style="margin-top: 24px; color: #718096; font-size: 14px;">Thank you for being part of our MLM network!</p>
        </div>
      `,
    };
  },
  
  rankAdvancement: (data: {
    userName: string;
    oldRank: string;
    newRank: string;
    benefits: string[];
  }) => {
    return {
      subject: `Congratulations on Your Rank Advancement to ${data.newRank}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Rank Advancement Achievement!</h2>
          <p>Hello ${data.userName},</p>
          <p>Congratulations! You've advanced from <strong>${data.oldRank}</strong> to <strong style="color: #805ad5;">${data.newRank}</strong>!</p>
          <div style="background-color: #f7fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #4a5568;">Your New Benefits:</h3>
            <ul style="padding-left: 20px;">
              ${data.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
          <p>Keep up the great work! As you continue to grow your network and increase your sales, you'll unlock even more benefits and higher rebate percentages.</p>
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #805ad5; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Dashboard</a>
          </div>
          <p style="margin-top: 24px; color: #718096; font-size: 14px;">Thank you for your dedication and commitment to our MLM network!</p>
        </div>
      `,
    };
  },
};

// Send email function
export async function sendEmail(
  to: string,
  template: keyof typeof templates,
  data: any
) {
  try {
    const { subject, html } = templates[template](data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MLM Rebate Engine <noreply@example.com>',
      to,
      subject,
      html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Verify connection
export async function verifyEmailConnection() {
  try {
    const verification = await transporter.verify();
    console.log('Email service is ready:', verification);
    return verification;
  } catch (error) {
    console.error('Email service verification failed:', error);
    return false;
  }
}
