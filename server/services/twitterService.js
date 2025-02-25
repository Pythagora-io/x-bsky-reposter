const { TwitterApi } = require('twitter-api-v2');
const User = require('../models/User');

/**
 * This service handles the Twitter API OAuth process and account management.
 */
class TwitterService {
  constructor() {
    // Use environment variables for these credentials
    this.clientId = process.env.TWITTER_CLIENT_ID;
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET;
    this.callbackUrl = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3000/api/accounts/twitter/callback';

    // Check if credentials are available
    if (!this.clientId || !this.clientSecret) {
      console.error('Twitter API credentials not configured! Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables.');
      throw new Error('Twitter API credentials not configured');
    } else {
      // Initialize the Twitter client for OAuth operations
      this.client = new TwitterApi({
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });
      console.log('Twitter API client initialized');
    }
  }

  /**
   * Generate an OAuth authorization URL for Twitter
   * @returns {Object} Object containing auth URL and state token
   */
  async generateAuthUrl() {
    try {
      // Define the scopes we need for Twitter API v2
      const scopes = [
        'tweet.read',
        'users.read',
        'offline.access'
      ];

      const { url, state, codeVerifier } = await this.client.generateOAuth2AuthLink(
        this.callbackUrl,
        { scope: scopes }
      );

      console.log(`Generated OAuth URL with state: ${state}`);

      return {
        url,
        state,
        codeVerifier
      };
    } catch (error) {
      console.error('Error generating Twitter auth URL:', error);
      throw new Error(`Failed to generate Twitter authentication URL: ${error.message}`);
    }
  }

  /**
   * Handle OAuth callback and exchange code for token
   * @param {string} code - Authorization code from Twitter
   * @param {string} state - State parameter for verification
   * @param {string} codeVerifier - Code verifier from initial request
   * @returns {Object} Twitter user information and tokens
   */
  async handleCallback(code, state, codeVerifier) {
    try {
      console.log('Processing Twitter OAuth callback');
      console.log(`Code: ${code.substring(0, 10)}...`);
      console.log(`State: ${state}`);
      console.log(`Code Verifier: ${codeVerifier ? codeVerifier.substring(0, 10) + '...' : 'missing'}`);

      if (!code) {
        throw new Error('Authorization code is required');
      }

      if (!codeVerifier) {
        throw new Error('Code verifier is required for OAuth 2.0 PKCE flow');
      }

      // Exchange the code for access token
      const { client: userClient, accessToken, refreshToken, expiresIn } =
        await this.client.loginWithOAuth2({
          code,
          codeVerifier,
          redirectUri: this.callbackUrl
        });

      console.log('Successfully obtained Twitter tokens');
      console.log(`Access token: ${accessToken.substring(0, 10)}...`);
      console.log(`Refresh token: ${refreshToken ? refreshToken.substring(0, 10) + '...' : 'none'}`);
      console.log(`Expires in: ${expiresIn} seconds`);

      // Get user information using the newly obtained token
      const { data: userInfo } = await userClient.v2.me({
        'user.fields': ['profile_image_url', 'name', 'username']
      });

      console.log(`Twitter authentication successful for user: ${userInfo.username}`);

      // Return user info and tokens
      return {
        id: userInfo.id,
        username: userInfo.username,
        name: userInfo.name || userInfo.username,
        profileImage: userInfo.profile_image_url || `https://via.placeholder.com/150?text=${userInfo.username}`,
        accessToken,
        refreshToken,
        expiresAt: refreshToken ? new Date(Date.now() + expiresIn * 1000) : null
      };
    } catch (error) {
      console.error('Error handling Twitter callback:', error);
      throw new Error(`Failed to authenticate with Twitter: ${error.message}`);
    }
  }

  /**
   * Get user tweets from Twitter
   * @param {string} twitterAccountId - The Twitter account ID to fetch tweets for
   * @returns {Promise<Array>} - Array of tweets
   */
  async getUserTweets(twitterAccountId) {
    try {
      console.log(`Fetching tweets for Twitter account ${twitterAccountId}`);

      // Find the user with this Twitter account
      const user = await User.findOne({
        'twitterAccounts.id': twitterAccountId
      });

      if (!user) {
        throw new Error(`No user found with Twitter account ID ${twitterAccountId}`);
      }

      // Find the specific Twitter account in the user's accounts
      const twitterAccount = user.twitterAccounts.find(acc => acc.id === twitterAccountId);

      if (!twitterAccount) {
        throw new Error(`Twitter account ID ${twitterAccountId} not found for user`);
      }

      if (!twitterAccount.accessToken) {
        throw new Error(`No access token found for Twitter account ID ${twitterAccountId}`);
      }

      console.log(`Using access token: ${twitterAccount.accessToken.substring(0, 10)}...`);

      // Create a client instance with the user's access token
      const userClient = new TwitterApi(twitterAccount.accessToken);

      // Fetch the user's timeline
      const timeline = await userClient.v2.userTimeline(twitterAccountId, {
        max_results: 10,
        expansions: ['attachments.media_keys'],
        'tweet.fields': ['created_at', 'public_metrics', 'text', 'id'],
        'user.fields': ['profile_image_url', 'name', 'username'],
        'media.fields': ['url', 'preview_image_url']
      });

      if (!timeline.data || !timeline.data.data) {
        console.log('No tweets found for this user');
        return [];
      }

      console.log(`Successfully fetched ${timeline.data.data.length} tweets`);

      // Transform the tweets to match our expected format
      return timeline.data.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        createdAt: new Date(tweet.created_at),
        likes: tweet.public_metrics.like_count,
        retweets: tweet.public_metrics.retweet_count
      }));
    } catch (error) {
      console.error(`Error fetching tweets from Twitter API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh an access token using a refresh token
   * @param {string} refreshToken - The refresh token
   * @returns {Object} Object containing new access token and expiration
   */
  async refreshAccessToken(refreshToken) {
    try {
      console.log('Refreshing Twitter access token');

      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      const { client, accessToken, refreshToken: newRefreshToken, expiresIn } =
        await this.client.refreshOAuth2Token(refreshToken);

      console.log('Successfully refreshed Twitter access token');

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
      };
    } catch (error) {
      console.error('Error refreshing Twitter access token:', error);
      throw new Error(`Failed to refresh Twitter access token: ${error.message}`);
    }
  }
}

module.exports = new TwitterService();