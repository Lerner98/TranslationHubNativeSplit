const tokens = new Map();

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const adminId = tokens.get(token);
  if (!adminId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  req.adminId = adminId;
  next();
};

const generateToken = (adminId) => {
  const token = `${adminId}-${Date.now()}`;
  tokens.set(token, adminId);
  return token;
};

module.exports = { authMiddleware, generateToken };