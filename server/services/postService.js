const Post = require('../models/Post');
const User = require('../models/User');
const twitterService = require('./twitterService');
const blueskyService = require('./blueskyService');
const AccountLink = require('../models/AccountLink');

/**
 * Get posts for a user with their Twitter and BlueSky information
 */
exports.getUserPosts = async (userId) => {
  try {
    // Find all posts for the user
    const posts = await Post.find({ userId }).sort({ 'twitterPost.createdAt': -1 });

    // Get user's Twitter accounts for additional information
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Map posts to include full account information
    const postsWithAccounts = posts.map(post => {
      const twitterAccount = user.twitterAccounts.find(
        account => account.id === post.twitterPost.accountId
      );

      return {
        _id: post._id,
        twitterPost: {
          id: post.twitterPost.id,
          text: post.twitterPost.text,
          createdAt: post.twitterPost.createdAt,
          likes: post.twitterPost.likes,
          retweets: post.twitterPost.retweets,
          account: twitterAccount ? {
            id: twitterAccount.id,
            username: twitterAccount.username,
            name: twitterAccount.name,
            profileImage: twitterAccount.profileImage
          } : null
        },
        blueskyPost: post.isReposted ? {
          id: post.blueskyPost.id,
          text: post.blueskyPost.text,
          createdAt: post.blueskyPost.createdAt,
          likes: post.blueskyPost.likes,
          reposts: post.blueskyPost.reposts
        } : null
      };
    });

    return postsWithAccounts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
};

/**
 * Fetch and sync Twitter posts for a user from the Twitter API
 */
exports.syncTwitterPosts = async (userId) => {
  try {
    console.log(`Syncing Twitter posts for user ${userId}`);
    const user = await User.findById(userId);

    if (!user || !user.twitterAccounts || user.twitterAccounts.length === 0) {
      console.log(`No Twitter accounts found for user ${userId}`);
      return [];
    }

    console.log(`Found ${user.twitterAccounts.length} Twitter accounts for user ${userId}`);

    // For each Twitter account, fetch posts
    for (const twitterAccount of user.twitterAccounts) {
      if (!twitterAccount.connected || !twitterAccount.accessToken) {
        console.log(`Skipping Twitter account ${twitterAccount.id} (${twitterAccount.username}) - not connected or missing token`);
        continue;
      }

      console.log(`Fetching tweets for Twitter account ${twitterAccount.id} (${twitterAccount.username})`);

      try {
        // Call Twitter API to get tweets
        const twitterPosts = await twitterService.getUserTweets(twitterAccount.id);
        console.log(`Retrieved ${twitterPosts.length} tweets for account ${twitterAccount.username}`);

        // Save each tweet to our database if it doesn't exist
        for (const tweet of twitterPosts) {
          // Check if post already exists
          const existingPost = await Post.findOne({
            userId,
            'twitterPost.id': tweet.id
          });

          if (!existingPost) {
            console.log(`Adding new tweet ${tweet.id} to database`);
            // Create new post
            const newPost = new Post({
              userId,
              twitterPost: {
                id: tweet.id,
                text: tweet.text,
                createdAt: tweet.createdAt,
                likes: tweet.likes,
                retweets: tweet.retweets,
                accountId: twitterAccount.id
              },
              isReposted: false
            });

            await newPost.save();
          } else {
            // Update existing post with new like/retweet counts
            existingPost.twitterPost.likes = tweet.likes;
            existingPost.twitterPost.retweets = tweet.retweets;
            await existingPost.save();
          }
        }
      } catch (error) {
        console.error(`Error fetching tweets for account ${twitterAccount.id}:`, error);
        // Continue with next account instead of failing the entire process
      }
    }

    return await this.getUserPosts(userId);
  } catch (error) {
    console.error('Error syncing Twitter posts:', error);
    throw error;
  }
};

/**
 * Process new posts for a user and automatically repost to BlueSky
 * @param {string} userId - User ID to process posts for
 */
exports.processNewPostsForUser = async (userId) => {
  try {
    console.log(`Processing new posts for user ${userId}`);

    // 1. Fetch and sync latest Twitter posts
    await this.syncTwitterPosts(userId);

    // 2. Find all account links for this user
    const accountLinks = await AccountLink.find({
      userId,
      active: true
    });

    if (!accountLinks || accountLinks.length === 0) {
      console.log(`No account links found for user ${userId}`);
      return;
    }

    console.log(`Found ${accountLinks.length} account links for user ${userId}`);

    // 3. For each link, find posts that haven't been reposted yet
    for (const link of accountLinks) {
      // Find unsynced posts for this Twitter account
      const unsyncedPosts = await Post.find({
        userId,
        'twitterPost.accountId': link.twitterAccountId,
        isReposted: false
      }).sort({ 'twitterPost.createdAt': -1 });

      console.log(`Found ${unsyncedPosts.length} unsynced posts for Twitter account ${link.twitterAccountId}`);

      if (unsyncedPosts.length === 0) {
        continue;
      }

      // Get user for BlueSky credentials
      const user = await User.findById(userId);
      if (!user) {
        console.log(`User ${userId} not found`);
        continue;
      }

      // Find the BlueSky account for this link
      const blueskyAccount = user.blueskyAccounts.find(
        account => account.id === link.blueskyAccountId
      );

      if (!blueskyAccount || !blueskyAccount.isConnected) {
        console.log(`BlueSky account ${link.blueskyAccountId} not found or not connected`);
        continue;
      }

      // Get BlueSky credentials
      const blueskyCredentials = {
        did: blueskyAccount.id,
        handle: blueskyAccount.username,
        accessJwt: blueskyAccount.accessJwt,
        refreshJwt: blueskyAccount.refreshJwt
      };

      // Process each unsynced post
      for (const post of unsyncedPosts) {
        try {
          console.log(`Auto-reposting Twitter post ${post.twitterPost.id} to BlueSky`);

          // Create post on BlueSky
          const blueskyPost = await blueskyService.createPost(
            post.twitterPost.text,
            blueskyCredentials
          );

          // Update post in database
          post.blueskyPost = {
            id: blueskyPost.id,
            text: blueskyPost.text,
            createdAt: blueskyPost.createdAt,
            likes: blueskyPost.likes,
            reposts: blueskyPost.reposts
          };
          post.isReposted = true;
          await post.save();

          console.log(`Successfully auto-reposted Twitter post ${post.twitterPost.id} to BlueSky`);
        } catch (postError) {
          console.error(`Error auto-reposting post ${post._id}:`, postError);
          // Continue with next post
        }
      }
    }

    console.log(`Completed processing posts for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error processing new posts:', error);
    throw error;
  }
};