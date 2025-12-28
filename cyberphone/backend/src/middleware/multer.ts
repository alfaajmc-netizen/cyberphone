import multer from "multer";
import fs from "fs";
import path from "path";

const tmpDir = path.join(process.cwd(), "tmp", "uploads");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

export const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination: function (_req, _file, cb) {
      cb(null, tmpDir);
    },
    filename: function (_req, file, cb) {
      // keep original name; server will prefix a uuid on upload to S3
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 250 * 1024 * 1024), // default 250 MB
  },
  fileFilter: function (_req, file, cb) {
    // basic allow: images and videos
    if (/^(image|video)\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Tipo de arquivo não permitido"), false);
  },
});