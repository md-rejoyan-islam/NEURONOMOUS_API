import multer, { memoryStorage } from "multer";
const supportedFormat = [".bin"];

const upload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 0.5 * 1024 * 1024, // Set the file size limit to 500KB
  },
  fileFilter: (req, file, cb) => {
    if (
      supportedFormat.some((format) => file.mimetype.includes(format)) ||
      file.mimetype === "application/octet-stream"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .bin and .gif files are allowed!"));
    }
  },
});

export default upload;
