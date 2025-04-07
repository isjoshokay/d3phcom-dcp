import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.Types.ObjectId

// Create model for a tweet from test query
export default mongoose.model('keywords', {
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