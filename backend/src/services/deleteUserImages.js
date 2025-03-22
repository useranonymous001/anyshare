const { GridFSBucket } = require("mongodb");
const AppError = require("../utils/errorApi");

const deleteImagesFromBucket = async (bucket, userId) => {
  try {
    const images = await bucket.find({ "metadata.userId": userId }).toArray();

    for (let image of images) {
      await bucket.delete(image._id);
    }
  } catch (error) {
    throw new AppError("UnhandledAppError", 500, error, true);
  }
};

module.exports = { deleteImagesFromBucket };
