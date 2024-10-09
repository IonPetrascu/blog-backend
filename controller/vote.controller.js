const db = require('../db')

class VoteController {
  async addVote(req, res) {
    const { entity_id, entity_type, vote_type } = req.body;

    const user_id = req.user.id

    const insertQuery = `INSERT INTO "votes" (user_id, entity_id, entity_type, vote_type)
    VALUES($1, $2, $3, $4)
    ON CONFLICT (user_id, entity_id, entity_type)
    DO UPDATE SET vote_type = EXCLUDED.vote_type
    RETURNING *`;

    try {
      const result = await db.query(insertQuery, [user_id, entity_id, entity_type, vote_type]);

      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error on add post:', err);
      res.status(500).send('Error on add post');
    }
  }

  async deleteVote(req, res) {
    const { entity_id, entity_type } = req.body;

    const user_id = req.user.id;

    const deleteQuery = `DELETE FROM "votes"
    WHERE user_id = $1 AND entity_id = $2 AND entity_type = $3
    RETURNING *`;

    try {
      const result = await db.query(deleteQuery, [user_id, entity_id, entity_type]);

      if (result.rowCount === 0) {
        return res.status(404).send('Vote not found');
      }


      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error on delete vote:', err);
      res.status(500).send('Error on delete vote');
    }
  }


}

module.exports = new VoteController()
