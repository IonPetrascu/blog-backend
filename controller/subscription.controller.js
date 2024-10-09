const db = require('../db')

class SubscriptionController {
  async addSubscription(req, res) {

    if (!req.user) {
      return res.status(401).send('Token not found');
    }

    const subscriber_id = req.user.id;
    const subscribed_to_id = Number(req.params.id, 10)

    if (subscriber_id === subscribed_to_id) {
      return res.status(400).json({ message: "You cannot subscribe to yourself." });
    }


    try {
      await db.query(
        'INSERT INTO subscriptions (subscriber_id, subscribed_to_id) VALUES($1, $2) RETURNING *',
        [subscriber_id, subscribed_to_id]
      );

      const userResult = await db.query(
        'SELECT u.id AS subscriber_id, u.u_name, u.u_email FROM "usersReg" u WHERE u.id = $1',
        [subscriber_id]
      );

      res.status(200).json(userResult.rows[0]);
    } catch (err) {
      console.error('Error subscription:', err);
      res.status(500).json({ message: "Error subscription" });
    }
  }

  async deleteSubscription(req, res) {

    if (!req.user) {
      return res.status(401).send('Token not found');
    }

    const subscriber_id = req.user.id;
    const subscribed_to_id = Number(req.params.id, 10)

    if (subscriber_id === subscribed_to_id) {
      return res.status(400).json({ message: "You cannot delete subscribtion to yourself." });
    }


    try {
      const result = await db.query(
        'DELETE FROM subscriptions WHERE subscriber_id = $1 AND subscribed_to_id = $2 RETURNING * ',
        [subscriber_id, subscribed_to_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Subscription not found." });
      }

      const userResult = await db.query(
        'SELECT u.id AS subscriber_id, u.u_name, u.u_email FROM "usersReg" u WHERE u.id = $1',
        [subscriber_id]
      );

      res.status(200).json(userResult.rows[0]);
    } catch (err) {
      console.error('Error on delete subscription:', err);
      res.status(500).json({ message: "Error on delete subscription" });
    }
  }

}

module.exports = new SubscriptionController()
