const db = require('../db')

class CommentController {
  async getPostComments(req, res) {
    const postId = req.params.id
    const userId = req.user.id;

    const insertQuery = `
    WITH comment_likes AS (
      SELECT
        entity_id AS comment_id,
        COUNT(CASE WHEN vote_type = true THEN 1 END) AS like_count,
        COUNT(CASE WHEN vote_type = false THEN 1 END) AS dislike_count
      FROM votes
      WHERE entity_type = 'comment'
      GROUP BY entity_id
    ),
    user_likes AS (
      SELECT
        entity_id AS comment_id,
        vote_type
      FROM votes
      WHERE entity_type = 'comment' AND user_id = $2
    )
    SELECT
      comments.*,
      "usersReg".img AS u_img,
      "usersReg".u_name,
      COALESCE(comment_likes.like_count::int, 0) AS like_count,
      COALESCE(comment_likes.dislike_count::int, 0) AS dislike_count,
      user_likes.vote_type AS user_vote
    FROM comments
    INNER JOIN "usersReg" ON comments.user_id = "usersReg".id
    LEFT JOIN comment_likes ON comments.id = comment_likes.comment_id
    LEFT JOIN user_likes ON comments.id = user_likes.comment_id
    WHERE comments.post_id = $1
    ORDER BY comments.created_at;
  `
    try {
      const result = await db.query(insertQuery, [postId, userId]);
      const comments = result.rows;

      const map = new Map();
      const roots = [];
      comments.forEach(comment => {
        map.set(comment.id, { ...comment, replies: [] });
      });
      comments.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = map.get(comment.parent_comment_id);
          if (parent) {
            parent.replies.push(map.get(comment.id));
          }
        } else {
          roots.push(map.get(comment.id));
        }
      });

      res.status(200).json(roots);
    } catch (error) {
      console.error('Error on get comments:', error);
      res.status(500).send('Error on get comments');
    }

    db.end;
  }

  async addComment(req, res) {
    const { postId, content, parent_comment_id } = req.body;

    const user_id = req.user.id

    const insertQuery = `INSERT INTO "comments" (post_id, content,parent_comment_id ,user_id) VALUES($1, $2, $3,$4) RETURNING *`;

    try {
      const result = await db.query(insertQuery, [postId, content, parent_comment_id, user_id]);

      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error on add post:', err);
      res.status(500).send('Error on add post');
    }
  }


}

module.exports = new CommentController()
