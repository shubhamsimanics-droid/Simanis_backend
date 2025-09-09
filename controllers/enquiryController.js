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

const ALLOWED_STATUSES = new Set(['new', 'in_progress', 'closed']);

exports.updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isRead } = req.body;

    const update = {};

    if (typeof status !== 'undefined') {
      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      update.status = status;
    }

    if (typeof isRead !== 'undefined') {
      // handle "true"/"false" strings from forms
      update.isRead = typeof isRead === 'string' ? isRead === 'true' : !!isRead;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const doc = await Enquiry.findByIdAndUpdate(id, update, { new: true })
      .populate('product');

    if (!doc) return res.status(404).json({ message: 'Enquiry not found' });

    return res.json(doc);
  } catch (err) {
    console.error('updateEnquiry error:', err);
    return res.status(400).json({ message: err.message || 'Failed to update enquiry' });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Enquiry.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Enquiry not found' });
    // No content needed for deletes
    return res.status(204).send();
  } catch (err) {
    console.error('deleteEnquiry error:', err);
    return res.status(400).json({ message: err.message || 'Failed to delete enquiry' });
  }
};
