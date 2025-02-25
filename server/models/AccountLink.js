const mongoose = require('mongoose');

const accountLinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  twitterAccountId: {
    type: String,
    required: true,
  },
  blueskyAccountId: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  versionKey: false
});

// Compound index to ensure uniqueness of the Twitter-BlueSky account pair per user
accountLinkSchema.index({ userId: 1, twitterAccountId: 1, blueskyAccountId: 1 }, { unique: true });

// Update the 'updatedAt' field on save
accountLinkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const AccountLink = mongoose.model('AccountLink', accountLinkSchema);

module.exports = AccountLink;