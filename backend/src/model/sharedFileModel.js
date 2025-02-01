const mongoose = require("mongoose");

const sharedFileSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  permission: {
    type: String,
    enum: ["view", "edit", "download"],
    default: "view",
  },
  sharedAt: {
    type: Date,
    default: Date.now,
  },
});

const SharedFile = mongoose.model("sharedFile", sharedFileSchema);
module.exports = SharedFile;
