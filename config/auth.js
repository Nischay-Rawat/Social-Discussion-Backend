const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET 

function verifyJWT(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secret, (error, decoded) => {
    if (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log(decoded)
    req.user = decoded
    next(); 
  });
}

module.exports = verifyJWT