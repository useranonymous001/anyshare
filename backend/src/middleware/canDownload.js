const SharedFile = require("../model/sharedFileModel");

const hasAccess = async (req, res, next) => {
  const { fileId, userId } = req.params;

  if (!fileId || !userId) {
    return res.status(400).json({ message: "userId || fileId missing" });
  }

  try {
    const sharedFile = await SharedFile.findOne({ fileId });

    if (
      sharedFile &&
      ["view", "edit", "download"].includes(sharedFile.permission)
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "You do not have permission to access this file" });
    }
  } catch (err) {
    return res.status(500).json({
      status: "failed",
      message: `Error in checking Download Permissions`,
      Error: `${err}`,
    });
  }
};

module.exports = { hasAccess };
