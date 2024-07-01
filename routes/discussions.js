const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussions');
const Comment = require('../models/Comments');
const verifyJWT = require('../config/auth.js')

router.post('/', async (req, res) => {
    const { text, image, hashtags } = req.body;
    const createdBy = req.user.userId;

    const newDiscussion = new Discussion({
        text,
        image,
        hashtags,
        createdBy
    });

    try {
        const savedDiscussion = await newDiscussion.save();
        res.status(201).json(savedDiscussion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', async (req, res) => {
    const { text, image, hashtags } = req.body;
    const discussionId = req.params.id;
    const updates = { text, image, hashtags };
    const options = { new: true };
    const userId = req.user.userId;

    try {
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }
        if (discussion.createdBy.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this discussion' });
        }
        const updatedDiscussion = await Discussion.findByIdAndUpdate(discussionId, updates, options);

        res.json(updatedDiscussion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/:id', async (req, res) => {
    const discussionId = req.params.id;


    try {
        const deletedDiscussion = await Discussion.findByIdAndDelete(discussionId);
        if (!deletedDiscussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }
        res.json({ message: 'Discussion deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    const discussionId = req.params.id;
    const userId = req.user.userId;

    try {
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }
        const hasViewed = discussion.viewedBy.some(viewerId => viewerId.toString() === userId);

        if (!hasViewed) {
            console.log(discussion.viewCount)
            discussion.viewedBy.push(userId);
            discussion.viewCount = discussion.viewCount + 1;
            await discussion.save();
        }

        res.json(discussion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/tags/:tags', async (req, res) => {
    const { tags } = req.params;
    const tagsArray = tags.split(',');

    try {
        console.log(tagsArray)
        const discussions = await Discussion.find({ hashtags: { $in: tagsArray } });
        res.json(discussions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/search/:text', async (req, res) => {
    const { text } = req.params;
    const searchQuery = {
        $or: [
            { text: { $regex: text, $options: 'i' } },
            { hashtags: { $in: text.split(',') } }
        ]
    };

    try {
        const discussions = await Discussion.find(searchQuery).populate('createdBy', 'name');
        res.json(discussions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:discussionId/comments', async (req, res) => {
    const { text } = req.body;
    const discussionId = req.params.discussionId;
    const userId = req.user.id;

    try {
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        const newComment = new Comment({
            text,
            discussion: discussionId,
            createdBy: userId
        });

        const savedComment = await newComment.save();
        discussion.comments.push(savedComment._id);
        await discussion.save();

        res.status(201).json(savedComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:discussionId/comments', async (req, res) => {
    const discussionId = req.params.id;

    try {
        const comments = await Comment.find({ discussion: discussionId }).populate('createdBy', 'name');
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/:discussionId/like', async (req, res) => {
    const { discussionId } = req.params;
    const currentUserId = req.user.userId;

    try {
        const discussion = await Discussion.findById(discussionId)

        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        if (discussion.likes.includes(currentUserId)) {
            return res.status(400).json({ message: 'Already liked this discussion' });
        }
        discussion.likes.push(currentUserId);
        await discussion.save();

        res.json({ message: 'Liked discussion successfully!', discussion });
    } catch (error) {
        console.error('Error liking discussion:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/:discussionId/comment', async (req, res) => {
    const { discussionId } = req.params;
    const { text } = req.body;
    const currentUserId = req.user.userId;

    try {
        const discussion = await Discussion.findById(discussionId);

        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        const newComment = new Comment({ text: text, createdBy: currentUserId, discussion: discussionId });
        await newComment.save();

        discussion.comments.push(newComment._id);
        await discussion.save();
        const comment = await Comment.findById(newComment._id)

        res.json({ message: 'Comment created successfully!', comment });
    } catch (error) {
        console.error('Error creating comment:', error.message);
        res.status(500).json({ message: 'Server error' });
    }

});
router.put('/comments/:commentId/like', async (req, res) => {
    const { commentId } = req.params;
    const currentUserId = req.user.userId;

    try {
        const comment = await Comment.findById(commentId)

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.likes.includes(currentUserId)) {
            return res.status(400).json({ message: 'Already liked this comment' });
        }

        comment.likes.push(currentUserId);
        await comment.save();

        res.json({ message: 'Liked comment successfully!', comment });
    } catch (error) {
        console.error('Error liking comment:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const currentUserId = req.user.userId;
    const { text } = req.body;

    try {
        const comment = await Comment.findById(commentId)

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.createdBy.toString() !== currentUserId) {
            return res.status(401).json({ message: 'Unauthorized to modify this comment' });
        }

        if (text) {
            comment.text = text;
        }
        await comment.save();

        res.json({ message: 'Comment modified successfully!' });
    } catch (error) {
        console.error('Error deleting or modifying comment:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/comments/:commentId/replies', async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;
    const currentUserId = req.user.userId;

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const newReply = new Comment({ text, createdBy: currentUserId, discussion: comment.discussion, replyTo: commentId });
        await newReply.save();
        comment.replies.push(newReply._id);
        await comment.save();
        const reply = await Comment.findById(newReply._id)

        res.json({ message: 'Reply created successfully!', reply });
    } catch (error) {
        console.error('Error creating reply:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});
module.exports = router;
