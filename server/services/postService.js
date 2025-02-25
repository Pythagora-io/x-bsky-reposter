const Post = require('../models/Post');
const User = require('../models/User');
const twitterService = require('./twitterService');

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