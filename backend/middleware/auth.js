const { verifyToken } = require('../utils/token');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Not authenticated.' });

    const decoded = verifyToken(header.split(' ')[1]);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = { protect };
