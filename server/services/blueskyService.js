const axios = require('axios');

class BlueSkyService {
  constructor() {
    // In a real implementation, you'd use actual BlueSky API base URL
    this.baseUrl = 'https://bsky.social/xrpc';
  }

  /**
   * Authenticates a user with BlueSky
   * @param {string} identifier - Username or email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Authentication result with user details
   */
  async authenticate(identifier, password) {
    try {
      // In a real implementation, this would make an actual API call to BlueSky
      // For development purposes, we're mocking the authentication process

      // Mock implementation - in production this would be:
      // const response = await axios.post(`${this.baseUrl}/com.atproto.server.createSession`, {
      //   identifier,
      //   password
      // });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if credentials are valid (mock validation)
      if (identifier && password) {
        if (identifier === 'error_user') {
          throw new Error('Authentication failed');
        }

        // Generate a fake successful response
        const userId = `user-${Math.random().toString(36).substring(2, 10)}`;
        return {
          success: true,
          did: `did:plc:${userId}`,
          handle: identifier.includes('@') ? identifier.split('@')[0] : identifier,
          email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
          displayName: `${identifier.charAt(0).toUpperCase()}${identifier.slice(1).split('@')[0]}`,
          profileImage: `https://ui-avatars.com/api/?name=${identifier.split('@')[0]}&background=random`,
        };
      } else {
        throw new Error('Invalid credentials');
      }
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
      // Mock implementation - in production this would be:
      // const response = await axios.get(`${this.baseUrl}/com.atproto.identity.resolveHandle`, {
      //   params: { handle: username }
      // });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // For development, we're assuming all accounts except specific test cases are valid
      if (username === 'nonexistent_user') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('BlueSky account validation error:', error);
      return false;
    }
  }
}

module.exports = new BlueSkyService();