// controllers/enquiryController.js
const Enquiry = require('../models/Enquiry');
const Product = require('../models/Product'); // only if you store product id
const { sendEnquiryEmail } = require('../utils/mailer');

exports.createEnquiry = async (req, res) => {
  try {
    const { name = '', email = '', message = '', product: productId } = req.body;
    // basic input sanity
    if (!name.trim() || !email.trim() || !message.trim()) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    // persist enquiry
    const enquiry = new Enquiry({ name: name.trim(), email: email.trim(), message: message.trim(), product: productId || undefined });
    await enquiry.save();

    // fetch product name for the email (optional)
    let product = null;
    if (productId) {
      product = await Product.findById(productId).select('name').lean().catch(() => null);
    }

    // send email to admin
    let emailSent = false;
    try {
      await sendEnquiryEmail({
        to: process.env.ADMIN_EMAIL,          // set this in env
        fromEmail: enquiry.email,
        fromName: enquiry.name,
        message: enquiry.message,
        product,
      });
      emailSent = true;
    } catch (mailErr) {
      console.error('Email send failed:', mailErr.message);
      // do not fail the API just because email failed
    }

    res.status(201).json({ ...enquiry.toObject(), emailSent });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || 'Failed to create enquiry' });
  }
};

exports.getEnquiries = async (req, res) => {
  const enquiries = await Enquiry.find().populate('product');
  res.json(enquiries);
};
