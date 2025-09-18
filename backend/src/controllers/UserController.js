import models from '../models/index.js';
import bcrypt from 'bcrypt';

const { User, Location } = models;

const controller = {
  getUserPage: (req, res) => {
    res.send('User Home Page');
  },

  register: async (req, res) => {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({ username, email, password: hashedPassword });
      res.send('User registered');
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  login: async (req, res) => {
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) {
      return res.status(400).json({ message: 'username or email and password are required' });
    }
    try {
      const user = await User.findOne({ where: username ? { username } : { email } });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      req.session.user = { id: user.id, username: user.username, email: user.email };
      return res.json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out' });
    });
  },

  me: (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.json({ user: req.session.user });
  }
};

export default controller;
