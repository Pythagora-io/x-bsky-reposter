import api from './api';

// Description: Get Twitter (X) posts with matching BlueSky posts
// Endpoint: GET /api/posts
// Request: {}
// Response: { posts: Array<{ _id: string, twitterPost: { id: string, text: string, createdAt: string, likes: number, retweets: number, account: { id: string, username: string, name: string, profileImage: string } }, blueskyPost: { id: string, text: string, createdAt: string, likes: number, reposts: number } | null }> }
export const getPosts = async () => {
  try {
    const response = await api.get('/api/posts');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Manually repost a Twitter post to BlueSky
// Endpoint: POST /api/posts/repost
// Request: { postId: string }
// Response: { success: boolean, blueskyPost: { id: string, text: string, createdAt: string, likes: number, reposts: number } }
export const repostToBluesky = async (postId: string) => {
  try {
    const response = await api.post('/api/posts/repost', { postId });
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};