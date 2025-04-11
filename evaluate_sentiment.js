// evaluate_sentiment.js
import cron from 'node-cron';
import moment from 'moment';
import OpenAI from 'openai';
import config from './config.js';
import sendEmail from '@sendgrid/mail';
sendEmail.setApiKey(config.SENDGRID_API_KEY)
import { Tweets, HistVals } from './models/index.js';

export function scheduleEvaluateSentiment() {
  return cron.schedule("*/15 * * * *", async () => {
    console.log("\n_______________________________\nPerforming Sentiment Analysis...\n");

    try {
      const now = moment().utc();
      const thirtyMinutesAgo = moment(now).utc().subtract(30, "minutes").toDate();
      console.log(`Thirty minutes ago: ${thirtyMinutesAgo}`);

      // Get all tweets added in the last 30 minutes
      let recentTweets = await Tweets.find({
        post_date: { $gte: thirtyMinutesAgo }
      }).catch(err => console.log(err));

      console.log(`${recentTweets.length} tweets were added to Mongo in the last 30 minutes.`);

      // Clean tweet texts by stripping URLs and formatting
      const urlRegex = /https?:\/\/\S+/g;
      recentTweets = recentTweets.map(tweet => {
        const cleanedText = tweet.text.replace(urlRegex, '');
        return `{-${cleanedText}-}`;
      });
      let batchedTweetText = recentTweets.join('\n');
      console.log(`TWEET BATCH:\n${batchedTweetText}`);

      // Configure GPT object and request sentiment analysis
      const gpt = new OpenAI({ apiKey: process.env.GPTKEY });
      const gptCall = await gpt.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are receiving a batch of tweets (posts) about war in Taiwan or China. The tweets are separated by braces with dashes inside like this: {-text-}.

Return a parseable JSON object with **four attributes**:

1. **evacuation_recommendation** – A 1–2 sentence reasoning about the overall sentiment and whether someone living near Taiwan should evacuate, based on recent context and the Defcon standard.
   
2. **influential_tweets** – Up to 5 sentences explaining which tweets most heavily influenced the sentiment score and why.

3. **average_sentiment_value** – A number from 0 to 10 representing the average sentiment across all tweets. The value should always be a one decimal number (i.e. 3.5). Higher values mean the situation is dangerous:
   - 10 = Extremely serious (e.g., bombs dropping, confirmed casualties today)
   - 5–6.9 = Situation is getting serious, but no confirmed action yet
   - Ignore distant-past events; focus on **recent** (today's) tweets only.

4. **email_subject_line** – A short subject line (10 words or fewer) for an alert email summarizing the recommended action.

Ensure the output is valid JSON. The number of tweets should influence the score--If there is only one or two tweets, it should negate the score, not considerably but enough to make the gauge go down. If there are many tweets, the score should increase.
Please only consider the tweets to affect the score if they pertain to war in taiwan. If it does not affect the sentiment to war in taiwan, it should not affect the score as much. Feel free to consider the current political climate in and around taiwan as
it pertains to the tweets given.`
          },
          { role: "user", content: batchedTweetText }
        ]
      });
      console.log("GPT RESULT:\n____________\n");

      // Parse GPT response and extract sentiment values
      let gptSentiment = JSON.parse(gptCall.choices[0].message.content);
      console.log(gptSentiment);
      const gauge = gptSentiment.average_sentiment_value;
      console.log(`Gauge: ${gauge}`);

      // Send an email if the gauge exceeds the threshold
      try {
        if (gauge >= 8.5) {
          console.log("Sending E-Mail...");
          const message = {
            to: [{ email: 'findfreddy@icloud.com' }, { email: 'jpcoder12@gmail.com' }],
            from: 'myanon808@gmail.com',
            subject: `${gptSentiment.email_subject_line}`,
            text: `${gptSentiment.evacuation_recommendation}`,
            html: `<h1>The gauge has reached a score of ${gauge}.</h1>
                   <p>${gptSentiment.evacuation_recommendation}</p><br>
                   <p>${gptSentiment.influential_tweets}</p>
                   <p>${batchedTweetText}</p>`
          };
          await sendEmail.send(message)
            .then(response => console.log('Email Sent!\n', response))
            .catch(err => console.log(err));
        } else {
          console.log("No alert will be sent because the sentiment is at a safe level.");
        }
      } catch (err) {
        console.log(err);
      }

      // Save the gauge and recommendation to the Historical Values collection
      await HistVals.create({
        final_gauge_score: gauge,
        post_date: now,
        evacuation_recommendation: gptSentiment.evacuation_recommendation,
        tagline: gptSentiment.email_subject_line
      });
    } catch (err) {
      console.log(err);
    }
  });
}