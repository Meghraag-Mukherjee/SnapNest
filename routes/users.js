var express = require('express');

const mongoose = require('mongoose');
const plm= require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    
  },

   posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],

  dp: {
    type: String, // URL of the profile picture
    default: ''
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  fullName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

userSchema.plugin(plm);
const User = mongoose.model('User', userSchema);


module.exports = User;
