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
import { scheduleGetTweets } from './getTweets.js'; // getTweets function
import { scheduleEvaluateSentiment } from './evaluate_sentiment.js'; // evaluate_sentiment function

// Sendgrid for sending emails
// const sendEmail = require('@sendgrid/mail')
import sendEmail from '@sendgrid/mail'
sendEmail.setApiKey(process.env.SENDGRID_API_KEY)

// spear fishing or wide net?
let mode = "spearfishing"
let gauge = 0.0



// Configure CORS middleware to allow requests from specified origins and methods
app.use(cors({
    origin: ["https://d3phcom.herokuapp.com/", "http://localhost:3000"], // only allowable from the content devlivery server
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
    console.log('Connected to Content Delivery Server:', socket.id)
    socket.emit('mode', mode)
    socket.on('disconnect', () => {
      console.log('Content Delivery Server Disconnected. Something went wrong.')
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
// Connect to MDB, everything happens within the domain of connection
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true, useUnifiedTopology: true
    }).then(() => {
        console.log("DCP Server Connected to MongoDB on", moment().format('MMM Do hh:mm:ss'))
    }).catch(err => {
        console.log("DCP Server Could not connect to MongoDB", err)
    })
const getTweetsJob = scheduleGetTweets(mode, process.env.BT);
const evaluateSentimentJob = scheduleEvaluateSentiment();


