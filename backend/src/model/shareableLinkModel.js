const mongoose = require("mongoose");

const shareableLinkSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
  },

  linkId: {
    type: String,
    required: true,
    unique: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedWith: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      permission: {
        type: String,
        enum: ["view", "edit", "download"],
        default: "view",
      },
    },
  ],
  expiresAt: {
    type: Date,
  },
});

const shareableLink = mongoose.model("shareableLink", shareableLinkSchema);
module.exports = shareableLink;
