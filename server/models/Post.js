const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  twitterPost: {
    id: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, required: true },
    likes: { type: Number, default: 0 },
    retweets: { type: Number, default: 0 },
    accountId: {
      type: String,
      required: true
    }
  },
  blueskyPost: {
    id: { type: String },
    text: { type: String },
    createdAt: { type: Date },
    likes: { type: Number, default: 0 },
    reposts: { type: Number, default: 0 }
  },
  isReposted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for Twitter post ID and user ID to ensure uniqueness
PostSchema.index({ 'userId': 1, 'twitterPost.id': 1 }, { unique: true });

// Update the updatedAt field before saving
PostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Post', PostSchema);