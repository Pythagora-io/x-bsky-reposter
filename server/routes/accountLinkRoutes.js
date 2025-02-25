const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const AccountLink = require('../models/AccountLink.js');
const User = require('../models/User.js');

const router = express.Router();

// POST /api/accounts/link
// Link a Twitter account to a BlueSky account
router.post('/link', requireUser, async (req, res) => {
  try {
    const { twitterAccountId, blueskyAccountId } = req.body;
    const user = req.user;

    if (!twitterAccountId || !blueskyAccountId) {
      return res.status(400).json({
        error: 'Twitter account ID and BlueSky account ID are required'
      });
    }

    // Verify that the user owns both accounts
    const twitterAccount = user.twitterAccounts.find(
      account => account.id === twitterAccountId
    );

    const blueskyAccount = user.blueskyAccounts.find(
      account => account.id === blueskyAccountId
    );

    if (!twitterAccount) {
      return res.status(404).json({
        error: 'Twitter account not found for this user'
      });
    }

    if (!blueskyAccount) {
      return res.status(404).json({
        error: 'BlueSky account not found for this user'
      });
    }

    // Check if this link already exists
    const existingLink = await AccountLink.findOne({
      userId: user._id,
      twitterAccountId,
      blueskyAccountId
    });

    if (existingLink) {
      // If it exists but is inactive, reactivate it
      if (!existingLink.active) {
        existingLink.active = true;
        existingLink.updatedAt = Date.now();
        await existingLink.save();

        return res.status(200).json({
          success: true,
          message: 'Account link reactivated successfully'
        });
      }

      return res.status(400).json({
        error: 'These accounts are already linked'
      });
    }

    // Create a new account link
    const accountLink = new AccountLink({
      userId: user._id,
      twitterAccountId,
      blueskyAccountId,
      active: true
    });

    await accountLink.save();

    // Mark the accounts as connected in the user document
    for (const account of user.twitterAccounts) {
      if (account.id === twitterAccountId) {
        account.isConnected = true;
      }
    }

    for (const account of user.blueskyAccounts) {
      if (account.id === blueskyAccountId) {
        account.isConnected = true;
      }
    }

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Accounts linked successfully'
    });
  } catch (error) {
    console.error('Error linking accounts:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while linking accounts'
    });
  }
});

// GET /api/accounts/links
// Get all linked accounts for the current user
router.get('/links', requireUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all active account links for this user
    const accountLinks = await AccountLink.find({
      userId: userId,
      active: true
    });

    // If we want to include the account details, we could populate the response
    // with Twitter and BlueSky account information
    const linkedAccounts = await Promise.all(accountLinks.map(async (link) => {
      // Find Twitter account info
      const twitterAccount = req.user.twitterAccounts.find(
        account => account.id === link.twitterAccountId
      );

      // Find BlueSky account info
      const blueskyAccount = req.user.blueskyAccounts.find(
        account => account.id === link.blueskyAccountId
      );

      return {
        _id: link._id,
        twitterAccount: twitterAccount ? {
          id: twitterAccount.id,
          username: twitterAccount.username,
          name: twitterAccount.name,
          profileImage: twitterAccount.profileImage
        } : null,
        blueskyAccount: blueskyAccount ? {
          id: blueskyAccount.id,
          username: blueskyAccount.username,
          name: blueskyAccount.name,
          profileImage: blueskyAccount.profileImage
        } : null,
        createdAt: link.createdAt
      };
    }));

    return res.status(200).json({
      success: true,
      links: linkedAccounts
    });
  } catch (error) {
    console.error('Error fetching linked accounts:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while fetching linked accounts'
    });
  }
});

// DELETE /api/accounts/links/:linkId
// Remove a link between Twitter and BlueSky accounts
router.delete('/links/:linkId', requireUser, async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = req.user._id;

    // Find the account link
    const accountLink = await AccountLink.findOne({
      _id: linkId,
      userId: userId
    });

    if (!accountLink) {
      return res.status(404).json({
        error: 'Account link not found'
      });
    }

    // Set the link to inactive instead of deleting
    accountLink.active = false;
    accountLink.updatedAt = Date.now();
    await accountLink.save();

    // Update isConnected status on accounts if they don't have other active links
    const userTwitterAccount = req.user.twitterAccounts.find(
      acc => acc.id === accountLink.twitterAccountId
    );

    const userBlueskyAccount = req.user.blueskyAccounts.find(
      acc => acc.id === accountLink.blueskyAccountId
    );

    // Check if Twitter account has other active links
    const hasOtherTwitterLinks = await AccountLink.exists({
      userId: userId,
      twitterAccountId: accountLink.twitterAccountId,
      active: true,
      _id: { $ne: accountLink._id }
    });

    // Check if BlueSky account has other active links
    const hasOtherBlueskyLinks = await AccountLink.exists({
      userId: userId,
      blueskyAccountId: accountLink.blueskyAccountId,
      active: true,
      _id: { $ne: accountLink._id }
    });

    // Update user document if needed
    let userUpdated = false;

    if (userTwitterAccount && !hasOtherTwitterLinks) {
      userTwitterAccount.isConnected = false;
      userUpdated = true;
    }

    if (userBlueskyAccount && !hasOtherBlueskyLinks) {
      userBlueskyAccount.isConnected = false;
      userUpdated = true;
    }

    if (userUpdated) {
      await req.user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Account link removed successfully'
    });
  } catch (error) {
    console.error('Error removing account link:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while removing the account link'
    });
  }
});

module.exports = router;