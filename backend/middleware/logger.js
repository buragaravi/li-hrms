// Request logging middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';

  // Log request
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log request body for POST/PUT/PATCH (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields from logs
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.token) sanitizedBody.token = '***';
    console.log(`[${timestamp}] Request Body:`, JSON.stringify(sanitizedBody, null, 2));
  }

  // Log response
  const originalSend = res.send;
  res.send = function (data) {
    const statusCode = res.statusCode;
    console.log(`[${timestamp}] Response: ${statusCode} ${method} ${url}`);
    
    // Log error responses
    if (statusCode >= 400) {
      try {
        const errorData = JSON.parse(data);
        console.log(`[${timestamp}] Error:`, errorData.message || errorData.error || 'Unknown error');
      } catch (e) {
        // Not JSON, log as is
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

module.exports = logger;

