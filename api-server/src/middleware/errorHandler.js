const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'rate_limit_exceeded') {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: err.message,
      resetTime: err.resetTime
    });
  }

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(status).json({
    error: err.type || 'internal_error',
    message
  });
};

module.exports = errorHandler;