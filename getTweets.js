// getTweets.js
import cron from 'node-cron';
import moment from 'moment'; // https://www.youtube.com/watch?v=ARvIYcoVXgI for pulling at time intervals
import api from 'axios'; // for making api requests to twitter
import { Keywords, Users, Tweets } from './models/index.js';
// Helper functions that were previously in dcp-server.js.
import { toRFC3339, getTime } from './utils.js';

async function storeTweetsinMongo(kw, data, currentDT) {
  if (!data) {
    console.log("No data to add to DB for", kw.kw_string);
  } else {
    console.log("Storing tweets in DB...");
    const tweetsData = data.map(tweet => ({
      post_date: currentDT.utc(),
      created_at: moment(tweet.created_at),
      text: tweet.text,
      query_kw: kw.kw_string,
      tweet_id: tweet.id,
      author_id: tweet.author_id,
      convo_id: tweet.conversation_id,
    }));
    try {
      await Tweets.insertMany(tweetsData, { ordered: false })
        .catch(err => {
          const numInserted = err.result.result.nInserted;
          if (numInserted > 0) {
            console.log(`${kw.kw_string}: ${numInserted} tweets were inserted into Mongo.`);
          } else {
            console.log("No tweets were inserted into the database for", kw.kw_string);
          }
        });
    } catch (err) {
      console.log(err);
    }
  }
}

const twtrEndpoint = `https://api.twitter.com/2/tweets/search/recent`;

export function scheduleGetTweets(mode, authToken) {
  return cron.schedule(`10 */${mode === "widenet" ? 10 : 5} * * * *`, async () => {
    const currentDT = moment();
    console.log("Gathering new tweets...", moment().format('MMM Do hh:mm:ss'));

    // Get Keywords and VIP Authors from Mongo
    const kws = await Keywords.find({}).catch(err => console.log("Error getting keywords:\n", err));
    console.log("Running tweet pull on mode", mode);

    const vipUsers = await Users.find({ vip: true }).catch(err => {
      console.log("Error getting VIP users:\n", err);
    });
    if (!vipUsers) {
      console.error("There was an error getting VIP users.");
      return;
    }
    const ugString = vipUsers.map(user => user.username.substring(1)).join(" OR from:");

    // Query Twitter API for each keyword
    for (const kw of kws) {
      console.log(`KEYWORD: ${kw.kw_string} TWEET COLLECTION:`);
      const myQuery = mode === "widenet"
        ? `(${kw.kw_string}) -is:retweet`
        : `(${kw.kw_string}) (from:${ugString}) -is:retweet`;
      try {
        console.log("Getting new tweets...");
        // console.log(`Query: ${myQuery}`); // for logging query
        const newTweets = await api.get(twtrEndpoint, {
          headers: {
            'Authorization': authToken
          },
          params: {
            query: myQuery,
            start_time: toRFC3339(getTime("hour")),
            end_time: toRFC3339(getTime("minute")),
            'tweet.fields': 'created_at,text,author_id,conversation_id,public_metrics',
            max_results: 100
          }
        }).catch(err => console.log(err.response));
        console.log(newTweets.data);
        console.log(`Query: ${kw.kw_string} ${ugString}`);
        const newTweetBatch = newTweets.data.data ? newTweets.data.data.length : `There were no tweets for ${kw.kw_string} from Twitter.`;
        console.log(`NEW TWEETS: ${newTweetBatch}`);
        // Store tweets in Mongo
        await storeTweetsinMongo(kw, newTweets.data.data, currentDT);
      } catch (err) {
        console.log("There was an error when trying to obtain new tweets:");
        console.log(err.response ? err.response.data.errors : err);
      }
    }
  });
}