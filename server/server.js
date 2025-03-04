require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");
const { connectDB } = require("./config/database");
const cors = require("cors");

// Add this line along with other route imports
const accountRoutes = require('./routes/accountRoutes');
const twitterAccountRoutes = require('./routes/twitterAccountRoutes'); // New route import
const blueskyAccountRoutes = require('./routes/blueskyAccountRoutes.js'); // New route import
const accountLinkRoutes = require('./routes/accountLinkRoutes.js'); // New route import
const postRoutes = require('./routes/postRoutes'); // New route import for post routes
const schedulerService = require('./services/schedulerService'); // Scheduler service import

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;
// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

app.use(cors({}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication routes
app.use(authRoutes);

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Basic Routes
app.use(basicRoutes);
app.use('/api/auth', authRoutes);

// Connect the existing account routes
app.use('/api/accounts', accountRoutes);
// Use the new Twitter account routes
app.use('/api/accounts/twitter', twitterAccountRoutes); // New route setup
app.use('/api/accounts/bluesky', blueskyAccountRoutes); // New route setup
app.use('/api/accounts', accountLinkRoutes); // New route setup
app.use('/api/posts', postRoutes); // New route setup for post routes

// Database connection
connectDB().then(() => {
  console.log('Database connected successfully');
  // Start schedulers after database is connected
  schedulerService.startAutoRepostScheduler();
  // Emit the ready event
  app.emit('ready');
}).catch(err => {
  console.error('Failed to connect to database:', err);
});

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

process.on('SIGINT', () => {
  console.log('Shutting down schedulers...');
  schedulerService.stopAll();
  console.log('Closing server...');
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});