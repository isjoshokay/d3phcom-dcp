import mongoose from 'mongoose'

let peopleModel = mongoose.model('tw_users', {
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

export default peopleModel