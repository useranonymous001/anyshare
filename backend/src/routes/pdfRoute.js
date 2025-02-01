const express = require("express");
const router = express.Router();
const pdfController = require("../controller/pdfController");
const { checkForAuthentication } = require("../middleware/authentication");
const { imageUpload, pdfUpload } = require("../middleware/upload");

router.post(
  "/upload",
  checkForAuthentication,
  imageUpload.array("file"),
  pdfController.handleConvertImageToPdf
);

router.post(
  "/merge",
  checkForAuthentication,
  pdfUpload.array("file"),
  pdfController.handleMergeMultiplePdf
);

module.exports = router;
