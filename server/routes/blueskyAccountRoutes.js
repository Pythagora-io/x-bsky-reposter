const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const BlueSkyService = require('../services/blueskyService.js');
const UserService = require('../services/userService.js');

const router = express.Router();

// GET /api/accounts/bluesky
// Returns the BlueSky accounts for the current user
router.get('/', requireUser, async (req, res) => {
  try {
    // User is already attached to req by the requireUser middleware
    const user = req.user;

    return res.status(200).json({
      accounts: user.blueskyAccounts || []
    });
  } catch (error) {
    console.error('Error fetching BlueSky accounts:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/accounts/bluesky/connect
// Connect a BlueSky account using credentials
router.post('/connect', requireUser, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    // Authenticate with BlueSky
    const blueskyAccount = await BlueSkyService.authenticate(identifier, password);

    // Check if this account is already connected to the user
    const user = req.user;
    const existingAccount = user.blueskyAccounts.find(account =>
      account.username === blueskyAccount.handle || account.id === blueskyAccount.did
    );

    if (existingAccount) {
      return res.status(400).json({ error: 'This BlueSky account is already connected to your profile' });
    }

    // Add the new BlueSky account to the user's accounts
    const newAccount = {
      id: blueskyAccount.did,
      username: blueskyAccount.handle,
      name: blueskyAccount.displayName || blueskyAccount.handle,
      profileImage: blueskyAccount.profileImage || '',
      isConnected: true,
      createdAt: new Date()
    };

    // Update the user document with the new account
    user.blueskyAccounts.push(newAccount);
    await user.save();

    return res.status(201).json({
      success: true,
      account: newAccount
    });
  } catch (error) {
    console.error('Error connecting BlueSky account:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;