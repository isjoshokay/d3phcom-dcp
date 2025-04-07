import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.Types.ObjectId

// Create model for a tweet from test query

export default mongoose.model('ACEV', {
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