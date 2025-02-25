const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');
const postService = require('../services/postService');
const Post = require('../models/Post');
const User = require('../models/User');
const AccountLink = require('../models/AccountLink');
const blueskyService = require('../services/blueskyService');

/**
 * Get all posts for the authenticated user
 * GET /api/posts
 */
router.get('/', requireUser, async (req, res) => {
  try {
    console.log(`Fetching posts for user ${req.user._id}`);

    // First, sync Twitter posts to ensure we have the latest data
    const posts = await postService.syncTwitterPosts(req.user._id);

    console.log(`Retrieved ${posts.length} posts for user ${req.user._id}`);

    res.json({ posts });
  } catch (error) {
    console.error('Error retrieving posts:', error);
    res.status(500).json({
      message: `Failed to retrieve posts: ${error.message}`
    });
  }
});

/**
 * Manually repost a Twitter post to BlueSky
 * POST /api/posts/repost
 */
router.post('/repost', requireUser, async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    // Find the post to repost
    const post = await Post.findOne({
      _id: postId,
      userId: req.user._id
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.isReposted) {
      return res.status(400).json({ message: 'Post has already been reposted to BlueSky' });
    }

    // Find the user to get BlueSky account credentials
    const user = await User.findById(req.user._id);
    console.log('User BlueSky accounts:', JSON.stringify(user.blueskyAccounts, null, 2));

    // Find the account link for the Twitter account associated with this post
    const accountLink = await AccountLink.findOne({
      userId: req.user._id,
      twitterAccountId: post.twitterPost.accountId,
      active: true
    });

    if (!accountLink) {
      return res.status(400).json({
        message: 'No linked BlueSky account found for this Twitter account'
      });
    }

    console.log('Account link found:', JSON.stringify(accountLink, null, 2));

    // Get the linked BlueSky account
    const blueskyAccount = user.blueskyAccounts.find(
      account => account.id === accountLink.blueskyAccountId
    );

    console.log('BlueSky account match:', blueskyAccount ?
      JSON.stringify(blueskyAccount, null, 2) : 'No matching BlueSky account found');

    if (!blueskyAccount) {
      return res.status(400).json({
        message: 'The linked BlueSky account is not found'
      });
    }

    if (!blueskyAccount.isConnected) {
      return res.status(400).json({
        message: 'The linked BlueSky account is not connected (isConnected flag is false)'
      });
    }

    // Create the post on BlueSky
    const blueskyCredentials = {
      did: blueskyAccount.id,
      handle: blueskyAccount.username,
      accessJwt: blueskyAccount.accessJwt,
      refreshJwt: blueskyAccount.refreshJwt
    };

    // Create post on BlueSky
    const blueskyPost = await blueskyService.createPost(
      post.twitterPost.text,
      blueskyCredentials
    );

    // Update the post in our database
    post.blueskyPost = {
      id: blueskyPost.id,
      text: blueskyPost.text,
      createdAt: blueskyPost.createdAt,
      likes: blueskyPost.likes,
      reposts: blueskyPost.reposts
    };
    post.isReposted = true;
    await post.save();

    res.json({
      success: true,
      blueskyPost: post.blueskyPost
    });
  } catch (error) {
    console.error('Error reposting to BlueSky:', error);
    res.status(500).json({
      message: `Failed to repost to BlueSky: ${error.message}`
    });
  }
});

module.exports = router;