const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.EMAIL && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

async function sendOTP(email, otp) {
  if (!transporter) {
    console.warn(`⚠️ Email transporter not configured. OTP for ${email}: ${otp}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Smart Gas Monitoring - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1976D2;">Smart Gas Monitoring</h2>
          <p style="font-size: 16px; color: #475569;">Your Password Reset OTP is:</p>
          <div style="background-color: #f5f9ff; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #1976D2; letter-spacing: 5px; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p style="font-size: 13px; color: #94a3b8;">This OTP code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`⚠️ Email sending failed: ${err.message}. OTP generated: ${otp}`);
    return false;
  }
}

module.exports = {
  sendOTP,
};