const db = require('../db')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid');


class ProfileController {

  async info(req, res) {
    const { u_password, ...data } = req.user
    res.json({ user: data });
  }

  async getProfile(req, res) {
    if (!req.user) {
      return res.status(401).send('Token not found');
    }

    const userId = req.params.id;
    const { sortBy = 'new', searchQuery = '', page = 1, limit = 6 } = req.query;
    const order = sortBy === 'old' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    try {
      const queryUserInfo = `SELECT id, u_name, u_email, img
      FROM "usersReg"
      WHERE id = $1;`;

      const userInfoResult = await db.query(queryUserInfo, [userId]);

      if (userInfoResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      let queryPostsOfUser = `
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
          MAX(CASE
            WHEN v.user_id = $2 THEN
              CASE WHEN v.vote_type = TRUE THEN 1 ELSE 0 END
            ELSE NULL END) AS user_vote
        FROM votes v
        WHERE v.entity_type = 'post' AND v.user_id = $2
        GROUP BY v.entity_id
      )
      SELECT
        p.id AS id,
        p.user_id,
        p.title,
        p.content,
        p.created_at,
        p.updated_at,
        p.img,
        COALESCE(lc.likes_count, 0) AS likes_count,
        COALESCE(lc.dislikes_count, 0) AS dislikes_count,
        uv.user_vote,
        COUNT(c.id)::INTEGER AS comments_count,
        ur.u_name AS user_name,
        ur.u_email AS user_email,
        ur.img AS user_img,
        CASE
          WHEN COUNT(t.id) > 0 THEN ARRAY_AGG(t.name)
          ELSE '{}'::TEXT[]
        END AS tags
      FROM posts p
      LEFT JOIN like_dislike_counts lc ON p.id = lc.post_id
      LEFT JOIN user_votes uv ON p.id = uv.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      LEFT JOIN "usersReg" ur ON p.user_id = ur.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.user_id = $1
    `;

      const values = [userId, req.user.id];

      if (searchQuery) {
        queryPostsOfUser += ` AND p.title ILIKE $3`;
        values.push(`%${searchQuery}%`);
      }

      queryPostsOfUser += `
      GROUP BY p.id, lc.likes_count, lc.dislikes_count, uv.user_vote, ur.id, ur.u_name, ur.u_email, ur.img
      ORDER BY p.created_at ${order}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2};
    `;
      values.push(limit, offset);

      const postsResult = await db.query(queryPostsOfUser, values);

      const totalQuery = `
      SELECT COUNT(*) FROM posts p
      WHERE p.user_id = $1
      ${searchQuery ? 'AND p.title ILIKE $2' : ''}
    `;
      const totalValues = searchQuery ? [userId, `%${searchQuery}%`] : [userId];
      const totalResult = await db.query(totalQuery, totalValues);
      const totalPosts = totalResult.rows[0].count;

      const querySubscribers = `SELECT u.id AS subscriber_id, u.u_name, u.u_email, u.img
      FROM subscriptions s
      JOIN "usersReg" u ON u.id = s.subscriber_id
      WHERE s.subscribed_to_id = $1;`;
      const subscribersResult = await db.query(querySubscribers, [userId]);

      const querySubscriptions = `SELECT u.id AS subscribed_to_id, u.u_name, u.u_email, u.img
      FROM subscriptions s
      JOIN "usersReg" u ON u.id = s.subscribed_to_id
      WHERE s.subscriber_id = $1;`;
      const subscriptionsResult = await db.query(querySubscriptions, [userId]);

      const profileData = {
        user: userInfoResult.rows[0],
        posts: postsResult.rows,
        totalPosts: parseInt(totalPosts, 10),
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalPosts / limit),
        subscribers: subscribersResult.rows,
        subscribtions: subscriptionsResult.rows,
      };

      res.status(200).json(profileData);

    } catch (err) {
      console.error('Error on get profile', err);
      res.status(500).json({ message: "Error on get profile" });
    }
  }

  async changeImgProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).send('Token not found');
      }

      const userId = req.user.id;

      const uniqueName = req.imageName
      const { file } = req

      if (file) {
        const currentUser = await db.query(
          'SELECT img FROM "usersReg" WHERE id = $1',
          [userId]
        );

        if (currentUser.rowCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        const result = await db.query(
          'UPDATE "usersReg" SET img = $1 WHERE id = $2 RETURNING *',
          [uniqueName, userId]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile image updated successfully', user: result.rows[0] });

      } else {
        return res.status(400).json({ message: 'No image file provided' });
      }

    } catch (err) {
      console.error('Error on update profile image:', err);
      res.status(500).json({ message: "Error on update profile image" });
    }
  }

  async deleteImgProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).send('Token not found');
      }
      const userId = req.user.id;


      const currentUser = await db.query(
        'SELECT img FROM "usersReg" WHERE id = $1',
        [userId]
      );

      if (currentUser.rowCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const result = await db.query(
        'UPDATE "usersReg" SET img = $1 WHERE id = $2 RETURNING *',
        [null, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Profile image updated successfully', user: result.rows[0] });




    } catch (err) {
      console.error('Error on update profile image:', err);
      res.status(500).json({ message: "Error on update profile image" });
    }
  }

  async getUsers(req, res) {

    if (!req.user) {
      return res.status(401).send('Token not found');
    }
    try {
      const query = `SELECT * FROM "usersReg"`
      const userId = req.user.id;
      const response = await db.query(query)

      if (response.rows.length === 0) {
        res.status(404).json({ message: 'Users not found' });
      }
      const list = response.rows.map(({ u_password, ...chat }) => chat).filter((user) => user.id !== userId)
      res.status(200).json(list)
    } catch (err) {
      console.error('Error on get users:', err);
      res.status(500).send('Error on get users:');
    }
  }
}

module.exports = new ProfileController()
