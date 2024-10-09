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
const ws = require('ws')
const http = require('http');

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
const wss = new ws.Server({ server });

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


wss.on('connection', function connection(ws) {
  ws.on('message', async function (message) {
    message = JSON.parse(message)
    switch (message.event) {
      case 'message':
        if (message.chat_id && message.user_id && message.message) {
          try {

            const hasAccess = await checkUserChatAccess(message.chat_id, message.user_id);
            if (!hasAccess) {
              ws.send(JSON.stringify({
                event: 'error',
                message: 'You do not have access to this chat'
              }));
              return;
            }

            message.sent_at = new Date().toISOString();
            const savedMessage = await saveMessageToDatabase(message);

            broadcastMessage(savedMessage);
          } catch (err) {
            console.error('Error processing message:', err);
          }
        } else {
          console.error('Invalid message format:', message);
        }
        break;
      case 'connection':

        ws.acces = await checkUserChatAccess(Number(message.id), message.user_id);
        ws.chat_id = Number(message.id);
        broadcastMessage(message)
        break;
      case 'history':
        try {

          const hasAccess = await checkUserChatAccess(Number(message.chat_id), message.user_id);
          if (!hasAccess) {
            ws.send(JSON.stringify({
              event: 'error',
              message: 'You do not have access to this chat'
            }));
            return;
          }

          const history = await getChatHistory(message.chat_id);
          ws.send(JSON.stringify({
            event: 'history',
            chat_id: message.chat_id,
            messages: history,
            sent_at: message.sent_at
          }));
        } catch (err) {
          console.error('Error fetching chat history:', err);
        }
        break;
    }
  })
})


function broadcastMessage(message) {
  wss.clients.forEach(client => {
    if (client.acces && message.chat_id && client.chat_id === message.chat_id) {
      client.send(JSON.stringify(message));
    }
  });
}

async function checkUserChatAccess(chat_id, user_id) {
  try {
    const query = `
      SELECT * FROM chat_users
      WHERE chat_id = $1 AND user_id = $2
    `;
    const result = await db.query(query, [chat_id, user_id]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error checking user chat access:', err);
    throw err;
  }
}

async function saveMessageToDatabase(value) {
  try {
    const query = `
      INSERT INTO messages (chat_id, user_id, content, sent_at)
      VALUES ($1, $2, $3,$4) RETURNING *
    `;
    const data = await db.query(query, [value.chat_id, value.user_id, value.message, value.sent_at])
    data.rows[0].event = 'message'
    return data.rows[0]
  } catch (err) {
    console.error('Error saving message to database:', err);
  }
}

async function getChatHistory(chatId) {
  try {
    const query = `
      SELECT user_id, content, sent_at
      FROM messages
      WHERE chat_id = $1
      ORDER BY sent_at ASC
    `;
    const result = await db.query(query, [chatId]);
    return result.rows;
  } catch (err) {
    console.error('Error fetching chat history:', err);
    throw err;
  }
}
