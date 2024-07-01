const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    hashtags: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    viewCount: {
        type: Number,
        default: 0
    },
    viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

discussionSchema.pre('save', async function (next) {
    next();
});

module.exports = mongoose.model('Discussion', discussionSchema);