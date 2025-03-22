/**

 download permission = edit + download + view  [ same goes for edit too]

 */

const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const File = require("../model/fileStatModel");
const User = require("../model/userModel");
const uniqueID = require("../utils/shortidGenerator");
const AppError = require("../utils/errorApi");
const shareableLink = require("../model/shareableLinkModel");
const SharedFile = require("../model/sharedFileModel");
const mime = require("mime-types");
const { pipeline } = require("node:stream");

const conn = mongoose.connection;

const uploadFile = async (req, res) => {
  try {
    if (req.fileValidationError) {
      // Handle multer validation errors (if any)
      return res.status(400).json({ error: req.fileValidationError });
    }

    if (!req.file) {
      // Handle cases where no file was uploaded
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileInfo = {
      fileId: req.file.id,
      filename: req.file.filename,
      originalname: req.file.originalname,
      contentType: req.file.contentType,
      size: req.file.size,
      owner: req.user.payload.id,
    };

    const user = await User.findOne({ _id: req.user.payload.id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.storageUsed += req.file.size;

    user.fileUploaded.push(new mongoose.Types.ObjectId(req.file.id));

    const newFile = new File(fileInfo);
    await newFile.save();
    await user.save();

    return res.status(200).json({
      status: "success",
      data: newFile,
      storageUsed: user.storageUsed,
    });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpCode).json(err.toResponse());
    } else {
      res
        .status(500)
        .json({ status: "failed", message: `error occured: ${err}` });
    }
  }
};

const downloadFile = async (req, res) => {
  try {
    // opening the bucket to get the files/data
    const bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });

    // getting files from the database
    const files = await bucket
      .find({ filename: req.params.filename })
      .toArray();

    const file = files[0]; // making sure the first file is taken if multiple file with same name occurs
    res.set({
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    });

    // opening a reading stream to read the streams of data from the grid
    const downloadStream = bucket.openDownloadStream(file._id);

    pipeline(downloadStream, res, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "some error occured while downloading" });
      }
    });

    downloadStream.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const userStatistic = async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new AppError("ResourceNotFoundError", 400, "User not Found", true);
  }

  try {
    const user = await User.findOne({ _id: userId }).select(
      "storageUsed storageLimit fileUploaded sharedFile"
    );

    return res
      .status(200)
      .json({ user, totalFileUploaded: user.fileUploaded.length });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res.status(500).json({
        status: "failed",
        message: "Internal Server Error",
        Err: `${error}`,
      });
    }
  }
};

const viewFile = async (req, res) => {
  const filename = req.params.filename;
  if (!filename) {
    return res.status(400).json({ msg: "filename missing" });
  }
  try {
    const bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    const files = await bucket.find({ filename }).toArray();

    if (!files) {
      return res.status(404).json({ msg: "file not found" });
    }

    const file = files[0];
    const readStream = bucket.openDownloadStream(file._id);

    readStream.pipe(res);

    readStream.on("error", (error) => {
      res.status(500).json({ err: error.message });
    });

    readStream.on("end", () => {
      console.log("reading complete");
    });
  } catch (error) {
    return res.status(500).json({ err: error.message });
  }
};

const createShareableLink = async (req, res) => {
  const fileId = req.params.fileId || req.body.fileId;

  if (!fileId) {
    return res.status(400).json({
      msg: "select a file to share",
    });
  }

  try {
    const fileToShare = await File.findOne({ _id: fileId });

    if (!fileToShare) {
      return res.status(404).json({ msg: "file not found to share" });
    }
    // generates unique ID for a FiletoShare
    const uniqueId = uniqueID();

    const updateShareableFile = new shareableLink({
      fileId: fileToShare._id,
      linkId: uniqueId,
      createdBy: req.user.payload.id,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);

    updateShareableFile.expiresAt = expiresAt;
    await updateShareableFile.save();

    res.status(200).json({ success: true, updatedFile: updateShareableFile });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: `Something went wrong: ${error}`,
    });
  }
};

// just reading, not downloading
const getSharedFile = async (req, res) => {
  const sharedFileUniqueId = req.params.uniqueId;
  if (!sharedFileUniqueId) {
    return res.status(400).json({ msg: " file not found" });
  }

  try {
    // getting the shareable link
    const sharedFile = await shareableLink.findOne({
      linkId: sharedFileUniqueId,
    });

    if (!sharedFile) {
      return res.status(404).json({ msg: "shared file not found" });
    }

    const bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });

    const fileToShare = await File.findById(sharedFile.fileId);

    if (!fileToShare) {
      return res.status(404).json({ message: "file not found to share" });
    }

    const files = await bucket.find({ _id: fileToShare.fileId }).toArray();

    const file = files[0];

    const readableStream = bucket.openDownloadStream(file._id);

    readableStream.pipe(res);

    readableStream.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });

    readableStream.on("end", () => {
      console.log("file read successfully");
    });
  } catch (error) {
    return res.status(500).json({ success: true, Err: error });
  }
};

const requestAccessDocument = async (req, res) => {
  const { fileId, userId } = req.params;

  if (!fileId || !userId) {
    return res
      .status(400)
      .json({ status: "failed", message: "fileId or userId param missing" });
  }

  try {
    const file = await shareableLink.findOne({ fileId });

    if (!file) {
      throw new AppError(
        "ResourceNotFoundError",
        404,
        "file is not shared",
        true
      );
    }

    const isAlreadyShared = file.sharedWith.some((entry) =>
      entry.userId.equals(userId)
    );

    if (!isAlreadyShared) {
      file.sharedWith.push({ userId, permission: "download" });

      const shareWithModel = new SharedFile({
        fileId,
        userId,
        permission: "download",
      });

      await shareWithModel.save();
      await file.save();
    }

    return res
      .status(200)
      .json({ status: "success", message: "request granted" });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res.status(500).json({
        status: "failed",
        message: "internal server error",
        Err: `${error}`,
      });
    }
  }
};

const previewPDFDocument = async (req, res) => {
  const { fileId } = req.params;
  if (!fileId) {
    throw new AppError(
      "ResourceNotFoundError",
      404,
      "pdf file not found",
      true
    );
  }

  try {
    // trying to create a new PDF document
    const bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });

    const file = await File.findOne({ _id: fileId });

    // check for file is pdf or not
    if (mime.lookup(file.originalname) !== "application/pdf") {
      throw new AppError(
        "NotAPdfDoc",
        400,
        "only pdf file can be viewed",
        true
      );
    }

    // if pdf return a preview file

    const readStream = bucket.openDownloadStream(file.fileId);

    // this gives direct preview to the pdf
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");

    readStream.pipe(res);

    readStream.on("error", (err) => {
      res.status(500).json({ error: "failed to stream pdf" });
    });

    // returns a buffer data to the json and download
    // let data = [];
    // readStream.on("data", (chunk) => {
    //   data.push(chunk);
    // });

    // readStream.on("end", async () => {
    //   const buff = Buffer.concat(data);
    //   const pdfDoc = await PDFDocument.load(buff);
    //   const pdfBytes = await pdfDoc.save();

    //   return res.status(200).json({ pdf: pdfBytes });
    // });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res.status(500).json({
        status: "failed",
        message: "InternalServerError",
        error: `Err: ${error}`,
      });
    }
  }
};

const renameFile = async (req, res) => {
  const { fileId } = req.params;
  const { newFilename } = req.body;

  if (!newFilename) {
    throw new AppError(
      "ParameterMissing",
      401,
      "new filename not provided",
      true
    );
  }

  try {
    const bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    await bucket.rename(new mongoose.Types.ObjectId(fileId), newFilename);

    const file = await File.findOneAndUpdate(
      { fileId },
      { $set: { filename: newFilename } },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "file renamed successfully",
      renamedFile: file,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res
        .status(500)
        .json({ status: "failed", message: `Error: ${error}` });
    }
  }
};

const deleteFile = async (req, res) => {
  const { fileId } = req.params;
  if (!fileId) {
    throw new AppError(
      "ParameterMissing",
      400,
      "select a file to delete",
      true
    );
  }

  try {
    const bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });

    await bucket.delete(new mongoose.Types.ObjectId(fileId));

    await File.findOneAndDelete({ fileId });

    const user = await User.findOneAndUpdate(
      { _id: req.user.payload.id },
      { $pull: { fileUploaded: fileId } },
      { new: true }
    );

    return res.status(200).json({
      status: "success",
      message: `File removed successfull`,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res
        .status(500)
        .json({ status: "failed", message: `Error: ${error}` });
    }
  }
};

// ?filename=..&originalname=...
const search = async (req, res) => {
  const query = req.query;
  if (!query) {
    return res.status(200).json({ message: `Match Found ${query}` });
  }

  try {
    const files = await File.find({
      $or: [
        { filename: { $regex: query.filename, $options: "i" } },
        { originalname: { $regex: query.filename, $options: "i" } },
      ],
    })
      .limit(10)
      .sort()
      .exec();

    return res.status(200).json({ status: "success", data: files });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res.status(500).json({
        status: "failed",
        message: " Internal Server Error",
        Err: `${error}`,
      });
    }
  }
};

// filter files: sort by size, date modified, filetype, contentType
const filterFiles = async (req, res) => {
  const PAGE_SIZE = parseInt(process.env.PAGE_SIZE) || 16;

  const PAGE = req.query.p || 1;
  const sortBySize = req.query.sortBySize;
  try {
    const keyword = req.query.search
      ? { filename: { $regex: req.query.search, $options: "i" } }
      : {};

    const sort = {};

    if (sortBySize) {
      sort.size = sortBySize === "asc" ? 1 : -1;
    }

    const filteredFiles = await File.find({ ...keyword })
      .sort(sort)
      .limit(PAGE_SIZE)
      .skip(PAGE_SIZE * (PAGE - 1));

    return res
      .status(200)
      .json({ status: "success", filterdProduct: filteredFiles });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.httpCode).json(error.toResponse());
    } else {
      return res.status(200).json({
        status: "failed",
        message: "InternalServerError",
        error: `${error}`,
      });
    }
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  viewFile,
  createShareableLink,
  getSharedFile,
  renameFile,
  deleteFile,
  requestAccessDocument,
  previewPDFDocument,
  userStatistic,
  search,
  filterFiles,
};
