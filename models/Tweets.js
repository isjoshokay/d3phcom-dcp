import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.Types.ObjectId

// Create model for a tweet from test query

export default mongoose.model('tweets', {
    post_date : {
        type: Date,
        required: true
    },
    created_at: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    query_kw: {
        type: String,
        required: true
    }, // reference to the keyword in the keywords table (which keyword triggered this tweet pull?)
    tweet_id: { // from twitter
        type: String,
        index: true,
        unique: true,
        required: true
    },
    convo_id: {
        type: String,
        required: true
    },
    author_id: {
        type: String,
        required: true
    },
    // sentiment: {
    //     value: Number,
    //     magnitude: Number
    // } // will be added later :) //
})