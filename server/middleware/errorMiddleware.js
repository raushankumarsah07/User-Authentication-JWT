// Runs when no route matches
export const notFound = (req, res, next) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

// Central error handler: every error ends up here.
// It must have 4 parameters so Express knows it is an error handler.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";

  // JWT problems -> 401 (generic message, no details leaked)
  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Session expired. Please log in again.";
  } else if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token. Please log in again.";
  }
  // Mongoose validation error -> 400
  else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }
  // Duplicate key (unique email) -> 409
  else if (err.code === 11000) {
    status = 409;
    message = "An account with this email already exists";
  }
  // Invalid ObjectId etc. -> 400
  else if (err.name === "CastError") {
    status = 400;
    message = "Invalid data provided";
  }
  // Malformed JSON body -> 400
  else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body";
  }

  // Never leak internal details for server errors
  if (status === 500) {
    console.error(err);
    message = "Something went wrong on the server";
  }

  res.status(status).json({ success: false, message });
};
