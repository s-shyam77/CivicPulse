
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Folders ----------
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded photos
app.use("/uploads", express.static(uploadDir));

app.use(cors());
app.use(express.json());

// ---------- SQLite Database ----------
const db = new Database(path.join(__dirname, "civicpulse.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    location TEXT DEFAULT '',
    status TEXT DEFAULT 'Reported',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add new columns safely for an existing database
const existingColumns = db
  .prepare("PRAGMA table_info(issues)")
  .all()
  .map((column) => column.name);

if (!existingColumns.includes("photo_path")) {
  db.exec("ALTER TABLE issues ADD COLUMN photo_path TEXT");
}

if (!existingColumns.includes("latitude")) {
  db.exec("ALTER TABLE issues ADD COLUMN latitude REAL");
}

if (!existingColumns.includes("longitude")) {
  db.exec("ALTER TABLE issues ADD COLUMN longitude REAL");
}

// ---------- Photo Upload ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = /^\.(jpg|jpeg|png|webp|gif|heic)$/.test(ext)
      ? ext
      : ".jpg";

    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// ---------- API Routes ----------

// Home
app.get("/", (req, res) => {
  res.json({ message: "CivicPulse API is running!" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    database: db.open ? "Connected (SQLite)" : "Disconnected",
  });
});

// Fetch all issues
app.get("/api/issues", (req, res) => {
  try {
    const issues = db
      .prepare("SELECT * FROM issues ORDER BY id DESC")
      .all();

    res.json(
      issues.map((issue) => ({
        ...issue,
        photo_url: issue.photo_path
          ? `/uploads/${encodeURIComponent(
              path.basename(issue.photo_path)
            )}`
          : null,
      }))
    );
  } catch (error) {
    console.error("Fetch issues failed:", error.message);
    res.status(500).json({ message: "Could not fetch issues." });
  }
});

// Create a new issue, optionally with a photo
app.post("/api/issues", (req, res, next) => {
  upload.single("photo")(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        message: uploadError.message || "Photo upload failed.",
      });
    }

    next();
  });
}, (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      latitude,
      longitude,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      if (req.file) fs.unlinkSync(req.file.path);

      return res.status(400).json({
        message: "Title and description are required.",
      });
    }

    const lat = latitude === "" || latitude == null
      ? null
      : Number(latitude);

    const lng = longitude === "" || longitude == null
      ? null
      : Number(longitude);

    if (
      (lat !== null && !Number.isFinite(lat)) ||
      (lng !== null && !Number.isFinite(lng)) ||
      (lat !== null && (lat < -90 || lat > 90)) ||
      (lng !== null && (lng < -180 || lng > 180))
    ) {
      if (req.file) fs.unlinkSync(req.file.path);

      return res.status(400).json({
        message: "Invalid GPS coordinates.",
      });
    }

    const photoPath = req.file
      ? req.file.filename
      : null;

    const result = db.prepare(`
      INSERT INTO issues (
        title,
        description,
        category,
        location,
        photo_path,
        latitude,
        longitude
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      description.trim(),
      typeof category === "string" && category.trim()
        ? category.trim()
        : "Other",
      typeof location === "string" ? location.trim() : "",
      photoPath,
      lat,
      lng
    );

    const issue = db
      .prepare("SELECT * FROM issues WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({
      ...issue,
      photo_url: issue.photo_path
        ? `/uploads/${encodeURIComponent(issue.photo_path)}`
        : null,
    });
  } catch (error) {
    console.error("Issue creation failed:", error.message);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Could not create issue.",
    });
  }
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`CivicPulse backend running at http://localhost:${PORT}`);
  console.log("Database: SQLite");
  console.log(`Photo uploads: ${uploadDir}`);
});
