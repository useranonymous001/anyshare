const express = require("express");
const router = express.Router();
const fileController = require("../controller/fileController");
const { upload } = require("../middleware/upload");
const { checkForAuthentication } = require("../middleware/authentication");
const { hasAccess } = require("../middleware/canDownload");
const { checkStorageLimit } = require("../middleware/checkStorageLimit");
router.post(
  "/upload",
  checkForAuthentication,
  checkStorageLimit,
  upload.single("file"),
  fileController.uploadFile
);

router.get("/:filename", checkForAuthentication, fileController.downloadFile);

router.get("/view/:filename", checkForAuthentication, fileController.viewFile);

router.get("/stats/:userId", fileController.userStatistic);

router.get(
  "/share/:fileId",
  checkForAuthentication,
  fileController.createShareableLink
);

router.get(
  "/shared/:fileId/:userId/:uniqueId",
  checkForAuthentication,
  hasAccess,
  fileController.getSharedFile
);

router.put(
  "/request/:fileId/:userId/access",
  checkForAuthentication,
  fileController.requestAccessDocument
);

router.get("/preview/doc/:fileId", fileController.previewPDFDocument);

router.get("/search/doc", checkForAuthentication, fileController.search);
router.get("/filter/doc", checkForAuthentication, fileController.filterFiles);

router.put(
  "/rename/:fileId",
  checkForAuthentication,
  fileController.renameFile
);

router.delete(
  "/delete/:fileId",
  checkForAuthentication,
  fileController.deleteFile
);

module.exports = router;
