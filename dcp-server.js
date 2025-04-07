import moment from 'moment' // for date/time
import cron from 'node-cron' // https://www.youtube.com/watch?v=ARvIYcoVXgI for pulling at time intervals
import api from 'axios' // for making api requests to twitter
import dotenv from 'dotenv' // for proprietary variables
dotenv.config()
const PORT = process.env.PORT || 3000 // for communicating between server and fe websocket
import express from 'express'
const app = express();
import http from 'http'
const server = http.createServer(app)
import cors from 'cors'
import mongoose from 'mongoose'
// All mongo models used below
import Tweets from './models/Tweets.js'
import THV from './models/TweetHistoricalValues.js'
import Users from './models/twitter_users.js'
import PHV from './models/PeopleHistoricalValues.js'
import HistVals from './models/HistoricalValues.js' 
import Keywords from './models/Keywords.js'
const twtrUserEndpoint = `https://api.twitter.com/2/users/`
const twtrEndpoint = `https://api.twitter.com/2/tweets/search/recent`
// const sgEndpoint = `httpsL//api.sendgrid.com/v3/mail/send`
// OpenAI / GPT API
// const {Configuration, OpenAI} = require('openai')
import OpenAI from 'openai'

// Sendgrid for sending emails
// const sendEmail = require('@sendgrid/mail')
import sendEmail from '@sendgrid/mail'
sendEmail.setApiKey(process.env.SENDGRID_API_KEY)

// spear fishing or wide net?
let mode = "spearfishing"
let gauge = 0.0



// Configure CORS middleware to allow requests from specified origins and methods
app.use(cors({
    origin: ["https://d3ph.com", "http://localhost:3000", "d3phcom-live.vercel.app"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}))
// Socket.io
// Web sockets (test version will has different origin)
let numOfUsers = 0;
import {Server} from 'socket.io'
const io = new Server(server, {
    cors: {
      origin: ["https://d3ph.com", "http://localhost:3000", "d3phcom-live.vercel.app"],
      methods: ["GET", "POST"],
      transports: ['websocket', 'polling']
    //   origin: ["http://localhost:3000"]
      // https://www.youtube.com/watch?v=xUqvXaiCmHI <-- for going live on cpanel
    },
    
  })
  async function getKws(){
    let fe_kws = await Keywords.find({}, 'kw_string')
    return fe_kws
  }

  io.on('connection', async socket => {
    numOfUsers += 1
    console.log('New Client Connection detected:', socket.id, numOfUsers, 'user(s) online')
    socket.emit('mode', mode)
    
    // send last 100 objects in the hvals array to client 
    let hvals = await HistVals.find()
    .sort({post_date: -1}).limit(1000)

    socket.on('disconnect', () => {
      console.log('Content Delivery Server Disconnected. Something is wrong.')
    })

  })

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
  })

  // Add error handling to catch any uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

  async function getNewUsers(userString) {
    console.log("Getting new user(s)...")
    try {
        const userData = await api.get(twtrUserEndpoint, {
            headers: {
                'Authorization' : process.env.BT
            }, 
            params: {
                'ids': `${userString}`, // change ids to get different users
                'user.fields': 'id,username,name,description,public_metrics,created_at,profile_image_url,verified,protected'
            }
        })
        const newUsers = userData.data.data
        let userNames = ' '
        for(const user of newUsers) {
            let found = await Users.findOne({author_id: user.id})
            if (!found) {
                console.log("New user detected:", user.username)
                userNames+= user.username
                const pm = user.public_metrics
                await Users.create({
                    post_date: moment.now(),
                    author_id: user.id,
                    username: '@'+user.username,
                    name: user.name,
                    created_at: moment(user.created_at),
                    vip: true,
                    profile_image_url: user.profile_image_url
                }).catch(err => console.log(err))
                await PHV.create({
                    post_date: moment.now(),
                    author_id: user.id,
                    name: user.name,
                    description: user.description,
                    tweet_count: pm.tweet_count,
                    followers_count: pm.followers_count,
                    following_count: pm.following_count,
                    listed_count: pm.listed_count,
                    verified: user.verified,
                    protected: user.protected
                }).catch(err => console.log(err))
            } else {
                console.log("User already exists:", user.username)
                userNames+= user.username + ' (already exists, vip updated to true)'
                Users.updateOne({author_id: user.id}, {vip: true}).catch(err => console.log(err))
                
            }
        }
        console.log("Finished gathering new user(s)")
        return userNames
    } catch (err) {
        console.log(err)
        return err
    }
    
}

// Connect to MDB, everything happens within the domain of connection
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true, useUnifiedTopology: true
    }).then(() => {
        console.log("Connected to MongoDB on", moment().format('MMM Do hh:mm:ss'))
    }).catch(err => {
        console.log("Could not connect to MongoDB", err)
    })
    function toRFC3339(date) {
        return date.toISOString();
    } 
    function getTime(limit){
        const now = new Date()
        let result = new Date(now)
        if (limit == "hour"){
            result.setHours(now.getHours() - 1)
        } else if (limit == "minute"){
            result.setMinutes(now.getMinutes() - 1)
        }
        return result
    }
    async function storeTweetsinMongo(kw, data, currentDT){ // for use in tweet pull
        // data is a batch of tweets for a specific keyword.
        if(!data){
            console.log("No data to add to DB for", kw.kw_string)
        } else {
            console.log("Storing tweets in DB...")
            let tweetsData = data.map(tweet => {
                return {
                  post_date: currentDT.utc(),
                  created_at: moment(tweet.created_at),
                  text: tweet.text,
                  query_kw: kw.kw_string,
                  tweet_id: tweet.id,
                  author_id: tweet.author_id,
                  convo_id: tweet.conversation_id,
                }
              })
              let THVData = data.map(tweet => {
                return {
                  tweet_id: tweet.id,
                  post_date: currentDT.utc(),
                  retweet_count: tweet.public_metrics.retweet_count,
                  reply_count: tweet.public_metrics.reply_count,
                  like_count: tweet.public_metrics.like_count,
                  quote_count: tweet.public_metrics.quote_count,
                  impression_count: tweet.public_metrics.impression_count
                }
              })
            try{
                await Tweets.insertMany(tweetsData, {ordered: false})
                  .catch(err => {
                    let numInserted = err.result.result.nInserted
                    if (numInserted > 0){
                      console.log(`${kw.kw_string}: ${numInserted} tweets were inserted into Mongo.`)
                    } else {
                        console.log("No tweets were inserted into the database for", kw.kw_string)
                    }
                  })
                await THV.insertMany(THVData, {ordered: false})
                    .catch(err => {console.log(err)}) 
                }catch(err){
                    console.log(err)
            }
            
        }
    }
    
const getTweets = cron.schedule(`*/${mode == "widenet" ? 10 : 5} * * * *`, async () => { // every three minutes with specific users, every 10 minutes for everyone. 
    let currentDT = moment()
    const now = new Date()
    console.log("Gathering new tweets...", moment().format('MMM Do hh:mm:ss'))

    // Get Keywords and VIP Authors from Mongo
    let kws = await Keywords.find({}).catch(err => console.log("Error getting keywords: \n", err))
    
    console.log("Running tweet pull on mode", mode)
    let vipUsers = await Users.find({vip: true}).catch(err => {
        console.log("Error getting VIP users: \n", err)
    })

    if (!vipUsers){
        console.error("No VIP users found in Mongo.")
        return
    }

    let ugString = vipUsers.map(user => user.username.substring(1)).join(" OR from:"); 
    

    // Query Twitter API
    
    
    for (const kw of kws) {
        
        // Grab Tweets from Twitter based on Keyword
        console.log(`KEYWORD: ${kw.kw_string} TWEET COLLECTION:`)
        let myQuery = mode == "widenet" ? `(${kw.kw_string}) -is:retweet` : `(${kw.kw_string}) (from:${ugString}) -is:retweet` // VIP users without retweets
        try { 
            console.log("Getting new tweets...")
            console.log(`users: ${myQuery}`)
            let newTweets = await api.get(twtrEndpoint, {
                
                headers: {
                'Authorization': process.env.BT
                }, 
                params: {
                query: myQuery,
                start_time: toRFC3339(getTime("hour")),
                end_time: toRFC3339(getTime("minute")),
                'tweet.fields': 'created_at,text,author_id,conversation_id,public_metrics',
                // 'media.fields': `type:photo,url,preview_`,
                // 'user.fields': `id,username`,
                max_results: 100
                }
                
                
            }).catch(err => console.log(err.response))
            console.log(newTweets.data)
            console.log(`Query:${kw.kw_string} ${ugString}`) // Shows full query being sent to twitter for the kw (ONLY FOR VIP CONSTRAINT)
        let newTweetBatch = newTweets.data.data ? newTweets.data.data.length : ["There were no tweets for", kw.kw_string, "from Twitter."]
        console.log(`NEW TWEETS:\n`, newTweetBatch) // params returned from newTws: status,statusText,headers,config,request,data
        // inside the data param is another data param to pull data.

        // Clean Data and Store in MDB (Tweets)
        storeTweetsinMongo(kw, newTweets.data.data, currentDT) 
        } catch (err) {
            console.log("There was an error when trying to obtain new tweets:")
            console.log(err.response ? err.response.data.errors : err)
        }
    }
    
    // new function end
    // Gather average sentiment based on Tweet text & Store in MDB Final Gauge
    // Determine whether or not an alert needs to be sent (get score threshold)    

})
const evaluateSentiment = cron.schedule("*/20 * * * *", async () => {
    console.log(`
    ________________________________
    Performing Sentiment Analysis...
    `)
    // Grab all tweets from the recent tweet pull from MongoDB
    
    try {
        const now = moment().utc()
        const thirtyMinutesAgo = moment(now).utc().subtract(30, "minutes").toDate()
        console.log(`Thirty minutes ago: ${thirtyMinutesAgo}`)
        
        let recentTweets = await Tweets.find({
        post_date: {
            $gte: thirtyMinutesAgo
        }
        }).catch(err => console.log(err))
        console.log(`${recentTweets.length} tweets were added to Mongo in the last 30 minutes.`)
        // Batched request of tweets, prompt for sentiment analysis
        // let batchedTweetText = ""
        // Strip the links out of the text for sending to GPT
        const urlRegex = /https?:\/\/\S+/g;
        recentTweets = recentTweets.map(tweet => {
            tweet = tweet.text.replace(urlRegex, '')
            return `{-${tweet}-}`
        })
        let batchedTweetText = recentTweets.join('\n')
        console.log(`
            TWEET BATCH 
            ${batchedTweetText}
        `)

        // Configure GPT object and request SA
        const gpt = new OpenAI({apiKey: process.env.GPTKEY});

        const gptCall = await gpt.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role: "system", content: `You are receiving a batch of tweets (posts) about war in Taiwan or China. The tweets are separated by braces with dashes inside like this: {-text-}.

Return a parseable JSON object with **four attributes**:

1. **evacuation_recommendation** – A 1–2 sentence reasoning about the overall sentiment and whether someone living near Taiwan should evacuate, based on recent context and the Defcon standard.
   
2. **influential_tweets** – Up to 5 sentences explaining which tweets most heavily influenced the sentiment score and why.

3. **average_sentiment_value** – A number from 0 to 10 representing the average sentiment across all tweets. Higher values mean the situation is more dangerous:
   - 10 = Extremely serious (e.g., bombs dropping, confirmed casualties today)
   - 5–6.9 = Situation is getting serious, but no confirmed action yet
   - Ignore distant-past events; focus on **recent** (today's) tweets only.

4. **email_subject_line** – A short subject line (10 words or fewer) for an alert email summarizing the recommended action.

Ensure the output is valid JSON.`},
                    {role: "user", content: batchedTweetText}
                    ]
        })
        console.log("GPT RESULT:\n____________\n")
        gauge = gptSentiment.average_sentiment_value
        try {
            if (gptSentiment.average_sentiment_value >= 8.5) {
                console.log("Sending E-Mail...")
                const message = {
                    to: [{email: 'findfreddy@icloud.com'}, {email: 'jpcoder12@gmail.com'}],
                    from: 'myanon808@gmail.com',
                    subject: `${gptSentiment.email_subject_line}`,
                    text: `${gptSentiment.evacuation_recommendation}`,
                    html: `<h1>The gauge has reached a score of ${gptSentiment.average_sentiment_value}.</h1>
                            <p>${gptSentiment.evacuation_recommendation}</p><br></br>
                            <p>${gptSentiment.influential_tweets}</p>
                            <p>${recentTweets}</p>
                            `
                }
                await sendEmail.send(message).then(response => console.log('Email Sent!\n', response)).catch(err => console.log(err))
            } else {
                console.log("No email will be sent because the sentiment is at a safe level.")
            }
        } catch (err) {
            console.log(err)
        }
        // add final gauge to hist vals w freddy 
        await HistVals.create({
            final_gauge: gauge,
            post_date: now,
            recommendation: gptSentiment.evacuation_recommendation
        })
        
    } catch(err){
        console.log(err)
    }

})


