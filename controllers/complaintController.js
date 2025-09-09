const { sendEnquiryEmail } = require('../utils/mailer'); // reuse your contact mailer

exports.sendComplaintEmail = async (req, res) => {
  try {
    const {
      name = '',
      email = '',
      phone = '',
      type = 'other',
      priority = 'medium',
      orderRef = '',
      description = ''
    } = req.body || {};

    // Minimal validation
    if (!name.trim() || !email.trim() || !description.trim()) {
      return res.status(400).json({ message: 'Name, email, and description are required.' });
    }

    // Build email body (keep it similar to contact)
    const lines = [
      `COMPLAINT RECEIVED`,
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      phone ? `Phone: ${String(phone).trim()}` : null,
      `Type: ${type}`,
      `Priority: ${priority}`,
      orderRef ? `Order/Invoice: ${String(orderRef).trim()}` : null,
      '',
      'Details:',
      String(description).trim()
    ].filter(Boolean);

    // Optional attachment from memory (no persistence)
    const attachments = [];
    if (req.file && req.file.buffer && req.file.originalname) {
      attachments.push({
        filename: req.file.originalname.replace(/\s+/g, '_'),
        content: req.file.buffer,
        contentType: req.file.mimetype
      });
    }

    await sendEnquiryEmail({
  to: process.env.ADMIN_EMAIL,
  fromEmail: email.trim(),
  fromName: name.trim(),
  subject: `New complaint from ${name.trim()}`,  // custom subject
  message: `
Type: ${type}
Priority: ${priority}
OrderRef: ${orderRef || '-'}
Phone: ${phone || '-'}

Details:
${description}
  `,
  attachments: req.file ? [{
    filename: req.file.originalname.replace(/\s+/g,'_'),
    content: req.file.buffer,
    contentType: req.file.mimetype,
  }] : []
});


    // Nothing stored; just acknowledge
    return res.status(202).json({ sent: true });
  } catch (err) {
    console.error('sendComplaintEmail error:', err);
    return res.status(500).json({ message: 'Failed to send complaint email' });
  }
};
