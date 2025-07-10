const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Extract token from 'Authorization' header, expecting "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: "No token provided or invalid format. Expected 'Bearer <token>'" });
  }

  const token = authHeader.split(' ')[1]; // Get the token part after "Bearer "

  try {
    // Verify the token using the JWT_SECRET from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the decoded user payload (e.g., { id: '...', iat: ..., exp: ... }) to the request object
    // This makes user information available in subsequent route handlers
    req.user = decoded; 
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    // If token verification fails (e.g., expired, invalid signature)
    return res.status(403).json({ msg: "Invalid token", error: err.message });
  }
};

module.exports = authMiddleware;
