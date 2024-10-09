const express = require('express')
const PORT = process.env.PORT || 3000
const WS_PORT = process.env.WS_PORT || 3001
const fileUpload = require('express-fileupload')
const cors = require('cors')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const db = require('./db')
const bodyParser = require('body-parser')
const path = require('path')
const http = require('http');
const ws = require('./websocket');

const postRouter = require('./routes/post.routes')
const authRouter = require('./routes/auth.routes')
const profileRouter = require('./routes/profile.routes')
const commentRouter = require('./routes/comment.routes')
const voteRouter = require('./routes/vote.routes')
const chatRouter = require('./routes/chat.routes')
const subscriptionRouter = require('./routes/subscription.routes')


dotenv.config();
const app = express()
const server = http.createServer(app);
ws.initWebSocketServer(server); // init websocket

app.listen(PORT, () => console.log(`Server start on port ${PORT}!`))
server.listen(WS_PORT, () => console.log(`Server listening on port ${WS_PORT}!`))

app.use(express.json())
app.use(cors());
app.use(fileUpload({}))
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, './static')));


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

app.use('/api', authRouter)
app.use('/api', verifyToken, postRouter)
app.use('/api', verifyToken, profileRouter)
app.use('/api', verifyToken, commentRouter)
app.use('/api', verifyToken, voteRouter)
app.use('/api', verifyToken, chatRouter)
app.use('/api', verifyToken, subscriptionRouter)
