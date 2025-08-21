// src/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                   // e.g. smtp.gmail.com, smtp.zoho.in, smtp.office365.com
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',    // true for 465, false for 587/25
  auth: {
    user: process.env.SMTP_USER,                 // full mailbox (e.g. your@domain.com)
    pass: process.env.SMTP_PASS,                 // app password or SMTP password
  },
});

async function sendEnquiryEmail({ to, fromEmail, fromName, message, product }) {
  const subject = `New enquiry${product?.name ? ` • ${product.name}` : ''} from ${fromName}`;
  const text = [
    `Name: ${fromName}`,
    `Email: ${fromEmail}`,
    product?.name ? `Product: ${product.name}` : null,
    '',
    'Message:',
    message,
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font:14px/1.5 -apple-system,Segoe UI,Roboto,Arial;">
      <h2 style="margin:0 0 8px;">New enquiry received</h2>
      <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(fromName)}</p>
      <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(fromEmail)}">${escapeHtml(fromEmail)}</a></p>
      ${product?.name ? `<p style="margin:0 0 8px;"><strong>Product:</strong> ${escapeHtml(product.name)}</p>` : ''}
      <p style="margin:16px 0 6px;"><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;background:#f6f7f8;padding:12px;border-radius:6px;border:1px solid #eee;">${escapeHtml(message)}</pre>
    </div>
  `;

  return transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'Simanics Website'}" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to,                          // your inbox
    replyTo: fromEmail,          // so you can reply directly to the user
    subject,
    text,
    html,
  });
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

module.exports = { sendEnquiryEmail };
