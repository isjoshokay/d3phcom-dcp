import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.Types.ObjectId

// Create model for a tweet from test query

export default mongoose.model('tweethistoricalvalues', {
    tweet_id: {
        type: String
    },
    post_date: {
        type: Date,
        required: true
    },
    retweet_count: {
        type: Number,
        required: true
    },
    reply_count: {
        type: Number,
        required: true 
    },
    like_count: {
        type: Number,
        required: true
    },
    quote_count: {
        type: Number,
        required: true
    },
    impression_count: {
        type: Number,
        required: true
    }
})

