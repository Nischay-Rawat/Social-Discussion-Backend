const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const usersRouter = require('./routes/users.js');
const discussionsRouter = require('./routes/discussions');
const verifyJWT = require('./config/auth.js');
const app = express();
app.use(express.json());
app.use(cors());
connectDB();
app.use('/api/users', usersRouter);
app.use('/api/discussions', verifyJWT,discussionsRouter);
console.log(process.env.PORT)
app.use((err, req, res, next) => {
    res.status(500).json({ message: 'Server error' });
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));