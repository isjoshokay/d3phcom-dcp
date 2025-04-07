import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.Types.ObjectId

// Create model for a tweet from test query

export default mongoose.model('peoplehistoricalvalues', {
    author_id: {
        type: String,
        required: true
    },
    post_date: {
        type: Date,
        required: true
    },
    name: {
        type: String
    },
    description: {
        type: String
    },
    tweet_count: {
        type: Number
    },
    followers_count: {
        type: Number
    },
    following_count: {
        type: Number
    },
    listed_count: {
        type: Number
    },
    verified: {
        type: Boolean
    },
    protected: {
        type: Boolean
    }
})
