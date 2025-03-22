const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const AppError = require("../utils/errorApi");
const mime = require("mime-types");
// const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const { PassThrough } = require("stream");

const {
  fetchImageBuffers,
  imageToPdf,
  fetchPDFBuffers,
  mergePDF,
} = require("../services/imageToPdf");
// const { PassThrough, pipeline } = require("node:stream");

const conn = mongoose.connection;
// convert image to pdf
const handleConvertImageToPdf = async (req, res, next) => {
  const bucket = new GridFSBucket(conn.db, { bucketName: "images" });
  try {
    const bufferArray = await fetchImageBuffers(bucket); // returns array of image buffers

    const pdfBytes = await imageToPdf(bufferArray);

    const readStream = new PassThrough();
    readStream.end(pdfBytes);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=converted.pdf");

    // await pipeline(pdfBytes, res);

    readStream.on("error", (err) => {
      res.status(500).json({ message: "error occured while reading pdf" });
    });

    readStream.pipe(res);

    readStream.on("finish", async () => {
      await bucket.drop();
    });
  } catch (error) {
    await bucket.drop();
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
  // open the bucket and fetch all the pdf uploaded by the user
  const bucket = new GridFSBucket(conn.db, { bucketName: "pdfs" });
  try {
    // create a array of pdfBytes of the uploaded pdfs
    const pdfArrayBuffers = await fetchPDFBuffers(bucket);

    // create a blank pdf doc and add all the pages to the new doc
    const mergedPdfBytes = await mergePDF(pdfArrayBuffers);

    const readStream = new PassThrough();
    readStream.end(mergedPdfBytes);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=merged.pdf");

    // const readStream = Readable.from(mergedPdfBytes);
    readStream.pipe(res);
    // await pipeline(readStream, res);

    readStream.on("error", (err) => {
      return res.status(500).json({ message: "cannot read the pdf data" });
    });
    // drop the database after finishing the task
    readStream.on("finish", async () => {
      await bucket.drop();
    });
  } catch (error) {
    await bucket.drop();
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
