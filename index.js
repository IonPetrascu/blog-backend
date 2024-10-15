const express = require('express')
const PORT = process.env.PORT || 3000
const WS_PORT = process.env.WS_PORT || 3001
const cors = require('cors')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const path = require('path')
const http = require('http');
const ws = require('./websocket');
const fs = require('fs');


const { upload, uploadFile, deleteFile, replaceFile } = require('./multer')
const { verifyToken } = require('./utils/token')

const postRouter = require('./routes/post.routes')
const authRouter = require('./routes/auth.routes')
const profileRouter = require('./routes/profile.routes')
const commentRouter = require('./routes/comment.routes')
const voteRouter = require('./routes/vote.routes')
const chatRouter = require('./routes/chat.routes')
const subscriptionRouter = require('./routes/subscription.routes')
const videoRouter = require('./routes/video.routes')


dotenv.config();
const app = express()
const server = http.createServer(app);
ws.initWebSocketServer(server); // init websocket

app.listen(PORT, () => console.log(`Server start on port ${PORT}!`))
server.listen(WS_PORT, () => console.log(`Server ws listening on port ${WS_PORT}!`))

app.use(express.json())
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/upload', express.static(path.join(__dirname, '/uploads/')));

app.use('/api', videoRouter)
app.use('/api', authRouter)
app.use('/api', verifyToken, postRouter)
app.use('/api', verifyToken, profileRouter)
app.use('/api', verifyToken, commentRouter)
app.use('/api', verifyToken, voteRouter)
app.use('/api', verifyToken, chatRouter)
app.use('/api', verifyToken, subscriptionRouter)


const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

createDirIfNotExists(path.join(__dirname, 'uploads/images'));
createDirIfNotExists(path.join(__dirname, 'uploads/videos'));
createDirIfNotExists(path.join(__dirname, 'uploads/audio'));



app.post('/api/upload', verifyToken, upload.single('file'), uploadFile);
app.delete('/api/delete', deleteFile);
app.post('/api/replace', upload.single('file'), replaceFile);

module.exports = app;
