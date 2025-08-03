// models/Post.js
const express = require('express');
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  postText: {
    type: String,
    required: true,
    trim: true
  },
  user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
,

  likes: {
    type: Array,
    default: [] // array of user IDs who liked the post
  }

}, {
  timestamps: true // adds createdAt and updatedAt fields automatically
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
