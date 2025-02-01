const ErrorHandler = (err, req, res, next) => {
  console.log("Error Handler: middleware");
  const errStatus = err.statusCode || 500;
  const errMessage = err.message || "Something Went Wrong";
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMessage,
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
};

module.exports = { ErrorHandler };
