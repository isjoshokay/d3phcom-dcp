import mongoose from 'mongoose'

let BlogModel = mongoose.model('blogpost', {
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

export default BlogModel