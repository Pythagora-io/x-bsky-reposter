const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');
const postService = require('../services/postService');

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

    // Implementation for reposting to BlueSky will be completed in a future task
    // For now, this is a placeholder

    res.status(501).json({ message: 'Reposting functionality will be implemented in a future task' });
  } catch (error) {
    console.error('Error reposting to BlueSky:', error);
    res.status(500).json({
      message: `Failed to repost to BlueSky: ${error.message}`
    });
  }
});

module.exports = router;