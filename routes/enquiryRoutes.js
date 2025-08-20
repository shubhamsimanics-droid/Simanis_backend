const express = require("express");
const { createEnquiry, getEnquiries } = require("../controllers/enquiryController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

const verify = require('../middleware/verifyToken');

router.post("/", createEnquiry);

//protected routes
router.get("/", verify, getEnquiries);

module.exports = router;
