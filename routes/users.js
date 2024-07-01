const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyJWT = require('../config/auth.js')

router.post('/signup', async (req, res) => {
    const { name, mobileNo, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'Email is already exists' });
    }
    const newUser = new User({
        name,
        mobileNo,
        email,
        password
    });
    try {
        const savedUser = await newUser.save();
        const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET);
        res.status(201).json({ message: 'User created successfully', token }); // Or relevant data about the created user
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Incorrect Email or Password ' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect email or password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ message: 'Login successful', token });
});

router.put('/updateUser', verifyJWT, async (req, res) => {
    const { name, mobileNo, email } = req.body;
    const userId = req.user.userId;
    const updates = { name, mobileNo };

    try {
        const existingUserWithEmail = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUserWithEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const existingUserWithMobileNo = await User.findOne({ mobileNo, _id: { $ne: userId } });
        if (existingUserWithMobileNo) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }
        updates.email = email;
        console.log(userId)
        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/search/:name', verifyJWT, async (req, res) => {
    const { name } = req.params;
    const userId = req.user.userId;
    try {
        const users = await User.find({ name: { $regex: name, $options: 'i' } })
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
})
router.post('/search/:name', verifyJWT, async (req, res) => {
    const { name } = req.params;
    const userId = req.user.userId;
    try {
        const users = await User.find({ name: { $regex: name, $options: 'i' } })
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
})

router.post('/follow/:userId', verifyJWT, async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    try {
        const currentUser = await User.findById(currentUserId);
        const followedUser = await User.findById(userId);
        if (currentUser.following.includes(userId)) {
            return res.status(400).json({ message: 'Already following this user' });
        }
        if (!followedUser) {
            return res.status(400).json({ message: 'Invalid follower this user' });
        }
        currentUser.following.push(userId);
        followedUser.followers.push(currentUserId);
        await currentUser.save();
        await followedUser.save();
        res.json({ message: 'Followed successfully!' });
    } catch (error) {
        console.error('Error following user:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router