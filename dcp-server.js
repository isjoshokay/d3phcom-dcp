import moment from 'moment' // for date/time
import config from './config.js'
const PORT = config.PORT // for communicating between server and fe websocket
import express from 'express'
const app = express();
import http from 'http'
const server = http.createServer(app)
import cors from 'cors'
import mongoose from 'mongoose'
import cron from 'node-cron'
import { scheduleGetTweets } from './getTweets.js'; // getTweets function
import { scheduleEvaluateSentiment } from './evaluate_sentiment.js'; // evaluate_sentiment function
// https://www.youtube.com/watch?v=xUqvXaiCmHI <-- for going live on cpanel
let mode = "spearfishing"
// Toggle mode variable between "spearfishing" and "widenet" once per day
cron.schedule('0 0,2 * * *', () => {
    if (mode === "spearfishing") {
        mode = "widenet"
    } else {
        mode = "spearfishing"
    }
    console.log(`Mode set to ${mode}`)
})
// Configure CORS middleware to allow requests from specified origins and methods
app.use(cors({
    origin: ["https://d3phcom.herokuapp.com/"], // only allowable from the content delivery server (add localhost for testing)
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}))

// Web sockets (test version will have different origin)
import {Server} from 'socket.io'
const io = new Server(server, {
    cors: {
      origin: ["https://d3ph.com", "http://localhost:3000", "https://d3phcom-live.vercel.app"],
      methods: ["GET", "POST"],
      transports: ['websocket', 'polling']
    },
  })
  io.on('connection', async socket => {
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
    useNewUrlParser: true,
    }).then(() => {
        console.log("DCP Server Connected to MongoDB on", moment().format('MMM Do hh:mm:ss'))
        const getTweetsJob = scheduleGetTweets(mode, process.env.BT); // getTweets.js
        const evaluateSentimentJob = scheduleEvaluateSentiment(); // evaluate_sentiment.js
    }).catch(err => {
        console.log("DCP Server Could not connect to MongoDB:\n", err)
    })


