const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  
 const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify checks if the token is valid and not expired
    // If valid, it gives back the data we stored in the token (like user_id)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // We attach the decoded data to req.user so the next function can use it
    // This is how we know WHICH user is making the request
    req.user = decoded;
    
    // next() means "okay this person is verified, continue to the actual route"
    next();
  } catch (error) {
    // If token is invalid or expired, reject
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;