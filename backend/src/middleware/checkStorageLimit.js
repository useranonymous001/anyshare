const File = require("../model/fileStatModel");
const User = require("../model/userModel");

const checkStorageLimit = async (req, res, next) => {
  const userId = req.user.payload.id;
  if (!userId) {
    return res
      .status(400)
      .json({ status: "failed", message: "please logg in again" });
  }

  const fileSize = req.file ? req.file.size : 0;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ status: "failed", message: "user not found" });
    }

    if (fileSize + user.storageUsed > user.storageLimit) {
      return res.status(400).json({
        status: "failed",
        message:
          "storage limit hit, please clean up or suscribe for more storage",
      });
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ status: "failed", message: `Some error occured: ${error}` });
  }
};

module.exports = { checkStorageLimit };
