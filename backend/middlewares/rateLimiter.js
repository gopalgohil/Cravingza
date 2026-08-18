const rateLimitStore = {};

/**
 * Memory-based rate limiter middleware
 * @param {object} options - Configuration options
 * @param {number} options.windowMs - Time window in ms (default 15 mins)
 * @param {number} options.max - Max requests allowed per window (default 5)
 * @param {string} options.message - Error message to display on limit hit
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 5,
    message = "Too many attempts. Please try again later.",
  } = options;

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    // Clean up memory store periodically to prevent leaks
    // Delete expired IPs
    Object.keys(rateLimitStore).forEach((key) => {
      if (now > rateLimitStore[key].resetTime) {
        delete rateLimitStore[key];
      }
    });

    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    const client = rateLimitStore[ip];

    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + windowMs;
      return next();
    }

    client.count += 1;

    if (client.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

export {
  rateLimiter,
};
