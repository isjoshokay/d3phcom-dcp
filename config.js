
import dotenv from 'dotenv';
dotenv.config();

export default {
  PORT: process.env.PORT || 3000,
  MONGODB_URL: process.env.MONGODB_URL,
  TWITTER_BEARER: process.env.BT,
  GPT_KEY: process.env.GPTKEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  TWITTER_ENDPOINTS: {
    tweets: `https://api.twitter.com/2/tweets/search/recent`,
    users: `https://api.twitter.com/2/users/`
  },
  // Add any other configuration items here
};