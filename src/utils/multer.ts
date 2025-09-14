import multer, { memoryStorage } from "multer";
const supportedFormat = [".bin", "pdf"];

const upload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Set the file size limit to 5MB
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

const studentFileUpload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Set the file size limit to 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log(file.mimetype);
    console.log(file);

    if (
      [".json"].some((format) => file.mimetype.includes(format)) ||
      file.mimetype === "application/json"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .json files are allowed!"));
    }
  },
});

export { studentFileUpload };

export default upload;
