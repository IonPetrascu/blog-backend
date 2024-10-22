const db = require('../db')

class ChatController {
  async getChats(req, res) {
    if (!req.user) {
      return res.status(401).send('Token not found');
    }
    const user_id = req.user.id;

    try {
      const query = `SELECT
  chats.id AS chat_id,
  chats.name,
  "usersReg".id AS user_id,
  "usersReg".img AS user_img,
  "usersReg".u_name AS user_name,
  last_message.id AS message_id,
  last_message.content AS last_message_content,
  last_message.sent_at AS last_message_sent_at
FROM chats
JOIN chat_users AS cu1 ON chats.id = cu1.chat_id
JOIN chat_users AS cu2 ON chats.id = cu2.chat_id
JOIN "usersReg" ON "usersReg".id = cu2.user_id
LEFT JOIN LATERAL (
  SELECT m.id, m.content, m.sent_at
  FROM messages m
  WHERE m.chat_id = chats.id
  ORDER BY m.sent_at DESC
  LIMIT 1
) last_message ON true
WHERE cu1.user_id = $1
  AND cu2.user_id != $1;`

      const result = await db.query(query, [user_id]);

      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error on get chats:', err);
      res.status(500).send('Error on get chats');
    }
  }

  async addChat(req, res) {

    if (!req.user) {
      return res.status(401).send('Token not found');
    }
    const user_id = req.user.id;
    const { other_user_id, chat_name } = req.body;

    if (!other_user_id || !chat_name) {
      return res.status(400).send('Both other_user_id and chat_name are required');
    }

    try {
      const existingChat = await db.query(`
      SELECT c.* FROM chats c
      JOIN chat_users cu1 ON cu1.chat_id = c.id AND cu1.user_id = $1
      JOIN chat_users cu2 ON cu2.chat_id = c.id AND cu2.user_id = $2
    `, [user_id, other_user_id]);

      if (existingChat.rows.length > 0) {
        return res.status(200).json({ message: 'Chat already exists', chat: existingChat.rows[0] });
      }
      // Вставка нового чата
      const chatResult = await db.query(
        'INSERT INTO chats (name, is_private) VALUES ($1, $2) RETURNING *',
        [chat_name, true]
      );
      const chatId = chatResult.rows[0].id;

      await db.query(
        'INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)',
        [chatId, user_id]
      );

      await db.query(
        'INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)',
        [chatId, other_user_id]
      );

      res.status(201).json({ message: 'Chat created successfully', chat: chatResult.rows[0] });
    } catch (err) {
      console.error('Error creating chat:', err);
      res.status(500).send('Error creating chat');
    }
  }

  async deleteChat(req, res) {

    if (!req.user) {
      return res.status(401).send('Token not found');
    }
    const user_id = req.user.id;
    const chatId = req.params.id
    try {
      const query = ` SELECT id FROM chats WHERE id = $1`

      const resChat = await db.query(query, [chatId])


      if (resChat.rows[0].length === 0) {
        res.status(404).json({ message: 'Chat not found' });
      }

      const queryChatUsers = `SELECT * FROM chat_users WHERE chat_id = $1`

      const resChatUsers = await db.query(queryChatUsers, [chatId])

      const userOfChat = resChatUsers.rows.findIndex((user) => user.user_id === user_id)
      if (userOfChat === -1) {
        res.status(404).json({ message: 'Error on delete chat' });
      }
      const queryChat = `DELETE  FROM chats WHERE id = $1 RETURNING id`

      const resDeleteChat = await db.query(queryChat, [chatId])

      if (resDeleteChat.rows.length === 0) {
        throw new Error('Chat not deleted');
      }

      res.status(200).json({ id: resDeleteChat.rows[0].id });
    } catch (err) {
      console.error('Error deletind chat:', err);
      res.status(500).send('Error deletind chat');
    }
  }


}

module.exports = new ChatController()
