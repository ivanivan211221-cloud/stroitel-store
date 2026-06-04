const express = require("express");
const { randomUUID } = require("crypto");
const path = require("path");
const multer = require("multer");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "uploads")),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${randomUUID()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Только изображения"));
    cb(null, true);
  },
});

const ensureUploadEnabled = (_req, res, next) => {
  if (process.env.DISABLE_FILE_UPLOAD === "true") {
    return res.status(503).json({
      message: "Загрузка на диск отключена на хостинге. Укажите URL изображения в поле товара.",
    });
  }
  next();
};

router.post(
  "/",
  auth,
  allowRoles("ADMIN", "MANAGER", "CONTENT_MANAGER"),
  ensureUploadEnabled,
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Файл не загружен" });
    const base =
      process.env.PUBLIC_API_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      `http://localhost:${process.env.PORT || 4000}`;
    res.json({ url: `${base}/uploads/${req.file.filename}` });
  }
);

module.exports = router;
