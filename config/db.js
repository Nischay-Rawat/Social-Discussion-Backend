const mongoose = require('mongoose');
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost/test';
const connection = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); 
  }
}
module.exports = connection;

