import api from './api';

// Description: Get Twitter (X) posts with matching BlueSky posts
// Endpoint: GET /api/posts
// Request: {}
// Response: { posts: Array<{ id: string, twitterPost: { id: string, text: string, createdAt: string, likes: number, retweets: number, account: { id: string, username: string, name: string, profileImage: string } }, blueskyPost: { id: string, text: string, createdAt: string, likes: number, reposts: number } | null }> }
export const getPosts = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        posts: [
          {
            _id: '1',
            twitterPost: {
              id: 't1',
              text: 'Just launched our new product! Check it out at example.com #newlaunch',
              createdAt: '2023-06-15T12:30:00Z',
              likes: 42,
              retweets: 12,
              account: {
                id: '1',
                username: '@johndoe',
                name: 'John Doe',
                profileImage: 'https://i.pravatar.cc/150?img=1',
              },
            },
            blueskyPost: {
              id: 'b1',
              text: 'Just launched our new product! Check it out at example.com #newlaunch',
              createdAt: '2023-06-15T12:31:00Z',
              likes: 18,
              reposts: 5,
            },
          },
          {
            _id: '2',
            twitterPost: {
              id: 't2',
              text: 'Beautiful day in San Francisco today! 🌞',
              createdAt: '2023-06-14T15:45:00Z',
              likes: 87,
              retweets: 23,
              account: {
                id: '1',
                username: '@johndoe',
                name: 'John Doe',
                profileImage: 'https://i.pravatar.cc/150?img=1',
              },
            },
            blueskyPost: {
              id: 'b2',
              text: 'Beautiful day in San Francisco today! 🌞',
              createdAt: '2023-06-14T15:46:00Z',
              likes: 34,
              reposts: 11,
            },
          },
          {
            _id: '3',
            twitterPost: {
              id: 't3',
              text: 'Just finished reading an amazing book. Highly recommend! #reading',
              createdAt: '2023-06-13T09:20:00Z',
              likes: 65,
              retweets: 15,
              account: {
                id: '2',
                username: '@janedoe',
                name: 'Jane Doe',
                profileImage: 'https://i.pravatar.cc/150?img=2',
              },
            },
            blueskyPost: null,
          },
          {
            _id: '4',
            twitterPost: {
              id: 't4',
              text: 'Working on some exciting new features! Stay tuned... #development',
              createdAt: '2023-06-12T18:10:00Z',
              likes: 53,
              retweets: 8,
              account: {
                id: '1',
                username: '@johndoe',
                name: 'John Doe',
                profileImage: 'https://i.pravatar.cc/150?img=1',
              },
            },
            blueskyPost: null,
          },
        ],
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/posts');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Manually repost a Twitter post to BlueSky
// Endpoint: POST /api/posts/repost
// Request: { postId: string }
// Response: { success: boolean, blueskyPost: { id: string, text: string, createdAt: string, likes: number, reposts: number } }
export const repostToBluesky = (postId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        blueskyPost: {
          id: `b${Date.now()}`,
          text: 'This is a reposted post',
          createdAt: new Date().toISOString(),
          likes: 0,
          reposts: 0,
        },
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post('/api/posts/repost', { postId });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};