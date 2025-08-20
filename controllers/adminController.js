const AdminUser = require("../models/AdminUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerAdmin = async (req, res) => {
  const { username, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = new AdminUser({ username, passwordHash });
  await admin.save();
  res.status(201).json({ message: "Admin registered" });
};

exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  const admin = await AdminUser.findOne({ username });
  if (!admin) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token });
};
