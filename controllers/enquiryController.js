const Enquiry = require("../models/Enquiry");

exports.createEnquiry = async (req, res) => {
  try {
    const enquiry = new Enquiry(req.body);
    await enquiry.save();
    res.status(201).json(enquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getEnquiries = async (req, res) => {
  const enquiries = await Enquiry.find().populate("product");
  res.json(enquiries);
};
