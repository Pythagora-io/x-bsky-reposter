import api from './api';

// Description: Get Twitter accounts
// Endpoint: GET /api/accounts/twitter
// Request: {}
// Response: { twitterAccounts: Array<{ id: string, username: string, name: string, profileImage: string, connected: boolean }> }
export const getTwitterAccounts = async () => {
  try {
    const response = await api.get('/api/accounts/twitter');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get Twitter OAuth URL
// Endpoint: GET /api/accounts/twitter/auth
// Request: {}
// Response: { authUrl: string, state: string, codeVerifier: string }
export const getTwitterAuthUrl = async () => {
  try {
    const response = await api.get('/api/accounts/twitter/auth');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Connect Twitter account after OAuth
// Endpoint: POST /api/accounts/twitter/connect
// Request: { code: string, state: string, codeVerifier: string }
// Response: { account: { id: string, username: string, name: string, profileImage: string, connected: boolean } }
export const connectTwitterAccount = async (params: { code: string, state: string, codeVerifier: string }) => {
  try {
    const response = await api.post('/api/accounts/twitter/connect', params);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
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

// Description: Get all linked accounts for the current user
// Endpoint: GET /api/accounts/links
// Request: {}
// Response: { success: boolean, links: Array<{_id: string, twitterAccount: Account, blueskyAccount: Account, createdAt: string}> }
export const getLinkedAccounts = async () => {
  try {
    const response = await api.get('/api/accounts/links');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Remove a link between Twitter and BlueSky accounts
// Endpoint: DELETE /api/accounts/links/:linkId
// Request: {}
// Response: { success: boolean, message: string }
export const removeAccountLink = async (linkId: string) => {
  try {
    const response = await api.delete(`/api/accounts/links/${linkId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};