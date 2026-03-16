// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  const status = err.status || 500;
  const message =
    err.message || "Something went wrong. Please try again later.";

  res.status(status).json({
    success: false,
    message
  });
}

