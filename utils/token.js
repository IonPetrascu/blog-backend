const jwt = require('jsonwebtoken')
const db = require('../db')

async function verifyToken(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: "Missing token" })
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (decoded) {
      const result = await db.query('SELECT * FROM "usersReg" WHERE id = $1', [decoded.userId]);

      if (result.rows.length > 0) {
        req.user = result.rows[0];
        next();
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error('Token verification failed', error.message);
    res.status(401).send('Invalid token');
  }
}

module.exports = {
  verifyToken
}
