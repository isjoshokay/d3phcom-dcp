import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.Types.ObjectId

// Create model for a tweet from test query

export default mongoose.model('final_historical_values', {
    post_date: {
        type: Date,
        required: true
    },
    kw_string: {
        type: String
    },
    tkwv: { // tweet keyword val
        type: Number
    },
    tweet_count_score: { // number of tweets pulled
        type: Number
    },
    acev: {// avg creator expert value
        type: Number,
        default: 5
    }, 
    retweet_score: {
        type: Number
    },
    like_score: {
        type: Number
    },
    impression_score: {
        type: Number
    },
    final_gauge: {
        type: Number,
        required: true
    },
    sentiment_analysis: {
        type: String
    }
})