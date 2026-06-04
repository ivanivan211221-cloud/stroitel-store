const fs = require("fs/promises");
const path = require("path");

const UPLOADS_PREFIX = "/uploads/";

function localUploadPathFromUrl(value) {
  if (!value || typeof value !== "string") return null;

  let pathname = value;
  try {
    pathname = new URL(value).pathname;
  } catch {
    // Plain local paths like /uploads/file.jpg are also valid product images.
  }

  const prefixIndex = pathname.lastIndexOf(UPLOADS_PREFIX);
  if (prefixIndex === -1) return null;

  const fileName = decodeURIComponent(pathname.slice(prefixIndex + UPLOADS_PREFIX.length));
  if (!fileName || fileName.includes("/") || fileName.includes("\\")) return null;

  const uploadsDir = path.resolve(process.cwd(), "uploads");
  const filePath = path.resolve(uploadsDir, fileName);
  if (!filePath.startsWith(`${uploadsDir}${path.sep}`)) return null;

  return filePath;
}

async function deleteLocalUpload(value) {
  const filePath = localUploadPathFromUrl(value);
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`Failed to delete upload ${filePath}:`, err.message);
    }
  }
}

module.exports = { deleteLocalUpload, localUploadPathFromUrl };
