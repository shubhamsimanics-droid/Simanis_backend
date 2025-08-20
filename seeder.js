/* eslint-disable no-console */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const Category   = require("./models/Category");
const Product    = require("./models/Product");
const AdminUser  = require("./models/AdminUser");
const Enquiry    = require("./models/Enquiry");

const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!DB_URI) {
  console.error("❌ MONGO_URI (or MONGODB_URI) not set in .env");
  process.exit(1);
}

const FORCE = process.argv.includes("--force");

// ------------------ Catalogue categories ------------------
const CATEGORIES = [
  { name: "Automatic Sensor Hand Dryer", description: "Electric hand dryers with automatic IR sensors" },
  { name: "Liquid Soap & Sanitizer Dispenser", description: "Manual and automatic soap/sanitizer dispensers" },
  // ... keep others same as before ...
];

// ------------------ Products per category ------------------
const PRODUCTS_BY_CATEGORY = {
  "Automatic Sensor Hand Dryer": [
    { name: "Auto Hand Dryer 1800W", shortDesc: "ABS body, 1800W, ~12s dry time" },
    { name: "Compact Hand Dryer 1200W", shortDesc: "Space-saving, low noise" }
  ],
  "Liquid Soap & Sanitizer Dispenser": [
    { name: "Auto Foam Dispenser 1000ml", shortDesc: "Touchless foam, refillable" },
    { name: "Manual Soap Dispenser 800ml", shortDesc: "Wall-mount, easy refill" }
  ]
  // ... keep others same as before ...
};

// ------------------ Admin user config ------------------
const DEFAULT_ADMIN = {
  username: "admin",
  password: "Admin@123"   // will be hashed before insert
};

// ------------------ Sample enquiries ------------------
const SAMPLE_ENQUIRIES = [
  {
    name: "Ramesh Kumar",
    email: "ramesh@example.com",
    phone: "9876543210",
    message: "I want bulk pricing for the Auto Hand Dryer 1800W."
  },
  {
    name: "Anita Sharma",
    email: "anita@example.com",
    phone: "9123456789",
    message: "Do you have warranty details for Ultrasonic Humidifier 4L?"
  },
  {
    name: "Corporate Buyer",
    email: "corporate@example.com",
    message: "Looking for 50 units of Air Curtain 36” for office."
  }
];

// ------------------ helpers ------------------
function looksLikeProd(uri) {
  return /mongodb\.net\/(admin|prod|production)/i.test(uri);
}

async function connect() {
  await mongoose.connect(DB_URI, { autoIndex: true });
  console.log("✅ Connected to MongoDB");
}

async function upsertCategories() {
  console.log("⏳ Seeding categories…");
  const byName = new Map();

  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { name: c.name },
      {
        $setOnInsert: { name: c.name, image: null },
        $set: { description: c.description || "" }
      },
      { new: true, upsert: true }
    );
    byName.set(c.name, doc._id);
  }

  console.log(`✅ Categories upserted: ${byName.size}`);
  return byName;
}

async function upsertProducts(categoryNameToId) {
  console.log("⏳ Seeding products…");
  let count = 0;

  for (const [catName, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const catId = categoryNameToId.get(catName);
    if (!catId) continue;

    for (const p of products) {
      await Product.findOneAndUpdate(
        { name: p.name, category: catId },
        {
          $setOnInsert: {
            name: p.name,
            category: catId,
            images: [],
            specs: p.specs || []
          },
          $set: {
            shortDesc: p.shortDesc || "",
            description: p.description || ""
          }
        },
        { new: true, upsert: true }
      );
      count++;
    }
  }
  console.log(`✅ Products upserted: ${count}`);
}

async function seedAdmin() {
  console.log("⏳ Seeding admin user…");
  const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  await AdminUser.findOneAndUpdate(
    { username: DEFAULT_ADMIN.username.toLowerCase() },
    {
      $setOnInsert: {
        username: DEFAULT_ADMIN.username.toLowerCase(),
        passwordHash: hash
      }
    },
    { new: true, upsert: true }
  );
  console.log("✅ Admin user seeded (username: admin / password: Admin@123)");
}

async function seedEnquiries(products) {
  console.log("⏳ Seeding enquiries…");

  // attach product references to first few enquiries
  const prodDocs = await Product.find().limit(3);
  const mapped = SAMPLE_ENQUIRIES.map((e, idx) => ({
    ...e,
    product: prodDocs[idx] ? prodDocs[idx]._id : undefined
  }));

  for (const e of mapped) {
    await Enquiry.create(e);
  }

  console.log(`✅ Enquiries seeded: ${mapped.length}`);
}

async function main() {
  if (!FORCE && looksLikeProd(DB_URI)) {
    console.error("🛑 Refusing to run on a production-like database. Use --force to override.");
    process.exit(2);
  }

  await connect();

  if (process.argv.includes("--fresh")) {
    console.log("♻️ Clearing collections…");
    await Category.deleteMany({});
    await Product.deleteMany({});
    await AdminUser.deleteMany({});
    await Enquiry.deleteMany({});
  }

  const catMap = await upsertCategories();
  await upsertProducts(catMap);
  await seedAdmin();
  await seedEnquiries();

  await mongoose.disconnect();
  console.log("🎉 Seed complete.");
}

main().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
