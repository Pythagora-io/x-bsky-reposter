import api from './api';

// Description: Get current user's Twitter accounts
// Endpoint: GET /api/accounts/twitter
// Request: {}
// Response: { accounts: Array<{ id: string, username: string, name: string, profileImage: string, isConnected: boolean, createdAt: string }> }
export const getTwitterAccounts = async () => {
  try {
    const response = await api.get('/api/accounts/twitter');
    return { accounts: response.data.twitterAccounts.map(account => ({
      id: account.id,
      username: account.username,
      name: account.name,
      profileImage: account.profileImage,
      isConnected: account.isConnected,
    })) };
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get current user's BlueSky accounts
// Endpoint: GET /api/accounts/bluesky
// Request: {}
// Response: { accounts: Array<{ id: string, username: string, name: string, profileImage: string, isConnected: boolean, createdAt: string }> }
export const getBlueskyAccounts = async () => {
  try {
    const response = await api.get('/api/accounts/bluesky');
    return {
      accounts: response.data.accounts.map(account => ({
        id: account.id, // Keeping 'id' for frontend consistency
        username: account.username,
        name: account.name,
        profileImage: account.profileImage,
        isConnected: account.isConnected,
      }))
    };
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get all connected accounts
// Endpoint: GET /api/accounts
// Request: {}
// Response: { twitterAccounts: Array<Account>, blueskyAccounts: Array<Account> }
export const getAccounts = async () => {
  try {
    const response = await api.get('/api/accounts');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Connect a Twitter account using auth code
// Endpoint: POST /api/accounts/twitter/connect
// Request: { authCode: string }
// Response: { success: boolean, message: string, account: { id: string, username: string, name: string, profileImage: string, isConnected: boolean } }
export const connectTwitterAccount = async (authCode: string) => {
  try {
    const response = await api.post('/api/accounts/twitter/connect', { authCode });
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Connect a BlueSky account using credentials
// Endpoint: POST /api/accounts/bluesky/connect
// Request: { identifier: string, password: string }
// Response: { success: boolean, account: { id: string, username: string, name: string, profileImage: string, isConnected: boolean, createdAt: string } }
export const connectBlueskyAccount = async (data: { identifier: string; password: string }) => {
  try {
    const response = await api.post('/api/accounts/bluesky/connect', data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get all current user's accounts (Twitter and BlueSky)
// Endpoint: GET /api/accounts
// Request: {}
// Response: { twitterAccounts: Array<...>, blueskyAccounts: Array<...> }
export const getAllAccounts = async () => {
  try {
    const response = await api.get('/api/accounts');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Link Twitter account to BlueSky account
// Endpoint: POST /api/accounts/link
// Request: { twitterAccountId: string, blueskyAccountId: string }
// Response: { success: boolean, message: string }
export const linkAccounts = async (data: { twitterAccountId: string; blueskyAccountId: string }) => {
  try {
    const response = await api.post('/api/accounts/link', data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};