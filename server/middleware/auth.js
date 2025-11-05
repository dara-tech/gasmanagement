const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Allow OPTIONS requests (CORS preflight) to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'គ្មាន token សម្រាប់អនុញ្ញាត' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token មិនត្រឹមត្រូវ' });
  }
};

module.exports = auth;

