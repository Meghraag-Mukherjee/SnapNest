const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Models
const userModel = require('./users');
const postModel = require('./posts');

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Passport Local Strategy
passport.use(new LocalStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// Routes

// Home page
router.get('/', (req, res) => {
  res.render('index', { title: 'Pinterest' });
});

// Login
router.get('/login', (req, res) => res.render('login'));
router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login'
}));

// Register
router.post('/register', (req, res, next) => {
  const { username, email, fullName } = req.body;
  const userData = new userModel({ username, email, fullName });
  userModel.register(userData, req.body.password)
    .then(() => passport.authenticate('local')(req, res, () => res.redirect('/profile')))
    .catch(err => res.send(err));
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Profile
router.get('/profile', isLoggedIn, async (req, res) => {
  const user = await userModel.findById(req.user._id).populate("posts");
  const posts = await postModel.find({ user: req.user._id }).sort({ createdAt: -1 });
  const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0);
  res.render('profile', { user, posts, totalLikes });
});

// Feed
router.get('/feed', isLoggedIn, async (req, res) => {
  const posts = await postModel.find().populate('user').sort({ createdAt: -1 });
  res.render('feed', { user: req.user, posts });
});

// Upload DP
router.post('/upload-dp', upload.single('dp'), async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  await userModel.findByIdAndUpdate(req.user._id, { dp: "/uploads/" + req.file.filename });
  res.redirect('/profile');
});

// Create Post
router.post('/create-post', upload.single('image'), async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  const post = await postModel.create({
    postText: req.body.postText,
    user: req.user._id,
    image: req.file ? "/uploads/" + req.file.filename : ""
  });
  await userModel.findByIdAndUpdate(req.user._id, { $push: { posts: post._id } });
  res.redirect('/profile');
});

// Like / Unlike Post
router.get('/like/:postId', isLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.postId);
  const liked = post.likes.includes(req.user._id);
  liked ? post.likes.pull(req.user._id) : post.likes.push(req.user._id);
  await post.save();
  res.redirect('/profile');
});

// Delete Post
router.get('/delete/:postId', isLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.postId);
  if (post.user.toString() === req.user._id.toString()) {
    await postModel.findByIdAndDelete(req.params.postId);
    await userModel.findByIdAndUpdate(req.user._id, {
      $pull: { posts: req.params.postId }
    });
  }
  res.redirect('/profile');
});

module.exports = router;
