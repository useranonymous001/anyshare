const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const AppError = require("../utils/errorApi");
const mime = require("mime-types");
const { PassThrough } = require("stream");

const {
  fetchImageBuffers,
  imageToPdf,
  fetchPDFBuffers,
  mergePDF,
} = require("../services/imageToPdf");

const { clearBucket } = require("../services/clearBucket");

const conn = mongoose.connection;
// convert image to pdf
const handleConvertImageToPdf = async (req, res, next) => {
  const bucket = new GridFSBucket(conn.db, { bucketName: "images" });
  try {
    const userId = req.user.payload.id;
    if (!userId) {
      return res.status(401).json({ message: "you need to login first" });
    }

    const bufferArray = await fetchImageBuffers(bucket, userId); // returns array of image buffers

    const pdfBytes = await imageToPdf(bufferArray);

    const readStream = new PassThrough();
    readStream.end(pdfBytes);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=converted.pdf");

    readStream.on("error", (err) => {
      res.status(500).json({ message: "error occured while reading pdf" });
    });

    readStream.pipe(res);

    readStream.on("finish", async () => {
      await clearBucket(bucket, userId);
    });
  } catch (error) {
    await clearBucket(bucket, userId);
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res.status(500).json({
        status: "failed",
        message: "some error occured",
        error: `${error}`,
      });
    }
  }
};

// merge multiple pdf
const handleMergeMultiplePdf = async (req, res, next) => {
  const bucket = new GridFSBucket(conn.db, { bucketName: "pdfs" });
  const userId = req.user.payload.id;
  if (!userId) {
    return res.status(400).json({ message: "need to login first" });
  }
  try {
    const pdfArrayBuffers = await fetchPDFBuffers(bucket, userId);
    const mergedPdfBytes = await mergePDF(pdfArrayBuffers);

    const readStream = new PassThrough();
    readStream.end(mergedPdfBytes);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=merged.pdf");

    readStream.pipe(res);

    readStream.on("error", (err) => {
      return res.status(500).json({ message: "cannot read the pdf data" });
    });

    readStream.on("finish", async () => {
      await clearBucket(bucket, userId);
    });
  } catch (error) {
    await clearBucket(bucket, userId);
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res.status(500).json({
        status: "failed",
        message: "some error occured",
        error: `${error}`,
      });
    }
  }
};

module.exports = {
  handleConvertImageToPdf,
  handleMergeMultiplePdf,
};
