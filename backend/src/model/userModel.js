const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
  },
  ip: {
    type: String,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "suspended", "deleted"],
    default: "active",
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
  },
  avatar: {
    type: String,
    default:
      "https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png",
  },
  storageUsed: {
    type: Number,
    default: 0,
  },
  storageLimit: {
    type: Number,
    default: 1e8,
  },
  lastLogin: {
    type: Date,
  },
  lastActivity: {
    type: Date,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  securityLogs: [
    {
      action: String,
      timestamp: Date,
      ip: String,
    },
  ],
  fileUploaded: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
  ],
  sharedFile: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
  ],
  sharedFilePermissions: [
    {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
      permission: {
        type: String,
        enum: ["view", "edit", "download"],
        default: "view",
      },
    },
  ],

  notifications: {
    email: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: false,
    },
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
