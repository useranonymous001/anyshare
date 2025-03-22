const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const AppError = require("../utils/errorApi");
const {
  notAllowedExtensions,
  notAllowedMimeTypes,
} = require("../utils/mime_extensions");
const path = require("node:path");

const storage = new GridFsStorage({
  url: "mongodb://127.0.0.1:27017/anyshare",
  file: async (req, file) => {
    try {
      return new Promise((resolve, reject) => {
        const filename = file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: `uploads`,
        };

        // return fileInfo;
        resolve(fileInfo);
      });
    } catch (error) {
      console.error("Error scanning file: ", error.message);
      throw error;
    }
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      notAllowedExtensions.includes(ext) ||
      notAllowedMimeTypes.includes(file.mimetype)
    ) {
      return cb(new Error("Malicious Files Detected"));
    }

    cb(null, true);
  },
});

const imageStorage = new GridFsStorage({
  url: "mongodb://127.0.0.1:27017/anyshare",
  file: async (req, file) => {
    try {
      return new Promise((resolve, reject) => {
        const filename = file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: "images",
        };
        resolve(fileInfo);
      });
    } catch (error) {
      throw new AppError(
        "ResourceUploadError",
        500,
        "error uploading images",
        true
      );
    }
  },
});

const imageUpload = multer({
  storage: imageStorage,

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["application/image", "image/png"];
    const allowedExtension = [".png"];

    const ext = path.extname(file.originalname).toLowerCase();

    if (
      !allowedExtension.includes(ext) ||
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      return cb(new Error("Only PNG files are allowed"));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const pdfStorage = new GridFsStorage({
  url: "mongodb://127.0.0.1:27017/anyshare",
  file: async (req, file) => {
    try {
      return new Promise((resolve, reject) => {
        const filename = file.originalname;

        const fileInfo = {
          filename: filename,
          bucketName: "pdfs",
        };

        resolve(fileInfo);
      });
    } catch (error) {
      throw new AppError(
        "ResourceUploadError",
        500,
        "error uploading images",
        true
      );
    }
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["application/pdf"];
    const allowedExtension = [".pdf"];

    const ext = path.extname(file.originalname).toLowerCase();
    if (
      !allowedMimeTypes.includes(file.mimetype) ||
      !allowedExtension.includes(ext)
    ) {
      return cb(new Error("Only PDF files are allowed"), false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = { upload, imageUpload, pdfUpload };
