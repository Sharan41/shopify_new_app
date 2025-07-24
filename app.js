const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'keyboard_cat',
  resave: false,
  saveUninitialized: true
}));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shopifyapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Register
app.post('/register', async (req, res) => {
  const { userId, password } = req.body;
  try {
    const existingUser = await User.findOne({ userId });
    if (existingUser) return res.status(400).send('User already exists');
    const newUser = new User({ userId, password });
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
    if (!user) return res.status(401).send('Invalid credentials');
    req.session.userId = user._id;
    res.send('Login successful');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get user downloads
app.get('/downloads', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const user = await User.findById(req.session.userId);
  res.json(user.downloadedFiles);
});

// Example route for adding a downloaded file
app.post('/download', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { fileName } = req.body;
  const user = await User.findById(req.session.userId);
  user.downloadedFiles.push(fileName);
  await user.save();
  res.send('File recorded');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});