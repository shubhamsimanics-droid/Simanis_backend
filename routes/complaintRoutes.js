const express = require('express');
const router = express.Router();
const multer = require('multer');
const { sendComplaintEmail } = require('../controllers/complaintController');

// In-memory storage → no file written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp|gif|bmp|tiff)/i.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

// Public: create/send complaint email (optional single image attachment)
router.post('/', upload.single('image'), sendComplaintEmail);

module.exports = router;
