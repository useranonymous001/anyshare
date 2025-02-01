const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = "mongodb://127.0.0.1:27017/anyshare"; // Replace with your MongoDB URI
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
