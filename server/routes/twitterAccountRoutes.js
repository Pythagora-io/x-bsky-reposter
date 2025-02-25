const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const UserService = require('../services/userService.js');
const TwitterService = require('../services/twitterService.js');

const router = express.Router();

// GET /api/accounts/twitter
// Returns the Twitter accounts for the current user
router.get('/', requireUser, async (req, res) => {
  try {
    // User is already attached to req by the requireUser middleware
    const user = req.user;

    return res.status(200).json({
      twitterAccounts: user.twitterAccounts || []
    });
  } catch (error) {
    console.error('Error fetching Twitter accounts:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/accounts/twitter/connect
// Connect a Twitter account using an auth code
router.post('/connect', requireUser, async (req, res) => {
  try {
    const { authCode } = req.body;

    if (!authCode) {
      return res.status(400).json({ error: 'Authentication code is required' });
    }

    // Verify the auth code and get Twitter user info
    const twitterUser = await TwitterService.verifyAuthCode(authCode);

    // Check if this Twitter account is already connected to this user
    const user = req.user;
    const alreadyConnected = user.twitterAccounts.some(account => account.id === twitterUser.id);

    if (alreadyConnected) {
      return res.status(400).json({ error: 'This Twitter account is already connected' });
    }

    // Add the Twitter account to the user's accounts
    user.twitterAccounts.push({
      id: twitterUser.id,
      username: twitterUser.username,
      name: twitterUser.name,
      profileImage: twitterUser.profileImage,
      isConnected: true
    });

    // Save the updated user
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Twitter account connected successfully',
      account: {
        _id: user._id + '-twitter-' + twitterUser.id, // Create a unique ID for the frontend
        id: twitterUser.id,
        username: twitterUser.username,
        name: twitterUser.name,
        profileImage: twitterUser.profileImage,
        connected: true
      }
    });
  } catch (error) {
    console.error('Error connecting Twitter account:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/accounts/twitter/auth
// Get Twitter OAuth URL
router.get('/auth', requireUser, async (req, res) => {
  try {
    const { url, state, codeVerifier } = await TwitterService.generateAuthUrl();

    // Store state and codeVerifier in session or Redis for verification in callback
    // For this mock implementation, we won't actually do that

    return res.status(200).json({
      authUrl: url,
      state
    });
  } catch (error) {
    console.error('Error generating Twitter auth URL:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/accounts/twitter/callback
// Handle Twitter OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // In a real implementation, you would:
    // 1. Retrieve the original state and codeVerifier from session/Redis
    // 2. Verify that the returned state matches the original state
    // 3. Exchange the code for tokens

    // For this mock implementation, we'll just handle the callback
    const codeVerifier = 'mock-code-verifier'; // This would come from session in a real implementation
    const twitterUser = await TwitterService.handleCallback(code, state, codeVerifier);

    // Send the user to a frontend page with the auth data
    // In a real app, you'd probably redirect to a frontend route
    res.redirect(`/accounts?twitter_connect=success&id=${twitterUser.id}`);
  } catch (error) {
    console.error('Error handling Twitter callback:', error);
    res.redirect('/accounts?twitter_connect=error&message=' + encodeURIComponent(error.message));
  }
});

module.exports = router;