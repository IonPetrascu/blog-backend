const db = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require("google-auth-library");

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      const existingUser = await db.query('SELECT * FROM "usersReg" WHERE u_email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await db.query(
        'INSERT INTO "usersReg" (u_name, u_password, u_email) VALUES ($1, $2, $3) RETURNING *',
        [name, hashedPassword, email]
      );



      if (result.rows.length > 0) {
        res.status(201).json('Register succes!');
      } else {
        res.status(400).send('No data returned from the database');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).send('Server Error');
    }
  }

  async login(req, res) {

    try {
      const { email, password } = req.body;

      const result = await db.query('SELECT * FROM "usersReg" WHERE u_email = $1', [email])

      const user = result.rows[0]

      const isPasswordMatch = await bcrypt.compare(password, user['u_password'])

      if (!user || !isPasswordMatch) {
        return res.status(400).json({ message: "Password or email incorrect" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, {
        expiresIn: '1d'
      })

      res.json({ token })
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error')
    }
  }

  async authGoogle(req, res) {

    const { token } = req.body
    try {
      const clientGoogle = new OAuth2Client(process.env.CLIENT_ID);

      const ticket = await clientGoogle.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name } = payload;

      const existingUser = await db.query('SELECT * FROM "usersReg" WHERE u_email = $1', [email]);

      let user;

      if (existingUser.rows.length > 0) {
        user = existingUser.rows[0];
      } else {
        const result = await db.query(
          'INSERT INTO "usersReg" (u_name, u_email, u_password) VALUES ($1, $2, $3) RETURNING *',
          [name, email, '']
        );
        user = result.rows[0];
      }

      const usertToken = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, {
        expiresIn: '30d'
      });

      res.json({ usertToken });
    } catch (error) {
      console.error(error);
      res.status(401).send('Unauthorized');
    }
  }

}

module.exports = new AuthController()
