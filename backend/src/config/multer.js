import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    const ok =
      allowed.includes(file.mimetype) ||
      /\.(csv|xlsx)$/i.test(file.originalname || "");
    if (ok) cb(null, true);
    else cb(new Error("Only CSV and Excel (.xlsx) files are allowed"), false);
  }
});

export const uploadSingle = upload.single("file");
