import multer from "multer";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const storage = multer.memoryStorage();

function imageFileFilter(_req, file, callback) {
  if (!allowedImageTypes.has(file.mimetype)) {
    callback(
      new Error("Only JPEG, PNG, and WebP profile images are allowed")
    );
    return;
  }

  callback(null, true);
}

export const uploadProfilePhoto = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
}).single("profilePhoto");