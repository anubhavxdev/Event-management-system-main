import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  // Fallback: Agar .env me SMTP setup nahi hai, toh console me log kar do (Mock SMTP)
  if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.log('\n✉️ --- MOCK EMAIL INTERCEPTED --- ✉️');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: \n${options.message}`);
    console.log('------------------------------------\n');
    return;
  }

  // Production/Staging: Real SMTP server setup
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'Event Platform'} <${process.env.FROM_EMAIL || 'noreply@eventplatform.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // Agar future me HTML template bhejna ho toh html: options.html yaha add kar sakte hai
  };

  await transporter.sendMail(message);
};