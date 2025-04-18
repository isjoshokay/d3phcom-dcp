const ObjectId = mongoose.Schema.Types.ObjectId
import mongoose from 'mongoose'

// Average Creator Expert Value
const ACEV = mongoose.model('ACEV', {
    author_id: {
        type: String,
        required: true
    }, // Author from Twitter (tweet maker) 
    CEV: {
        type: Number,
        required: true,
        default: 5
    }, // Value of CEV (default 5)
})
const BlogModel = mongoose.model('blogpost', {
    date: {
        type: String,
        required: true
    }, 
    title: {
        type: String,
        required: true
    },
    text: { // use <img> to place images in text (to be replaced in client)
        type: String,
        required: true
    }, // <bold /> <ital /> <img> 
    images: { // pass in an array of links
        type: [String],
    },
    isSignificant: { // if true, the post has a different style to indicate significance
        type: Boolean,
        default: false
    }
})
const HistVals = mongoose.model('final_historical_values', {
    post_date: {
        type: Date,
        required: true
    },
    kw_string: { // no longer utilized as all keywords influence scoring a single gauge.
        type: String
    },
    tkwv: { // tweet keyword val, no longer utilized as all keywords influence scoring a single gauge.
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
    final_gauge_score: {
        type: Number,
        required: true
    },
    evacuation_recommendation: {
        type: String
    },
    tagline: { // subject_text from the AI sentiment object returned from OpenAI
        type: String
    },
    influence_tweet_ids: {
        type: [String] // tweet ids that influenced the score
    }
})
const Keywords = mongoose.model('keywords', {
    kw_string: {
        type: String,
        required: true
    }, // String that user requests to ping API for
    rkwv: {
        type: Number,
        required: true
    }, // relative keyword value // will use AI once we are on our feet. Current data is rudimentary
    kw_creator: {
        type: String,
        default: 'freddie'
    }, // Once we add user functionality this will be usernames
    post_date: {
        type: Date,
        required: true
    }
})
const PHV = mongoose.model('peoplehistoricalvalues', {
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
const THV = mongoose.model('tweethistoricalvalues', {
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
const Tweets = mongoose.model('tweets', {
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
const Users = mongoose.model('tw_users', {
    post_date: {
        type: Date
    },
    author_id: {
        type: String,
        index: true,
        unique: true
    },
    username: {
        type: String
    },
    name: {
        type: String
    },
    cev: {
        type: Number,
        default: 20 // max 40
    },
    created_at: {
        type: String
    },
    vip: {
        type: Boolean,
        default: false,
        required: true
    },
    profile_image_url: {
        type: String
    }
})


// Export all models
export { BlogModel, HistVals, Keywords, PHV, THV, Tweets, Users }
