const ws = require('ws')
const db = require('./db')

function initWebSocketServer(server) {
  const wss = new ws.Server({ server });

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

              broadcastMessage(wss, savedMessage);
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
          broadcastMessage(wss, message)
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

  return wss;
}


function broadcastMessage(wss, message) {
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



module.exports = {
  initWebSocketServer,
  checkUserChatAccess,
  saveMessageToDatabase,
  getChatHistory,
};
