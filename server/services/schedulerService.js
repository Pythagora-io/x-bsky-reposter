const cron = require('node-cron');
const postService = require('./postService');
const User = require('../models/User');
const AccountLink = require('../models/AccountLink');

/**
 * SchedulerService
 * Handles all scheduled jobs for the application
 */
class SchedulerService {
  constructor() {
    this.jobs = {};
  }

  /**
   * Start the automatic repost scheduler
   */
  startAutoRepostScheduler() {
    console.log('Starting automatic Twitter -> BlueSky repost scheduler');

    // Schedule job to run every minute
    this.jobs.autoRepost = cron.schedule('* * * * *', async () => {
      try {
        console.log('Running auto-repost job: ' + new Date().toISOString());

        // Find all users with linked accounts
        const users = await User.find({
          twitterAccounts: { $exists: true, $not: { $size: 0 } },
          blueskyAccounts: { $exists: true, $not: { $size: 0 } }
        });

        console.log(`Found ${users.length} users with Twitter and BlueSky accounts`);

        // For each user, find and process new posts
        for (const user of users) {
          try {
            await postService.processNewPostsForUser(user._id);
          } catch (userError) {
            console.error(`Error processing posts for user ${user._id}:`, userError);
            // Continue with next user
          }
        }
      } catch (error) {
        console.error('Error in auto-repost scheduler:', error);
      }
    });

    console.log('Auto-repost scheduler started successfully');
    return this.jobs.autoRepost;
  }

  /**
   * Stop all schedulers
   */
  stopAll() {
    Object.values(this.jobs).forEach(job => {
      if (job && typeof job.stop === 'function') {
        job.stop();
      }
    });
    console.log('All scheduled jobs stopped');
  }
}

module.exports = new SchedulerService();