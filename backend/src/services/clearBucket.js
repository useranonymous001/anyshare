const AppError = require("../utils/errorApi");

const clearBucket = async (bucket, userId) => {
  try {
    const files = await bucket.find({ "metadata.userId": userId }).toArray();

    for (let file of files) {
      await bucket.delete(file._id);
    }
  } catch (error) {
    throw new AppError("UnhandledAppError", 500, error, true);
  }
};

module.exports = { clearBucket };
