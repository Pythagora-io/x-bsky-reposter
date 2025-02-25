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
      return res.status(400).json({
        message: 'BlueSky identifier and password are required'
      });
    }

    console.log(`Connecting BlueSky account for user ${req.user._id} with identifier: ${identifier}`);

    // Validate BlueSky credentials using BlueSky API
    const authResult = await BlueSkyService.authenticate(identifier, password);

    if (!authResult || !authResult.success) {
      return res.status(401).json({
        message: 'Invalid BlueSky credentials'
      });
    }

    console.log(`Authentication successful for BlueSky account: ${authResult.handle}`);

    // Get the user - using get method instead of findUserById
    const user = await UserService.get(req.user._id);

    // Check if this account is already connected
    const existingAccount = user.blueskyAccounts.find(
      account => account.id === authResult.did || account.username === authResult.handle
    );

    if (existingAccount) {
      // Update the existing account
      existingAccount.name = authResult.displayName;
      existingAccount.profileImage = authResult.profileImage;
      existingAccount.isConnected = true; // <-- Use isConnected instead of connected
      existingAccount.accessJwt = authResult.accessJwt; // Store access token
      existingAccount.refreshJwt = authResult.refreshJwt; // Store refresh token
      existingAccount.updatedAt = new Date();

      console.log(`Updated existing BlueSky account ${existingAccount.id}`);
    } else {
      // Add the new account
      user.blueskyAccounts.push({
        id: authResult.did,
        username: authResult.handle,
        name: authResult.displayName,
        profileImage: authResult.profileImage,
        isConnected: true, // <-- Use isConnected instead of connected
        accessJwt: authResult.accessJwt, // Store access token
        refreshJwt: authResult.refreshJwt, // Store refresh token
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Added new BlueSky account ${authResult.did}`);
    }

    await user.save();

    // Return the newly added/updated account
    const addedAccount = user.blueskyAccounts.find(
      account => account.id === authResult.did || account.username === authResult.handle
    );

    console.log(`Returning account details: ${JSON.stringify(addedAccount, null, 2)}`);

    res.json({
      success: true,
      message: 'BlueSky account connected successfully',
      account: {
        id: addedAccount.id,
        username: addedAccount.username,
        name: addedAccount.name,
        profileImage: addedAccount.profileImage,
        isConnected: addedAccount.isConnected
      }
    });
  } catch (error) {
    console.error('Error connecting BlueSky account:', error);
    res.status(500).json({
      message: `Failed to connect BlueSky account: ${error.message}`
    });
  }
});

module.exports = router;