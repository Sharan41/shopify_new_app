const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'keyboard_cat',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public')); // Optional, for CSS or assets

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shopifyapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Show login page



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/', (req, res) => {
  res.redirect('/login');
});
app.get('/login', (req, res) => {
  res.render('login', { username: null, error: null });
});

// Register user
app.post('/register', async (req, res) => {
  const { userId, password } = req.body;
  try {
    const existingUser = await User.findOne({ userId });
    if (existingUser) return res.status(400).send('User already exists');
    const newUser = new User({ userId, password, downloadedFiles: [] });
    await newUser.save();
    res.status(201).send('User registered');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { userId, password } = req.body;
  try {
    const user = await User.findOne({ userId, password });
    if (!user) {
      return res.render('login', {
        username: null,
        error: 'Invalid credentials'
      });
    }
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } catch (err) {
    res.status(500).render('login', {
      username: null,
      error: 'Server error'
    });
  }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  res.render('dashboard', { username: user.userId, downloads: user.downloadedFiles });
});

// Add downloaded file
app.post('/download', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { fileName } = req.body;
  const user = await User.findById(req.session.userId);
  user.downloadedFiles.push(fileName);
  await user.save();
  res.send('File recorded');
});

// Get user downloads (optional API)
app.get('/downloads', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const user = await User.findById(req.session.userId);
  res.json(user.downloadedFiles);
});

// Logout (optional)
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
