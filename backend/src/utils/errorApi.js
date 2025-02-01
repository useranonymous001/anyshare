// Centralized Error Handler

/**
 * @param AppError Inherited class from Error Class to handle application errors
 */

class AppError extends Error {
  constructor(name, httpCode, description, isOperational = true) {
    super(description); // passing description to Error constructor
    (this.name = name),
      (this.httpCode = httpCode),
      (this.isOperational = isOperational);
    Error.captureStackTrace(this, this.constructor); // capture the error stack trace
  }

  toResponse() {
    return {
      error: {
        name: this.name,
        message: this.message,
        httpCode: this.httpCode,
      },
    };
  }
}

module.exports = AppError;
