const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const UserService = require('../services/userService.js');
const TwitterService = require('../services/twitterService.js');
const crypto = require('crypto');

const router = express.Router();

// In-memory storage for OAuth state and code verifiers
// In production, use Redis or another shared storage
const oauthStates = {};

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
// Connect a Twitter account using OAuth code after redirect
router.post('/connect', requireUser, async (req, res) => {
  try {
    const { code, state, codeVerifier } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Twitter authorization code is required' });
    }

    if (!codeVerifier) {
      return res.status(400).json({ message: 'Code verifier is required for Twitter OAuth' });
    }

    console.log('Connecting Twitter account with authorization code');
    console.log(`Code: ${code.substring(0, 10)}...`);
    console.log(`State: ${state}`);
    console.log(`Code Verifier: ${codeVerifier.substring(0, 10)}...`);

    // Verify the auth code with Twitter
    const twitterInfo = await TwitterService.handleCallback(code, state, codeVerifier);

    console.log('Received Twitter account info from OAuth process:');
    console.log(`ID: ${twitterInfo.id}`);
    console.log(`Username: ${twitterInfo.username}`);
    console.log(`Access Token: ${twitterInfo.accessToken.substring(0, 10)}...`);

    // Check if this Twitter account is already connected to this user
    const existingAccount = req.user.twitterAccounts.find(
      account => account.id === twitterInfo.id
    );

    if (existingAccount) {
      console.log(`Updating existing Twitter account: ${twitterInfo.username}`);
      // Update the existing account with new tokens
      existingAccount.accessToken = twitterInfo.accessToken;
      existingAccount.refreshToken = twitterInfo.refreshToken;
      existingAccount.connected = true;
      existingAccount.username = twitterInfo.username;
      existingAccount.name = twitterInfo.name;
      existingAccount.profileImage = twitterInfo.profileImage;
    } else {
      console.log(`Adding new Twitter account: ${twitterInfo.username}`);
      // Add the new Twitter account
      req.user.twitterAccounts.push({
        id: twitterInfo.id,
        username: twitterInfo.username,
        name: twitterInfo.name,
        profileImage: twitterInfo.profileImage,
        accessToken: twitterInfo.accessToken,
        refreshToken: twitterInfo.refreshToken,
        connected: true
      });
    }

    // Save the updated user
    await req.user.save();
    console.log(`User account updated with Twitter account: ${twitterInfo.username}`);

    // Return the Twitter account info (excluding sensitive token data)
    res.json({
      account: {
        id: twitterInfo.id,
        username: twitterInfo.username,
        name: twitterInfo.name,
        profileImage: twitterInfo.profileImage,
        connected: true
      }
    });
  } catch (error) {
    console.error('Error connecting Twitter account:', error);
    res.status(500).json({
      message: `Failed to connect Twitter account: ${error.message}`
    });
  }
});

// GET /api/accounts/twitter/auth
// Get Twitter OAuth URL
router.get('/auth', requireUser, async (req, res) => {
  try {
    const { url, state, codeVerifier } = await TwitterService.generateAuthUrl();

    console.log('Generated Twitter OAuth URL:');
    console.log(`URL: ${url.substring(0, 50)}...`);
    console.log(`State: ${state}`);
    console.log(`Code Verifier: ${codeVerifier.substring(0, 10)}...`);

    // Store the codeVerifier for this state
    // In production, use Redis or another shared storage
    oauthStates[state] = {
      codeVerifier,
      userId: req.user._id,
      createdAt: Date.now()
    };

    // Clean up old states (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const s in oauthStates) {
      if (oauthStates[s].createdAt < tenMinutesAgo) {
        delete oauthStates[s];
      }
    }

    return res.status(200).json({
      authUrl: url,
      state,
      codeVerifier
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
      return res.status(400).send('Missing required parameters');
    }

    console.log('Received Twitter OAuth callback:');
    console.log(`Code: ${code.substring(0, 10)}...`);
    console.log(`State: ${state}`);

    // Retrieve the stored code verifier and user ID
    const stateData = oauthStates[state];
    if (!stateData) {
      console.error(`No state data found for state: ${state}`);
      return res.status(400).send('Invalid or expired state parameter');
    }

    const { codeVerifier, userId } = stateData;

    // Clean up the used state
    delete oauthStates[state];

    // Verify that there's a user for this connection
    const user = await UserService.get(userId);
    if (!user) {
      console.error(`No user found for ID: ${userId}`);
      return res.status(400).send('User not found');
    }

    // Get Twitter account info
    const twitterInfo = await TwitterService.handleCallback(code, state, codeVerifier);

    // Check if this Twitter account is already connected to this user
    const existingAccount = user.twitterAccounts.find(
      account => account.id === twitterInfo.id
    );

    if (existingAccount) {
      // Update the existing account with new tokens
      existingAccount.accessToken = twitterInfo.accessToken;
      existingAccount.refreshToken = twitterInfo.refreshToken;
      existingAccount.connected = true;
      existingAccount.username = twitterInfo.username;
      existingAccount.name = twitterInfo.name;
      existingAccount.profileImage = twitterInfo.profileImage;
    } else {
      // Add the new Twitter account
      user.twitterAccounts.push({
        id: twitterInfo.id,
        username: twitterInfo.username,
        name: twitterInfo.name,
        profileImage: twitterInfo.profileImage,
        accessToken: twitterInfo.accessToken,
        refreshToken: twitterInfo.refreshToken,
        connected: true
      });
    }

    // Save the updated user
    await user.save();
    console.log(`User account updated with Twitter account: ${twitterInfo.username}`);

    // Redirect back to the frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?twitter_connect=success&id=${twitterInfo.id}`);
  } catch (error) {
    console.error('Error handling Twitter callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?twitter_connect=error&message=${encodeURIComponent(error.message)}`);
  }
});

// DELETE /api/accounts/twitter/:accountId
// Remove a Twitter account
router.delete('/:accountId', requireUser, async (req, res) => {
  try {
    const { accountId } = req.params;
    const user = req.user;

    // Find the account index
    const accountIndex = user.twitterAccounts.findIndex(
      account => account.id === accountId
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        message: 'Twitter account not found'
      });
    }

    // Remove the account
    user.twitterAccounts.splice(accountIndex, 1);
    await user.save();

    console.log(`Removed Twitter account ${accountId} from user ${user._id}`);

    return res.status(200).json({
      message: 'Twitter account removed successfully'
    });
  } catch (error) {
    console.error('Error removing Twitter account:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;