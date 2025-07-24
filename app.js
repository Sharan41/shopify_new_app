const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'keyboard_cat',
  resave: false,
  saveUninitialized: true
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shopifyapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Render login/register page
app.get('/', (req, res) => {
  res.render('login');
});

// Auth handler (login or register)
app.post('/auth', async (req, res) => {
  const { userId, password, action } = req.body;
  try {
    if (action === 'register') {
      const existingUser = await User.findOne({ userId });
      if (existingUser) return res.send('User already exists. Please login.');
      const newUser = new User({ userId, password });
      await newUser.save();
      req.session.userId = newUser._id;
      return res.redirect('/dashboard');
    } else if (action === 'login') {
      const user = await User.findOne({ userId, password });
      if (!user) return res.send('Invalid credentials.');
      req.session.userId = user._id;
      return res.redirect('/dashboard');
    }
    res.send('Invalid action');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const user = await User.findById(req.session.userId);
  res.render('dashboard', { userId: user.userId, downloadedFiles: user.downloadedFiles });
});

// Add file name to downloads
app.post('/download', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const { fileName } = req.body;
  const user = await User.findById(req.session.userId);
  user.downloadedFiles.push(fileName);
  await user.save();
  res.redirect('/dashboard');
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
