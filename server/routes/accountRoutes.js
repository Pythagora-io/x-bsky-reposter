const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const UserService = require('../services/userService.js');

const router = express.Router();

// GET /api/accounts
// Returns the Twitter and BlueSky accounts for the current user
router.get('/', requireUser, async (req, res) => {
  try {
    // User is already attached to req by the requireUser middleware
    const user = req.user;

    return res.status(200).json({
      twitterAccounts: user.twitterAccounts || [],
      blueskyAccounts: user.blueskyAccounts || [],
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;