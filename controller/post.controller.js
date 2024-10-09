const db = require('../db')
const { v4: uuidv4 } = require('uuid');
const path = require('path')

class PostController {
  async getPosts(req, res) {
    if (!req.user) {
      return res.status(401).send('Token not found');
    }
    const user_id = req.user.id;

    try {
      const query = `
    WITH like_dislike_counts AS (
  SELECT
    v.entity_id AS post_id,
    COUNT(CASE WHEN v.vote_type = TRUE THEN 1 END)::INTEGER AS likes_count,
    COUNT(CASE WHEN v.vote_type = FALSE THEN 1 END)::INTEGER AS dislikes_count
  FROM votes v
  WHERE v.entity_type = 'post'
  GROUP BY v.entity_id
),
user_votes AS (
  SELECT
    v.entity_id AS post_id,
    MAX(CASE WHEN v.user_id = $1 THEN CASE WHEN v.vote_type THEN 1 ELSE 0 END ELSE NULL END) AS user_vote
  FROM votes v
  WHERE v.entity_type = 'post'
  GROUP BY v.entity_id
)
SELECT
  p.*,
  COALESCE(lc.likes_count, 0) AS likes_count,
  COALESCE(lc.dislikes_count, 0) AS dislikes_count,
  uv.user_vote,
  COUNT(c.id)::INTEGER AS comments_count,
  ur.id AS user_id,
  ur.u_name AS user_name,
  ur.u_email AS user_email,
  ur.img AS user_img
FROM posts p
LEFT JOIN like_dislike_counts lc ON p.id = lc.post_id
LEFT JOIN user_votes uv ON p.id = uv.post_id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN "usersReg" ur ON p.user_id = ur.id
GROUP BY p.id, lc.likes_count, lc.dislikes_count, uv.user_vote,ur.id, ur.u_name, ur.u_email, ur.img
ORDER BY p.created_at DESC;
    `;

      const result = await db.query(query, [user_id]);

      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error on get posts:', err);
      res.status(500).send('Error on get posts');
    }
  }

  async getOnePost(req, res) {
    if (!req.user) {
      return res.status(401).send('Token not found');
    }
    const postId = req.params.id;

    const insertQuery = `SELECT
                         posts.*,
                         "usersReg".id AS u_id,
                         "usersReg".u_name,
                         "usersReg".u_email,
                         "usersReg".img AS u_img
                       FROM
                         posts
                       JOIN
                         "usersReg" ON "usersReg".id = posts.user_id
                       WHERE
                         posts.id = $1`;
    try {
      const result = await db.query(insertQuery, [postId]);

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error on get post:', error);
      res.status(500).send('Error on get post');
    }

    db.end;
  }

  async addPost(req, res) {
    try {
      const { title, description } = req.body;

      if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
      }
      const img = req.files ? req.files.img : null;
      const user_id = req.user.id

      let fileName = null
      if (img) {
        fileName = uuidv4() + '.jpg';
        img.mv(path.resolve(__dirname, '..', 'static', fileName), (err) => {
          if (err) {
            console.error('Error moving file:', err);
            return res.status(500).send('Error uploading image');
          }
        });
      }

      const insertQuery = fileName
        ? `INSERT INTO posts(title, content, user_id, img) VALUES($1, $2, $3, $4) RETURNING *`
        : `INSERT INTO posts(title, content, user_id) VALUES($1, $2, $3) RETURNING *`;

      const values = fileName
        ? [title, description, user_id, fileName]
        : [title, description, user_id];

      const result = await db.query(insertQuery, values);
      res.status(200).json(result.rows[0]);

    } catch (error) {
      console.error('Error on add post:', error);
      res.status(500).send('Error on add post');
    }

  }

  async deletePost(req, res) {
    if (!req.user) {
      return res.status(401).send('Token not found');
    }
    const postId = req.params.id;
    const userId = req.user.id
    const insertQuery = `DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *`

    try {
      const result = await db.query(insertQuery, [postId, userId]);
      res.status(200).json(result.rows[0]);

    } catch (error) {
      console.error('Error on get post:', error);
      res.status(500).send('Error on get post');
    }

    db.end;
  }

}

module.exports = new PostController()
