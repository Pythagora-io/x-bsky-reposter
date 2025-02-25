const { BskyAgent, RichText } = require('@atproto/api');

class BlueSkyService {
  constructor() {
    this.agent = new BskyAgent({
      service: 'https://bsky.social',
    });
  }

  /**
   * Authenticates a user with BlueSky
   * @param {string} identifier - Username or email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Authentication result with user details
   */
  async authenticate(identifier, password) {
    try {
      console.log(`Attempting to authenticate BlueSky user: ${identifier}`);

      // Authenticate with the Bluesky API
      const response = await this.agent.login({
        identifier,
        password,
      });

      if (!response.success) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      console.log(`BlueSky authentication successful for: ${identifier}`);

      // Get profile information
      const profile = await this.agent.getProfile({
        actor: this.agent.session.did,
      });

      console.log(`Retrieved profile for BlueSky user: ${profile.data.handle}`);

      // Return user data
      return {
        success: true,
        did: this.agent.session.did,
        handle: profile.data.handle,
        email: identifier.includes('@') ? identifier : null,
        displayName: profile.data.displayName || profile.data.handle,
        profileImage: profile.data.avatar || `https://ui-avatars.com/api/?name=${profile.data.handle}&background=random`,
        accessJwt: this.agent.session.accessJwt,
        refreshJwt: this.agent.session.refreshJwt,
      };
    } catch (error) {
      console.error('BlueSky authentication error:', error);
      throw new Error(error.message || 'Failed to authenticate with BlueSky');
    }
  }

  /**
   * Validates that a BlueSky account exists
   * @param {string} username - BlueSky username
   * @returns {Promise<boolean>} - Whether the account exists
   */
  async validateAccount(username) {
    try {
      console.log(`Validating BlueSky account: ${username}`);

      // Create a temporary agent for validation
      const agent = new BskyAgent({
        service: 'https://bsky.social',
      });

      // Try to resolve the handle
      const response = await agent.resolveHandle({ handle: username });
      return !!response.data.did;
    } catch (error) {
      console.error('BlueSky account validation error:', error);
      return false;
    }
  }

  /**
   * Creates a post on BlueSky
   * @param {string} text - Content of the post
   * @param {Object} credentials - User credentials for BlueSky
   * @returns {Promise<Object>} - Created post details
   */
  async createPost(text, credentials) {
    try {
      console.log(`Creating BlueSky post for user: ${credentials.handle}`);

      // Authenticate again with the stored credentials
      const agent = new BskyAgent({
        service: 'https://bsky.social',
      });

      // If we have access and refresh tokens saved in credentials, use them
      if (credentials.accessJwt && credentials.refreshJwt) {
        console.log('Using saved session tokens for authentication');
        // Use the resumeSession method instead of direct assignment
        await agent.resumeSession({
          did: credentials.did,
          handle: credentials.handle,
          accessJwt: credentials.accessJwt,
          refreshJwt: credentials.refreshJwt,
        });
      } else {
        // Otherwise, we need to fetch the user's credentials
        console.log('No tokens available, trying to fetch from database');
        throw new Error('No authentication tokens available for this account');
      }

      // Create rich text object
      const richText = new RichText({ text });
      await richText.detectFacets(agent);

      // Create the post
      const response = await agent.post({
        text: richText.text,
        facets: richText.facets,
      });

      console.log(`Successfully created BlueSky post with URI: ${response.uri}`);

      // In a real implementation, we would fetch the actual post using its URI
      // For simplicity, we'll return the basic info
      return {
        success: true,
        id: response.uri.split('/').pop(),
        text,
        createdAt: new Date(),
        likes: 0,
        reposts: 0,
      };
    } catch (error) {
      console.error('BlueSky post creation error:', error);
      throw new Error(error.message || 'Failed to create post on BlueSky');
    }
  }
}

module.exports = new BlueSkyService();