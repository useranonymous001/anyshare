const mongoose = require("mongoose");

const fileStatSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    filename: {
      type: String,
      required: true,
    },
    originalname: {
      type: String,
      required: true,
    },
    numberOfDownload: {
      type: Number,
      default: 0,
    },

    size: Number,

    bucket: {
      type: String,
      default: "uploads",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    version: {
      type: Number,
      default: 1,
    },

    tags: [String],

    expiresAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
    checksum: {
      type: String,
    },
    fileType: {
      type: String,
      enum: ["document", "image", "video", "audio", "other"],
      default: "other",
    },
    contentType: {
      type: String,
      required: true,
    },
    activityLogs: [
      {
        action: String,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileStatSchema);
